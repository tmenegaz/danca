# servidor/ — o HTTP agnóstico (rotas declaradas uma vez)

A camada de servidor corre em **Web Standards** (`Request`/`Response`/`URL`/`fetch`) — não em
`node:http` nem no `fetch` específico do Worker.

| Arquivo | Papel |
|:--|:--|
| `roteador.js` | um roteador mínimo sobre Web Standards (padrões com `:param`, `:param/*` e `*`) |
| `rotas.js` | **as rotas declaradas UMA vez** — recebe o armazenamento + conteúdo + esquema e devolve o roteador |
| `node.js` | a ponte Node: `node:http` → `Request`/`Response` → roteador (e lê conteúdo/esquema do fs) |
| `cloudflare.js` | a ponte Worker: `export default { fetch }` → roteador (lê conteúdo/esquema do ASSETS, grava no KV) |
| `disparar.js` | o **gatilho da geração** (F3): o Worker pede ao GitHub Actions que gere, via `workflow_dispatch` |
| `escrever-po.js` | a **ponte envelope → fonte** (F4): o Worker grava o `ciclo-XX-<escola>-po.md` no repositório, via Contents API |

As rotas são as **mesmas** nos dois runtimes. O que muda é o transporte e o armazenamento —
nunca a declaração das rotas.

## Escopo declarado

Aqui vivem as **15 rotas da porta completa** — não só a elicitação: `/assets/style.css`,
`/api/mapa` (com `?fonte=po`), `/api/prompt`, `/api/ia` (o stub do passo 2, com o freio e o
registro de custo), `/api/ficha` + `/api/ficha.md`, `/api/anamneses`, `/api/anamnese-estados`,
`/api/anamnese-estado/:id`, `DELETE /api/anamnese-vinculo/:id`, `POST /api/anamnese-ajuste/:id`,
`PUT /api/anamnese-editar/:id`, `/api/envelopes`, `/api/envelope/:id`, `POST /api/elicitar`,
`/api/ficha-preenchida[.<id>]`, `/api/plano-preenchido[.<id>]` e o fallback estático
(`GET/HEAD *`).

O `/api/plano-preenchido` é o irmão do `/api/ficha-preenchida`: a estante da anamnese abre a
FICHA, e a do plano abre o PLANO — o mesmo gesto (ler e imprimir), e não o envelope cru. O
texto que ele serve é o da fonte do ciclo (`nucleo/derivar-plano-ciclo.js`, a MESMA derivação
do `servidor/escrever-plano.js`), menos as marcas que não são do professor (o frontmatter YAML
e o `<!-- CALENDARIO -->`, onde o gerador escreve o calendário).

O núcleo da porta (registro, mapa, vínculo, estados, carimbo, gravação, elicitação) vive em
`nucleo/porta.js` — sem infraestrutura; o armazenamento chega por parâmetro. O `rotas.js`
só declara as rotas e liga cada uma ao núcleo. As chaves de envelope usam a MESMA notação do
disco: `envelope/<id>.json`.

`criarRotas` recebe, além do armazenamento/conteúdo/esquema/PO, os **dados de runtime** que
não são lógica: `fichaHtml` (o renderizador HTML puro de `nucleo/ficha-html.js`), `prompt`
(`prompts/elicitar-ciclo.md`), `identidade` (`tools/templates/ciclo.css`), `servirEstatico`
(a função que resolve o fallback estático — disco no Node, ASSETS no Worker), `agora` (o
relógio, injetável para as provas serem repetíveis) e `disparar` (o gatilho da geração,
opcional).

## O gatilho da geração (F3)

A geração (pandoc/pdflatex → HTML + PDF + menu) **não roda no Worker** (workerd é
JavaScript/Wasm). Por isso o Worker não gera — ele **dispara**: quando o PO fica completo E
gravado (`POST /api/elicitar`, `fonte=po`, `gravado=true`), a rota chama `disparar(contexto)`,
que pede ao GitHub Actions que rode `.github/workflows/gerar-ciclo.yml` (`workflow_dispatch`
com `professor`/`ciclo`/`escola`).

O `disparar` é **injetado pela ponte** e **best-effort**: sem token (`env.GITHUB_TOKEN`), é
`null` e a elicitação continua intacta; se o disparo falhar, o envelope já está gravado e a
falha é devolvida no campo `disparo` da resposta — nunca desfaz a gravação. Só o PO dispara:
a anamnese é o sujeito do PO, não o recorte que manda gerar.

A prova é `provar-disparo.js` (22/22): o pedido é construído certo (URL, método, token,
inputs), sem token não há disparador, o PO completo dispara com o contexto do ato, a anamnese
não dispara, e o workflow alvo existe com os inputs. O token real (um PAT com escopo
`workflow` + `contents`) é o **único** segredo que falta para o round-trip de verdade — deve
ser gravado como segredo do Worker (`wrangler secret put GITHUB_TOKEN`).

## A ponte envelope → fonte (F4)

A geração lê a FONTE (`ciclo-XX-<escola>-po.md`), não o envelope. Por isso, quando o PO fica
completo E gravado, a rota `POST /api/elicitar` faz duas coisas, **na ordem**:

1. `escreverPO(envelope)` — deriva o Markdown (`nucleo/derivar-po.js`) e grava o arquivo no
   repositório via GitHub Contents API (GET para o `sha` atual, PUT com o conteúdo em base64).
   O commit dispara o `reancorar.yml` já existente.
2. `disparar(contexto)` — o `workflow_dispatch` do `gerar-ciclo.yml`.

O caminho da fonte segue a regra de `hash-ciclo.sh` (`professores/<slug>/ciclos/ciclo-<NN>-<escola>-po.md`),
com o `professor` do contexto como SLUG da pasta. A derivação é pura (`nucleo/derivar-po.js`),
e a lacuna da «Norma estabelecida» sai declarada (`[Preencher: …]`) — o formulário não a
pergunta, e não se inventa. A prova é `provar-ponte-po.js` (16/16) + `provar-derivar-po.js`
(31/31), que inclui a validação do Markdown derivado contra o `tools/validar-po-ciclo.js` real.

A porta original (`porta/servidor.js`) **continua a funcionar** como referência — o motor Node
é agora um adaptador, não o motor.

## A página da Produção (os Bastidores)

`bastidores.js` serve o grupo **Bastidores** (o Estúdio e a Produção) na MESMA origem do Worker
da escola, com o KV da própria escola (`bastidores/<escola>/…`) e a senha da direção. A Produção
é uma **página de secções**: o menu lateral mostra UMA de cada vez, e as secções já nascem
escondidas do servidor (só o Painel inicial vem visível) — assim a página nunca volta a ser tudo
empilhado, mesmo se o script falhar.

A **régua da rubrica** é declarada AQUI, como uma **RUBRICA com nome** (`bastidores/<escola>/rubricas`):
os níveis com que o resultado é medido no fim do ciclo são decisão da escola — podem mudar em comitê
(renomear, acrescentar, remover) —, e cada turma é **vinculada** à rubrica que usa (`rubricaId`),
na aba «Vincular turma à rubrica». Uma rubrica pode valer para várias turmas: mudar os níveis dela
muda todas as que a usam, no mesmo ato. Até 15/10/2026 a régua vivia DENTRO da turma e era
declarada no próprio cadastro; por isso a leitura aceita as TRÊS origens, nesta ordem — o
**vínculo**, a **régua própria** da turma (`rubrica`, o formato antigo, que continua válido sem
migração) e o **padrão** (`NIVEIS_DA_RUBRICA`, importada da derivação — uma fonte só). A leitura
nunca devolve uma régua vazia: o plano de ensino LÊ a régua da turma do professor, e uma régua
vazia mediria contra nada. O `GET /api/bastidores/turmas` entrega a régua **resolvida**, para o
plano (`{daTurma: "rubrica"}`) não saber de onde ela veio.

**A turma não se edita: DERIVA** (16/10/2026). O `POST /api/bastidores/turma` devolve **409** só
contra uma turma **vigente** — porque corrigir a hora, a duração ou os dias de uma turma é o
`POST /api/bastidores/turma-derivar`: um registo **novo**, com o **mesmo nome** e uma
`vigenteDe` (data a partir da qual vale), e o anterior fica guardado com `substituidaPor` e
`substituidaEm`. É o invariante do plano vinculado a um PO — o passado acrescenta-se, não se
reescreve. O nome não muda de propósito: a curadoria guarda o **nome** e o plano referencia o
**nome**; um registo novo com outro nome partiria as duas ligações. O `id` é que muda
(`teste` → `teste-2026-11-01`), porque é o slug do nome e colidiria.

Quem lê «as turmas» para trabalhar usa `turmasVigentes()` — a curadoria, o plano, o vínculo
turma↔termo e o `GET /api/bastidores/turmas` (e por isso uma turma substituída não aparece no
select do cabeçalho do plano). A lista inteira só serve ao histórico que a Produção mostra num
`<details>` fechado em cada cartão. Como duas turmas passam a partilhar o nome, o `DELETE
/api/bastidores/turma` e o `POST /api/bastidores/turma-rubrica` resolvem **pelo id** — procurar
pelo nome apagaria a do passado em vez da que a escola quer tirar. A derivação leva com ela o que
não se está a ajustar: a ligação à rubrica (`rubricaId`) e os vínculos turma↔termo.

A prova é `experimentos/provar-producao.js` (104/104): roda o script servido num DOM de mentira e
confere que o menu troca a secção, que as três abas de Turmas trocam de painel, que os handlers dos
formulários existem e que a página não é cacheável. Ela trava um defeito silencioso: o script é
montado por concatenação numa linha só, e um comentário `//` comenta **todo o resto** do script —
o login funcionava (vinha antes), mas o menu e os botões ficavam mortos. Por isso o script servido
não pode ter comentário de linha.

A derivação da turma tem prova própria — `experimentos/provar-derivacao-da-turma.js` (35/35), sobre
um KV de mentira: o nome repetido só colide contra a vigente; a derivação recusa sem data; a
anterior fica com o elo e o ritmo **não** é reescrito; a lista viva traz uma só; a régua e a
cadeia sobrevivem; uma turma já substituída não se deriva outra vez; e o `DELETE` remove a versão
**pedida** — o caso que mais dói, por ser silencioso.

## Prova contra o Worker real

`wrangler-agnostico.jsonc` + `worker-entry.js` (ambos em `experimentos/pe/`, fora do Git)
ligam esta ponte ao Worker real, em namespace de teste (`ciclos-escolas-plano-b`):

```
wrangler dev -c experimentos/pe/wrangler-agnostico.jsonc --port 8792
curl -X POST http://localhost:8792/api/ia -H 'Content-Type: application/json' \
  -d '{"mensagens":[{"papel":"professor","texto":"1"}], "contexto":{...}}'
```

Medido (08/10/2026): a conversa responde o turno, o teto de 30 corta (`esgotado:true`), e o
registro de custo assenta no KV (`ia-registro/registro.jsonl`), tudo **sem o motor Node no
caminho**. O `_assets-test/` é o staging do conteúdo servido pelo `ASSETS` só para a prova.
