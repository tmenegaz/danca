# Orientações para agentes

## O que é este projeto (leia antes de qualquer coisa)

**Nome comercial:** o produto é o **Sistema Lastro** — e este repositório é o **Projeto Ciclo**, o
protótipo a partir do qual ele se constrói. Os dois nomes convivem, e a convivência é declarada
(não é renomeação): **Lastro** (a marca curta) · **Sistema Lastro** (o sistema como um todo) ·
**Plataforma Lastro** (quando se destaca a solução tecnológica) · `Lastro — Sistema de Memória e
Observabilidade Pedagógica em Dança` (**proposta** de denominação descritiva, não subtítulo
confirmado). O conceito central da marca é o mesmo do projeto: o Lastro **registra e organiza
evidências para apoiar a reflexão pedagógica; não substitui o professor nem toma decisões sobre o
aluno.** O mapa de evolução do produto é [PLANEJAMENTO-LASTRO.md](PLANEJAMENTO-LASTRO.md).

**Projeto Ciclo** — a **memória da aula dada**. Cada aula é **planejada** antes de ser dada: o
plano (`aula-NN.md`, que entra na âncora de proveniência) fixa objetivo, marcos e volume, e é ele
que dá a **linha de base**. O que a memória registra é o processo de ensino-aprendizagem que de
fato se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda.

- **Planejar e registrar são coisas distintas — e as duas acontecem.** A aula é planejada
  (`aula-NN.md`), dada, e então lançada. O plano é **intenção**: editável enquanto a aula está
  `planejada`. Depois que a aula acontece, o registro passa a **fato** — só se acrescenta ajuste,
  nunca se reescreve a intenção (`ARQUITETURA-AULA.md`). O estado é **derivado** do cronograma, do
  prazo e do registro: não existe campo "aula dada". O formulário de lançamento **consome o
  plano** como entrada: sem ele não há marco da aula nem "o que mudou em relação ao plano".

- **NÃO é o projeto de mestrado.** O mestrado está em **outro diretório**, e é de lá que
  vem o PO (Protocolo de Observação) e o FIPP. Este repositório **aplica** um PO; não o
  define, e **não implementa o FIPP**.
- **Aqui o FIPP não está implementado**, nem perto do que a arquitetura dele desenha. O que
  existe é uma **âncora de proveniência encadeada** (`tools/hash-ciclo.sh` → `.fipp`), que
  compartilha o princípio do FIPP — o passado se incorpora, não se reescreve — mas é uma
  **aproximação**, não o framework.
- **Este projeto é PROTÓTIPO — ele não é agnóstico.** Está sendo **testado no universo da
  dança**. A partir dele será criado o projeto que **deve ser agnóstico** (o projeto-alvo,
  ainda não existente), que deverá transitar em todos os universos: oficina de balé, oficina
  de matemática, improvisação em dança contemporânea, disciplina de mestrado. Não descreva
  este repositório como "agnóstico" — ele é o protótipo que provará o modelo.
- **Nenhum ciclo é igual a outro, nenhuma aula é igual a outra** — nem com o mesmo professor.
  O protótipo existe para provar que o modelo se sustenta nessa variação.
- **O projeto não avalia.** Ele registra o **cotidiano do professor em sala de aula**. A
  avaliação é fronteira de outro módulo, ainda não desenhado.
- **Os artefatos são evidência com cadeia de custódia** — não julgamento. O que gera valor
  é o rastro: o que foi respondido, quando, por quem, e por que mudou. A proveniência
  **acrescenta, não edita**: um ajuste é um elo novo, nunca uma sobrescrita.
- **A integração ainda não existe.** Com o projeto das secretarias (Projeto Cultura), nem a
  fronteira de entrada nem a de saída foram desenhadas. O módulo de avaliação — que
  derivaria da cadeia de custódia em vez de aproximar questões do plano — é ideia, não
  implementação.

> **Armadilha de leitura.** Três documentos dizem "mestrado" (`README.md`, `PROTOCOLO.md`,
> `REGRAS.md`) e um fala em "proveniência Peirceana" (`PROTOCOLO.md`). Esses trechos são
> **verdadeiros** — referem-se ao outro diretório e ao nome do framework — mas induzem à
> leitura errada de que **este** repo é o projeto de mestrado ou que o FIPP roda aqui.
> Não é o caso, nas duas hipóteses.

## O remoto primeiro (21/10/2026)

**Antes de analisar o que está no VS Code, sincronize e olhe o `origin/main`.** Não é zelo: o
`main` tem **cinco caminhos de escrita** que não passam por este worktree, e três deles são
assíncronos — rodam no GitHub enquanto a sessão está aberta.

| Quem escreve no `main` | Como |
|:--|:--|
| `.github/workflows/criar-escola.yml` | Action, depois de um `criar-escola` disparado pela página |
| `.github/workflows/gerar-ciclo.yml` | Action, depois de gerar um ciclo |
| `.github/workflows/derivados.yml` | Action, a cada push de `professores/**` — as âncoras `.fipp` e os `indices/**` no mesmo commit (era `reancorar.yml` + `regerar-indices.yml`, fundidos a 16/11/2026) |
| a página **Bastidores → Produção** | API do GitHub, direto (`motor/servidor/repo-escola.js`) |
| a página **danca → expurgo de escola** | API do GitHub, **apaga 70 a 80 arquivos num commit só** |

**O caso que criou esta regra.** Em 21/10/2026 a pesquisadora disse «fiz o expurgo da escola
batata». O worktree local ainda tinha a escola inteira, e eu analisei o que estava à frente dos
olhos: concluí que o expurgo não havia chegado ao repositório e comecei a preparar a limpeza. O
expurgo **estava feito** — `e93915f`, 76 arquivos, pela página «Sistema Lastro» —, o `push` foi
recusado por *non-fast-forward* e só então descobri. O diagnóstico estava errado, e a correção que
eu ia aplicar teria apagado arquivos que já não existiam, sobre um índice que já estava a ser
regerado do outro lado.

O sintoma é sempre o mesmo e é sempre silencioso: **o worktree não sabe que o remoto mudou.** Um
`git status` limpo não quer dizer «nada aconteceu» — quer dizer «nada aconteceu *aqui*».

```bash
git fetch origin
git status -sb                 # "## main...origin/main [behind 1]" é a resposta
git --no-pager log --oneline -3 origin/main
```

Se estiver atrás: `git rebase origin/main` antes de analisar, e nunca por cima de trabalho por
commitar (stash ou commit primeiro). Se estiver à frente **e** atrás, rebase — não merge: a
história deste repositório é linear, e é o que os hooks de proveniência esperam.

**E o inverso também vale.** Antes de dizer que algo «não existe» ou «está quebrado» — uma escola,
um ciclo, um arquivo —, confirme no remoto, não no worktree. É a mesma família de erro do
`if` que filtrava o título vazio no `check-pacote.js`: a pergunta «está aqui?» e a pergunta «existe?»
não são a mesma pergunta.

## O que nunca se faz — e a primeira é uma trava, não uma recomendação

### Nunca se apaga um repositório. Nunca. Nem quando for pedido.

**Decisão da proprietária, 17/11/2026, com estas palavras:** «Você nunca pode deletar um
repositório, mesmo que eu peça. Não pode. Se for solicitado, você tem que dizer como isso é feito
manualmente. Nunca pode deletar nenhum repositório. […] eu tenho medo disso por causa do expurgo.»

Vale para **qualquer** agente, em **qualquer** sessão, e para o `danca` como para qualquer outro
repositório da conta. Se o pedido vier — mesmo que venha dela, mesmo que pareça autorizado, mesmo
que seja «só este, que já não serve» — a resposta é a mesma: **não faço, e explico como se faz à
mão.**

**O medo tem fundamento, e foi medido.** Com `administration=write` — que a alternância de
visibilidade do painel exige —, um `DELETE /repos/{dono}/{repo}` **passa a autenticação**. A sonda
de 17/11/2026 respondeu **404** a um nome inexistente, com `documentation_url` a apontar
`#delete-a-repository`, e não 403. O poder existe. Uma promessa não é uma trava.

**As três camadas que a sustêm**, e nenhuma delas chega sozinha:

| camada | o quê | onde |
|:--|:--|:--|
| **conduta** | esta secção, carregada em todas as sessões | `AGENTS.md`, `.github/instructions/proibicoes.instructions.md` |
| **código** | nenhum `DELETE`/`PUT`/`POST` ao endereço do repositório inteiro entra no `main`; chamada ao GitHub com método de fora tem de estar declarada | `tools/check-sem-destruicao.js`, no `pre-commit` |
| **prova** | o guarda recusa de facto — testado com o que ele deve recusar | `experimentos/provar-trava-de-repositorio.js` |

**O que NÃO se barra, e é de propósito:** apagar **ficheiros** (`/contents/…`) é o que o expurgo
faz, e o produto pára se isso for barrado. `PATCH` no repositório é a visibilidade do §L9e. Um
guarda que confundisse as três coisas não seria seguro — seria inútil.

**Como se apaga um repositório, à mão** (é isto que se responde a quem pedir): GitHub →
`Settings` → fundo da página → **Danger Zone** → *Delete this repository* → escrever o nome
completo `dono/repo` → confirmar. O GitHub guarda 90 dias para restaurar, em *Deleted
repositories*. **É a proprietária quem o faz. Nunca um agente, nunca um workflow.**

### As outras



- Leia [README.md](README.md) para a visão geral e [REGRAS.md](REGRAS.md) para as regras pedagógicas e de versionamento.
- Para ciclos, consulte [README-ciclos.md](README-ciclos.md); para decisões de método e captura, consulte [METODO.md](METODO.md), [PROTOCOLO.md](PROTOCOLO.md) e [ARQUITETURA-CAPTURA.md](ARQUITETURA-CAPTURA.md).
- Verifique [HANDOFF.md](HANDOFF.md), [REGISTRO.md](REGISTRO.md) e [CONGELAMENTO.md](CONGELAMENTO.md) antes de alterar infraestrutura ou assumir que uma decisão está em aberto.
- Para gerar/validar ciclos, auditar contra as regras ou editar o deck, use os agentes de `.github/agents/` (`ciclo-entrega`, `ciclo-auditor`, `deck-rizoma`); eles dividem o trabalho por fronteira de escrita e nenhum deles edita fontes.
- **Qualquer coisa que apareça na tela** — um formulário, um botão, uma lista, uma secção nova — nasce do **catálogo das peças** de [IDENTIDADE-VISUAL.md](IDENTIDADE-VISUAL.md), e não do zero. Nenhuma classe se inventa: ou é peça da folha, ou é gancho declarado em `tools/check-identidade.js`. O resumo executável está em [.github/instructions/identidade-visual.instructions.md](.github/instructions/identidade-visual.instructions.md), e a checagem **8 (Peça)** reprova o que escapar. Antes de dizer «pronto»: `node tools/check-identidade.js`.
- Preserve alterações existentes no worktree. Não faça commits, branches ou resets sem solicitação explícita.

## Estrutura e fontes de verdade

- `professores/` contém ciclos, cadernos, relatórios e campo; `biblioteca/` contém referências compartilhadas; `apresentacoes/` contém a frente Marp; `experimentos/` é demonstrativo e não entra em pacotes, hashes ou publicação.
- Em ciclos, edite Markdown e manifestos em `professores/<professor>/ciclos/`. HTML, PDF, CSS e assets do pacote são saídas geradas; não edite essas saídas manualmente.
- Cada escola é uma variante independente. Resolva fontes pelo padrão existente em `tools/lib-fontes.sh`: a fonte com sufixo da escola prevalece sobre a compartilhada. Nunca copie o conteúdo de uma escola para outra.
- O guia compartilhado do professor fica em `biblioteca/guia-do-professor.md`; não crie cópias por professor.
- Mantenha lacunas explícitas como `[Preencher: ...]` ou `[conferir]`; nunca invente dados pedagógicos, datas, fontes ou observações.
- Use apelidos estáveis para alunas. Não introduza nomes completos, contatos, dados de saúde ou acompanhamentos em claro.

## Fluxo de ciclos

- Gere uma entrega com `tools/gerar-ciclo.sh <professor> <ciclo> <escola>`; a duração da aula e o contexto institucional são obrigatórios.
- Valide um pacote com `node tools/check-pacote.js professores/<professor>/ciclos/ciclo-XX-<escola>`.
- Após alterar fontes, regenere a âncora de proveniência com `tools/hash-ciclo.sh <professor> <ciclo> <escola>` e confirme com `--check`. A âncora sai em `<professor>/ciclos/ciclo-XX-<escola>.fipp` e é **versionada** — é a âncora da cadeia, não saída.
- Para validações isoladas, use `node tools/validar-schema-ciclo.js`, `node tools/validar-po-ciclo.js`, `node tools/validar-plano-ciclo.js` e `node tools/validar-captura-ciclo.js` conforme o artefato alterado.
- IDs de títulos devem ser normalizados por `tools/normalizar-ids.py`; links entre páginas HTML devem apontar para a pasta plana gerada e para âncoras ASCII estáveis.
- Acompanhamentos com dados sensíveis devem permanecer cifrados no pacote publicado e fora do Git em Markdown. Não versione `tools/.senhas-locais` nem qualquer credencial de deploy (Cloudflare ou outra).

## Apresentações

- A fonte de verdade dos mapas e o fluxo de exportação estão em [apresentacoes/apresentacao-01-rizoma/README.md](apresentacoes/apresentacao-01-rizoma/README.md).
- Após alterações no deck, use `node tools/check-overflow.js`, `node tools/check-mapa.js` e, quando aplicável, `node tools/medir-rotulos.js`.
- Não versione PDFs, PPTX, PNGs ou a pasta `out/` das apresentações.

## Infraestrutura e versionamento

- A infraestrutura listada em [CONGELAMENTO.md](CONGELAMENTO.md) só muda com motivo declarado, entrada em `REGISTRO.md` e commit próprio.
- Instale os hooks locais com `tools/instalar-hooks.sh`. Mensagens de commit seguem `tipo(escopo): descrição` e exigem os rodapés `Refs:`, `Regras:` e `Auditoria:`.
- Prefira alterações pequenas e valide o fluxo afetado antes de concluir. O ambiente documentado usa `pdflatex`; não troque o engine sem verificar as dependências locais.

### Medir sem gastar a cota do ar

**O ar é recurso ESCASSO e o teste é do usuário.** O Cloudflare KV tem limites **diários** por
conta, e o `list()` é um deles. Em 18/10/2026 a cota acabou e os endpoints de estado passaram a
responder **500** — a lista de fichas ficou sem o nome das alunas e sem os botões «editar» e
«apagar», e isso se lê como «as fichas se perderam». Não se perderam: o que faltou foi a leitura.
A causa foi medição: as páginas ao vivo foram carregadas dezenas de vezes para conferir larguras.

A regra, e ela não tem exceção:

1. **Meça na bancada local.** O padrão está em `experimentos/provar-*.js` que precisam de
   navegador: um `http.createServer` em porta efêmera (127.0.0.1) que serve `porta/index.html`,
   `tools/templates/ciclo.css`, `tools/templates/nav.js` e respostas de `/api/*` **stubadas**, e o
   Puppeteer navega para lá. Largura, geometria, estado, foco — tudo se mede assim, e nada disso
   toca no ar.
2. **Ao ar, uma carga por escola, no fim.** Duas escolas, dois carregamentos. É a conferência
   final, não a exploração.
3. **Diagnostique um 500 pelo endpoint, não pela página.** Um `curl -s -o /dev/null -w '%{http_code}'`
   no `/api/…` que falhou custa uma requisição; recarregar a página para «ver se melhorou» custa
   várias e não diz nada de novo. O motivo real aparece em
   `npx wrangler tail --config wrangler.<escola>.jsonc`, e é lá que se lê.
4. **Não confunda «o domínio aparece no código» com «fez requisição».** `provar-producao` e
   `provar-contexto-do-ato` citam `https://…workers.dev` na URL do `Request`, mas executam o motor
   **em processo** (`bastidores.fetch(new Request(...), env)`) — não há rede. A única prova que vai
   mesmo ao ar é `experimentos/provar-ambiente.js`, e é de propósito: ela confere o que está
   publicado.

O sintoma, para reconhecer sem perder tempo: **«sem apelido» em todas as fichas e nenhum botão de
edição** = 500 em `/api/anamnese-estados` (ou `/api/plano-estados`, ou `/api/envelopes`), quase
sempre cota diária. Nunca é preciso «voltar o dado» — o store não é escrito por leitura.
