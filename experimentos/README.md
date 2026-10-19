# experimentos/ — área de teste

O que fica aqui **não entra no hash da âncora**, **não entra no pacote** e **não é
publicado**. É área de teste: se funcionar, sai daqui e entra nos diretórios
oficiais; se não, some.

## Por que isso é seguro por construção

Não depende de disciplina — depende de como o projeto é montado:

| O que | Por que o `experimentos/` não afeta |
|:--|:--|
| **Hash da âncora** | cobre as fontes do ciclo, resolvidas por `tools/lib-fontes.sh` (`index` + `DOCS` + PO + manifestos + relatórios). Nada daqui é fonte |
| **Pacote** | é montado de `DOCS` + acompanhamentos. Nada daqui está nessas listas |
| **Site publicado** | o Cloudflare serve os pacotes versionados. Nada daqui é publicado |
| **`check-pacote`** | valida o pacote, não a raiz do repositório |

Ou seja: **experimentar aqui não pode quebrar produção.**

## Como testar localmente

```bash
python3 -m http.server 8000 --bind 127.0.0.1     # da RAIZ do repositório
# abra http://127.0.0.1:8000/experimentos/<experimento>/
```

Use `127.0.0.1` (e não `file://`): páginas que usam WebCrypto — como o
PageCrypt dos acompanhamentos — só funcionam em contexto seguro, e `file://`
pode falhar sem dizer por quê.

**E sirva da RAIZ, não com `--directory experimentos`** (medido, 20/09/2026): as páginas dos
experimentos consomem libs que vivem **fora** de `experimentos/` — a `tools/lib-vistas.js`, por
exemplo, entra por `<script src="../../tools/lib-vistas.js">`. Servindo só a pasta `experimentos/`,
a página abre (200) e a **lib dá 404** ✗: o experimento fica sem os builders.

**O sintoma, quando acontece (medido, 20/09/2026):** a página abre e o painel diz *"Detalhe:
Vistas is not defined"*. É a lib que deu 404 — mas o erro vem com a cara de outra coisa, porque o
`ciclos.json` da mesma pasta carrega normalmente. A conferência é abrir
`../../tools/lib-vistas.js` direto no navegador: **404 = o servidor não está na raiz.** Vale para
servidor **antigo** também: um `http.server` no ar desde antes de a lib existir (a 8001 deste
repositório ficou assim) serve a página e não serve a lib — derrube e suba de novo:

```
pkill -f 'http.server 8001'
python3 -m http.server 8001 --bind 127.0.0.1        # da RAIZ do repositório
```

O formulário passou a dizer isso por si (o painel nomeia a lib que faltou, em vez de culpar o
`ciclos.json`), mas o conserto é o servidor, não a página: a mensagem existe para o sintoma
apontar para a causa sem passar por três tentativas.

> **Atenção:** o deploy é do **Worker ligado ao repositório**, disparado pelo push — e ele
> publica em produção (uma escola por Worker, hoje só a Diaghilev). Não use para experimentos.
> Para ver um experimento no ar, `git push` não serve: nada de `experimentos/` é
> publicado. Se um experimento precisar de site, ele deixa de ser experimento.

## O que é versionado

**Só este README.** O resto de `experimentos/` é ignorado pelo Git (`.gitignore`).

O motiva: experimento é rascunho. Versionar rascunho enche o histórico de
tentativas que ninguém vai ler — e o que vale vira produção, com commit próprio.
Se um experimento precisar ser guardado como está, ele vira um documento
(`IDEIA-*.md`, `ARQUITETURA-*.md`) na raiz, que é onde as ideias são registradas.

## O que existe hoje

Um diretório por experimento — sem nome reservado e sem a obrigação de nascer
preenchido. Os que estão em curso, medidos em 01/10/2026:

```
experimentos/
├── README.md                 este arquivo (o único versionado)
├── captura-json/             o gerador de vistas sob demanda
├── simulacao-marau/          a Elicitação inventada até a página de produção
├── pe/                       o piloto do PE — ver o README de cada um
└── *.js · preview-*.html     provas e rascunhos soltos na raiz da área
```

Os diretórios de experimento são **ignorados pelo Git**; o `README.md` de cada um
existe para quem lê o diretório no disco, não para o histórico. O que vale vira
produção, com commit próprio — e é aí que entra no Git.

## Provas que moram aqui e valem como prova

Nem tudo nesta pasta é rascunho. Estes arquivos são **provas** — rodam, medem e reprovam:

| Prova | O que mede | Precisa de navegador |
|:--|:--|:--|
| `provar-producao.js` | o comportamento da vista de Produção (135 casos) | não |
| `provar-derivacao-da-turma.js` | a cadeia de derivação da turma (123 casos) | não |
| `provar-tema.js` | a aparência clara/noturna: aplicação, persistência, botão alcançável | não (DOM de mentira) |
| `provar-celular.js` | a **geometria** em 320–1024px: nada transborda, o nome da turma não é espremido, o menu de secções vira faixa | **sim** (Chrome) |
| `medir-marca.js` | os números da marca contra as três famílias (o instrumento do estudo **Q**) | não |
| `marca/vetorizar.js` | o traçado da logomarca em SVG e a **fidelidade medida** (IoU 0,980) | **não** (PNG via `zlib`) |
| `provar-acordeoes.js` | as **cinco** secções da Produção recolhem, e recolhidas a listagem mede a largura inteira; a seta de uma não mexe nas outras; o estado é lembrado por secção; o «Carregar catálogo inicial» cabe na coluna | **sim** (Chrome) |

A `provar-celular.js` é de 17/10/2026 e nasceu de um defeito medido: a lista de turmas do
Produção ficava acavalada no celular — o nome com 116px e os dois botões com 126px fixos. É
geometria, e geometria não aparece num teste de DOM: só o navegador a vê. Ela extrai o `<style>`
do próprio `bastidores.js` (sem cópia) e monta a página de prova com as formas de linha reais.

Sem Chrome, ela **declara a conferência NÃO FEITA** e sai com código 1 — nunca um «passou»
silencioso. Por isso **não** está no `pre-commit`: um commit não pode depender de haver navegador
na máquina de quem commita.

## Medir sem gastar a cota do ar (18/10/2026)

Esta pasta é onde nascem os scripts de medição, e por isso é onde o erro se comete. **Medir no ar
tem custo, e o custo é diário:** o Cloudflare KV limita as operações por conta e por dia, e o
`list()` está entre elas. Em 18/10/2026 a cota acabou — e o sintoma apareceu longe da causa: a
lista de fichas da anamnese ficou **sem o nome das alunas e sem os botões «editar»/«apagar»**,
porque `/api/anamnese-estados` respondia 500. Lia-se como «perdi as fichas». Não se perdeu nada.

**O padrão certo**, e é o que as provas desta pasta já fazem:

```js
// bancada local: servidor stub em porta efêmera, sem tocar no ar
const srv = http.createServer((req, res) => { /* serve porta/, ciclo.css, nav.js, /api/* stub */ });
srv.listen(0, '127.0.0.1', async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;   // ← o navegador vai AQUI
  ...
});
```

- **Ao ar, uma carga por escola, no fim** — a conferência final. Duas escolas, duas cargas.
- **Um 500 diagnostica-se pelo endpoint**, não recarregando a página:
  `curl -s -o /dev/null -w '%{http_code}\n' https://<escola>…/api/anamnese-estados`, e o motivo
  real em `npx wrangler tail --config wrangler.<escola>.jsonc`.
- **O domínio no código não significa requisição.** `provar-producao.js` e
  `provar-contexto-do-ato.js` citam `https://…workers.dev` no `Request`, mas rodam o motor **em
  processo** — sem rede. A única prova que vai ao ar é `provar-ambiente.js`, e é de propósito.

O sintoma que se reconhece em cinco segundos: **«sem apelido» em todas as fichas + nenhum botão de
edição** = 500 nos endpoints de estado, quase sempre cota. Não se «volta o dado» — leitura não
escreve no store.

## Quando um experimento vira produção

1. **Documento de ciclo** (aula, caderno, relatório…): entra nos diretórios do
   professor, é declarado no `DOCS` do manifesto e passa a ser fonte do hash;
2. **Ferramenta**: entra em `tools/`, com commit próprio e motivo declarado
   (`tools/` está congelado — ver `CONGELAMENTO.md`);
3. **Mudança de infraestrutura**: motivo declarado no commit + entrada no
   `REGISTRO.md`;
4. **Ideia que ainda não é para implementar**: vira `IDEIA-*.md` (o porquê) e,
   se tiver desenho, `ARQUITETURA-*.md` (o como) — e o `HANDOFF.md` passa a
   listá-los sozinho.

## Experimentos em curso

**`captura-json`** — o gerador de vistas sob demanda: lê o JSON do ciclo e deriva o caderno, o
relatório e o acompanhamento; e, desde 20/09/2026, também o **guia de observação** e a
**musicalidade**, que derivam das DUAS entradas — o PO e o plano.

Os JSONs de entrada desse experimento **não são escritos à mão**: eles saem dos extratores
(`tools/validar-po-ciclo.js --json`, `tools/validar-plano-ciclo.js --json`), pelo contrato
compartilhado (`tools/lib-extracao-md.js`, `tools/lib-validacao-md.js`). A leitura à mão que
existia antes ficou guardada como REFERÊNCIA, e é com ela que o `diff-classificado.js` (local)
prova que a estrutura extraída **é o que o documento oferece** — sem diferença sem classe.

**E os builders das vistas saíram do formulário** (peça 2 da migração, 20/09/2026): o caderno, o
relatório, o acompanhamento, o guia e a musicalidade agora vivem em **`tools/lib-vistas.js`** —
uma definição só, consumida por este experimento (`<script src="../../tools/lib-vistas.js">`) **e
pelo gerador** (Node). Aqui não há cópia: o formulário chama `Vistas.guia({…})`, `Vistas.caderno({…})`
e `Vistas.helpers.*`. E a igualdade está provada: com o mesmo `prov`, **o guia do Node é idêntico
ao do formulário**; sem `prov` (o caso do gerador), a única diferença é o carimbo — declarado.

A área foi criada em 19/09/2026, junto com a documentação da
ideia de captura em JSON (`IDEIA-CAPTURA.md` e `ARQUITETURA-CAPTURA.md`), para
que a experimentação tenha onde acontecer sem tocar no que está publicado.

**`simulacao-marau`** — o diagnóstico de 23/09/2026: *o JSON está construindo o formulário
corretamente?* A pergunta é do formulário de lançamento, e para respondê-la o experimento faz a
cadeia inteira **sem atalho**: dez blocos elicitados → documentos `.md` → extratores
(`tools/validar-*-ciclo.js`) → `po-01.json` e `plano-01.json` → `tools/templates/lancamento.html`,
rodada em Node. A Elicitação é **inventada** — o "Estúdio Marau" e a professora não existem
(`README-ciclos.md`: a escola "ainda não existe") — e está preservada como matéria-prima em
`00-eliciacao-simulada.md`: é dela que os documentos saem, e refazê-la apagando-a não reproduz o
mesmo resultado. Um experimento inventado responde por um caminho real; o que ele **não** prova é
fidelidade a um ciclo de verdade.

**`pe`** — o piloto do **PE** (Processo de Elicitação), que é a frente mais recente. O ponto de
partida é uma separação: `prompts/elicitar-ciclo.md` carrega **duas camadas juntas** — o **conteúdo**
(blocos, perguntas, forma de saída) e o **mecanismo** (uma pergunta por vez, como persistir, como
ramificar). Pelo `ARQUITETURA-PE.md` §2.2, só a segunda é PE; pelo §2.5, a entrevista de dez blocos
**não é o PE** — é conteúdo de PO que passa a ser **hospedado** pelo recipiente dele. Separar as
camadas é o trabalho, e nada em `prompts/` (congelado) foi tocado: o experimento vive só aqui.

O piloto é a **anamnese** — não o ciclo — por quatro razões: é nova (não tem legado a migrar), já
tem ramificação declarada (os dois módulos condicionais), já tem forma canônica de saída
(`{aluno, traz, precisaDesenvolver}`), e a ficha é o primeiro entregável real. A cadeia roda
inteira, em três motores puros que não saem com `process.exit`:

```
conteudo/anamnese.json          o conteúdo (DADO, não norma; a norma é ARQUITETURA-ANAMNESE.md §3)
   ↓ derivar-plano.js           deriva o plano de ramificação
ramificacao/plano.json          nunca escrito à mão
   ↓ validar.js --contrato plano    mede a instância contra o contrato registrado
   ↓ elicitar.js --respostas r.json  conduz a Elicitação, com validar.js como porteiro
envelope/anamnese-*.json       o envelope, validado contra envelope/elicitacao-schema.json

conteudo/anamnese.json          o mesmo conteúdo, noutra saída
   ↓ ficha/renderizar.js        RENDERIZA — não elicita, não decide
ficha/ficha-anamnese.md         a ficha imprimível que o professor leva ao campo
```

Medido em 01/10/2026: `derivar-plano` dá **1 gatilho · 2 destinos · 3 paradas · 2 divergências ·
1 não-ramifica · 3 lacunas**; `validar --autoteste` passa **22 de 22**; `elicitar --autoteste`
passa **34 de 34**; `renderizar --autoteste` passa **50 de 50** e imprime os **43 nós** com
cobertura integral, deixando as **3 lacunas** como lacuna — uma por ramo do Módulo A. Uma
Elicitação real sai com `estado: em_curso`, a ramificação executada e uma **parada declarada** — o
motor se recusa a inferir o gatilho do Módulo B e diz por quê, em vez de supor. As três lacunas do
plano são exatamente essas paradas declaradas.

**Isto não está integrado, e o experimento não afirma que está.** O contrato de degradação graciosa
(`ARQUITETURA-PE.md` §7.1) tem três casos, e só o **primeiro** está medido: sem `PE_RAIZ`, o fluxo
produz o mesmo de antes e as três âncoras continuam íntegras. O caso do `PE_RAIZ` apontando para
caminho inexistente e o do `PE_RAIZ` válido continuam **declarados, não medidos** — e o segundo e o
terceiro dependem de um arreio no lado de `tools/`, que é congelado e exigiria motivo declarado.
Hoje **nada em `tools/` consulta este diretório**, e `PE_RAIZ` ainda não nasceu no projeto.

As três regras de fronteira do piloto, que valem para o `experimentos/` inteiro: **nada aqui é fonte
de ciclo** (esta área está fora do hash por construção); **nada aqui escreve fora daqui** (o motor
grava em `experimentos/pe/`, e a promoção é decisão, não efeito colateral); e **nada aqui toca
congelado**.
## Nota de 16/10/2026 — as cópias de folha aqui são HISTÓRICAS

`experimentos/receptor-local/bancada/assets/style.css` e
`experimentos/pe/_assets-test/tools/templates/ciclo.css` são **cópias de uma versão anterior** da
fonte de verdade (`tools/templates/ciclo.css`). Elas continuam servindo ao que os experimentos
precisam — abrir a bancada e ver o desenho daquele momento —, mas **não são a identidade vigente**
e não são conferidas pelo `tools/check-identidade.js`, cujo circuito cobre os pacotes de escola e a
raiz.

Quem for revisar a identidade **não deve olhar para estas cópias**: elas divergem de propósito
(registram um estado passado). Se um experimento passar a ser demonstração viva, a folha dele deve
ser **copiada da fonte** no momento em que ele for montado — como o `gerar-ciclo.sh` e o
`gerar-raiz.sh` fazem —, e não versionada à mão.
