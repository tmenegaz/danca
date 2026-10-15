# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-10-15T12:55:03-0300`
Commit atual: `a45ec58` — chore(entrega): absorver o volteio do gerador (carimbo e sais novos)
Para: sessão nova (retomar o diálogo)

## O que é este projeto

**Nome comercial:** o produto é o **Sistema Lastro** — e este repositório é o **Projeto
Ciclo**, o protótipo a partir do qual ele se constrói. Os dois nomes convivem, e a
convivência é declarada (não é renomeação): **Lastro** é a marca curta; **Sistema Lastro**
é o sistema como um todo; **Plataforma Lastro** destaca a solução tecnológica; e
`Lastro — Sistema de Memória e Observabilidade Pedagógica em Dança` é a **proposta** de
denominação descritiva (proposta, não subtítulo confirmado). O conceito central não muda:
o Lastro **registra e organiza evidências para apoiar a reflexão pedagógica; não substitui
o professor nem toma decisões sobre o aluno.** O mapa de evolução do produto está em
`PLANEJAMENTO-LASTRO.md`.

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
- **Professores:** leticia
tiago (2)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor, fechando na **conclusão** — o campo **«Resultado da avaliação»** (apta/não apta + nível, sem turma/horário/frequência) — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-GERAL.md`** — Arquitetura geral — por que sistema de arquivos, e não um backend com banco
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Bastidores é o ambiente da direção da escola: um grupo de menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência própria da escola. Não implementado.
- **`PLANEJAMENTO-LASTRO.md`** — o mapa de evolução do **Sistema Lastro** (o nome comercial do produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os relacionamentos, os índices, o versionamento e o comercial — e **dez frentes** com objetivo, lacunas, dependências, entregas, critérios verificáveis, riscos e prioridade. Nada foi implementado: este documento é o mapa, não a obra.

## Últimos commits

```
a45ec58 chore(entrega): absorver o volteio do gerador (carimbo e sais novos)
4f61a8b chore(entrega): absorver o volteio do gerador (carimbo e sais novos)
9a4e792 chore(entrega): os pacotes da Barra e da Maria absorvem o formulário que decifra pelo Worker
33e2299 fix(template): o formulário decifra pelo Worker — a chave sai do navegador
4c57a8c feat(estrutura): a chave de cifra vira interna do Worker — e a criação para de entregá-la
789e309 fix(tools): o arquivo de senhas vira um espelho por escola — e o modelo ensina a forma
b39b5b6 fix(tools): o prefixo do nome separa a chave de cifra da senha de acesso
281c7e1 docs(registro): a SENHA_LETICIA não é inerte — é o login da professora
83560fc fix(estrutura): a criação da escola diz onde guardar a senha de criptografia
e3fc795 fix(tools): o guarda do pre-push confere a última linha do arquivo de senhas
8c56058 docs(registro): o passo de deploy foi exercitado — a cadeia publica
3bcddc1 chore(entrega): gerar o pacote de leticia/01/barra
19a23de feat(estrutura): a geração publica — o deploy entra na cadeia
90af3f6 docs(registro): a prova fim-a-fim da cifra passa, e o que falta é o deploy
a7a99e5 chore(entrega): a geração da Barra absorve a página dos bastidores e a proveniência do plano
fff06ae Merge origin/main — o pacote da Barra gerado pela Action entra ao lado da correção da cifra
52da76e chore(entrega): gerar o pacote de leticia/01/barra
bf3b08f feat(ciclo): o «Guardar» do PO cifra ciclo-01-barra-dados.cifrado.json
1f11443 feat(po): o PO elicitado vira a fonte do ciclo
65f9d1b fix(estrutura): a cifra do Worker respeita o teto do runtime — e a falha deixa de ser muda
```

## Por professor

### leticia — 1 ciclo(s)

**Ciclo 01** — variante(s): barra

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| barra | ciclo-01-barra-po.md | Input_PO_Aguardando | 1 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| barra | ciclo-01-barra.fipp | `db6233ad4475` | (vazio) | Input_PO_Aguardando |

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): maria

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| maria | ciclo-01-maria-po.md | Input_PO_Aguardando | 1 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| maria | ciclo-01-maria.fipp | `03fb63d2af3a` | (vazio) | Input_PO_Aguardando |

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

## 15/10/2026 — A chave de cifra vira interna do Worker: ninguém a vê, ninguém a arquiva

**O que motivou.** O dono do produto, olhando o arquivo de senhas depois do espelho por escola:

> *«Quando eu criar uma escola nova, eu vou receber então a senha barra, ou a senha da escola… Ou não
> sou eu que guardo isso? Porque é meio estranho eu ter que pegar essas senhas e colocar num arquivo.
> Pra mim, como usuário, isso já deveria ser automático. E, na verdade, a senha da escola pode até ser
> uma senha gigante como essa aqui você tá me passando. Mas o que o professor espera, o que a pessoa
> que tá criando espera, é que a senha seja a senha que ela colocou ali. E não uma senha gigante
> modificada da que ela colocou. Então é meio estranho isso.»*

Ele está certo, e o **diagnóstico do estado anterior** mostrou o tamanho do absurdo:

| O que a chave protegia | Medido |
|:--|:--|
| O `-dados.json` do pacote | **A semente vazia** — `aulas: []` nos DOIS pacotes; o lançamento vai para o KV, em texto puro, e nada o traz de volta |
| O `-dados.json` como coisa sensível | O que ele traz é `apelidos`, que saem **em claro no envelope**, por decisão registrada |
| O uso da chave no formulário | **Nunca acontecia**: o caminho é `if (!bruto.lancamentos) return …`, e `lancamentos` é sempre 0 |

Ou seja: uma chave gerada, exibida uma única vez, arquivada à mão — **para cifrar um arquivo vazio, e
sem que ninguém a digite no caminho real**. E, ao lado dela, `/api/receber` grava lançamento em texto
puro **sem autenticação nenhuma** (medido: `HTTP 200 {"ok":false,"erro":"nenhum arquivo no pedido"}` —
recusa de negócio, não 401).

**Por que a chave não pode ser simplesmente «a senha que ela digitou».** Se a chave **for** a senha,
trocar a senha inutiliza tudo o que já foi cifrado (o `-dados.json` do pacote e os acompanhamentos das
alunas): um aluno muda de senha e o arquivo histórico deixa de abrir. A pergunta certa não é «qual
senha usar» — é **«quem precisa ver a chave?»**. E a resposta é: **ninguém**.

**O que foi decidido.**
- **A criação para de entregar a chave.** `provisionar-escola.js` continua gerando e gravando a
  `SENHA_CRIPTO` como secret do Worker, mas **não a devolve** na resposta; a página `danca` para de
  exibi-la e diz que ela ficou no Worker. Não há nada a anotar, nada a copiar.
- **O Worker decifra** (`motor/servidor/ler-dados.js`, novo). O navegador **deixa de conhecer a
  chave**: manda a senha da PESSOA — a que ela já sabe, e que o Worker já confere nos Bastidores — e
  recebe o **texto em claro**. A senha passa a ser só **autenticação**; trocá-la **não invalida nada**.
- **A conferência é a da ESCOLA** (a direção ou qualquer professor cadastrado), e **não** a
  por-professor do `validar-senha`: aquela existe para o login DE UMA PESSOA («a senha de um professor
  nunca vale para outro — era esse o vazamento»); esta abre o DADO DA ESCOLA, que não pertence a um
  professor. A política nova está escrita em `senhaDaEscolaOk`.
- **O nome do arquivo é conferido, não confiado.** Ele vem do cliente: sem o filtro, uma travessia de
  caminho (`../../tools/.senhas-locais`) leria outro arquivo do ASSETS e o devolveria **em claro** a
  quem tem a senha de um professor. O filtro aceita só `ciclo-NN[-escola]-dados[-carimbo].json`.

**Consequências declaradas — as duas, sem eufemismo.**
- **O segredo do Cloudflare é WRITE-ONLY.** Não há como lê-lo de volta, nem pelo painel nem pela API.
  Sem a exibição, a chave torna-se **irrecuperável por qualquer pessoa** — é exatamente isso que a
  torna interna, e é o preço. O que ela custa: a ferramenta **local** que precisa dela, o
  `gerar-acompanhamento.sh` (que cifra a página de cada aluna com o `pagecrypt`), passa a depender de
  a cifra **migrar para o Worker**. Hoje **não há acompanhamento nenhum** (o ciclo da Barra registra
  «0 aluna(s) · 0 relatório(s)»), então nada ficou inacessível — e as chaves das duas escolas de teste
  seguem em `tools/.senhas-locais`, para quem precisar delas agora.
- **O teto do runtime reaparece do outro lado.** O WebCrypto do workerd recusa PBKDF2 acima de
  100.000 iterações; o envelope do CLI local tem 2e6. Abrir um pacote legado pelo Worker **falha**, e
  a falha é **declarada** com a instrução («regenere o pacote — o gerador usa a contagem do Worker»).
  Medido: a **Maria**, escola legada **sem `SENHA_CRIPTO`**, responde «a leitura dos dados cifrados não
  está disponível» em vez de estourar — caminho degradado declarado, não erro obscuro.

**Motivo declarado — os congelados.** `tools/templates/` está congelado. O motivo: **o formulário
público era o último lugar onde a chave aparecia**, e mantê-la lá contradiria a decisão — ele decifrava
com a chave digitada, e agora **pede a senha da pessoa ao Worker**. O que **não muda**: a fórmula da
cifra (`PBKDF2-SHA256+AES-GCM`), o esquema do envelope (autodescritivo), o contrato do
`check-pacote.js`, a obrigatoriedade do `-dados.json` cifrado no pacote, as 17 regras e as 22 pétreas.
Nenhum arquivo de ciclo foi tocado como fonte — a âncora `.fipp` não cobre `tools/` **nem** as saídas
geradas, então **não há reancoragem**.

**Onde entrou.**
- `motor/servidor/ler-dados.js` (novo) — o leitor: filtro do nome, conferência da senha, decifra.
- `motor/servidor/bastidores.js` — `senhaDaEscolaOk` (a política da escola), exportada.
- `motor/servidor/cloudflare.js` — a injeção do leitor (`passosDeGeracao` + `montarPorta`), no mesmo
  padrão de `escreverCiclo`; o prefixo do leitor é **vazio** (o `-dados.json` mora na raiz do pacote,
  e a porta sob `plano-observacao/`).
- `motor/servidor/rotas.js` — a rota `POST /api/dados`.
- `motor/servidor/producao.js` — o despacho de `/api/dados` na raiz.
- `motor/servidor/provisionar-escola.js` — para de devolver `senhaCripto`.
- `raiz/index.html` — para de exibir a chave; diz que ela ficou no Worker.
- `tools/templates/lancamento.html` — a decifra passa pelo Worker; o rótulo vira «Sua senha»; a
  `lib-cifra.js` sai do formulário (o navegador não decifra mais nada).

**Com o quê.** Os arquivos acima, mais os pacotes regenerados da Barra e da Maria (o formulário é
gerado a partir do template), `REGISTRO.md` e `HANDOFF.md`.

**Referências.** Os quatro elos de 15/10/2026 anteriores · `motor/servidor/cifrar-envelope.js` (o
teto do runtime, do outro lado) · `motor/servidor/escrever-ciclo.js` (o passo 3b) ·
`CONGELAMENTO.md` (`tools/templates/`).

**O que ainda não está feito.**
- **`/api/receber` continua SEM AUTENTICAÇÃO**, e o lançamento continua gravado em **texto puro** no
  KV. Era a quarta opção da lista apresentada («quero ver o `/api/receber` autenticado e o dado
  cifrado também no KV»), e **não** foi a escolhida. Fica registrado como o descompasso que sobra: o
  formulário autentica para LER e não autentica para GRAVAR. Enquanto isso, quem souber o endereço da
  escola pode gravar um lançamento no KV dela.
- **Os acompanhamentos não têm mais como obter a chave localmente** (a consequência acima). A frente
  que fecha isso é a cifra dos acompanhamentos **migrar para o Worker** — ou um caminho gated para
  revelá-la, que contradiria «ninguém a vê» e por isso não foi feito sem decisão do dono do produto.
- **A `lib-cifra.js` continua sendo copiada para o pacote** pelo `gerar-ciclo.sh`, agora sem uso no
  formulário. Limpeza pequena, não feita, para não aumentar a superfície congelada deste commit.
- O caminho novo **não foi exercitado com dado real**: o pacote nunca tem `lancamentos > 0`, então o
  formulário nunca chama a rota. O que foi provado é a ROTA (cinco casos, no ar) e o formulário
  publicado (chama `/api/dados`, não carrega `Cifra`, rótulo novo).
- **A Maria é escola legada**: sem `SENHA_CRIPTO` e com envelope de 2e6 na semente. Ela responde a
  falha declarada; migrá-la (criar o secret e regenerar o envelope) não foi feito.
- **A árvore NUNCA fica limpa depois de um commit que toque fonte de ciclo — e não foi este trabalho
  que a fez assim.** O hook de `pre-commit` regenera o ciclo, e a regeração reescreve, a cada passo,
  coisas que não são conteúdo: o `gerado_em` do `ciclos.json` (resolução de minuto), o carimbo
  embutido nos PDFs, e o **envelope cifrado da Maria** — que o gerador re-cifra porque o pacote dela
  não traz a cópia pronta do Worker, e cada cifra sorteia sal e IV novos. Medido três vezes seguidas:
  gerar → sujar a árvore → commitar → sujar de novo, sem convergir. **Não é defeito do espelho das
  senhas nem desta entrada**: é a combinação `gerador × hook`, e persegui-la é infinito. O que se
  fez: absorver o volteio no commit próprio (como em 15/10) e **descartar o resíduo final**, porque
  são SAÍDAS reconstruíveis e o conteúdo é idêntico a menos de carimbo. A frente que fecha isso — o
  gerador só reescrever o que muda de verdade, ou carimbar a partir do commit — não foi aberta.

## O que está pendente

## 15/10/2026 — O guarda do pre-push passa a conferir a última linha do arquivo de senhas

- Não há **teste automatizado** para o hook: a prova foi a reprodução manual acima. O hook aceita
  `SENHAS_LOCAIS=<arquivo>` (caminho trocável), então um teste é possível — mas não existe.
- O defeito irmão, agora que a última linha é lida: uma senha com `=` no valor. O `read` com
  `IFS='='` devolve o resto ao último campo, o que preserva `a=b`; **não foi medido**, e fica dito
  como não verificado em vez de suposto.

## 15/10/2026 — A criação da escola diz onde guardar a senha de criptografia

- **A mensagem não foi vista renderizada.** Não dá para exercitá-la sem **criar uma escola de
  verdade** — e criar é ato do dono do produto, não de uma sessão de manutenção. O que foi provado:
  a sintaxe do script inline, e a montagem do nome (`d.escola` = `barra` → `SENHA_BARRA`). A prova
  visual fica para a próxima escola criada.
- A `SENHA_LETICIA` em `tools/.senhas-locais` **não é lida por script nenhum** (nenhuma escola tem
  slug `leticia`; a escola é `barra`) e continua isenta no `tools/.escolas-teste`, onde a isenção
  existe pelo valor **placeholder** «leticia», que aparece nos caminhos `professores/leticia/…`.
  Não foi removida: mexer nela é decisão da pesquisadora, não efeito colateral deste conserto.
  **O que ela É** — ver a nota de correção no fim desta entrada: não é uma chave, é a senha de
  acesso da professora.

> **Correção de 15/10/2026 (mesmo dia).** A primeira redação deste item dizia que a `SENHA_LETICIA`
> «segue **inerte**». **Está errado**, e o erro é do mesmo tipo do que esta entrada combate — um
> nome que parece uma coisa e é outra. «Inerte» descrevia só o que os *scripts* fazem: `lib-senhas.sh`
> monta `SENHA_<ESCOLA_SLUG>` e nunca lê `SENHA_LETICIA`. Mas o **valor** daquela linha é a senha
> **viva** da professora Letícia — dona da escola Barra —, e é por ela que se entra nos
> **Bastidores** e na **Produção**. Medido na escola no ar, em 15/10/2026:
>
> | Segredo no Worker `barra` | Valor medido | Para que serve |
> |:--|:--|:--|
> | `SENHA_PROFESSOR` | «leticia» | login da professora dona — abre Bastidores **e** Produção |
> | `SENHA_ADMIN` | «barra» | login da direção — abre Produção |
> | `SENHA_CRIPTO` | 48 hex | chave da cifra — abre o `-dados.cifrado.json` |
>
> A linha `SENHA_LETICIA="leticia"` em `tools/.senhas-locais` guarda o **primeiro** destes — um
> **login**, não uma chave. O arquivo cujo cabeçalho diz «senhas de criptografia» passou a conter,
> também, credencial de acesso. A versão anterior desta redação não é apagada: fica como o elo que
> registra o que se pensou antes da correção.
- `tools/.senhas-locais.exemplo` (congelado) já documenta a convenção `SENHA_<ESCOLA>` — não
  precisou mudar. O que faltava não era a regra: era **dizê-la no momento em que a senha nasce**.

## 15/10/2026 — O prefixo do nome separa a chave da cifra da senha de acesso

- **Nada foi provado contra a escola no ar depois da renomeação**, porque nada no Worker a lê: a
  renomeação é do arquivo **local**. O que foi provado em bancada: o sujeito do `LOGIN_LETICIA` é
  isentado **porque está declarado** na lista de teste — com um `LOGIN_PROFESSORES` (não declarado,
  valor que existe em centenas de arquivos versionados) o guarda **alerta e barra o push**, e um
  prefixo desconhecido (`PREFIXO_QUALQUER`) **também** é conferido. A isenção é o que salva, e não
  um descuido de leitura.
- **A senha da direção não está no arquivo local.** `SENHA_ADMIN` = «barra» no Worker da Barra
  (medido), e ela **não** tem linha aqui. Se for guardada, o nome natural — `SENHA_BARRA` — está
  **tomado** pela chave de cifra da mesma escola. O prefixo novo resolve: `LOGIN_<SLUG DE QUEM
  ENTRA>`.
- As senhas de acesso da Barra são as strings óbvias (`leticia`, `barra`) e estão neste transcript.
  Para **escola de teste com dados 100% falsos** a política declarada cobre isso; **se a Barra
  deixar de ser só teste, as duas precisam mudar** — e trocar `SENHA_PROFESSOR`/`SENHA_ADMIN` é
  operação no Worker, não neste repositório.

## 15/10/2026 — O arquivo de senhas vira um espelho por escola

- **A chave de cifra ainda passa pela mão da pesquisadora — e isso é uma falha de produto, não de
  configuração.** Quem cria a escola recebe a chave uma vez e tem de copiá-la para um arquivo local;
  o dono do produto disse o óbvio: *«pra mim, como usuário, isso já deveria ser automático»*. O
  Worker que a gera é o mesmo que a usa para cifrar (caminho (a)) — **o CI não precisa dela**, e
  quem a usa para ABRIR é o navegador (o formulário de lançamento pede a senha) e o
  `gerar-acompanhamento.sh` (local). Automatizar exige decidir **onde** a chave fica disponível sem
  passar pela mão de ninguém — frente não desenhada.
- **A `SENHA_ADMIN` da Maria não está registrada** (o Worker no ar recusa «maria» e «tiago», o que
  prova que ela é outra coisa). O bloco da Maria saiu com os logins em `[Preencher]`, comentados.
- O nome `LOGIN_BARRA` para o login da direção foi **escolha desta sessão**, ditada pela isenção por
  sujeito. Se o dono do produto preferir `LOGIN_DIRECAO_BARRA`, o `pre-push` (congelado) precisa
  mudar — exige motivo declarado e commit próprio.

## 15/10/2026 — A chave de cifra vira interna do Worker: ninguém a vê, ninguém a arquiva

- **`/api/receber` continua SEM AUTENTICAÇÃO**, e o lançamento continua gravado em **texto puro** no
  KV. Era a quarta opção da lista apresentada («quero ver o `/api/receber` autenticado e o dado
  cifrado também no KV»), e **não** foi a escolhida. Fica registrado como o descompasso que sobra: o
  formulário autentica para LER e não autentica para GRAVAR. Enquanto isso, quem souber o endereço da
  escola pode gravar um lançamento no KV dela.
- **Os acompanhamentos não têm mais como obter a chave localmente** (a consequência acima). A frente
  que fecha isso é a cifra dos acompanhamentos **migrar para o Worker** — ou um caminho gated para
  revelá-la, que contradiria «ninguém a vê» e por isso não foi feito sem decisão do dono do produto.
- **A `lib-cifra.js` continua sendo copiada para o pacote** pelo `gerar-ciclo.sh`, agora sem uso no
  formulário. Limpeza pequena, não feita, para não aumentar a superfície congelada deste commit.
- O caminho novo **não foi exercitado com dado real**: o pacote nunca tem `lancamentos > 0`, então o
  formulário nunca chama a rota. O que foi provado é a ROTA (cinco casos, no ar) e o formulário
  publicado (chama `/api/dados`, não carrega `Cifra`, rótulo novo).
- **A Maria é escola legada**: sem `SENHA_CRIPTO` e com envelope de 2e6 na semente. Ela responde a
  falha declarada; migrá-la (criar o secret e regenerar o envelope) não foi feito.
- **A árvore NUNCA fica limpa depois de um commit que toque fonte de ciclo — e não foi este trabalho
  que a fez assim.** O hook de `pre-commit` regenera o ciclo, e a regeração reescreve, a cada passo,
  coisas que não são conteúdo: o `gerado_em` do `ciclos.json` (resolução de minuto), o carimbo
  embutido nos PDFs, e o **envelope cifrado da Maria** — que o gerador re-cifra porque o pacote dela
  não traz a cópia pronta do Worker, e cada cifra sorteia sal e IV novos. Medido três vezes seguidas:
  gerar → sujar a árvore → commitar → sujar de novo, sem convergir. **Não é defeito do espelho das
  senhas nem desta entrada**: é a combinação `gerador × hook`, e persegui-la é infinito. O que se
  fez: absorver o volteio no commit próprio (como em 15/10) e **descartar o resíduo final**, porque
  são SAÍDAS reconstruíveis e o conteúdo é idêntico a menos de carimbo. A frente que fecha isso — o
  gerador só reescrever o que muda de verdade, ou carimbar a partir do commit — não foi aberta.

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
- **23/09/2026** — A identidade do projeto entra na documentação (e a… → `REGISTRO.md` L2344
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO.md` L2425
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO.md` L2506
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO.md` L2597
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO.md` L2665
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o… → `REGISTRO.md` L2740
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que… → `REGISTRO.md` L2851
- **25/09/2026** — A identidade visual passa a existir como contrato, e a… → `REGISTRO.md` L3051
- **25/09/2026** — A hora da aula entra no `DIAS`, e o calendário passa a ter… → `REGISTRO.md` L3182
- **26/09/2026** — O `DOCS` deixa de ser lista à mão: as famílias por aula… → `REGISTRO.md` L3356
- **26/09/2026** — A P-13 deixa de sugerir que o dado é privado do professor:… → `REGISTRO.md` L3477
- **26/09/2026** — O prazo do §3 dizia "menor entre" — e dois números do… → `REGISTRO.md` L3630
- **26/09/2026** — O config da captura deixa de ser um por ciclo: um… → `REGISTRO.md` L3779
- **26/09/2026** — O `check-identidade.js` entra no `pre-commit`: a identidade… → `REGISTRO.md` L3979
- **26/09/2026** — O campo ganha a forma canônica da linha de base, a… → `REGISTRO.md` L4213
- **26/09/2026** — A data da aula deixa de ser adivinhada: o `ciclos.json`… → `REGISTRO.md` L4406
- **26/09/2026** — O JSON de dados ganha validador: o `-dados.json` deixa de… → `REGISTRO.md` L4673
- **26/09/2026** — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo`… → `REGISTRO.md` L4875
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por… → `REGISTRO.md` L5156
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO.md` L5316
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO.md` L5470
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas… → `REGISTRO.md` L5659
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única… → `REGISTRO.md` L5861
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO.md` L5974 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO.md` L6166
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO.md` L6324
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO.md` L6488
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação… → `REGISTRO.md` L6623
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO.md` L6743
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO.md` L6859
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO.md` L7197
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só… → `REGISTRO.md` L7298
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO.md` L7424 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO.md` L7545 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO.md` L7670 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO.md` L7818
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO.md` L7945
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO.md` L8015 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO.md` L8093
- **30/09/2026** — O segundo papel do agente: o servidor local **não… → `REGISTRO.md` L8182
- **01/10/2026** — A grafia de "Elicitação" se propaga, e a pendência do… → `REGISTRO.md` L8269
- **01/10/2026** — A view gerada e a regra de leitura cresciam com o arquivo:… → `REGISTRO.md` L8410
- **02/10/2026** — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev… → `REGISTRO.md` L8531
- **02/10/2026** — A escola passa a poder ser desabilitada, com motivo e data → `REGISTRO.md` L8645
- **07/10/2026** — O cofre dos lançamentos sai do Netlify e entra no… → `REGISTRO.md` L8762
- **07/10/2026** — O Netlify antigo é destruído, o mapa anda para o slide 83… → `REGISTRO.md` L8914
- **07/10/2026** — O prompt de elicitação herda oito decisões do… → `REGISTRO.md` L9042
- **09/10/2026** — A criação de escola vira um comando: o CLI de… → `REGISTRO.md` L9282
- **09/10/2026** — A porta passa a elicitar o PLANO, e o ciclo do zero passa a… → `REGISTRO.md` L9334
- **10/10/2026** — O menu separa a Anamnese do Plano de Observação, e a… → `REGISTRO.md` L9387
- **11/10/2026** — «Nós, Por Exemplo» vira a página de entrada; o… → `REGISTRO.md` L9440
- **11/10/2026** — Atalhos da porta na página de entrada e aprofundamento do… → `REGISTRO.md` L9509
- **11/10/2026** — URLs próprias para a Anamnese e o Plano de Observação → `REGISTRO.md` L9563
- **11/10/2026** — As sete mudanças de comportamento e a proveniência… → `REGISTRO.md` L9605
- **11/10/2026** — Ordem alfabética nos menus e rótulo da harmonização → `REGISTRO.md` L9681
- **12/10/2026** — O «Nós, Por Exemplo» passa a ter fonte única e a raiz… → `REGISTRO.md` L9730
- **12/10/2026** — O plano de ensino vira rota própria e o PO passa a puxar… → `REGISTRO.md` L9787
- **12/10/2026** — O plano de ensino ganha estante, edição em sítio e… → `REGISTRO.md` L9846
- **12/10/2026** — A arquitetura geral ganha documento próprio (arquivo, não… → `REGISTRO.md` L9889
- **12/10/2026** — O botão «Criar nova escola» alinha o menu da Área do… → `REGISTRO.md` L9923
- **12/10/2026** — O CLI «criar-escola» alinha o menu zero ao plano de ensino → `REGISTRO.md` L9955
- **12/10/2026** — A página de entrada ganha o «Plano de ensino» → `REGISTRO.md` L9993
- **12/10/2026** — A raiz nunca é desabilitada pelo freio de escola → `REGISTRO.md` L10047
- **12/10/2026** — O rodapé do ciclo zero lista os três itens da Área do… → `REGISTRO.md` L10085
- **12/10/2026** — A folha de captura ganha rótulo curto e transposição → `REGISTRO.md` L10122
- **12/10/2026** — A senha de criptografia da Maria nasce mockada e chega ao CI → `REGISTRO.md` L10168
- **12/10/2026** — O PO referencia o plano por id e para de duplicar o… → `REGISTRO.md` L10202
- **12/10/2026** — O Diaghilev sai por expurgo DIRETO, e a trava de identidade… → `REGISTRO.md` L10251
- **12/10/2026** — O hook de expurgo nasce e passa o teste no Diaghilev II → `REGISTRO.md` L10339
- **12/10/2026** — O criar-escola.sh passa a gerar o índice da escola (fecha… → `REGISTRO.md` L10404
- **12/10/2026** — O expurgo ganha a reconciliação worker×slug e o hook… → `REGISTRO.md` L10453
- **12/10/2026** — A senha de criptografia deixa de ser manual: nasce REAL no… → `REGISTRO.md` L10508
- **12/10/2026** — A senha de criptografia nasce no Cloudflare (caminho a): o… → `REGISTRO.md` L10561
- **12/10/2026** — A página «Criar nova escola» passa a subir o motor… → `REGISTRO.md` L10629
- **12/10/2026** — O formulário vira mínimo e o Bastidores vira grupo… → `REGISTRO.md` L10692
- **13/10/2026** — A contaminação entre escolas (o envelope sem escola) é… → `REGISTRO.md` L10756
- **13/10/2026** — O hook deixa o ciclo-zero (scaffold de escola) passar → `REGISTRO.md` L10839
- **13/10/2026** — A Produção exclui aluna e professor (o gabinete se… → `REGISTRO.md` L10870
- **13/10/2026** — O professor é o dono, a Produção pede senha e o… → `REGISTRO.md` L10894
- **13/10/2026** — Bloco 2: o nó 50 não semeia, e «não foi medido» entra… → `REGISTRO.md` L10934
- **13/10/2026** — «Não foi medido» chega aos basilares e às cinco… → `REGISTRO.md` L10964
- **13/10/2026** — A categoria etária é re-derivada da idade; a memória é… → `REGISTRO.md` L10999
- **13/10/2026** — A senha é por professor, e a categoria etária re-deriva… → `REGISTRO.md` L11027
- **13/10/2026** — Cadastro de turmas e vocabulário técnico do balé (com… → `REGISTRO.md` L11066
- **13/10/2026** — Norma revisada: o Bastidores cria e declara (caso a caso);… → `REGISTRO.md` L11114
- **13/10/2026** — A base canónica do catálogo migra para… → `REGISTRO.md` L11152
- **13/10/2026** — A curadoria nasce: a escola atribui a cada professor o que… → `REGISTRO.md` L11185
- **13/10/2026** — Metodologia e notação chegam ao PO (ligar L5 — Bloco… → `REGISTRO.md` L11218
- **13/10/2026** — A tela consome a curadoria: plano/PO travam sem curadoria e… → `REGISTRO.md` L11245
- **13/10/2026** — Bastidores quebrou: a página da Produção referia `env`… → `REGISTRO.md` L11283
- **13/10/2026** — A grelha das tabelas: a rubrica, as turmas em plural, o… → `REGISTRO.md` L11306
- **13/10/2026** — A rubrica: o conteúdo alinha-se à decisão (Bloco 10,… → `REGISTRO.md` L11410
- **13/10/2026** — A grelha não chegava à porta: duas listas brancas… → `REGISTRO.md` L11449
- **14/10/2026** — A régua da turma mede o critério no LANÇAMENTO (frente… → `REGISTRO.md` L11489
- **14/10/2026** — O PO completo chega inteiro aos derivados (frente B10) → `REGISTRO.md` L11578
- **14/10/2026** — O plano completo chega inteiro aos derivados (frente B11) → `REGISTRO.md` L11679
- **15/10/2026** — O Sistema Lastro: o nome comercial, e o mapa de evolução… → `REGISTRO.md` L11818
- **15/10/2026** — A dimensão observada deriva do PLANO (e o vocabulário do… → `REGISTRO.md` L12149
- **15/10/2026** — A cifra do Worker respeita o teto do runtime, e a falha… → `REGISTRO.md` L12267
- **15/10/2026** — A geração publica: o deploy entra na cadeia → `REGISTRO.md` L12367
- PO de **leticia · barra** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **leticia · ciclo 01:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).
- PO de **tiago · maria** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **tiago · ciclo 01:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).
- Material de campo de **tiago**: 0 evento(s) versionado(s).

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
