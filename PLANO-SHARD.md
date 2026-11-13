# Plano — o shard: N escolas num Worker, e o endereço por host

> **Status.** O **passo 1 está feito** (13/11/2026): a escola deixou de ser `var` de deploy e passou
> a vir do mapa `escolas/por-host`, em KV, com cache de isolate — ver a entrada do `REGISTRO.md` de
> 13/11/2026. O **passo 2 não começou**, e não começa por falta de decisão: começa quando houver
> **três escolas** no ar (as duas de teste que faltam), porque o que ele muda é o endereço de tudo
> e o que o detecta é dado real, não bancada vazia.
>
> **A decisão de endereço, tomada.** `<escola>.padd.com.br` — **por host, não por prefixo**. É a
> forma como o Cloudflare funciona (`escola.domínio`), e é a que **não mexe em nenhum caminho
> publicado**: `/aulas/`, `/ciclos/planos/`, `/area-do-professor/anamnese` continuam a ser o que
> são. O prefixo (`padd.com.br/escola/…`) fica descartado.
>
> **Por que o shard.** Não é capacidade: um Worker já serve ~240 escolas (20.000 ficheiros por
> versão ÷ 82). É **raio de alcance** — um erro num deploy chega a N escolas, e as outras não viram
> o commit. E é o que passa do tecto de **100 Workers por conta** (limite do plano gratuito), que é
> hoje a única parede real do produto.

---

## 0. O que está medido

| o que | número | de onde |
|:--|:--|:--|
| ficheiros por escola, 2 turmas | **82** (~5 MB) | `publicacao/calango` |
| ficheiros fixos + por turma | **16 + 33** | `publicacao/calango` (2 turmas de 33) |
| tecto de ficheiros por versão (grátis) | **20.000** | limites do Workers Static Assets |
| escolas por Worker, 2 turmas | **~240** | 20.000 ÷ 82 |
| escolas por Worker, 4 turmas | **~135** | 20.000 ÷ 148 |
| Workers por conta (grátis) | **100** | limites do Workers |
| escolas no ar hoje | **1** (`calango`) | `/accounts/…/workers/scripts` |

A consequência que importa: **o shard não vive no limite dele**. Com 20 escolas por Worker, cada
versão sobe ~1.640 ficheiros — 8% do tecto.

---

## 1. O que há para configurar no Cloudflare

> **ATUALIZADO a 13/11/2026 — já não é trabalho manual.** O registo DNS e a rota de cada escola
> são criados **por dentro do sistema**, quando a escola nasce pela página `danca`
> (`motor/servidor/dominio-da-escola.js`, ligado ao `provisionar-escola.js`), e apagados pelo
> expurgo. A pesquisadora: *«toda vez eu tenho que ir lá e falar qual é a zona e criar o processo
> — isso não é legal de fazer toda vez»*. Deixou de ser.
>
> **O único trabalho que resta é um, e é uma vez só:** a permissão no token (§1.0). O resto desta
> secção fica escrito como *o que o sistema faz em seu nome* — e como se confere, se um dia for
> preciso ligar à mão.

### 1.0 A permissão do token — o único passo manual

O `CLOUDFLARE_API_TOKEN` que a raiz usa tem de incluir, para a zona `padd.com.br`:

| permissão | para quê | estado medido a 13/11/2026 |
|:--|:--|:--|
| **Zone → Workers Routes → Edit** | criar a rota | **já tem** (criar e apagar verificados) |
| **Zone → DNS → Edit** | criar o registo `A` | **FALTA** — `dns_records → 403` |

Onde: **Cloudflare → My Profile → API Tokens → Edit** no token em uso → *Permissions* → acrescentar
`Zone · DNS · Edit` (com a zona `padd.com.br`, ou `All zones`). Sem ela, a escola **nasce na mesma**
— o painel diz «Endereço próprio: PENDENTE» e a dica diz o que falta. A criação não se perde por
uma permissão; fica pendente, e diz-se.

### 1.1 Pré-requisito, uma vez

A zona `padd.com.br` tem de estar **activa** no Cloudflare (os *nameservers* do registrador
apontados para os da Cloudflare). Se já usa o domínio em outras coisas através da Cloudflare,
este passo está feito.

**O certificado não é trabalho nenhum.** O *Universal SSL* cobre o domínio raiz **e os subdomínios
de primeiro nível** — `batata.padd.com.br` está coberto automaticamente, sem pedir certificado
nenhum. (Só um segundo nível, `x.batata.padd.com.br`, precisaria de *Total TLS* ou de certificado
avançado. Não é o nosso caso.)

### 1.2 Por escola: um registo DNS + uma rota — **agora automático**

O sistema faz as duas coisas ao criar a escola. Isto fica aqui para (a) se conferir o que ele fez e
(b) se ligar à mão quando for preciso. As duas apontam para o **mesmo** Worker (hoje o da escola;
no shard, o do shard):

| passo | onde | o que |
|:--|:--|:--|
| **DNS** | zona `padd.com.br` → **DNS → Records → Add record** | Tipo `A`, nome `calango`, IPv4 `192.0.2.1`, **Proxy status: Proxied** (nuvem laranja) |
| **Rota** | **Workers & Pages** → o Worker do shard → **Settings → Domains & Routes → Add → Route** | Zona `padd.com.br`, padrão `calango.padd.com.br/*` |

Notas que evitam erro:

- **O `192.0.2.1` não é um servidor.** É o endereço de documentação (RFC 5737), e serve só para
  criar um registo proxyado. Quem responde é o Worker, porque a rota o intercepta antes. A
  Cloudflare exige um registo DNS proxyado para a rota existir — é o único motivo de ele estar lá.
- **A rota exige a nuvem laranja.** Um registo DNS *DNS-only* (cinzenta) não recebe rota.
- **A rota é sempre `<escola>.padd.com.br/*`** — com o `/*` no fim. Sem ele, só a raiz casaria.

### 1.3 Por que rota explícita, e não um curinga

Um curinga (`*.padd.com.br/*` numa rota só) seria mais cómodo: escola nova não exigiria nada no
Cloudflare. **E é perigoso neste domínio**, por duas razões que a documentação confirma:

1. Um registo DNS curinga (`*`) só se aplica **quando não existe registo exacto** — na DNS, os
   subdomínios que já usa estão protegidos. Mas **a rota não tem essa proteção**: uma rota
   `*.padd.com.br/*` intercepta **todos** os subdomínios da zona que não tenham uma rota mais
   específica. Tudo o que hoje vive em `algo.padd.com.br` passaria a responder pelo nosso Worker.
2. O `padd.com.br` **já é usado** para outras coisas. Um curinga transformaria o «vou testar isto»
   num «quebrei aquilo».

**MEDIDO NA ZONA REAL, 13/11/2026 — e isto é o que a regra previne.** A zona `padd.com.br` tem hoje
**uma rota curinga**: `*.padd.com.br/*` → script `danca` (a raiz). Ela foi criada para ligar o
endereço do painel, e não está a quebrar nada *hoje* por um acidente feliz: o apex não é coberto
por curinga, o `www` tem rota própria, e as outras subetiquetas que se usam não têm registo DNS
(resolver antes de rota é o que salva — sem registo, o pedido nem chega). Mas o risco é real e é
silencioso: **qualquer subdomínio novo com registo DNS e sem rota própria passa a responder pelo
painel do Lastro** (401 «autenticação necessária»), e quem estiver a montar outra coisa conclui que
o DNS está errado.

Duas consequências práticas:

- **O painel deve ter rota explícita** — `danca.padd.com.br/*` → `danca` — e o curinga deve sair.
  Com o curinga no lugar, uma escola cujo registo DNS ficou criado e cuja rota falhou não dá erro:
  serve o painel. Um endereço de escola a mostrar o painel de administração é o pior dos avisos,
  porque *parece* que funciona.
- **As provas ao vivo têm de distinguir quem respondeu.** A bancada do domínio aponta a um script
  de ESCOLA (e não à raiz) exactamente por isto: o `/api/saude` de uma escola diz
  `{"tipo":"escola","slug":"…"}`, e o da raiz diz `{"tipo":"raiz"}`. Apontada à raiz, a bancada
  passaria pelo caminho errado — e um falso positivo que dá alívio é pior do que uma falha.

Há duas saídas se um dia o número de escolas tornar o clique insuportável:

- **rotas por escola, criadas por script** — `provisionar-escola.js` já cria o Worker e o
  subdomínio pela API; criar o registo DNS e a rota é a mesma chamada, na mesma função. É o caminho
  que eu recomendo, e é o que mantém o `padd.com.br` intacto.
- **uma zona dedicada** (`lastro.padd.com.br` como zona própria, ou um domínio novo) — aí o curinga
  não ameaça nada, e uma escola nova passa a ser só uma linha no mapa em KV. Exige um segundo
  domínio (ou uma zona delegada) e um certificado para o nível extra.

**Regra que fica**: enquanto o domínio for partilhado com outras coisas, **rota explícita por
escola**. O curinga só entra num domínio que seja só do sistema.

### 1.4 O expurgo leva o endereço consigo

O `excluirEscola` (usado pelo expurgo **e** pelo desfazer de um provisionamento que morreu) apaga o
registo DNS e a rota — e só os que têm a marca do sistema: registo `A` → `192.0.2.1` proxyado, e
rota que aponta a este script. Um `<escola>.padd.com.br` que aponte para outra coisa **fica**.

Isto existe por um defeito medido: `diagleve.padd.com.br` e `duo.padd.com.br` continuavam a existir
para escolas já expurgadas. Um endereço que aponta para um Worker apagado responde erro a quem o
abre, e o DNS continua a dizer que aquela escola existe.

### 1.5 O que **não** precisa de ser feito

- Não é preciso criar o registo DNS nem a rota à mão — é o que esta versão automatiza.
- Não é preciso «Custom Domain» por escola — isso é um domínio por Worker, e o shard tem **um**
  Worker para N escolas. Rota é o mecanismo certo.
- Não é preciso mexer no `.workers.dev`. `calango.tmenegaz77.workers.dev` continua a funcionar, e
  é o endereço de trabalho até a zona estar ligada.
- Não é preciso tocar no `ESCOLA_HABILITADA` nem no mapa: a escola já está no mapa, e a resolução
  por etiqueta (`calango.padd.com.br` → `calango`) está provada desde 13/11/2026
  (`provar-escola-por-host`, secção 1).

---

## 2. O que o passo 2 muda no código

O endereço público **não muda**. O que muda é que uma árvore de ficheiros passa a ter N escolas
dentro dela, e por isso a ponte tem de dizer **qual** subárvore servir.

### 2.1 A árvore

Hoje: `assets.directory = publicacao/calango`, e `/aulas/` é `publicacao/calango/aulas/`.

No shard: `assets.directory = publicacao/` (todas), e a ponte reescreve o caminho antes de pedir
ao ASSETS — `/aulas/` vira `/calango/aulas/`. O endereço na barra do navegador fica `/aulas/`.

### 2.2 O preço, dito antes de ser pago

Com a reescrita, o ASSETS deixa de conseguir servir sozinho: o caminho pedido (`/aulas/`) não existe
na árvore (`/calango/aulas/`). E o `run_worker_first` que acabei de ajustar em 13/11/2026 passaria a
`true` — **4 invocações por página em vez de 1**, que é exactamente o que a entrada do `REGISTRO` de
hoje corrigiu.

Há uma saída, e ela é legítima: **`/assets/` é igual em todas as escolas**. É o mesmo `style.css`,
o mesmo `nav.js`, o mesmo `favicon.svg` — a checagem «Circuito» do `check-identidade` garante que as
cópias são iguais à fonte. Se a montagem escrever **uma** cópia em `publicacao/assets/` em vez de
uma por escola, a negativa `!/assets/*` continua a valer, e o CSS, o JS e o favicon continuam a ser
servidos sem invocar o Worker. Os assets **por turma** (`/piano/assets/lib-vistas.js`) têm de ser
reescritos, e esses pagam uma invocação.

| o que | hoje | shard (sem partilhado) | shard (com `/assets/` partilhado) |
|:--|--:|--:|--:|
| invocações por página vista | 1 | 4 | **2** |
| capacidade no plano grátis (100.000/dia) | ~100.000 páginas | ~25.000 | **~50.000** |

É uma decisão de desenho para o passo 2, e fica aqui declarada com os números.

### 2.3 O que mais toca

- `tools/montar-publicacao.js` — monta uma árvore com N escolas em vez de uma; escreve o `escola.json`
  de cada uma no sítio certo da árvore.
- `motor/servidor/producao.js` — reescreve o caminho com a escola resolvida, antes do ASSETS; a
  identidade do pacote passa a ser lida de `/<escola>/escola.json`.
- `motor/servidor/mapa-de-escolas.js` — já resolvido; no shard, um isolate serve N escolas e a
  leitura do mapa é **uma só** para todas (é o ganho que o cache já dá hoje, e que só aparece
  quando houver mais do que uma escola por isolate).
- `wrangler.<shard>.jsonc` — **um** ficheiro para o shard, com `assets.directory = publicacao/` e as
  rotas das escolas que ele serve.

---

## 3. O canário: as escolas de teste primeiro

A regra que a pesquisadora propôs, e que o código já suporta sem inventar convenção nenhuma:
`motor/servidor/teste-fixtures.js` diz, desde 19/10/2026, que a **palavra no nome** decide —
`Calango → 1`, `Batata → 2`, `Breu → 3`. Qualquer nome que contenha uma delas é escola de teste.

| shard | quem | quando recebe deploy |
|:--|:--|:--|
| `lastro-teste` | calango, batata, breu | **primeiro** |
| `lastro-producao` | DU, Petitá, Bolshoi, São Paulo Cia… | depois de o teste validar |

Não é preciso inventar um campo «é de teste»: ele já existe, é `numeroDoTeste`, e é o mesmo que
liga o preenchidor automático dos formulários.

---

## 4. A bateria de testes de bancada (o que se faz quando as três escolas estiverem no ar)

Por escola, e nas três: **criar · editar · derivar · alterar · apagar** — com os documentos gerados
de verdade. A lista concreta, para não depender da memória:

| # | gesto | o que tem de continuar verdadeiro |
|:--|:--|:--|
| 1 | abrir `/` de cada escola pelo domínio próprio | o conteúdo é o dela (o `escola.json` confere) |
| 2 | `/aulas/`, `/ciclos/planos/`, os PDFs | servem, e o caminho na barra é o mesmo de hoje |
| 3 | `/assets/style.css`, `/nav.js` | servem, e sem invocar o Worker (medido por log) |
| 4 | anamnese: criar, editar, apagar | a lista mostra o vigente, não a proveniência |
| 5 | plano de ensino: criar, derivar | a cascata marca o que precisa de revisão |
| 6 | PO: criar, concluir, gerar | a geração escreve no repositório da escola certa |
| 7 | linha de base: enviar, alterar elenco | a turma e a etiqueta de cada aluna seguem |
| 8 | turma: criar, mudar de sala, apagar | o expurgo de uma **não** toca nas outras |
| 9 | professor: cadastrar, desligar, excluir | a pasta apagada é `professores/<slug>/` dela |
| 10 | `/api/saude` de cada host | `origem: "mapa"` e `escola_do_pacote` iguais |

O que já está provado e não precisa de ser repetido à mão: `provar-isolamento-entre-escolas`
(25/25), `provar-escola-por-host` (20/20) e `provar-assets-sem-worker` (38/38).

---

## 5. O que continua em aberto

- **A raiz.** `danca.tmenegaz77.workers.dev` serve o painel. Com a zona ligada, ele passa a
  `padd.com.br` (apex) ou a `painel.padd.com.br`? É decisão de endereço, e tem o mesmo peso da das
  escolas — mas é independente e pode ficar para depois.
- **O `/assets/` partilhado.** Vale a pena? Os números da §2.2 dizem que sim (2 invocações contra
  4), mas implica a montagem escrever uma cópia por escola a menos — e o `check-pacote` conta
  ficheiros por pacote.
- **Quantas escolas por shard.** 20 é confortável (8% do tecto de ficheiros) e dá um raio de alcance
  pequeno. Só a prática dirá se 20 é o número certo.
- **A criação de escola pelo painel da raiz.** Hoje quem regista no mapa é o workflow
  `criar-escola`. Criar a partir da página `danca` não regista — o painel da raiz não tem `PADD_KV`
  ligado. Ligá-lo é o que fecha essa porta.
