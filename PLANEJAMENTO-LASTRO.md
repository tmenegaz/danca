# Planejamento de frentes — Sistema Lastro

> **Resumo (para o HANDOFF):** o mapa de evolução do **Sistema Lastro** (o nome comercial do
> produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do
> que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os
> relacionamentos, os índices, o versionamento e o comercial — e **treze frentes** com objetivo,
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
>
> **Reconferência de 15/10/2026 (mesmo dia) — a credencial do provedor.** Voltando à documentação
> de Checkout para responder «é isto o que a cobrança precisa para informar o pagamento?», três
> factos novos ficaram **medidos** e entram na frente: a unidade de `amount` é **centavos**
> (documentado, com as palavras da própria página); a API **não** documenta e **não** exige
> credencial de transporte — `POST /links` sem identificação nenhuma responde **400** de validação,
> não 401/403; e o **cadastro** público cria a **conta** (com o `handle`), sem emitir chave. O
> conjunto está em §L11, «A credencial» — e acrescentou ao desenho a regra de tratar o `handle`
> como **segredo operacional**. Também aqui nenhuma linha de código de produto foi alterada.
>
> **Incorporação de 16/10/2026 — a estratégia comercial e o modelo manual.** O dono do produto
> entregou a **estratégia comercial e de pagamento** (três meses gratuitos do plano Básico sem
> cartão; contratação por Pix com **conciliação manual** do administrador; a InfinitePay como
> **caminho futuro**, não como dependência da primeira versão) e pediu que ela fosse incorporada
> ao planeamento, **sem implementar**. Ela **muda o modelo de operação da L11** — que tinha sido
> desenhada sobre um provedor automatizado — e acrescenta uma frente nova, **L12 — a jornada
> comercial**, para o que é oferta e comunicação em vez de cobrança. As **contradições** que a
> conferência encontrou estão registadas em **§3 (C12, C13, C14)** e **não foram resolvidas por
> dedução**. O que a incorporação tocou, além da L11 e da L12: o **§2.9** (a varredura que mostra
> que a «regra dos 30 dias» **não existe** neste repositório), o **§2.10** (C12–C14 entram em
> «precisa de decisão»), o **§4** (o quadro-resumo passa a doze frentes), o **§5** (L12 na camada 5),
> o **§8** (a terceira matriz de cobertura) e o **§9** (as perguntas que ficaram abertas).
> Nenhuma linha de código de produto foi alterada — e nenhuma será nesta etapa.
>
> **Registo de 16/10/2026 — a identidade visual como escolha do usuário.** O dono do produto
> explorou **seis direções de paleta**, cada uma com variante **clara** e **noturna**, e pediu que
> o estudo fosse **documentado** — a identidade vigente (bordô e ouro) **não muda**, e nada de
> código se escreve nesta rodada. Entra a frente **L13 — a identidade visual como escolha**, com o
> catálogo das doze combinações, os requisitos da implementação futura, os critérios de
> acessibilidade e **uma pergunta que o modelo de acesso não responde** (a preferência é de quem?).
> O contrato da identidade é o `IDENTIDADE-VISUAL.md`, que ganhou o catálogo e a funcionalidade
> futura; aqui registam-se a frente, as dependências e a decisão pendente. O quadro-resumo passa a
> **treze** frentes (§4), a sequência ganha a **camada 6 — a forma** (§5), a §8 ganha a quarta
> matriz de cobertura e a §9 acolhe **C15**. Nenhuma linha de código de produto foi alterada.
>
> **Incorporação de 16/10/2026 — a cobrança Pix por arquivo.** O dono do produto entregou uma
> **proposta operacional** de cobrança que **dispensa, na primeira versão, a integração bancária**:
> ele gera a cobrança na **área Pix do banco** da conta de pessoa jurídica — com QR Code, Pix copia
> e cola, chave e compartilhamento —, **descreve** nela o identificador da escola ou do professor
> (o **slug**), e o material resultante é **organizado por arquivo** e conciliado **à mão**. A
> proposta **não substitui** a conciliação manual que a L11 já contemplava: **complementa-a**,
> dizendo **como** o material chega, **onde** é guardado e **o que** a confirmação humana precisa
> garantir. Entrou na **§L11**, como subsecção — o ponto de menor duplicação —, datada e marcada
> como **proposta futura**. Nasceu **uma** contradição nova, **C16** (*onde vive o **material** de
> cobrança, e o que dele é público*), **distinta** de **C11** (*onde vive o **estado** comercial*):
> material não é estado, e a proposta **não** pode virar um segundo controle de pagamentos. O
> **§2.10** acolhe C16, o **§4** nomeia-a na linha da L11 e o **§9** ganha a lista do que esta
> rodada **não** decidiu. Nenhuma linha de código de produto foi alterada — e **nada** da proposta
> foi implementado.
>
> **Registo de 16/10/2026 — as lacunas de fundação.** Uma **avaliação do dono do produto** (sobre a
> proposta comercial e o catálogo de identidades) apontou três ausências que este documento
> **media**, mas **não elevava a decisão**: o **papel de administrador** do Sistema Lastro —
> invocado pela L11 (a confirmação de pagamento) e pela L12 (o e-mail) e **inexistente** (§L12,
> situação atual); o **`pagante` que significa duas coisas** (a trava de expurgo do andaime, §2.9, e
> o estado comercial da L12); e a **natureza da L13** — **escolha de quem já é usuário** (*A*) ou
> **instrumento de aquisição** (*B*), e, com ela, a pergunta de **quando** a paleta se escolhe (na
> contratação ou dentro do sistema). Nasceram **C17** e **C18**, e a **C15** ganhou uma **quarta
> dimensão** («quando», e para quê) — sem que nenhum dos três seja decidido por dedução. O
> **§2.10** acolhe C17 e C18, o **§4** nomeia-as nas linhas da L11 e da L12, e o **§9** ganha a
> lista do que esta rodada **não** decidiu. Nenhuma linha de código de produto foi alterada — e
> **nada** foi implementado.
>
> **Registo de 02/11/2026 — os três aspectos macro, e a musicalidade que não se pergunta.** A
> pesquisadora declarou o eixo que qualquer modalidade tem de ter — **força e flexibilidade**, o
> **elemento da técnica/código** e a **poiésis** —, e a declaração tem duas consequências neste
> documento. A primeira é uma **contradição nova**, a **C20**: a **Regra 4** pede «pré-requisitos de
> força e flexibilidade» e o campo que a alimenta é «**Condições do espaço**», que é outra coisa (o
> piso, a barra, o espelho); e a força e a flexibilidade **existem** — na **anamnese**, e desde
> 02/11/2026 chegam ao **ponto de partida** do PO com os quinze campos que ela escolheu. A segunda é
> de **taxonomia**: se os três aspectos são o que se observa, eles são os **eixos das dimensões** —
> hoje só «Técnica» o é —, e isso toca a **L1**, a **L10** e a ligação bloco ↔ dimensão (**P1**), onde
> um eixo a mais é uma dimensão a mais a ligar.
>
> No mesmo dia ficou assente, pela terceira vez e agora por escrito no código, que a **musicalidade
> não se pergunta**: o professor decide-a no **verbete** (a grade de contagens, por música) e no
> **plano** (os tempos e o compasso), e o documento da aula **consolida** — o pulso é a contagem, o
> acento é o tempo do compasso em que ela cai, a frase é o exercício inteiro sobre a música. É a mesma
> família da decisão 31 já registada no `ESTADO-ATUAL` («o que a sequência já responde não se escreve
> outra vez»), e é o princípio que o §L1 tem de respeitar: **um campo por dado, e o dado no sítio onde
> se decide**. Nenhuma linha de código de produto foi alterada nesta rodada de planeamento.

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
| Recipiente da elicitação | `porta/envelope/elicitacao-schema.json` | o **envelope** — versão `1.3.0`, `additionalProperties: false` no topo |
| Conteúdo dos formulários | `porta/conteudo/anamnese.json`, `porta/plano/conteudo/plano.json`, `porta/po/conteudo/po.json` | os nós respondíveis (o que a porta serve) |
| Motor (lógica pura) | `motor/nucleo/*` | `porta.js`, `elicitar.js`, `derivar-*.js`, `chaves.js`, `lancamento.js`, `ia.js` — sem IO |
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
  de que ele fala**: `VERSAO_DO_ENVELOPE = '1.3.0'` (`motor/nucleo/elicitar.js`), com o motivo
  da subida escrito (1.1.0 → 1.2.0, pelo elo do ajuste; 1.2.0 → 1.3.0, pela `turma` no
  `contexto` — as duas aditivas, `elicitar.js`). É o **padrão** da casa
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

**O que existe de PRAZO — e a regra dos 30 dias, procurada e não encontrada.** A estratégia de
16/10/2026 (§L12) fala de «suspensão após 30 dias sem pagamento» como uma «regra existente».
**Varredura feita, e o resultado é negativo:** não há «30 dias», nem «trinta dias», em
`PLANEJAMENTO-LASTRO.md`, `motor/`, `tools/`, `porta/`, `biblioteca/`, `prompts/` nem
`experimentos/`. O que existe é outra coisa, com outro nome e outros números:

- **O expurgo, que é APAGAMENTO — não suspensão.** `motor/servidor/raiz.js:29`
  (`PRAZO_EXPURGO_MS = 3 * 60 * 1000`) e a ordem de verificação em `raiz.js:211-213`:
  **(1)** desabilitada? **(2)** não está a pagar? **(3)** o `desde` existe? **(4)** o prazo
  venceu? — só então apaga. `pagante === true` **impede** o expurgo (`raiz.js:243`).
- **O prazo é 3 minutos no teste, e «a produção vai a 3 meses»** — a intenção está declarada em
  dois lugares: o comentário da constante (`raiz.js:26`) e `IDEIA-PAINEL-ESCOLA.md` §17.5
  («Para teste o prazo é **3 minutos** (em vez de **3 meses**)»). É a **única** constante a
  trocar, e ela **não foi trocada**: o que está no ar expurga em 3 minutos.
- **Desabilitar não é o mesmo que dever.** A flag é `habilitada`, do andaime, e o expurgo a lê;
  a dívida entra como `pagante`. São dois campos, e é a combinação deles que decide.

**A consequência, dita uma vez:** «suspensão aos 30 dias» **não tem onde morar hoje** — não é uma
regra deste repositório, e não se deve escrevê-la como se fosse. O que se pode dizer é o que se
mediu: existe **apagamento** com carência de 3 meses (intenção), e **suspensão** — bloquear sem
apagar — **não existe em lugar nenhum**. As três durações que a estratégia nomeia (2 h, 48 h,
3 meses de oferta) e esta quarta (o prazo de expurgo) estão em **§3 C12**, para decisão.

**As duas pegadas comerciais que existem** — e são andaime declarado: `pagante` (trava do
expurgo) e `habilitada` (interruptor). Nenhuma delas é plano, preço, cobrança ou período. E a
palavra `pagante` significa aqui **«não apagar»**, e **não** o estado comercial da L12: são **dois
significados com a mesma palavra** (**C18**).

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
| **EXISTE** | Fonte de verdade em ficheiros + Git; contrato por artefacto (schema versionado); documento derivado por transformação determinística; as três fontes com chave-valor por `id` de nó no envelope; a **âncora encadeada** por ciclo **e por aula**; o **elo do ajuste** com `motivo` e a recusa de apagar o vinculado; o envelope **versionado** (`1.3.0`) com proveniência **por campo** (`{valor, origem, respondente, nota}`); o armazenamento por contrato de 6 verbos com adaptador `fs`↔KV; turma e termo com **id slug** e a relação turma↔termo chaveada por id; o **índice por aula** do ciclo (`aulas[]` com `estado`/`prazo`/`lancada`); a **vista determinística** por aluna; o isolamento por escola na família do envelope; o `pagante` como trava de expurgo; o cadastro de professores com **senha em hash + sal** (nunca em claro); **a identidade visual como contrato** — fonte única (`tools/templates/ciclo.css`), papel por token, piso de contraste **medido** e validador (`tools/check-identidade.js`) |
| **EXISTE PARCIALMENTE** | **Chave estável dos campos**: existe para a folha de captura (`_declaracao`, rótulo↔chave↔tipo) e **não** para os 111 nós (a chave do derivado vem do rótulo visível); **identidade das entidades**: escola/ciclo/turma/termo têm id, **aluna e professor não**; **índice**: existe por escola (inventário, não lido pela aplicação) e por aula, **não** há índice invertido nem de consulta; **proveniência**: existe por campo e por elo de ajuste, **falta** o produtor de `ancora` e de `conteudo.digest`; **leitura do lançamento**: o dado **está gravado** e **não tem rota**; **relações**: existem derivadas por varredura (`vinculos`, `vinculosDePlano`) e faltam declaradas; **imutabilidade**: implementada para a anamnese (ajuste) e **não** para o PO (sobrescrito); **medidor de IA**: escrito e **nunca lido** |
| **NÃO EXISTE** | Cruzamento entre entidades, filtro, agregação e **busca textual**; **exportação**; leitor do lançamento; as cinco camadas de indexação do texto 1 §4 como camadas; o **conceito de «contexto»** (isolado × combinação), de **«componente»**, de **«intervenção docente»** e de **«resposta observada»** — medidos: **zero** ocorrências nos três conteúdos (§7); `modalidade` como campo (vive só na curadoria); a referência **curricular** versionada e os objetivos do **próximo nível**; tudo o comercial (plano, preço, assinatura, cobrança, cota, limite por plano); **o catálogo de paletas e o seletor de aparência** — as seis famílias e as doze combinações **não existem no código** (nenhum hex, nenhum item de menu, nenhuma persistência: §L13); o vínculo persistido entre lançamento e versão do plano — **decidido em 15/10/2026 que passa a existir**, realiza-se em **L5** (§3 C3) |
| **PRECISA DE DECISÃO** | **C1** lançamento: fonte versionada × leitura do KV · **C2** namespace partilhado × separado (isolamento) · **C4** vínculo da aula ao marco por id · **C5** quais consultas em cada plano (C5b) — **«todas» já decidida** em 18/10/2026: é a fotografia da data de vigência (C5a) · **C6** contagem de nós · **C7** leitor do medidor · **C8** valores comerciais como dado · **C9** a frase de B5 sobre os envelopes · **C10** os quatro conceitos ausentes do modelo (§3) — e, com ela, a ordem: acrescentar o vocabulário do domínio (L10) antes ou depois de L6 · **C11** onde vive o **estado comercial** (plano, período, pagamento, provisionamento) — KV × Git × D1 —, e, com ela, o achado de que **não existe lado público** na porta (§3). **Entraram em 16/10/2026: C12** as **quatro durações** (2 h · 48 h · 3 meses de oferta · e a «regra dos 30 dias» de suspensão, que **não existe** no repositório), e o que «suspender» bloqueia · **C13** em que **instalação** vive a página de planos e pagamentos (o Worker da escola, onde `ESCOLA_SLUG` identifica, ou a raiz, onde não há escola a identificar) · **C14** quando **começam as 48 h** de conciliação · **C16** onde vive o **material** de cobrança que o banco gera (QR Code, copia e cola, instruções) e o que dele é **público** — decisão **distinta** de **C11**, que continua a ser o «onde» do **estado** comercial, e que a proposta **não** pode duplicar · **Entraram em 16/10/2026 (a avaliação): C17** quem é o **«administrador»** do Sistema Lastro — a direção da escola, o dono da plataforma, ou ambos com fronteiras —, papel que a L11 (a confirmação) e a L12 (o e-mail) invocam e que **não existe** · **C18** `pagante` com **dois significados** (a trava de expurgo do andaime × o estado comercial da L12), e **o que faz uma escola ser `pagante`**. **Entraram em 01–02/11/2026: C19** o que é uma **«turma pronta»** (só o esqueleto, ou o conteúdo pedagógico) e **de quem é o ritmo** · **C20** os **três aspectos macro** que o Lastro observa (força e flexibilidade · técnica/código · poiésis) e a **Regra 4**, que pede o primeiro e é alimentada por um campo sobre o espaço · **C21** a **Regra 15 substituída** (o dado venceu o arquivo paralelo) e o **motor dos verbetes**, que a pesquisadora vai propor sobre arquivos JSON de chave e valor. **Saiu desta lista em 18/10/2026: C15** — decidida pelo dono do produto: **a preferência de aparência é da escola** (e, com ela, o mecanismo passa a ser o **servidor**, porque a escolha de uma escola não pode viver num navegador) — §3 C15. **Saiu desta lista em 15/10/2026: C3** — decidida (o PO/plano publicado passa a ter versão explícita que o lançamento referencia); as sub-decisões de desenho **S1–S4** foram **aprovadas no mesmo dia**, e as três **de produto** (**S5** o formato do ordinal · **S6** quando reancorar · **S7** como o formulário mostra a versão) foram **decididas em seguida** — o desenho de L5 está **completo** — §3 C3 e §L5 |

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
> 2. **O padrão da casa para introduzir versão já existe** — `VERSAO_DO_ENVELOPE = '1.3.0'` com o
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
formalizado»*. **Partida em duas em 18/10/2026.**

- **C5a — «todas» — RESOLVIDA** por decisão do dono do produto: são **as perguntas disponíveis na
  data de vigência do contrato**. Contratado em 18/10/2026, o Avançado leva o que existe nesse dia;
  o que o produto ganhar depois **não entra** — fica para renovação ou upgrade. Isso obriga o
  catálogo a ser **fotografia datada** (`catalogo@AAAA-MM-DD`) e o contrato a nomear **qual**
  fotografia congelou (L9).
- **C5b — quais consultas em cada plano — NÃO BLOQUEIA, e não pode ser respondida agora.** A
  repartição foi tratada como premissa; não é: é **consequência** do catálogo fechado. A unidade da
  decisão é o **poder** que o plano entrega — **operar** (x) · **cruzar para escolher** (x²) ·
  **decidir sobre o programa** (x³) —, não a contagem de consultas, que no texto 2 era bússola e só
  isso. O catálogo tem hoje **55 perguntas firmadas em 8 famílias**, e a **grade** que mede a
  cobertura (54 células: 29 ocupadas, 17 dívidas, 8 recusas) está em
  [PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) §4.9; a repartição sai
  quando a grade saturar (§5 daquele documento). *(Frentes L6, L9.)*

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

**C12 — As quatro durações, e qual delas é qual.** A estratégia de 16/10/2026 (§L12) nomeia
**três** prazos e menciona um **quarto** como «regra existente». Varridos, nenhum deles se
relaciona hoje com o outro no repositório, e um deles **não existe** (§2.9, medido):

| Duração | O que a estratégia diz | O que o repositório tem |
|:--|:--|:--|
| **2 h** | prazo para o usuário **pagar**, contado da criação da solicitação | **nada** — não há solicitação, nem prazo |
| **48 h** | janela de **conciliação** pelo administrador | **nada** — e o **marco inicial é indeterminado** (C14) |
| **3 meses** | **período gratuito** do Básico, sem cobrar ao fim | **nada** — não há plano, nem período |
| **«30 dias»** | «a regra existente de eventual **suspensão** após 30 dias sem pagamento» | **não existe** — nem 30 dias, nem suspensão (§2.9). O que existe é **expurgo** (apagamento) com carência de **3 meses** na intenção (`raiz.js:26`, `IDEIA-PAINEL-ESCOLA.md` §17.5), **hoje em 3 minutos** no ar |

**As três perguntas que isto deixa**, e são suas — não as respondo por dedução:

1. **A «regra dos 30 dias» é para criar, ou veio de outro projeto?** Se ela é para valer, ela
   **não substitui** o expurgo de 3 meses: **suspender** (bloquear sem apagar) e **expurgar**
   (apagar) são coisas diferentes, e hoje só a segunda existe no código. Escrevê-las como uma só
   regra faria um atraso de pagamento apagar uma escola.
2. **3 meses de oferta e 3 meses de expurgo são o mesmo 3 meses?** Por coincidência os dois
   números são iguais, e por isso mesmo a confusão é fácil: um é **oferta** (tempo grátis antes de
   precisar pagar) e o outro é **carência antes de apagar**. Convergir os dois — se for essa a
   intenção — é decisão declarada, não coincidência.
3. **O que «suspensão» bloqueia?** A estratégia diz que ela «deverá bloquear as operações não
   autorizadas sem apagar automaticamente os dados da escola». Isso é **mais largo** que o
   `ESCOLA_HABILITADA = 'nao'` de hoje, que devolve 503 em **tudo** — inclusive na página de
   pagamento, o que impediria a própria escola de pagar e se reativar.

*(Afeta L12, L11 e o andaime do expurgo. A pergunta 1 precisa de resposta antes de L12 ter
critério de aceite para «suspender».)*

**C13 — Em que instalação vive a página de planos e pagamentos.** A estratégia (§3) pede que o
sistema **identifique automaticamente a escola da instalação atual**, e proíbe que o usuário
escolha a escola de uma lista pública. Medido, o mecanismo confiável para isso existe e é **um
só**: a variável **`ESCOLA_SLUG`**, que vive no **Worker de cada escola** (`wrangler.fita.jsonc`,
medida). A **raiz** (`wrangler.danca.jsonc`) **não tem `ESCOLA_SLUG`** — ela não é uma escola,
serve **todas**. Daí a contradição, que é de arquitetura e não de detalhe:

- **Se a página de pagamento vive no Worker da escola** → `ESCOLA_SLUG` identifica a escola sem
  ambiguidade, e a regra «não pagar pela instalação de terceiros» é **estrutural** (a instalação
  não alcança outra). É o caminho que a arquitetura de instalações isoladas sustenta.
- **Se ela vive na raiz** — que é onde a estratégia põe a **rota pública** («criar uma escola,
  conhecer o Sistema Lastro, consultar os planos e iniciar a contratação», §2) — então **não há
  escola a identificar**: quem chega ali ainda **não tem** instalação. Quem acabou de criar a
  escola é redirecionado para o subdomínio dela, e é lá que a contratação continua.

**O mecanismo já existe, e já recusa em voz alta.** Medido: a ponte da escola compara o subdomínio
com o `ESCOLA_SLUG` e **falha de propósito** quando não batem — `identidadeOk`, em
`motor/servidor/producao.js:58`, publicado em `/api/saude` (200, ou 500 com o **erro nomeado**:
«`ESCOLA_SLUG` ausente ou divergente do subdomínio — config × Worker trocados»). E
`escolaDe(env, url)`, em `motor/servidor/bastidores.js:97`, **prefere a var do Worker** ao
parâmetro `?escola=` — que só sobrevive como recurso de desenvolvimento. Isto é: a regra que a
estratégia pede — identificar **sem** deixar o usuário escolher — **já está implementada** onde a
escola existe, e **não tem onde ser implementada** onde ela não existe (a raiz). É a contradição,
dita por medição e não por opinião.

**A convergência que proponho, e que NÃO decido:** a raiz apresenta a oferta (é pública, não
identifica escola nenhuma porque não há nenhuma) e **entrega** a contratação à instalação da
escola, onde `ESCOLA_SLUG` responde. Isso satisfaz as duas exigências — a rota pública existe, e a
escola nunca é presumida. Mas é **decisão de arquitetura**, e por isso fica aqui. *(Afeta L11
(E2) e L12.)*

**C14 — Quando começa a contagem das 48 h.** A estratégia fixa a janela de conciliação em 48 h e
manda que o **marco temporal seja definido no documento** — «não decida sozinho». Não decidido, e
o motivo de não ser indiferente: cada candidato produz um sistema diferente, e um deles produz um
bloqueio indevido.

| Marco candidato | O que decorre |
|:--|:--|
| **(a)** da **criação** da solicitação | as 2 h de pagamento e as 48 h de conciliação **começam juntas** (a janela de conciliação corre enquanto o usuário ainda pode pagar); é o mais simples de calcular e o mais generoso com quem demora a pagar |
| **(b)** do **fim** das 2 h | as duas somam **50 h** para pagar-e-conciliar; se o pagamento chega na 49.ª hora, o sistema já sinalizou atraso — e a escola **não** foi bloqueada (a estratégia proíbe bloquear durante a conciliação) |
| **(c)** da **confirmação do pagamento** pelo usuário | o relógio passa a depender do usuário **avisar** — e quem paga e não avisa nunca sai da janela. É o candidato que a estratégia **não** pode querer, e está aqui para ser visto e descartado por você, não por mim |

**O que é fato, e vale para os três:** a estratégia diz, por palavras próprias, que «o fim do prazo
de duas horas **não deverá ser confundido com inadimplência definitiva**» e que «o fim da janela de
conciliação de 48 horas **não deverá resultar automaticamente em exclusão de dados**». Logo, **nada
disso bloqueia nem apaga sozinho** — é o que o desenho tem de garantir, qualquer que seja o marco.
*(Afeta L11 e L12.)*

> **DECIDIDA em 18/10/2026, pelo dono do produto — a preferência é DA ESCOLA.** A escolha de
> aparência pertence à **escola**, e não a cada pessoa nem a cada navegador: decide-se uma vez,
> na instalação que o `ESCOLA_SLUG` identifica, e vale para todos os que usam aquela escola.
> O que isto resolve, e o que continua aberto, está no bloco **«O que a decisão de 18/10 fecha»**,
> logo abaixo da tabela dos três caminhos. O texto original fica inteiro — é a razão pela qual a
> pergunta existia, e ela continua a ser a razão pela qual a resposta é esta.

**C15 — A preferência de aparência é de quem.** A tarefa de 16/10/2026 (§L13) manda **não presumir**
que a paleta escolhida valha para todos os usuários de uma escola, e confirmá-lo contra o modelo de
acesso. **Medido, e o modelo não responde:**

- **A senha da Produção é uma por escola.** `senhaDaEscolaOk` (`motor/servidor/bastidores.js:468`)
  aceita a senha da **direção** *ou a de qualquer professor cadastrado* — e é decisão declarada no
  próprio código: o dado da escola «não pertence a um professor», e quem lança aula pode ser
  qualquer um da casa.
  **Correção de 18/10/2026 — a função citada é a errada.** O portão da **Produção** é
  `senhaDaDirecaoOk`, que aceita **duas** senhas: a da **escola** (`SENHA_ADMIN`) e a do
  **professor principal** (`SENHA_PROFESSOR`) — e só essas duas. `senhaDaEscolaOk` é a política
  **larga**, e serve a outra coisa: abrir o **dado cifrado do ciclo** (`motor/servidor/
  cloudflare.js`), onde qualquer professor da casa entra, porque o dado é da escola. A conclusão
  desta secção **não muda** — continua a não haver *usuário* a quem pendurar a preferência —, mas
  a razão fica dita com a função certa.
- **Depois do portão, o que a página guarda é a senha, não quem entrou.** O `entrar()` do gate põe
  o valor em `sessionStorage` — **estado por aba**, que esquece ao fechar. O sistema autentica **um
  segredo**, não **uma pessoa**.

Isto é: **hoje não há a quem pendurar uma preferência por usuário.** Não é um detalhe de aparência —
é a mesma classe de lacuna que a **C11** encontrou na porta (não há lado público) e a **C13** na
identificação da escola (não há escola na raiz): **o modelo de acesso não tem a entidade que a
funcionalidade supõe.** Os três caminhos, e **nenhum escolhido**:

| Caminho | O que exige | O que custa |
|:--|:--|:--|
| **por escola** ✅ **escolhido em 18/10/2026** | nada de novo: é a chave que a instalação já tem | a escolha de um vale para todos — que é o que a tarefa mandava **não presumir**, e que **agora está decidido** |
| **por usuário** | dar **identidade** a quem entra | é decisão de **acesso**, com consequência de segurança — não de forma |
| **por navegador** — *o que está implementado hoje* | nada: a preferência vive no navegador de cada um | não viaja entre dispositivos, e não pertence nem ao usuário nem à escola |

**O que a decisão de 18/10 fecha.**

| Fecha | Como |
|:--|:--|
| **De quem é** | **da escola**. Há chave para isso: o `ESCOLA_SLUG`, que a instalação já tem e que nada precisa de inventar |
| **O mecanismo de aplicação** | **no servidor**. Uma preferência da escola não pode viver num navegador — ela vale para todos, e tem de viajar. O caminho já existe: `run_worker_first: true` e `env.ASSETS` em `motor/servidor/cloudflare.js` |
| **A tabela `PARES` e o «qual paleta o PDF lê»** | a **vigente da escola**. O PDF e o deck seguem a paleta da escola; com uma só paleta por escola, o problema dos doze `:root` não se põe nesta etapa |

**O que a decisão de 18/10 NÃO fecha — e não é esquecimento.**

1. **Os hex das doze combinações continuam a não existir.** A decisão é «de quem», e não «quais».
   Nenhum valor foi inventado: as imagens de referência continuam a ser **estudo**, e a V1 (medir
   cada par contra os fundos reais) continua inteira.
2. **O *quando* — a natureza *A × B*.** Com a preferência na escola, a paleta pode ser escolhida
   **na contratação** (e então é parte do provisionamento, território de **C11/C16**) ou **depois,
   dentro do sistema** (o que está desenhado). As duas pontas terminam na escola; muda **onde o
   valor mora**.
3. **Quem, dentro da escola, pode mudar — respondido em 18/10/2026.** O dono do produto declarou
   a regra do acesso, e ela **é o que o código já faz** para a Produção:

   | Quem | O que abre |
   |:--|:--|
   | **senha da escola** (`SENHA_ADMIN`) | **tudo** — Produção, Estúdio, Área do Professor, lançamento |
   | **professor principal** (`SENHA_PROFESSOR`, o dono) | **tudo** — é o representante da escola |
   | **demais professores** | **não entram na Produção**; abrem o **Estúdio**, a **Área do Professor** e o **lançamento** |

   O portão da Produção é `senhaDaDirecaoOk` — **só** as duas primeiras. Logo o seletor de
   aparência, estando **em Produção**, está no lugar certo: só a escola e o professor principal lá
   chegam, e o que se aplica é a vontade da escola. Isto **fecha a parte da C17** que interessava
   a esta decisão — *quem administra a Produção* — e deixa aberto o resto da C17 (o administrador
   **da plataforma** e o e-mail da L12).

**A quarta dimensão — *quando* a preferência se escolhe, e para quê (a natureza *A × B*).** Uma
avaliação de 16/10/2026 separou **duas coisas que a L13 pode estar a misturar**: **(A)** a
identidade como **escolha de quem já é usuário** — doze combinações, seletor global, preferência
persistida: conforto e pertencimento; e **(B)** a identidade como **instrumento de aquisição** — a
escola reconhece-se numa paleta, e isso serve **quem ainda não é usuário**. A L13 está desenhada
para **A**; servir **B** exige uma decisão de **produto** que ainda não existe: a paleta é escolhida
**na contratação** (como se escolhe o nome — e então ela é **parte do provisionamento**) ou
**depois, dentro do sistema** (o que está desenhado)?

**O que isto faz à C15 — e o que não faz.** Se a escolha for **na contratação** (B), a preferência é
**da escola** e mora no **estado comercial** que a L11 vai criar (território de **C11/C16**) — e a
C15 **encolhe** para o primeiro caminho da tabela acima. Mas ela **não se elimina**: **mudar** a
paleta depois reabre o «de quem», porque o modelo de acesso continua a autenticar **um segredo por
escola**, não uma pessoa (a nota abaixo vale igual). Isto é: a natureza **A × B** é uma **decisão do
dono do produto**, e **precede** a **V0** — ela decide *quando* se escolhe, e a V0 decide *de quem*
é a escolha.

> **Nota honesta, e é uma porta que não se abre por acidente.** `senhaDaEscolaOk` **percorre** a
> lista de professores e sabe **qual** senha bateu: a identidade **existe no dado** e **não é
> usada**. Transformar isso em «quem entrou» é possível — e é **decisão de acesso**, não um efeito
> colateral de um seletor de cores. **Confirma-se em 18/10/2026, e é por isso que o seletor pode
> viver em Produção:** ali o portão é o estreito (`senhaDaDirecaoOk`), e a porta fica fechada aos
> demais professores **sem precisar de identidade**.

*(Afeta L13. **Precede** o desenho da persistência: é ela que decide se há um campo novo no dado da
escola. **Precede também a V0**, e por duas perguntas — «de **quem**» é a escolha, e «**quando**»
ela se faz: na contratação (*B*) ou dentro do sistema (*A*).)*

**C16 — Onde vive o material de cobrança, e o que dele é público.** A proposta de 16/10/2026
(§L11, «A cobrança Pix por arquivo») **desacopla** o **material** da cobrança do **estado**
comercial: o material é o que o banco gera (QR Code, Pix copia e cola, chave, compartilhamento — no
formato que **ainda não se conhece**), e o estado é o que a L11 já modela. Medido, **nada disto
existe** (§2.9); e a arquitetura vigente oferece **dois** caminhos legítimos para o material, com
consequências diferentes:

- **No GitHub** — o material vira **arquivo versionado**, fonte de verdade, com a cadeia de revisão
  do repositório; mas versionar cobrança tem **custo de exposição** (informação privada com
  histórico) e de **atualização** (mudar um estado exige *commit* e *deploy*).
- **No Worker/Cloudflare (KV ou equivalente)** — o material fica como **dado operacional**,
  atualizável sem novo *deploy* completo; mas o KV **não** dá transação nem unicidade — e já é o
  ponto que a **C11** pesa para o **estado**.

O que a decisão tem de fechar, e **nenhum** destes caminhos fecha sozinho: **o que pode ser
público** (o material de pagamento, se a arquitetura o exigir) e **o que tem de ser privado** (o
material bancário, o extrato, o estado); e **qual mecanismo é a fonte de verdade do estado de
pagamento** — que é a **C11**, e **não** se duplica aqui. **Não presumir** que toda cobrança vire
arquivo estático: QR Code, instruções e estado têm requisitos de exposição e de atualização
diferentes. E, qualquer que seja o caminho, a proposta **não** pode criar um **segundo controle de
pagamentos** — os campos e os estados têm de ser os que a L11 define.

*(Afeta L11 (a organização dos arquivos e as etapas de publicação) e a decisão **C11** — com quem
partilha o «onde», sem com ela se confundir. **Precede** a ferramenta local futura: é ela que decide
onde a ferramenta grava.)*

**C17 — Quem é o «administrador» do Sistema Lastro.** A estratégia invoca um **administrador** que
confirma pagamentos (§L11) e recebe o e-mail administrativo (§L12 J4) — e a medição mostra que
**esse papel não existe**: o que existe são **duas senhas**, e nenhuma delas é «o administrador». O
portão da Produção autentica a **direção da escola** (`senhaDaEscolaOk`,
`motor/servidor/bastidores.js:468`), e a raiz autentica **o dono da plataforma** (`SENHA_RAIZ`,
`motor/servidor/raiz.js:32`).

> **Nota de 18/10/2026 — a metade da C17 que interessa à Produção está respondida.** O dono do
> produto declarou a regra do acesso, e ela é a que o código já pratica: **a senha da escola**
> (`SENHA_ADMIN`) e a do **professor principal** (`SENHA_PROFESSOR`) abrem **tudo**, inclusive a
> Produção; **os demais professores não entram na Produção** — abrem o Estúdio, a Área do Professor
> e o lançamento. O portão da Produção é `senhaDaDirecaoOk` (**só** as duas primeiras); a política
> larga (`senhaDaEscolaOk`, que percorre todos os professores) serve ao **dado cifrado do ciclo**, e
> não a este portão — a citação acima confunde as duas, e fica corrigida aqui. **Continua aberto**
> o que a C17 perguntava para o **comercial**: quem confirma o pagamento e recebe o e-mail
> administrativo, quando o candidato é o **dono da plataforma** — que a raiz autentica e que não
> tem `ESCOLA_SLUG`. São dois segredos de **escopos diferentes**, e nenhum deles nomeia uma
pessoa — como a **C15** já mediu, o sistema autentica um **segredo**, não um **usuário**.

A pergunta é de **acesso** (e, porque confirma dinheiro, de **segurança**), e tem três respostas
possíveis, **nenhuma escolhida**:

| Candidato | O que é | O que custa |
|:--|:--|:--|
| **a direção da escola** | o portão que já existe por escola | o dono da plataforma **não** é administrador; quem confirma o pagamento é a própria escola que paga — e **quem paga não deveria confirmar o próprio crédito** |
| **o dono da plataforma** | a senha da raiz, que já existe | a raiz **não é uma escola** e não tem `ESCOLA_SLUG` (**C13**); confirmar exige o contexto da escola, que falta na raiz |
| **ambos, com fronteiras** | a escola administra o seu dado; o dono administra o comercial | exige **desenhar duas fronteiras** e o mecanismo que diz **quem está a agir** — que **não existe** hoje |

**O que decide, e por que precede.** O papel **precede** o desenho da **confirmação** (§L11, a
cobrança por arquivo) e o **destino** do e-mail administrativo (§L12 J4): os dois nomeiam uma pessoa
que o modelo **não tem**. E é a **mesma classe** de lacuna da C11 (não há lado público), da C13 (não
há escola na raiz) e da C15 (não há usuário): **a funcionalidade supõe uma entidade que o acesso não
oferece.**

*(Afeta L11 (a confirmação) e L12 (o e-mail). **Precede** as duas — e é decisão de **acesso**, não
de implementação.)*

**C18 — `pagante` significa duas coisas.** A palavra `pagante` existe hoje com **um** sentido e está
a ser usada com **outro**: no andaime, `raiz/escolas-habilitadas.json` → `pagante: true` é **trava
de expurgo** — significa «escola pagante — **não se apaga**» (`motor/servidor/raiz.js:73-74`,
`:243`); na L12, `pagante` é **estado comercial**, um dos quatro (`gratuito` · `solicitou` ·
`pagante` · `expirado-sem-contratar`, §L12 entrega (f)). São **dois significados**, a mesma palavra,
e **nenhum** deles foi definido: a trava diz apenas «não apagar», e o estado diz apenas «pagou» —
mas **o que faz uma escola ser `pagante`** (ter **plano activo**, ou **já ter pago pelo menos uma
vez**?) não está escrito em lugar nenhum, e a diferença decide o estado `expirado-sem-contratar`.

**Por que isto não é preciosismo.** Duas consequências concretas: **(1)** um campo com dois
significados é uma fonte de defeito — quem lê `pagante` no andaime espera «não apagar», quem o lê na
L12 espera «contratou», e o código passa a depender de **qual** dos dois se quis dizer; **(2)** a
L12 **não pode** definir os quatro estados sem responder à primeira pergunta, porque `pagante` é um
deles. As duas decisões que isto pede: **renomear** um dos dois (a trava do expurgo e/ou o estado
comercial), e **definir** o que faz uma escola ser `pagante`. **Nada foi renomeado** — registar a
colisão é o que esta entrada faz.

*(Afeta §2.9 (o andaime), §L12 (os quatro estados) e a L9 (o plano que os precede). Não é decisão de
arquitetura: é de **vocabulário** — e de vocabulário que o dinheiro vai ler.)*

**C19 — O que é uma «turma pronta», e de quem é o ritmo.** A pesquisadora, a 01/11/2026, deu ao
botão «Carregar as turmas iniciais» um destino comercial: «carregar já turmas prontas, tudo pronto,
montado já para o professor […] eu quero poder vender isso no futuro» (frente **L14**). A decisão
tem duas metades, e **as duas precisam de resposta antes de haver oferta**:

- **A extensão.** «Turma pronta» é o **esqueleto** — o nome, o nível de referência e as associações
  turma↔termo, que é o que o catálogo tem hoje —, ou inclui também as **aulas**, os **planos de
  ensino** e os **POs** de referência? A diferença não é de grau: um esqueleto é **configuração**, e
  um plano com PO é **conteúdo pedagógico** — com autoria, com responsabilidade e com um preço
  outro.
- **O ritmo.** Medido: as turmas do catálogo **não trazem o ritmo** (dias, hora de cada dia,
  duração e período), e `comporConf` **lança** sem ele — «a turma não tem o que a geração exige».
  Semeada hoje, a turma serve para a curadoria e **não gera ciclo**. E o ritmo **não é do
  conteúdo**: a mesma «Balé Nível 1» pode ser 2×/semana numa escola e 3× noutra, porque ele é do
  **contrato da escola**, não do exercício. Três saídas, e a escolha decide quantas perguntas a
  carga faz: **(a)** um ritmo de referência no catálogo, que a escola corrige; **(b)** um
  intervalo («2 a 3×/semana, 60 min») que a carga converte em pergunta; **(c)** a carga passa a
  pedir o ritmo, uma vez por turma carregada.

**O que fica decidido sem esperar:** o aviso. Enquanto as duas metades estiverem abertas, o botão
**diz o que não traz** — no `confirm`, e não em prosa fixa na página (a regra da casa é que o
formulário não explica). Um botão que promete «carregar as turmas» e entrega metade delas é a
mesma família de erro do `if` que filtrava o título vazio: diz uma coisa, faz outra, e ninguém dá
por isso.

*(Afeta §L14 (a frente que isto destranca), §L8 (o valor) e a L9 (a trava por plano). A metade do
ritmo é de **domínio**; a da extensão é **comercial**.)*

**C20 — O que o Lastro observa: três aspectos macro, e a Regra 4 pede um quarto que ninguém declara.**
A pesquisadora declarou, a 02/11/2026, o eixo que **qualquer modalidade** tem de ter — não é do balé
clássico, é do que se observa em dança:

- **Força e flexibilidade** — «a gente tem que ter isso, para o balé clássico e para qualquer outra
  habilidade que a gente queira em dança, em qualquer modalidade»;
- **o elemento da técnica, do código** — «o balé clássico é a técnica do balé clássico, a codificação
  do balé clássico, qualquer que seja a tradição. Marta Graham é a técnica, release é a técnica, o hip
  hop tem as suas técnicas também, a dança de salão também tem»;
- **a poiésis** — «a parte da expressividade, a parte do olhar, a parte da condução que o professor faz
  através do contexto, através do processo pedagógico dele, através do estímulo e transmissão da
  oralidade, através da história da dança. E é por isso que a gente tem o vídeo e é por isso que a
  gente tem a música, é por isso que a gente tem os *pas de bras*».

**E é aqui que a contradição se mede.** A **Regra 4** usa a expressão «pré-requisitos de **força e
flexibilidade**» — o primeiro dos três aspectos —, mas o **campo** que a alimenta no plano de ensino é
«**Condições do espaço**»: «o que a sala e o material precisam ter». São duas coisas diferentes com o
mesmo nome de regra, e o documento da aula dizia a primeira por cima do conteúdo da segunda. Corrigido
o título (02/11/2026), **a contradição que sobra é do modelo**: a força e a flexibilidade **existem** —
estão na **anamnese**, em campos que já se perguntam (`flexibilidade-dos-isquiotibiais`,
`flexibilidade-dos-adutores`, `controle-de-carga-no-demi-grand-plie`, …), e desde 02/11/2026 chegam ao
**ponto de partida** do PO com os quinze campos que ela escolheu. O que está por decidir é **o que a
Regra 4 quer dizer**: (a) passa a falar do espaço e do material, e a força e a flexibilidade ficam
onde estão (a anamnese → o PO); ou (b) nasce no plano um campo próprio para elas, e o «Condições do
espaço» fica só com a sala.

**A consequência para o produto, e é a que interessa a este documento:** se os três aspectos são o que
o Lastro observa, eles são **a taxonomia das dimensões** — hoje o eixo («Técnica») é declarado no
conteúdo do PO, e nada impede que os outros dois passem a ser eixos de primeira classe. Isso toca a
**L1** (o dicionário de campos), a **L10** (o vocabulário do domínio que falta) e a ligação
bloco ↔ dimensão (**P1**), porque um eixo a mais é uma dimensão a mais a ligar.

**Decidido a 02/11/2026, e é a alternativa (b).** A pesquisadora: «você vai colocar, ó, antes da
música e vídeo de referência você vai colocar esse item que é relacionado a força e flexibilidade,
que é o aspecto físico, o aspecto do corpo das meninas». O **plano de ensino ganhou o bloco 10,
«Aspecto físico — força e flexibilidade»** — e ele é **lido, não escrito**: consolida as anamneses
das alunas da turma por aspecto (nunca uma linha por aluna) e marca como **ponto de atenção** quem
não está no melhor nível, usando a **ordem das opções da própria anamnese** como régua. O «Condições
preliminares» fica com o espaço e o material, e o §2 da aula passou a dizer «(o espaço e o material)»
no título, para não voltar a ler-se como se fosse a força e a flexibilidade. **O que sobra por
decidir é só a redação da Regra 4**, que é texto congelado (`CONGELAMENTO.md`) e continua a usar a
expressão «pré-requisitos de força e flexibilidade»: ou se lhe dá o sentido do bloco 10, ou se
declara que essa expressão quer dizer o espaço e o material, e a força e a flexibilidade vivem no
bloco 10. A decisão é dela, e não se toma por dentro do gerador.

*(Afeta §L1, §L10, a ligação bloco ↔ dimensão (P1) e a decisão da Regra 4. A metade da taxonomia é de
**domínio**; a do campo no plano é de **formulário**.)*

**C21 — A Regra 15 foi substituída, e o motor dos verbetes está prometido.** Duas coisas de
02/11/2026, e nenhuma das duas é uma contradição: são o que muda no que este documento assume.

- **A Regra 15** («bloco próprio em cada aula + arquivo paralelo do ciclo») foi **substituída pelo
  que o código faz** — o **verbete** declara a grade de contagens por música, a **sequência do
  plano** declara os tempos e o compasso, e a **§4 da aula** consolida os dois. O `REGRAS.md` é
  congelado e ganhou uma **nota de substituição** com motivo declarado. A consequência para este
  documento: **a L1 (o dicionário de campos) já tem um pedaço feito** — o vocabulário da modalidade
  e o alfabeto da notação são chave-valor no repositório, e a musicalidade é o primeiro domínio em
  que a chave-valor do verbete virou documento. O que ainda não é dado é o **dicionário do que
  acontece** (`catalogo-seed.js`), indexado por notação.
- **O motor dos verbetes**, anunciado pela pesquisadora: «essa parte toda aqui dos verbetes vai ter
  que gerar um motor, e a gente vai criar arquivos JSON de chave e valor para o dicionário, para o
  syllabus e para outras propostas que eu vou te apresentar». **A proposta não existe ainda**, e ela
  pediu tempo para ler este documento antes de a trazer. Fica registado — e **nada se desenha antes
  de a proposta existir**. Quando vier, o sítio é este: é a **L1** com um segundo consumidor, e é o
  que decide se o dicionário do que acontece sai do código para o repositório.

*(Afeta §L1, a L10 e a decisão da Regra 15, que fica fechada. A metade do motor é de **produto**; a
do dicionário é de **dado**.)*

---

## 4. As frentes

Treze frentes. Cada uma traz os oito itens pedidos. A **prioridade** é sugerida — a decisão é sua.
A **L13** (a identidade visual como escolha, 16/10/2026) **não reordena nada**: entra em **P3**, com
o mesmo peso da L12, e o motivo está declarado na própria frente. A classificação do que existe
hoje está em **§2.10**; o catálogo pergunta por pergunta, em **§7**; e a cobertura de cada requisito
— dos dois textos, da **estratégia comercial de 16/10/2026** e da **atualização da identidade
visual** —, em **§8**.

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
| **L11** | A porta paga: cobrança, verificação e liberação de escolas | **P2** | o lado público da porta | L8 (o valor) · **decisão C11** (onde vive o estado) · **C16** (onde vive o material de cobrança) · **C17** (quem é o administrador que confirma) · **dependências externas** (provedor) |
| **L12** | A jornada comercial: a oferta, o período gratuito e a comunicação | **P3** | a contratação | L8 (o valor) · L9 (a trava) · **C12** (as durações) · **C13** (onde a página vive) · **C17** (o administrador do e-mail) · **C18** (os quatro estados e o que é «pagante») · **o canal** (externo) |
| **L13** | A identidade visual como escolha: o catálogo das doze combinações | **P3** | — (não destranca frente nenhuma) | o contrato de forma (`IDENTIDADE-VISUAL.md`) · **C15 decidida em 18/10/2026: a preferência é da escola**, e o mecanismo é o servidor · o *quando* (*A × B*) continua aberto, e decide **onde o valor mora** |
| **L14** | O catálogo de turmas prontas — a oferta que se vende | **P3** | uma fonte de receita nova, e o primeiro conteúdo vendável | L8 (o valor) · L9 (a trava) · L11/L12 (a venda) · **decisão C19** (o que é «turma pronta») · **o ritmo do catálogo** (ver a frente) |

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
  domínio antes de ser implementável; (c) C5b (quais consultas em cada plano); (d) o que fazer com o dado
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

> **MUDANÇA DE MODELO — 16/10/2026.** Esta frente foi desenhada sobre um **provedor
> automatizado** (a InfinitePay, com webhook e verificação activa). A estratégia entregue em
> 16/10/2026 (§L12) **inverte a ordem**: a primeira versão cobra por **Pix com conciliação
> MANUAL** do administrador, e a integração com provedor passa a **caminho futuro**. O que isso
> muda aqui: o **adaptador de pagamento** (E1) deixa de ser a peça central e passa a ser a
> **porta** por onde a integração futura entrará; a **verificação** (E5) continua obrigatória como
> desenho, mas na primeira versão **quem verifica é uma pessoa**, conferindo o crédito na conta —
> e a estratégia é explícita que **comprovante enviado pelo usuário não é confirmação**. A **E8**
> deixa de ser «a integração» e passa a ser **uma** integração possível. O resto — o lado público
> (E2), o valor (E3), a autorização de uso único (E6), a recuperação (E7) — **não muda**.

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
  | **Autenticação da API de cobrança** (chave, token, segredo, cabeçalho) | varredura da página inteira de Checkout por `authorization`, `bearer`, `api key`, `token`, `secret`, `hmac`, `credencial`, `autentica`: **zero** ocorrências | **NÃO documentado** — e **medido**: `POST /links` **sem** credencial nenhuma responde **400** de validação, **não** 401/403 (§«A credencial») |
  | **Como se obtém a credencial** | o cadastro público (`buy.infinitepay.io/cadastro/onboarding/checkout-integrado`) pede CPF ou CNPJ/MEI, representante legal, celular e código no WhatsApp — e **não** emite chave, token nem segredo | **documentado** (é a **conta**, não uma credencial de API) |
  | **`handle` (InfiniteTag)** | é como a API identifica a conta — e é o **nome público** dela no App, usado sem o `$` | **documentado** |
  | **Sandbox / ambiente de teste** | varredura na página de Checkout: **zero** ocorrências de «sandbox», «homologação» ou «ambiente de teste» | **NÃO documentado** |
  | **API de planos e assinaturas** | a documentação de API cobre **links de Checkout**; a página de recorrência descreve a gestão **pelo App** | **NÃO documentado** |
  | **Recorrência por Pix** | a página de recorrência diz «Pix taxa zero **ou** cartão em até 12x», e que «**se o cliente usar cartão**, a cobrança acontece **automaticamente** todo mês» — para Pix, o que se promete é **enviar a cobrança** e **lembrar por WhatsApp** | **parcial** — cobrança repetida, sim; **débito automático por Pix, não** |
  | **Pix automático / recorrente por autorização** | nada | **NÃO confirmado** |
  | **Taxa zero no produto de API** | «Pix com taxa zero» aparece como **argumento de venda**; as condições do produto de API não estão na página | **NÃO confirmado** |
  | **Unidade de `amount`** | «O valor do produto deve ser colocado em centavos, então R$ 10,00 = 1000 centavos» | **documentado** — fecha o item que antes era «aparente — confirmar» |

  **A leitura honesta desta matriz:** o que a InfinitePay documenta cobre **cobrança avulsa com
  confirmação** — que é exactamente o que L11 precisa para **cada período** — e **não** documenta
  **gestão de assinatura por API**. Isto não invalida o provedor: sustenta a decisão de modelar a
  assinatura como **uma cobrança por período** (o que o rascunho já pede) em vez de confiar numa
  assinatura administrada pelo provedor. **O que a matriz NÃO autoriza** é presumir sandbox,
  assinatura por API ou débito automático por Pix — nenhum dos três está documentado.

- **A credencial — as três medições de 15/10/2026.** Três leituras independentes apontam para o
  mesmo lugar, e é por isso que ficam escritas juntas:

  1. **A documentação não descreve autenticação nenhuma.** Varredura da página inteira de Checkout
     por `authorization`, `bearer`, `api key`, `token`, `secret`, `hmac`, `credencial` e
     `autentica`: **zero** ocorrências. O **único** dado que identifica a conta é o `handle`.
  2. **A API responde a quem não se identifica.** `POST https://api.checkout.infinitepay.io/links`
     com corpo `{}` e **sem** credencial nenhuma devolveu **400** —
     `{"success":false,"message":"param is missing or the value is empty or invalid: handle"}`.
     Não devolveu **401** nem **403**: havendo camada de autenticação, a requisição morreria
     **antes** da validação; ela atravessou e foi reprovada **por falta do parâmetro**. *(Nada foi
     criado — sem `handle` não há link. O mesmo caminho em `GET` devolve 404: só existe o POST.)*
  3. **O cadastro entrega uma conta, não uma credencial.** O fluxo público de cadastro
     (`buy.infinitepay.io/cadastro/onboarding/checkout-integrado`) pede CPF ou CNPJ/MEI, dados do
     representante legal, celular e um código no WhatsApp: é onde **a conta e o `handle` nascem**.
     Em passo nenhum ele emite chave de API, token ou segredo.

  **O que isto prova — e o que não prova.** Fica **provado** que não há credencial de API
  documentada nem camada de autenticação no transporte. Fica **por confirmar**, e é pergunta para
  a conta, se um `handle` válido basta para criar um link em nome dela: isso não se ensaia sem uma
  conta real, e não se ensaia à custa de dinheiro de ninguém.

  **A consequência, que passa a valer como regra de desenho.** No Lastro quem cobra é **a
  plataforma**, e a escola é o `order_nsu` — logo há **um** `handle`, e ele cobre **toda** a
  superfície de receita, não a de uma escola só. Duas disciplinas saem disto, e são critérios de
  aceite: (a) o `handle` é tratado como **segredo operacional** — não entra em página pública, não
  entra em asset do Worker, não vai ao navegador, e vive em *secret* como qualquer outro; (b) a
  autorização que libera uma escola **não pode** depender do sigilo do `handle` — quem a concede é
  a **verificação activa** e o **token de uso único**. A disciplina que vinha da matriz fica
  reforçada: a notificação é **sinal**, a prova é a consulta — porque não há assinatura que a
  autentique.

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
    **se existe alguma credencial de API além do `handle`** (a documentação não descreve nenhuma e
    a medição confirma que o endpoint não a exige — ver «A credencial»); gestão de assinaturas por
    API; recorrência por Pix e o que ela significa (cobrança enviada × débito automático);
    condições de taxa **do produto de API**; verificação de autenticidade do webhook.
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
  | **E8** | **A integração real** — só com o provedor confirmado | as respostas do provedor | Credenciais em **secrets** — **o `handle` entre elas**; o modo real **não** pode ser ativado por engano pelo ambiente de teste; cada item pendente da matriz do provedor tem resposta registada |

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
  chega ao navegador — **incluído o `handle`**, que é a credencial que a API de facto usa.

- **Riscos e decisões por confirmar.**
  - **O risco maior não é técnico:** é o **preço**. Sem a confirmação de C8, o valor cobrado seria
    inventado — e cobrar é irreversível de outra forma. A E3 pode ser construída com valor de
    teste; a **E8 não**.
  - **Verificar sem mecanismo documentado.** Como a autenticidade do webhook **não** está
    documentada, a notificação é tratada como **sinal**, e a **prova** é a consulta ao provedor.
    Se o provedor documentar assinatura mais tarde, ela **soma** — não substitui a consulta.
  - **Uma credencial só, e ela é pública por natureza.** O `handle` é o nome da conta no App e é
    também o único dado que autoriza criar cobranças (§«A credencial»). Guardá-lo como segredo
    operacional **não** o torna secreto contra quem já o conheça — por isso o desenho **não pode**
    depender do sigilo do `handle` para coisa nenhuma: quem libera a escola é a **verificação
    activa** e o **token de uso único**.
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

#### A cobrança Pix por arquivo — proposta operacional *(16/10/2026, sem implementação)*

> **O que esta subsecção é.** Uma **proposta do dono do produto** para a **primeira versão** da
> cobrança, **alternativa** à integração com provedor: ele gera a cobrança na área Pix do **banco**
> da conta de pessoa jurídica, e o material resultante é organizado por arquivo e conciliado à mão.
> Ela **não substitui** a conciliação manual que a «Mudança de modelo» acima já declarava —
> **complementa-a**, dizendo **como** o material chega, **onde** é guardado e **o que** a
> confirmação humana precisa garantir. **Nada disto está implementado**, e o formato do material do
> banco **não foi inventado**: está declarado como **a verificar** (abaixo).

- **O fluxo, como proposto.** O proprietário da conta: (1) gera a cobrança na área Pix do banco,
  preenchendo a **descrição** com um identificador inequívoco do destinatário — preferencialmente o
  **slug** da escola ou do professor, combinado com o que for necessário; (2) copia as informações
  ou o arquivo que o banco disponibiliza (QR Code, Pix copia e cola, chave, link de
  compartilhamento — o que o banco oferecer); (3) entrega o conteúdo a uma **ferramenta local**
  futura, ou o deposita num arquivo **no formato a definir**; (4) a ferramenta identifica o
  destinatário, organiza o material e o associa ao **registro comercial** correspondente; (5) o
  material é publicado ou disponibilizado no ambiente apropriado, conforme a arquitetura vigente;
  (6) quando o crédito aparece no **extrato**, o proprietário **confirma o pagamento à mão**; (7) a
  ferramenta registra a confirmação e atualiza o **estado comercial**, executando o que for
  necessário para manter o acesso contratado habilitado.

- **O que o material do banco é — e o que ele não é.** O formato **não é conhecido**: o banco pode
  devolver HTML, PDF, imagem, o texto do Pix copia e cola, um arquivo estruturado, ou uma
  combinação. **Antes de definir o formato de entrada é preciso inspecionar um exemplo real** — sem
  dados bancários sensíveis — e só então decidir. **Não presumir que o QR Code isolado carregue os
  dados comerciais necessários** para identificar o destinatário: a identidade do destinatário vem
  da **descrição** e do **registro**, não do desenho do QR Code.

- **A organização dos arquivos — conceitual, não fixada.** A proposta é organizá-los por
  **identificador de domínio e subdomínio** e por **data**, para que cada cobrança seja localizável.
  A estrutura conceitual pensada é: **destinatário** (escola ou professor) · **identificador** (o
  slug) · **data de emissão** · **plano ou finalidade** · **material Pix recebido do banco** ·
  **estado de pagamento** · **data de confirmação**, quando houver. Isto é **proposta**, e **não**
  fixa caminho, extensão nem formato: os padrões do repositório (sufixo da escola, um arquivo por
  artefato, saídas geradas fora do Git) têm de ser **verificados** antes, e é o que a **C16** deixa
  em aberto.

- **GitHub × Cloudflare × Worker × KV — o que a solução futura tem de respeitar.** A arquitetura
  vigente: o **GitHub** guarda os arquivos versionados que são **fontes de verdade**; o
  **Cloudflare** serve os estáticos implantados; o **Worker** executa as operações dinâmicas já
  previstas; o **KV**, onde couber, guarda o dado operacional para o qual foi previsto. Duas
  possibilidades de operação ficam **registadas como alternativas**, não escolhidas: **(A) pelo
  GitHub** — preparar ou atualizar os arquivos localmente, revisar, versionar e implantar pelo
  processo existente; **(B) pelo Worker/Cloudflare** — publicar ou atualizar **apenas** o dado
  operacional apropriado, sem um *deploy* completo quando ele não for necessário. **Não decidir
  antecipadamente que toda cobrança vira arquivo estático**: QR Code, instruções de pagamento,
  estado comercial e informação privada têm requisitos de exposição e de atualização
  **diferentes**. Fica registada, para decisão, a necessidade de saber **o que pode ser público, o
  que é privado, e qual mecanismo é a fonte de verdade do estado de pagamento** — a última parte é a
  **C11**, e **não** se duplica aqui.

- **A confirmação manual — o que ela tem de garantir.** Quem confirma é o proprietário ou um
  administrador autorizado, **depois** de ver o crédito no extrato — e as regras abaixo **reafirmam
  e estendem** a «Mudança de modelo» desta frente, sem a contradizer: **(i)** o QR Code gerado
  **não** comprova pagamento; **(ii)** o comprovante enviado pelo cliente **não** é confirmação
  definitiva; **(iii)** a **descrição** Pix ajuda a conciliação, mas **não** serve, isolada, como
  prova suficiente de identidade; **(iv)** a confirmação manual tem de deixar **registro
  rastreável**; **(v)** o estado comercial atualizado tem de ficar associado ao **destinatário
  correto**; **(vi)** a operação tem de ser **idempotente** — confirmar duas vezes a mesma cobrança
  **não** pode duplicar pagamento, crédito nem mudar estado indevidamente; **(vii)** uma cobrança
  **não** pode ser ligada a uma escola ou professor **só porque o nome coincide** com outro
  registro; **(viii)** falha na publicação ou na atualização tem de ser **detectável e
  recuperável**. Os campos e estados exactos têm de ser **compatibilizados com o modelo comercial
  que a L11 já define** — e **não** pode nascer um **segundo controle de pagamentos**.

- **A ferramenta local futura — possibilidade, não entrega.** Fica registada como possibilidade
  futura uma ferramenta local que receba o conteúdo copiado do banco e automatize o repetitivo.
  Depois de **especificação e implementação próprias**, ela poderá: (1) receber o material Pix;
  (2) validar o formato; (3) pedir ou identificar o destinatário; (4) organizar os arquivos por
  identificador e data; (5) preparar os arquivos para publicação; (6) permitir revisão antes de
  publicar; (7) registrar a confirmação manual de pagamento; (8) atualizar o estado comercial pelo
  mecanismo apropriado; (9) executar ou orientar o *deploy* necessário; (10) mostrar o resultado da
  operação e permitir recuperação em caso de falha. **A ferramenta não pode marcar pagamento
  sozinha** só porque um arquivo foi inserido ou publicado. A estimativa do proprietário de
  «≈ **2 minutos por cliente**» na operação manual fica registada como **hipótese dele** —
  **não** como desempenho medido; nada foi cronometrado.

- **Segurança e privacidade — o que não pode ser publicado.** Antes de implementar, é preciso
  definir **o que do banco se preserva e o que se descarta**. **Não** vão para o GitHub, para
  estáticos nem para páginas públicas: **extratos** bancários; **dados pessoais** desnecessários;
  informação privada da **conta** bancária; **credenciais, tokens ou segredos**; e informação
  administrativa que permita **mudar o estado comercial sem autorização**. O material Pix é tratado
  conforme a sua natureza e a finalidade de **disponibilizar a cobrança**; o **estado de pagamento**
  tem **controle de acesso próprio** — é a regra 7 do §6 aplicada ao dinheiro.

- **O que esta subsecção NÃO é.** Não é implementação: não há código, não há arquivo de cobrança
  criado, não há cobrança real publicada, e **nada** do Worker, do KV ou do *deploy* foi tocado.
  Não é integração bancária: **não** há webhook, gateway, API de banco nem automação. E **não**
  substitui a conciliação manual por confirmação automática — a confirmação continua **humana**.

---

### L12 — A jornada comercial: a oferta, o período gratuito e a comunicação

- **Objetivo e justificativa.** Fazer a escola **conhecer e contratar** o plano sem que ninguém
  empurre: a oferta declarada num lugar só (o plano Básico com **três meses gratuitos**, sem
  cartão, sem cadastro de meio de pagamento e **sem cobrança automática** no fim), uma secção
  **permanente** onde os três planos são visíveis com preços, recursos e limites, e uma
  **comunicação não intrusiva** que avisa o fim do período gratuito **antes** de ele chegar. A
  justificativa é comercial e é do dono do produto: o período gratuito é a porta, e a contratação
  tem de ser um ato **consciente** — não um susto na fatura nem um pop-up a cada acesso.

- **Situação atual — medida.** **Nada existe** (§2.9): não há plano, preço, período, oferta,
  aviso ou mensagem. Não há **e-mail** em lugar nenhum do motor (`motor/`, `tools/` — varredura:
  zero ocorrências de envio, SMTP ou serviço de terceiros). Não há **menu** de planos: o menu do
  topo tem `Sistema Lastro` e o grupo `Bastidores` (`criar-escola.sh`, `gerar_nav_zero`), e mais
  nada. E não há **papel de administrador**: existe a senha da direção (a da escola) e a senha da
  raiz (a do dono do produto) — nenhuma das duas é «o administrador do Sistema Lastro» que a
  estratégia nomeia.

- **Lacunas.** (1) **Não há onde declarar a oferta** — nem o período gratuito, nem o que ele
  inclui; (2) **não há como contar o tempo** de uma escola desde a criação: a data de criação
  existe no índice da escola (`escola/<slug>/indice.json`, medido: `criado_em`), mas **nada a
  lê**; (3) **não há secção de planos** no menu, e criá-la é alterar a **navegação** (o que
  `CONGELAMENTO.md` exige motivo declarado + commit próprio — para quando se implementar, não
  agora); (4) **não há canal de mensagem** — sem e-mail, «avisar os últimos 15 dias» não tem por
  onde sair; (5) **não há sinal de bloqueio suave**: o único interruptor é `ESCOLA_HABILITADA`, que
  devolve **503 em tudo**; (6) **não há distinção entre «não pagou» e «não contratou»** — e no fim
  do período gratuito a escola está na segunda situação, não na primeira.

- **Dependências técnicas e de domínio.**
  - **L8** (os valores) — os preços dos três planos **não estão no repositório** (§2.9, C8). A
    secção de planos pode ser construída com valor declarado como **rascunho**, mas não **entra no
    ar** sem C8.
  - **L9** (cotas e limites por plano) — a estratégia §9 é explícita: «o motor deverá validar o
    plano e suas permissões. A interface **não** será considerada mecanismo suficiente de controle
    de acesso». Isso é **exactamente** o que L9 entrega, e **já está lá** (critérios (i)–(v)). L12
    não o duplica: aponta.
  - **C13** (onde vive a página de pagamentos) e **C14** (quando começam as 48 h) — decidem o que a
    jornada faz no fim.
  - **C12** (as quatro durações) — o fim do período gratuito **não** é dívida: é o **começo** da
    possibilidade de contratar. Tratá-lo pela regra de inadimplência seria bloquear quem nunca
    deveu nada.
  - **Canal de mensagem** — o e-mail administrativo de L11 §4 e os avisos desta frente dependem de
    um serviço que **não existe** no projeto. É **dependência externa** nova, e não está escolhida.

- **Entregas.** (a) A **oferta declarada** — o que o período gratuito inclui, por quanto tempo, e
  o que **não** acontece quando ele acaba (não há cobrança automática); (b) a **secção permanente
  «Planos, Pagamentos e Condições»** no menu, com os três planos e os recursos por plano — os
  superiores **visíveis e explicados**, e **bloqueados** quando não autorizados (a trava é de L9,
  não da interface); (c) a **contagem do período gratuito** por escola, a partir do `criado_em`
  que já existe, com a data de fim **visível** para a escola (não escondida); (d) a **comunicação
  não intrusiva** — a programação de mensagens declarada como *proposta inicial ajustável*; (e) o
  **aviso antecipado** do fim do período gratuito, com a antecedência que a decisão fixar;
  (f) o **estado comercial explícito** de cada escola, com os quatro que hoje **não** se
  distinguem: `gratuito` · `solicitou` · `pagante` · `expirado-sem-contratar`.

- **A comunicação, como proposta e não como regra.** A estratégia sugere cinco marcos —
  **boas-vindas no 1.º dia**, **avaliação por volta do 7.º**, **apresentação dos planos por volta
  do 14.º** e **avisos nos últimos 15 dias** (dois, portanto: o primeiro a 15 dias do fim e outro
  mais perto). Ela própria os marca como «proposta inicial ajustável». Registo-os aqui como o que
  são — **cadência sugerida**, a confirmar — e não como desenho fechado, porque a cadência depende
  de o canal existir, e o canal não existe. **Duas regras da estratégia que valem desde já**, e
  são critérios de aceite: **não** apresentar janelas comerciais a cada acesso, e **separar** o
  pedido de avaliação da oferta de contratação (a mesma caixa de diálogo não faz as duas coisas).

- **Ordem de implementação.**

  | Etapa | O que é | Depende de | Critério de aceite da etapa |
  |:--|:--|:--|:--|
  | **J0** | **Decidir as quatro durações** (C12) e o **marco das 48 h** (C14) | — | As quatro durações estão escritas, datadas e com o motivo; suspensão e expurgo estão **separados** por definição |
  | **J1** | **O estado comercial da escola** — os quatro estados, e onde vivem | J0 · **C11** (o mesmo lugar do estado de L11) | Os quatro estados existem e são distinguíveis; uma escola **gratuita** nunca é lida como inadimplente |
  | **J2** | **A oferta e a secção de planos** (sem preço no ar) | J1 · **C13** (onde a página vive) | A secção existe e explica os três planos; os recursos não autorizados aparecem **bloqueados**; o preço exibido vem da **fonte única** de L8 — e enquanto C8 não fechar, **não vai ao ar** |
  | **J3** | **A contagem do período gratuito** | J1 | A data de fim é calculada e **visível** para a escola; uma escola de teste criada hoje mostra o fim a três meses |
  | **J4** | **A comunicação** | J3 · **o canal** (escolha externa) | O aviso do fim sai **antes** do fim; nenhuma janela comercial aparece por acesso; avaliação e oferta são mensagens **separadas** |
  | **J5** | **O bloqueio suave** | J1 · **C12** (pergunta 3) | Suspender bloqueia as operações não autorizadas **sem** apagar dado **e sem** impedir a página de pagamento; medido com contagens antes e depois |

  **O que não se deve fazer.** Ligar o **J2** antes do **J1** (uma secção de planos sem estado
  comercial não sabe a quem está a mostrar o quê), e tratar o **fim do período gratuito** com a
  régua da **inadimplência** (C12, pergunta 1) — é a confusão que bloqueia quem nunca deveu.

- **Critérios verificáveis.** **(i)** Uma escola recém-criada é `gratuito` e tem os recursos do
  Básico; **(ii)** ao fim dos três meses **sem** contratação, `ESCOLA_HABILITADA` **não** é
  desligada automaticamente e **nenhum** dado é apagado; **(iii)** o preço exibido, o calculado e o
  cobrado são o **mesmo número** (L8, critério (ii)); **(iv)** um recurso de plano superior aparece
  **explicado e bloqueado**, e a tentativa de o usar é recusada **pelo motor**, não pela tela;
  **(v)** nenhuma mensagem comercial aparece no 2.º acesso do mesmo dia; **(vi)** a avaliação do
  7.º dia e a oferta do 14.º são mensagens **distintas**; **(vii)** o aviso do fim do período
  gratuito chega **antes** do fim, e o evento fica registado; **(viii)** descer de plano **não
  apaga** dado (o critério (iv) de L9, exercido); **(ix)** a suspensão **não** impede a escola de
  pagar e se reativar; **(x)** o e-mail administrativo **não** altera estado comercial por si só
  (a mesma regra dura que L11 §4 declara).

- **Riscos e decisões por confirmar.**
  - **O risco maior é de produto, e não de código:** o período gratuito é uma **promessa**. Se ao
    fim dos três meses o sistema bloquear de repente, a promessa vira armadilha — e o dano é de
    reputação, não de dado. É o que a pergunta 1 de C12 protege.
  - **Bloqueio suave sem canal.** «Avisar antes» pressupõe um canal confiável (e-mail de
    alguém). Sem ele, o aviso mais honesto é **dentro do sistema** — e isso só alcança quem entra.
    Não escolho o canal: é dependência externa, com custo.
  - **Preço em página pública.** A secção de planos é pública (C13) e os preços são C8. Publicar
    antes de C8 fechar é o modo mais rápido de o preço errado circular.
  - **Três planos, um só disponível.** A estratégia quer os superiores **visíveis e bloqueados**.
    Feito sem cuidado, isso é publicidade a portas fechadas — e o critério é que cada recurso
    diga **o que é**, não que fique cinzento.

- **Prioridade.** **P3** — depois de L8 (o valor) e L9 (a trava), e **depois de J0**, que é
  decisão e não código. **J1 e J3 não dependem de nada externo** e podem começar desde já; o que
  espera é a **J2** (C8) e a **J4** (o canal).

---

### L13 — A identidade visual como escolha: o catálogo das doze combinações

- **Objetivo e justificativa.** Deixar a **aparência** do sistema ser escolha de quem o usa, dentro
  de um catálogo **fechado e medido** — seis famílias de paleta, cada uma com variante **clara** e
  **noturna** —, em vez de uma identidade única imposta a todas as escolas. A justificativa é de
  produto e de uso real: as escolas do universo da dança **não têm a mesma cara**, e uma paleta de
  teatro clássico não é o que uma escola de bairro quer na tela às 21h. A frente existe para que a
  escolha seja **uma decisão com contrato** — e não uma preferência que cada página resolve por si,
  que é como a identidade divergiu em quatro arquivos na primeira vez (é a origem de
  `IDENTIDADE-VISUAL.md`).

- **Documentação concluída, funcionalidade NÃO implementada — dito uma vez, e sem rodeio.**

  | | Estado |
  |:--|:--|
  | O **contrato** da identidade (tokens, papéis, piso de contraste, validador) | **documentado e em vigor** desde 25/09/2026 |
  | O **catálogo** das seis famílias × duas variantes | **documentado** em 16/10/2026 — nomes provisórios, **sem hex** |
  | A **funcionalidade** (menu «Identidade visual», campo «Paleta de cores», aplicação global, persistência) | **não implementada** — nem uma linha |
  | Os **hex** de cada família | **não existem** — a especificar e medir antes de implementar |

- **Situação atual — medida.** A identidade **existe e está em vigor**; o catálogo **não**. O que a
  medição de 16/10/2026 estabeleceu, e que decide o esforço da frente:

  - **O caminho está aberto.** `tools/templates/ciclo.css` é a fonte única, e o **corpo** dela
    **não escreve um único hex**: usa `var(--…)` **66 vezes** (medido). Trocar os valores do
    `:root` re-veste **todos** os componentes sem reescrever uma regra — é o que torna o escopo
    global viável sem tocar em componente nenhum.
  - **Uma folha só para a interface inteira.** Os Bastidores carregam **a mesma** folha do pacote
    (`motor/servidor/bastidores.js:550`), e o pacote recebe `assets/style.css` como **cópia
    gerada** da fonte.
  - **Mas a paleta é resolvida na geração, não no uso.** A cópia do pacote é **gerada** e o
    validador exige que ela seja **idêntica** à fonte (`check-identidade.js`, a checagem
    «circuito»). Um estático não muda de cor porque alguém escolheu uma opção — e a escolha é de
    **pessoa**, não de pacote.
  - **Há uma chave de escola confiável.** `ESCOLA_SLUG` (var do Worker de cada escola) — o mesmo
    mecanismo que a **C13** mediu. Não há lista pública, e o parâmetro `?escola=` é recurso de
    desenvolvimento (`escolaDe`, `bastidores.js:97`).

- **Lacunas.** (1) **Não há catálogo** — as doze combinações não existem em lugar nenhum do
  código, e nenhum dos seus hex está especificado; (2) **não há item de menu** «Identidade visual»
  no painel administrativo — e acrescentá-lo é alterar **navegação** (`CONGELAMENTO.md`, «exige
  motivo declarado»); (3) **os leitores da fonte assumem um só `:root`** — `tools/lib-tokens.js`
  corta o bloco no **primeiro** `}` depois do primeiro `:root`, e `check-identidade.js` faz o mesmo
  (`lerTokens`): doze paletas num arquivo exigem que os dois saibam **qual** ler; (4) **não há
  mecanismo de aplicação** escolhido — navegador ou servidor, e cada um arrasta consequências
  distintas — **decidido em 18/10/2026: servidor**, porque a preferência é da escola (C15); (5)
  **não há onde guardar a preferência** — o *de quem* está respondido (**C15: da escola**), o
  *onde no dado* não; (6) **o validador mede uma paleta** — com o catálogo, tem de medir **cada
  combinação contra os fundos reais**, e os semânticos (`--ok`, `--alerta`, `--falha`) não podem
  perder o significado em nenhuma delas; (7) **não há noturna nenhuma** — a vigente não tem par
  noturno, e a variante noturna da Bordô de Cena também é estudo.

- **Dependências técnicas e de domínio.**
  - **O contrato de forma** — `IDENTIDADE-VISUAL.md` (livre). É onde o catálogo, os requisitos e o
    critério de acessibilidade estão declarados. **A frente implementa o que ele descreve**; se o
    desenho precisar de outra coisa, muda-se o **contrato**, com data.
  - **A decisão do mecanismo** — aplicar **no navegador** (um script reescreve os tokens no `:root`
    a partir da preferência guardada; funciona em página estática e não exige regerar nada) ou
    **no servidor** (o Worker injeta a paleta; o caminho existe — `"run_worker_first": true` nos
    `wrangler.<escola>.jsonc`, e `env.ASSETS` em `motor/servidor/cloudflare.js:188`). **Escolhido
    em 18/10/2026: o servidor** — consequência directa de a preferência ser **da escola**: uma
    escolha que vale para todos não pode viver no navegador de cada um. O que se implementa hoje
    (o tema no navegador) é o caminho **provisório**, e está declarado como tal.
  - **C15** — a preferência é **por escola**, **por usuário** ou **por navegador**. **Precede** o
    desenho: é ela que decide se há um campo novo no dado da escola, e é ela que trava a
    persistência. **DECIDIDA em 18/10/2026: por escola** — e a razão de a pergunta existir
    continua medida em §3 C15. O que a decisão arrasta: o mecanismo passa a ser o **servidor**, e
    o valor mora no **dado da escola** (onde, ainda não: ver o *A × B*, abaixo).
  - **Infraestrutura congelada** — `tools/templates/ciclo.css`, `tools/lib-tokens.js`,
    `tools/check-identidade.js`, e `tools/templates/*.html` se o mecanismo exigir um script.
    Alterá-los exige **motivo declarado + `REGISTRO.md` + commit próprio** — **na implementação**,
    não agora.
  - **C13** (onde a página de planos vive) — **não** é dependência: as duas são de instalação, e a
    identidade visual pertence ao **painel administrativo**, que já existe.

- **Entregas.** (a) Os **tokens das doze combinações** na fonte única — cada família com clara e
  noturna, **medidos** antes de escritos; (b) a **entrada de menu «Identidade visual»** na área de
  configuração do painel (alteração de navegação: motivo declarado); (c) o campo **«Paleta de
  cores»** com as doze opções, na ordem do catálogo, cada família com as duas variantes juntas;
  (d) o **mecanismo de aplicação global** — a escolha feita uma vez e valendo em cabeçalho,
  navegação, formulários, tabelas, cartões, modais e mensagens; (e) a **persistência** da
  preferência entre sessões, **no dado da escola** (C15 decidida: a preferência é da escola), e
  aplicada pelo servidor; (f) o **validador
  estendido** — `PARES` contra as doze combinações e contra os fundos reais, com a **cópia única**
  continuando a valer (as doze paletas são **acréscimo à fonte**, não cópias espalhadas); (g) a
  **noturna concebida para cada família**, nunca uma inversão automática; (h) os **leitores da
  fonte** capazes de dizer **qual** paleta ler — `lib-tokens.js` (o PDF) e `check-identidade.js`.

- **Ordem de implementação.**

  | Etapa | O que é | Depende de | Critério de aceite da etapa |
  |:--|:--|:--|:--|
  | **V0** ✅ **18/10/2026** | **Decidir de quem é a preferência** (C15) | — | **Feito:** a decisão está escrita, datada e com o motivo (§3 C15) — **a preferência é da escola**. Os três caminhos foram comparados contra o modelo de acesso **medido**, e é a medição que sustenta a escolha: por usuário não há onde pendurar |
  | **V1** | **Especificar e medir** os hex das doze combinações, na fonte única | V0 não; o **critério** sim (WCAG 2.1 AA) | Cada par de `PARES` passa, em cada combinação, **contra os fundos reais**; nenhum hex entra sem a medição publicada; a identidade vigente **não** muda de valor |
  | **V2** | **O validador estendido** — mede as doze, e a cópia única continua a valer | V1 | `check-identidade.js` mede a **matriz** completa e reprova a combinação que falhar; o deck e o PDF continuam conferidos contra a paleta vigente |
  | **V3** | **O mecanismo de aplicação global** | V0 · a decisão navegador × servidor | A escolha re-veste **todas** as telas sem regerar pacote (navegador) **ou** com o servidor injectando; nenhum componente passa a conhecer o nome de uma paleta |
  | **V4** | **O item de menu e o campo** | V3 · **motivo declarado** (navegação + `tools/`) | O menu abre a configuração; o campo oferece as **doze**, na ordem do catálogo; o rótulo é «Paleta de cores» |
  | **V5** | **A persistência** | V0 · V3 | A preferência sobrevive ao fechar e reabrir; a troca **não** toca em dado pedagógico, registro, versão de plano, permissão nem regra de negócio — verificado por contagem antes e depois |

- **Critérios verificáveis.** **(i)** A identidade vigente **não** muda ao introduzir o catálogo —
  os tokens de hoje mantêm os valores de hoje; **(ii)** as **doze** combinações são oferecidas, na
  ordem do catálogo, com as duas variantes de cada família juntas; **(iii)** cada combinação passa
  no piso medido — **4,5:1** texto, **3,0:1** traço com função — **contra os fundos reais** dos
  componentes; **(iv)** os semânticos continuam a comunicar resultado em **toda** combinação (não
  viram ornamento); **(v)** a escolha vale em **todas** as telas — cabeçalho, navegação,
  formulários, tabelas, cartões, modais e mensagens —, e não por página; **(vi)** a preferência
  **persiste** entre sessões; **(vii)** a escolha **não** depende de `prefers-color-scheme` (o
  sistema operativo pode, no máximo, sugerir o valor inicial); **(viii)** a troca **não** altera
  dado pedagógico, registro, versão de plano, permissão nem regra de negócio — provado por
  contagem; **(ix)** o `.fipp` **não** é reancorado pela troca de paleta (é forma, não fonte de
  ciclo); **(x)** zero dependência nova — o catálogo é CSS nativo.

- **Riscos e decisões por confirmar.**
  - **O risco maior é de arquitetura, e não de cor:** aplicar no **navegador** não cria campo no
    dado e não exige regerar pacote, mas a preferência **não viaja** entre dispositivos; aplicar no
    **servidor** viaja, e cria um campo **de alguém** — que é exatamente o que C15 não respondeu.
    **Resolvido em 18/10/2026:** C15 respondeu (**da escola**), e por isso o caminho é o
    **servidor**. O risco que fica é outro, e é menor: o campo é um, e é da instalação.
  - **A noturna é trabalho, não inversão.** Doze combinações são doze desenhos: inverter a clara
    produz contraste que reprova e uma cor que não é a da família. O critério (iii) é o que impede
    a pressa.
  - **Os leitores da fonte quebram se o arquivo passar a ter doze `:root`.** O `lib-tokens.js`
    alimenta o **PDF** (`--latex`), e ele lê o **primeiro** bloco. Um `:root` a mais antes dele
    muda a cor do PDF **em silêncio** — é a mesma classe de defeito que originou o validador.
  - **O deck e o PDF seguem a vigente.** O deck **declara** os tokens e o validador confere se
    batem com a fonte; o PDF recebe `\definecolor` **injetado**. Com doze paletas, **qual** delas o
    deck e o PDF usam é pergunta a responder em V2 — e a resposta provável é «a vigente», mas isso
    é decisão, não consequência.
  - **Verificação de acessibilidade não se faz no olho.** Sem a medição, o catálogo é gosto.
  - **A natureza da frente — *A × B* — é decisão de produto, e precede a V0.** Se a paleta se
    escolhe **na contratação** (*B* — instrumento de aquisição), ela é **parte do provisionamento** e
    a preferência é **da escola**, morando no estado comercial (território de **C11/C16**); se se
    escolhe **dentro do sistema** (*A* — conforto de quem já é usuário, o que está desenhado), a
    pergunta «de quem» continua aberta. **Não decidida** — e é o que **reordena** a V0: primeiro
    *quando*, depois *de quem* (a quarta dimensão da **C15**, §3).
    **Nota de 18/10/2026:** o «de quem» foi decidido (**a escola**), e é o *quando* que fica. Com
    as duas pontas a terminarem na escola, ele deixa de ser uma pergunta sobre a **V0** e passa a
    ser sobre a **V5** (a persistência): *o valor mora no dado da escola desde a contratação, ou
    nasce no primeiro uso?* Continua a ser **decisão de produto**, e não bloqueia mais a V0.

- **Prioridade.** **P3** — e **não reordena nada**: nenhuma frente depende dela, e ela não depende
  de nenhuma frente. É a única frente do documento nessa posição, e o motivo é declarado: ela é de
  **forma**, e a forma não bloqueia conteúdo, cobrança nem porta. **V1 é a parte independente** e
  pode começar assim que houver o critério — o que ela **não** pode é começar sem V0, porque os hex
  de doze combinações são caros de escolher e baratos de escolher duas vezes.

---

### L14 — O catálogo de turmas prontas: a oferta que se vende

- **Objetivo e justificativa.** Transformar o botão «Carregar as turmas iniciais» — hoje um
  andaime de desenvolvimento, que enche o cadastro com as turmas de referência do
  `progressao.json` — na **primeira oferta comercial de conteúdo do produto**: turmas já
  montadas, prontas para o professor usar, que a escola **compra** em vez de construir. A
  pesquisadora, a 01/11/2026: «quando esse botão carregar turma for acionado, eu penso em
  carregar já turmas prontas, tudo pronto, montado já para o professor. E eu quero poder vender
  isso no futuro […] então no futuro eu quero usar isso, mas eu acho que isso tem que entrar com
  um plano». É a diferença entre **um serviço** (a escola contrata o sistema e o alimenta) e
  **um produto** (a escola compra conteúdo e o usa) — e o sistema já tem o conteúdo: 94 termos,
  a progressão de níveis, os verbetes da notação e as associações turma↔conteúdo.
- **Situação atual.** **Existe o mecanismo e não existe a oferta.** `POST
  /api/bastidores/semear-catalogo` carrega `CATALOGO.TURMAS` e `CATALOGO.RELACOES` do
  `biblioteca/modalidades/bale-classico/progressao.json` para o cadastro da escola, sem duplicar
  o que já existe — idempotente, medido. O botão está hoje dentro do «+» do verbete
  («Verbetes da notação» → exercício novo), para onde foi a 01/11/2026 quando a página do
  vocabulário saiu (§2.1).
  **O QUE ELE NÃO TRAZ, e é a lacuna que esta frente tem de fechar:** as turmas do catálogo
  têm **nome, ordem, programa e nível de referência** e **não têm o RITMO** — dias, hora de cada
  dia, duração e período. Medido: `comporConf` **lança** «a turma não tem o que a geração exige:
  os dias da semana da turma; a duração de cada aula; o início do período; o fim do período».
  Uma turma semeada assim serve para a curadoria e para o repertório e **não gera ciclo**: nasce
  pela metade. Hoje o aviso está no `confirm` do botão; a frente tem de resolver a causa.
- **Lacunas.** (a) O catálogo não declara o ritmo — e o ritmo é do **contrato da escola**, não
  do conteúdo (a mesma turma pode ser 2×/semana numa escola e 3× noutra): falta decidir **quem
  o fornece** (a escola ao carregar? um valor de referência que ela corrige? um intervalo?);
  (b) não há noção de «turma pronta» como **objeto vendável** — hoje `progressao.json` é
  conteúdo da modalidade, e não há preço, versão, autoria nem licença; (c) não há
  **curadoria de conteúdo**: quem responde por uma turma que a escola paga para usar; (d) não
  há como a escola **acrescentar ao** catálogo o que ela construiu (o inverso da compra), que é
  o que separa um catálogo vivo de uma lista fixa; (e) não há registro de **o que foi comprado**
  — a escola que carrega hoje não sabe depois o que veio do catálogo e o que é dela.
- **Dependências técnicas e de domínio.** L8 (o valor — sem preço não há oferta) e L9 (a trava
  por plano — quantas turmas prontas o plano inclui); L11/L12 para o ato de compra; **C19** (o
  que exatamente é «turma pronta»: só o esqueleto de níveis e associações, ou também as aulas,
  os planos de ensino e os POs de referência?); e a **decisão do ritmo** — técnica, porque
  determina se o catálogo pode ser semeado sem mais perguntas ou se a carga passa a ter uma
  etapa de cadastro.
- **Entregas.** (a) O **ritmo no catálogo**, de uma das três formas que a decisão escolher:
  valor de referência por turma (que a escola corrige), ou intervalo («2 a 3×/semana, 60 min»),
  ou pergunta obrigatória ao carregar; (b) o **objeto «turma pronta»** com `id`, versão, autoria,
  nível de referência e associações — separado do cadastro da escola, que passa a **referenciá-lo**
  (`turmaProntaId`) em vez de o copiar, para a escola receber correções; (c) a **marca de
  origem** em cada turma carregada (do catálogo × da escola), que é o que permite dizer depois o
  que foi comprado; (d) o **catálogo como oferta**: o que está incluído, o que é adicional, e a
  ligação a L8; (e) a via inversa — a escola propõe ao catálogo o que construiu, com curadoria.
- **Critérios verificáveis.** (i) Uma turma carregada do catálogo **gera ciclo** sem nenhuma
  edição manual — é a prova que hoje falha, e a que fecha esta frente; (ii) carregar duas vezes
  não duplica (idempotência, que já se mede); (iii) a marca de origem distingue catálogo de
  escola, e sobrevive à regeração dos índices; (iv) uma correção no catálogo chega às escolas que
  o compraram sem lhes apagar o que é delas; (v) o preço e o que está incluído saem de L8, não do
  código.
- **Riscos e decisões por confirmar.** (a) **C19** — o que é «turma pronta» (só o esqueleto, ou
  as aulas e os planos também): é a decisão que dá tamanho à frente; (b) **o ritmo**: sem ele a
  oferta não entrega o que promete, e é a lacuna medida hoje; (c) **propriedade intelectual do
  conteúdo** — de quem é a turma pronta, e o que impede uma escola de a repassar; (d) **o
  catálogo envelhece**: uma turma vendida em 2026 e corrigida em 2027 muda debaixo dos pés de
  quem já a usa — a resposta é versão, e ela custa; (e) **a fronteira com o gratuito**: o que a
  escola recebe sem comprar (as turmas de referência, que hoje são o andaime) e o que passa a ser
  oferta.
- **Prioridade.** **P3** — não destranca nenhuma frente de dado, e depende de L8 e L9 para ser
  oferta. Mas é a única frente que **cria conteúdo vendável a partir de conteúdo que já existe**,
  e por isso é a que tem o melhor retorno por unidade de trabalho — desde que C19 e o ritmo
  estejam decididos.

## 5. Sequência sugerida

**Por camadas** — cada camada só começa quando a de baixo está fechada:

| Camada | Frentes | Por que nesta ordem |
|:--|:--|:--|
| **0 — a base** | **L1** (dicionário de campos) · **L2** (identidade estável) · **L10** (o vocabulário do domínio que falta) | sem chave estável não há o que cruzar, indexar ou provar — e sem o **conceito** (contexto, componente, intervenção, resposta) não há o que cruzar. L1, L2 e L10 correm em paralelo; cruzam-se no nó `sujeitos` e em `itens-por-dimensao` |
| **1 — a versão e a ponte** | **L5** (versão explícita do plano — **desenho completo**: C3 · S1–S4 · S5–S7) · **L3** (o lançamento e o envelope com leitor — e é ele que **carrega** a referência de versão) | C3 decidida destrava L5 e L3; L5 define **o que** a ponte referencia, L3 constrói **a ponte** — nesta ordem, porque uma referência sem registro onde morar não é consultável, e um registro sem versão não tem o que referenciar |
| **2 — o encontro** | **L4** (mapa de relações e índice) | é a consequência de L1+L2+L10 aplicada ao dado de L3; sem ela, cada consulta varre tudo |
| **3 — o valor** | **L6** (catálogo de consultas) | depende de L1–L4 **e de L10** (sem o vocabulário, quatro das oito perguntas não têm como ser respondidas — §7); é onde o produto passa a valer |
| **4 — o comercial** | **L7** (IA e uso) → **L9** (cotas por plano) · **L8** (composição e valores) | L9 depende de L6+L7+L8. **L8 é independente do dado** e pode começar a qualquer momento, depois da confirmação dos valores |
| **5 — a porta** | **L11** (o lado público, o adaptador e a simulação — E1, E2) · **L12** (a oferta, o período gratuito e a comunicação) | **corre em paralelo a tudo o resto**: não depende do dado nem do provedor. O que ela tem de comercial — **E3** o valor, e toda a **L12** — só entra depois de **L8/C8**; e a integração real (**E8**) só entra quando o provedor responder. **J1 e J3 de L12 não dependem de nada externo** e podem começar desde já |
| **6 — a forma** | **L13** (a identidade visual como escolha — o catálogo das doze combinações) | **corre em paralelo a tudo o resto**, e é a camada mais independente do documento: não depende do dado, nem do provedor, nem do valor, nem da porta. O que ela espera **não é uma frente** — é a decisão de **C15** (a preferência é de quem), que **precede** o desenho da persistência — **decidida em 18/10/2026: da escola**. **As duas camadas 5 e 6 são as únicas cujo começo não espera por outra camada** |

**O que não se deve fazer.** Implementar L6 antes de L1/L2/L3 **e de L10** — produziria consultas
sobre chaves instáveis, sobre um dado sem leitor e sobre conceitos que o modelo não tem, e cada
consulta teria de ser reescrita depois. E implementar L9 antes de L6: não haveria catálogo para
distribuir nem medição para cortar.

**E o que não se deve fazer no comercial** — duas confusões que a estratégia de 16/10/2026 torna
fáceis, e que custam caro: tratar o **fim do período gratuito** com a régua da **inadimplência**
(quem nunca deveu nada não é inadimplente — §3 C12, pergunta 1), e usar **uma** duração onde a
estratégia nomeia **quatro** (§3 C12). A camada 5 tem **duas** frentes que se encostam: a L11
cobra, a L12 oferece — e a fronteira é o **estado comercial**, que as duas leem e só uma escreve
(quem escreve é decisão de **C11**).

**E o que não se deve fazer na forma** — a armadilha da camada 6, que é nova e tem nome: tratar a
**variante noturna** como a clara **invertida**. Inverter não é desenhar: produz contraste que
reprova e uma cor que não é a da família. A noturna é **concebida para a família**, e o piso medido
(4,5:1 texto · 3,0:1 traço) vale igual nos doze casos. A segunda armadilha é de sequência:
**especificar os hex antes de saber de quem é a preferência** (C15, **decidida em 18/10/2026: da escola**; agora o que falta são os valores) — doze combinações desenhadas
para «o usuário» quando não há usuário a quem pendurá-las é trabalho que se faz duas vezes.

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

## 8. Cobertura — cada requisito dos textos, e onde é respondido

> **Por que esta secção existe.** Para que o mapa seja **auditável**: nenhum requisito dos textos
> fica sem resposta, e nenhuma resposta fica sem requisito. É a tabela que se relê quando se
> quiser saber «isto já foi pensado?». São **quatro** os textos: o texto 1 (integridade, indexação
> e proveniência), o texto 2 (consultas pedagógicas e organização comercial), a **estratégia
> comercial de 16/10/2026** e a **atualização da identidade visual de 16/10/2026** — as duas
> últimas incorporadas nesta rodada.

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
| §5 | Distribuição 3 / 7 / todas | **§3 C5** — «todas» **decidida** em 18/10/2026 (fotografia da data de vigência); a repartição é **consequência** do catálogo fechado (C5b) |
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

### A estratégia comercial de 16/10/2026 — onde cada item é respondido

| § | O que a estratégia pede | Onde é respondido |
|:--|:--|:--|
| §1 | Três meses gratuitos do Básico, **sem cartão** e **sem compromisso**; **não** há cobrança automática no fim | **§L12**, entregas (a) e (c) · critérios (i) e (ii) |
| §1 | Modelo por **Pix com conciliação manual**; a InfinitePay como **alternativa**, não dependência | **§L11** («Mudança de modelo», 16/10/2026) + §L11 entregas (d) e (f) |
| §2 | Separar a **rota administrativa privada** da **rota pública** | **§3 C13** (em que instalação cada uma vive) + §L11 E2 · **§3 C11-1** (a rota pública **não existe** hoje) |
| §2 | A rota pública **não** expõe função administrativa nem dá acesso a dado comercial de outra escola | §L11 E2 (critério) + §6 regra 5 + **§3 C2** (isolamento) |
| §3 | Identificação **automática** da escola, sem lista pública de escolas | **§3 C13** — e a evidência de que o mecanismo **já existe** (`ESCOLA_SLUG` + `identidadeOk`, `producao.js:58`; `escolaDe`, `bastidores.js:97`) + §L11 E2 |
| §3 | Se a identidade **não** for segura, **interromper** a solicitação em vez de presumir a escola | §L11 E2 critério + §L12 J2 critério — **e** o precedente medido: a ponte já responde **500 com o erro nomeado** em vez de seguir (C13) |
| §4 | Os **oito campos** da solicitação de contratação | §L11 entregas (e) e (f) + **§3 C11** (onde o estado vive — precede o modelo) |
| §4 | E-mail administrativo, que **não** altera estado comercial por si só | §L12 J4 + critério (x) · **canal inexistente, medido** (§2.9) |
| §5 | Instruções de cobrança e, quando disponível, QR e Pix copia e cola | §L11 entrega (d) — a interface, com o provedor **opcional** |
| §5 | **Não** presumir a API do Nubank | §L12 dependências («o canal» e a API) — declarado **não verificado** |
| §5 | Comprovante do usuário **não** é confirmação definitiva | §L11 «Mudança de modelo» + §L12 critério (x) |
| §6 | **2 h** para pagar; **48 h** de conciliação; **não** bloquear durante a conferência | **§3 C12** e **§3 C14** (o marco das 48 h **não** é decidido por dedução) · §L12 J5 |
| §6 | Conjunto de evidências; o nome do pagador **não** decide sozinho | §L11 entregas (d)/(f) + §L12 J1 (o estado `solicitou`) |
| §7 | O fim dos prazos **não** é inadimplência nem exclusão automática | **§3 C12** (pergunta 1) · §L12 critério (ii) |
| §7 | O administrador decide, e **toda** mudança fica registada | §L11 entrega (f) + §L12 J1 · **papel inexistente, medido** (§L12 situação atual) |
| §8 | Período gratuito × assinatura paga, com tolerância e regularização | **§3 C12** (as quatro durações) + §L12 J1 e J5 |
| §8 | **Localizar e analisar** a «regra dos 30 dias» antes de mexer | **§2.9** (varredura: **não existe**) + **§3 C12** (as três perguntas) |
| §9 | Secção permanente **«Planos, Pagamentos e Condições»** no menu | §L12 entrega (b) — **e** é alteração de navegação: `CONGELAMENTO.md` exige motivo declarado **quando se implementar** |
| §9 | Recursos superiores **visíveis e bloqueados** | §L12 critérios (iii) e (iv) |
| §9 | O **motor** valida o plano, não a interface | **§L9** critérios (i)–(v) — já escrito, e L12 apenas aponta |
| §10 | Comunicação **não intrusiva**; avaliação **separada** da oferta; aviso antecipado do fim | §L12 «A comunicação, como proposta» + critérios (v)–(vii) |
| §10 | A cadência (1.º · 7.º · 14.º · últimos 15 dias) como **proposta ajustável** | §L12 «A comunicação, como proposta» — registada **como** proposta, não como regra |
| §11 | Auditar as decisões existentes e **não** resolver contradições em silêncio | **§3 C12, C13, C14** (as três que a conferência encontrou) · este §8 · §9 |
| §12 | Só o planeamento; resumo das alterações e lista das dúvidas | este documento — e **§9** (o que não se decidiu) |

### A atualização da identidade visual de 16/10/2026 — onde cada item é respondido

O texto desta rodada não é uma estratégia: é a **documentação de um estudo de forma** e o
**registo de uma funcionalidade futura**. A matriz é dele.

| § | O que foi pedido | Onde é respondido |
|:--|:--|:--|
| §1 | Inspecionar antes de editar; confirmar nomes e caminhos reais; não criar documento duplicado | **`IDENTIDADE-VISUAL.md`** — o documento **já existia** e foi **atualizado**, não duplicado. Os caminhos foram medidos: a fonte única é `tools/templates/ciclo.css`, o validador é `tools/check-identidade.js`, o leitor é `tools/lib-tokens.js` |
| §1 | Preservar as decisões técnicas não substituídas | **`IDENTIDADE-VISUAL.md`**, os tokens · §L13 critério **(i)** (a vigente **não** muda de valor) |
| §2 | A paleta bordô e dourado **continua** a identidade vigente; não declarar as seis como aprovadas | **`IDENTIDADE-VISUAL.md`**, o banner de 16/10/2026 e «O catálogo planejado» · **§L13**, o quadro «documentação concluída × funcionalidade implementada» |
| §2 | Registar as seis direções, cada uma clara e noturna, para avaliação futura | **`IDENTIDADE-VISUAL.md`**, «O catálogo planejado» · §L13 entregas (a) e (g) |
| §2 | As imagens são **estudos**, e o que nelas é ilegível não é especificação | **`IDENTIDADE-VISUAL.md`**, o aviso «As imagens são estudos, não especificação» |
| §3 | As seis famílias **nomeadas**, com carácter, provisórias | **`IDENTIDADE-VISUAL.md`**, a tabela das seis famílias |
| §3 | A lista das **doze** opções, na ordem do catálogo | **`IDENTIDADE-VISUAL.md`**, a lista · §L13 entrega (c) e critério (ii) |
| §3 | **Não** inventar hex a partir das imagens | **`IDENTIDADE-VISUAL.md`** (nenhum hex foi escrito) · §L13 entrega (a) e etapa **V1** |
| §4 | A funcionalidade futura: menu, campo, fluxo de cinco passos, aplicação global | **`IDENTIDADE-VISUAL.md`**, «A funcionalidade futura» · §L13 entregas (b)–(d) |
| §4 | Escopo **global**, não por página ou componente | **`IDENTIDADE-VISUAL.md`** (o corpo do `ciclo.css` é 100% tokens — 66 `var(--…)`, zero hex) · §L13 critério (v) |
| §4 | Respeitar a arquitetura de autenticação, persistência e escopo **já existente** | **§3 C15** — medido: o portão da Produção autentica **um segredo**, não uma pessoa, e por isso **não há usuário** onde pendurar a preferência. **É esta medição que sustentou a decisão de 18/10/2026:** sem usuário, a preferência é da instalação |
| §4 | **Não presumir** que a preferência vale para todos; confirmar contra o modelo de acesso e registar como pendente se não estiver definido | **§3 C15** — os três caminhos foram comparados contra o modelo medido, e a escolha foi **decidida em 18/10/2026: a escola** · **§L13 V0 fechada** |
| §4 | A preferência persiste entre sessões, sem escolher o mecanismo antes de inspecionar | **`IDENTIDADE-VISUAL.md`**, «Onde a preferência é guardada» (KV × navegador, o `sessionStorage` não serve) · §L13 entrega (e) |
| §4 | A troca **não** altera dado pedagógico, registro, versão de plano, permissão nem regra de negócio | **`IDENTIDADE-VISUAL.md`**, «O que a troca NÃO pode tocar» · §L13 critério (viii) |
| §5 | Os **onze** requisitos de implementação, sem implementar | **`IDENTIDADE-VISUAL.md`**, «Requisitos registados» · §L13 entregas e critérios |
| §5 | A escolha **não** pode depender só de `prefers-color-scheme` | **`IDENTIDADE-VISUAL.md`** (a escolha é explícita; o SO sugere, no máximo, o inicial) · §L13 critério (vii) |
| §6 | Preservar o WCAG 2.1 AA (4,5:1 e 3,0:1) | **`IDENTIDADE-VISUAL.md`**, «O critério é medido» e «Acessibilidade» · §L13 critério (iii) |
| §6 | Validar **cada** combinação contra os **fundos reais**; os semânticos mantêm o significado | **`IDENTIDADE-VISUAL.md`**, «Acessibilidade — o critério não muda, a superfície cresce» · §L13 critérios (iii) e (iv) |
| §6 | O catálogo e as regras de contraste **integram** os validadores existentes, sem cópias divergentes | **`IDENTIDADE-VISUAL.md`** (a tabela `PARES` é o lugar) · §L13 entrega (f) e etapa **V2** |
| §7 | Registar no planeamento: objetivo, escopo, dependências, critérios, pendências | **§L13** inteira · **§5** (camada 6) · **§9** |
| §7 | Distinguir documentação concluída de funcionalidade implementada | **§L13**, o quadro do topo · **`IDENTIDADE-VISUAL.md`**, o banner e «Não implementa o que planeja» |
| §7 | Não alterar a ordem de prioridades sem justificativa | **§4** e **§L13 «Prioridade»** — a L13 entra em **P3** e **não reordena nada**; o motivo está declarado |
| §7 | Não marcar como concluída etapa de código não executada | **§L13** — V0 a V5 estão **todas** por fazer, e a frente diz isso por palavras |
| §7 | Registar no handoff: a atualização, que não foi implementado, os arquivos alterados e as decisões abertas | `REGISTRO.md`, entrada de **16/10/2026**, que o `HANDOFF.md` **extrai** (é gerado) — com o bloco «O que ainda não está feito» |
| §7 | Entrada datada no registo cronológico de decisões, no formato já usado | **`REGISTRO.md`**, `## 16/10/2026 — …` |
| §8 | Os sete critérios de conclusão | **§9** (as pendências) e o resumo da entrega |

### O que os textos exigem e **ainda não tem resposta** — declarado

1. **A definição de «contexto», «componente», «intervenção» e «resposta observada»** (§3 C10) —
   é decisão de conteúdo, e sem ela o §7 mostra quatro perguntas bloqueadas. **Não a escrevi**: o
   texto 1 §7 proíbe presumir equivalência entre tradições, e definir «combinação» por analogia
   com o RAD seria fazê-lo.
2. **A especificação completa de cada consulta** (entradas, filtros, agrupamentos, saídas) —
   depende de (1) e dos ids de L1/L2; a **classe** de cada uma já está no §7.
3. **Quais consultas em cada plano** (§3 C5b) — decisão comercial, que **depende do catálogo
   fechado**; o texto 2 já a marcava como «a validar», e a grade de cobertura está em
   [PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) §4.9.
4. **Onde a habilitação do plano vive** (o `ESCOLA.conf` que o andaime promete) — depende de B3 e
   de C2.

---

## 9. O que este documento **não** decidiu

- **Não escolheu** as interpretações das contradições C1–C18 (§3); registou-as. **Exceção: C3**,
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
- **Não inventou** valores comerciais, nem regras de cobrança, nem quais consultas vão em cada
  plano (§2.9, C5b).
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
  por Pix, taxa do produto de API e verificação de autenticidade do webhook ficam **declarados como
  pendentes**, item por item, na matriz de **L11** (§4) — com a distinção explícita entre o que
  está **documentado**, o que está **parcialmente** documentado e o que **não** está. **Saiu desta
  lista, em 15/10/2026, a unidade de `amount`**: a documentação diz, com estas palavras, que «o
  valor do produto deve ser colocado em centavos». A frente **não escolheu** provedor: registou a
  **InfinitePay como a em avaliação** — e registou, como **facto medido** e não como suposição, que
  a API de cobrança **não** documenta nem exige credencial além do `handle` (§L11, «A credencial»),
  o que passou a obrigar a tratá-lo como **segredo operacional**.
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

### O que a incorporação de 16/10/2026 não decidiu — as perguntas que são do dono do produto

A estratégia pediu, por palavras próprias, que as contradições **não** fossem resolvidas em
silêncio e que as dúvidas fossem apresentadas **em separado**. Ficaram **cinco**, agrupadas em
**três** contradições (C12, C13, C14), e nenhuma delas tem resposta dedutível do repositório:

1. **A «regra dos 30 dias» existe em algum lugar, ou é para criar?** Não foi encontrada em
   varredura nenhuma (§2.9) e **não é sinónimo** do expurgo de 3 meses — suspender e apagar são
   coisas diferentes, e só a segunda tem código. **C12, pergunta 1.** Sem resposta, a L12 não tem
   como dar critério de aceite a «suspender».
2. **Os 3 meses de oferta e os 3 meses de carência do expurgo são o mesmo prazo?** Convergi-los é
   decisão declarada; hoje são dois números iguais com significados distintos. **C12, pergunta 2.**
3. **O que a suspensão bloqueia, exactamente?** A estratégia quer «as operações não autorizadas» —
   que é **mais estreito** que o `ESCOLA_HABILITADA = 'nao'` de hoje, o qual devolve **503 em
   tudo**, inclusive na página de pagamento, e por isso **impediria a escola de pagar**. **C12,
   pergunta 3.**
4. **Em que instalação vive a página de planos e pagamentos — no Worker da escola ou na raiz?** A
   única identificação de escola que existe é `ESCOLA_SLUG`, e ela **só existe no Worker da
   escola**; na raiz não há escola a identificar. A convergência proposta (a raiz **apresenta** a
   oferta, a instalação da escola **contrata**) não foi decidida. **C13.**
5. **As 48 h de conciliação começam quando?** Da criação (a), do fim das 2 h (b) ou do aviso do
   usuário (c — o candidato que a estratégia **não** pode querer)? Os três produzem sistemas
   diferentes. **C14.** Não decidido — por instrução expressa.

E duas que são dependência **externa**, e por isso não dependem de decisão de arquitetura, mas de
compra:

6. **O canal de mensagem.** Os avisos desta frente (boas-vindas, 7.º dia, 14.º dia, últimos 15
   dias) e o e-mail administrativo de L11 §4 não têm **onde sair**: não há envio de e-mail em
   `motor/` nem em `tools/` (varredura: zero). É serviço novo, com custo, e não está escolhido.
   Enquanto não houver canal, o único aviso honesto é **dentro do sistema** — e alcança só quem
   entra.
7. **A API do provedor de Pix.** A estratégia manda **não presumir** que a API do Nubank é
   acessível. Nada foi presumido: a documentação da InfinitePay continua a ser a única consultada,
   com as suas capacidades declaradas **item por item como pendentes** em §L11, e a conciliação
   fica **manual** até haver resposta. Isto **não** é uma pergunta para responder agora — é o que
   mantém a primeira versão livre de dependência do provedor.

E uma que **não** é pergunta, é aviso de escopo, para quando a L12 for implementada: a secção
permanente **«Planos, Pagamentos e Condições»** acrescenta um item ao **menu** do topo, que é
gerado por `tools/criar-escola.sh` (`gerar_nav_zero`) e descrito em `CONGELAMENTO.md` — a mudança
de navegação exige **motivo declarado + entrada no `REGISTRO.md` + commit próprio**, como qualquer
alteração àquela lista de arquivos. **Não** foi antecipada nesta rodada: o documento é planeamento,
e o `CONGELAMENTO.md` já cobre a hipótese sem precisar de emenda nova.

### O que o registo da identidade visual *(16/10/2026)* não decidiu

Esta rodada é **documental**, e o que ela **não** decidiu é o que a mantém honesta. Nada disto tem
resposta dedutível do repositório:

1. **De quem é a preferência de aparência — da escola, do usuário ou do navegador?** (**C15**) É a
   pergunta que **precede** o desenho: é ela que decide se há um campo novo no dado da escola e
   quem é a chave. **Medido:** o portão da Produção autentica **um segredo por escola**, não uma
   pessoa — logo **não há usuário** onde pendurar a preferência hoje. A tarefa manda **não
   presumir** que ela vale para todos, e a presunção é justamente o que o modelo não autoriza.
   **RESPONDIDA em 18/10/2026, pelo dono do produto: a preferência é DA ESCOLA.** A pergunta que
   resta não é «de quem», é «quem, dentro da escola» — e essa é a **C17**.
2. **O mecanismo de aplicação — no navegador ou no servidor?** O primeiro funciona em página
   estática e não exige regerar pacote; o segundo viaja entre dispositivos e cria um campo «de
   alguém». A decisão arrasta os **leitores da fonte**: `lib-tokens.js` e `check-identidade.js`
   assumem **um só** `:root`, e doze paletas exigem que os dois saibam **qual** ler.
   **RESPONDIDO em 18/10/2026: o servidor** — é a consequência de a preferência ser da escola.
3. **Os hex das doze combinações não existem.** Foram registados **nomes e carácter**, e
   deliberadamente **nenhum valor** — as imagens de referência são **estudo**, não especificação.
   **Confirma-se em 18/10/2026:** a decisão da C15 foi sobre **quem escolhe**, não sobre **quais
   são**. Os valores continuam por especificar e por medir (V1), e nenhum foi inventado.
   Especificar e **medir** cada combinação é a etapa **V1**, e ela não tem valor por dedução.
4. **Qual paleta o PDF e o deck passam a usar.** O deck **declara** os tokens e o validador confere
   se batem com a fonte; o PDF recebe o `\definecolor` **injetado** por `lib-tokens.js`. Com doze
   paletas, «a vigente» é a resposta **provável** e continua a ser **decisão**.
5. **Nada foi implementado.** Não há paleta nova no `ciclo.css`, não há item de menu «Identidade
   visual», não há campo «Paleta de cores», não há persistência e **não houve regeração de pacote**.
   O quadro de §L13 diz isto por palavras: o **contrato** está documentado e em vigor desde
   25/09/2026, o **catálogo** está documentado em 16/10/2026, a **funcionalidade não existe**.
6. **A identidade vigente não foi promovida nem rebaixada.** O sistema continua a ser o de **bordô
   e ouro**; as seis famílias são **estudo**, elegíveis e não eleitas. Nenhum valor de token mudou.

E uma nota de escopo, para quando a L13 for implementada: a entrada de menu **«Identidade visual»**
acrescenta um item ao painel administrativo, e `CONGELAMENTO.md` **já** lista «alterar a estrutura
de menu ou navegação» como exigindo motivo declarado — além de `tools/templates/ciclo.css`,
`tools/lib-tokens.js` e `tools/check-identidade.js`, que são **infraestrutura congelada**. A
implementação é **commit próprio com motivo escrito**, e **não** foi antecipada nesta rodada.

### O que a incorporação de 16/10/2026 *(a cobrança Pix por arquivo)* não decidiu

Esta rodada é **proposta operacional**, e o que ela **não** decidiu é o que a mantém honesta. Nada
disto tem resposta dedutível do repositório:

1. **Qual é o formato do material que o banco gera.** **Não inventado.** Antes de definir a
   entrada, é preciso **inspecionar um exemplo real** — sem dados bancários sensíveis — para saber
   se o banco devolve HTML, PDF, imagem, o texto do Pix copia e cola, um arquivo estruturado ou uma
   combinação. E **não** se presume que o QR Code isolado carregue os dados comerciais do
   destinatário: a identidade vem da **descrição** e do registro.
2. **Onde vive o material de cobrança, e o que dele é público** (**C16**). O material do banco não
   é o estado comercial — e por isso a decisão é **distinta** da **C11**. As duas alternativas (o
   GitHub, versionado, e o Worker/Cloudflare, operacional) estão registadas e **nenhuma escolhida**.
3. **Qual mecanismo é a fonte de verdade do estado de pagamento.** É a pergunta da **C11** — KV, Git
   ou D1 —, e a proposta **não** a responde nem cria um **segundo** controle de pagamentos: os
   campos e os estados têm de ser compatibilizados com o modelo que a L11 já define.
4. **Quais campos e estados do modelo comercial bastam.** **Não se assume** que o estado de
   pagamento que existe hoje já tenha todos os campos necessários (data de emissão, plano ou
   finalidade, data de confirmação, rastro da confirmação). A compatibilização com a L11 é
   **trabalho de desenho**, não um fato consumado.
5. **O formato dos arquivos e o padrão de nomes.** A estrutura conceitual (destinatário ·
   identificador · data · plano · material · estado · confirmação) é **proposta**, e **não** fixa
   caminho, extensão nem formato: os padrões do repositório (sufixo da escola, um arquivo por
   artefato, saídas geradas fora do Git) têm de ser **verificados** antes.
6. **Se a ferramenta local será construída, e quando.** Ela é registada como **possibilidade
   futura**, com dez passos — e **não** tem especificação nem implementação. A estimativa de
   «≈ 2 minutos por cliente» é **hipótese do proprietário**, não desempenho medido.
7. **O que do material se preserva e o que se descarta.** A política de retenção do material
   bancário (o que fica, por quanto tempo, o que é descartado) **precede** a implementação — e não
   se deduz do repositório.
8. **Nada foi implementado.** Não há código, não há arquivo de cobrança criado, não há cobrança real
   publicada, e o Worker, o KV e o *deploy* **não** foram tocados. A conciliação manual **não** foi
   substituída por confirmação automática: quem confirma continua a ser uma **pessoa**, olhando o
   extrato.

### O que a avaliação de 16/10/2026 *(as lacunas de fundação)* não decidiu

Três ausências que o documento **media** e **não** elevava a decisão — a avaliação do dono do produto
nomeou-as. Nenhuma tem resposta dedutível do repositório:

1. **Quem é o «administrador» do Sistema Lastro** (**C17**). A L11 (a confirmação de pagamento) e a
   L12 (o e-mail administrativo) invocam um papel que **não existe**: o que existe são duas senhas de
   escopos diferentes — a direção da escola (`senhaDaEscolaOk`) e o dono da plataforma (`SENHA_RAIZ`)
   —, e nenhuma nomeia uma pessoa. É decisão de **acesso** — e **precede** as duas frentes. Os três
   candidatos estão na **C17**, e **nenhum** escolhido.
2. **`pagante` — dois significados** (**C18**). A trava de expurgo do andaime (§2.9) e o estado
   comercial da L12 partilham a palavra. **Renomear** um deles e **definir** o que faz uma escola ser
   `pagante` (**plano activo** × **já pagou**) são decisões distintas — e a segunda decide o estado
   `expirado-sem-contratar`. **Nada foi renomeado.**
3. **A natureza da L13 — *A × B*** (**C15**, quarta dimensão). A identidade é **escolha de quem já é
   usuário** (*A*) ou **instrumento de aquisição** (*B*)? Se for escolhida **na contratação**, a
   preferência é **da escola** e a C15 encolhe — mas **não** se elimina (mudar depois reabre «de
   quem», porque o acesso não identifica pessoa). É **decisão de produto**, **precede a V0**, e
   reordena-a: primeiro *quando*, depois *de quem*.
   **Nota de 18/10/2026:** o «de quem» foi decidido — **a escola** —, e a previsão desta entrada
   cumpriu-se ao contrário do que ela temia: escolher a escola **não** eliminou a pergunta pelo
   *quando*, mas **deslocou-a**. As duas pontas (*A* e *B*) terminam na escola; o que muda é **onde
   o valor mora** — no provisionamento (território de **C11/C16**) ou no dado da escola criado no
   primeiro uso. Deixa de bloquear a **V0** e passa a ser pergunta da **V5**.
