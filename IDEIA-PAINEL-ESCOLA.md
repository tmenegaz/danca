# Bastidores — o ambiente da direção da escola

> **Resumo (para o HANDOFF):** o Bastidores é o ambiente da direção da escola: um grupo de
> menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a
> Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da
> reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência
> própria da escola. Não implementado.

> **Documento de plano.** O documento anterior chamava-se "Painel da escola e a página
> pública da cadeia de custódia" e registrava, desde 23/09/2026, a ideia de um painel de
> gestão. A conversa que deu origem a esta versão definiu o **Bastidores** — e este arquivo
> passou a ser o **plano desse ambiente**. **Nada disto está implementado**, e o desenho das
> telas ainda não foi feito: o que fica registrado aqui é **a ideia, o que o sistema já tem
> pronto e o que ainda precisa ser decidido**. As partes do documento anterior que continuam
> valendo (o painel de gestão, a página pública, a retenção e a consulta do material) foram
> mantidas, agora como partes do mesmo ambiente — ver as seções finais.

> **Escopo.** Este repositório é a **memória da aula dada** — protótipo testado no universo
> da dança (não é agnóstico; o projeto agnóstico será criado a partir dele). Não é o projeto
> de mestrado, e o FIPP não está implementado aqui: o que existe é uma **âncora de
> proveniência encadeada** (`tools/hash-ciclo.sh` → `.fipp`), aproximação do framework. O
> Bastidores **não avalia**: mostra fatos — quem interpreta é a direção.

## 1. O nome — «Bastidores»

**Bastidores** é o nome do ambiente. A referência é o mundo do espetáculo — o mesmo universo
de «Nós, Por Exemplo»:

> **O professor está em cena. O aluno está em cena. A escola está nos bastidores.**

O palco é a aula. O que o professor e o aluno vivem — o plano, a execução, o ajuste, o que
mudou — acontece em cena. O que a escola decide — a metodologia, as diretrizes, a
capacidade, quem conduz — é decidido nos bastidores, **antes** de a cena começar, e desce
para a cena sem que o professor tenha de reescrever nada.

## 2. A estrutura do menu

**Bastidores é um grupo de menu**, não um item. Ao clicar, abrem-se os **dois itens** de
dentro:

1. **Estúdio de Dança** — a vista que a **direção e o professor** partilham.
2. **Produção** — a vista **só da direção**. O professor **não tem acesso**.

A ordem é esta: **Estúdio primeiro, Produção depois**. O Estúdio é a **cena**; a Produção é
o **gabinete**.

No menu principal, o Bastidores fica **depois da «Área do Professor»** — é o **último grupo**
da navegação.

## 3. O princípio — cena × bastidores

Não é só nome de menu. É **princípio do sistema**:

- O professor **vê** o que o Estúdio mostra. **Não vê** a Produção.
- A direção **vê** os dois — mas o que vê no Estúdio é **o mesmo que o professor vê**, apenas
  **agregado**. A diferença é o **ângulo**, não o **acesso**.
- A direção **determina** o que desce (na Produção) e **lê** o que sobe (Estúdio + Produção).
  **Nunca entra em cena** — não altera o processo do professor.

Em uma frase: **o professor está em cena; a escola está nos bastidores.** O que a escola
declara desce; o que a cena produz sobe; nada se apaga, nada se edita — cada mudança é um elo
novo, com data e motivo.

## 4. A regra das senhas

Há **duas** senhas, e elas não se misturam.

- **Estúdio de Dança** usa a **senha da escola** — a que **já existe** (`tools/lib-senhas.sh`),
  a mesma dos acompanhamentos cifrados e a mesma do lançamento. O professor **não ganha senha
  nova**.
- **Produção** tem **senha própria** — Modelo 2, decisão explícita da pesquisadora. É **só da
  direção**; o professor **não tem acesso**, mesmo que saiba o endereço.

**Onde a senha da Produção vive.** Segue a convenção do `tools/.senhas-locais` (não
versionado; o `.exemplo` é o único versionado): uma variável a mais por escola, na mesma
família —

```
SENHA_<ESCOLA>_PRODUCAO        # ex.: SENHA_DIAGHILEV_PRODUCAO
```

— ao lado de `SENHA_<ESCOLA>`. Se o arquivo não existir ou a variável estiver vazia, a senha
é pedida no terminal, como já acontece hoje. **O que não pode acontecer:** a senha da
Produção versionada no repositório, ou acessível por quem não é da direção.

**Quando o professor é também diretor.** Nada muda de especial: ele é o **mesmo** usuário nos
dois lados. Se quiser, usa a **mesma senha** no Estúdio e na Produção — a decisão é dele. A
separação das senhas existe para o caso em que **são pessoas diferentes**: cada um tem a sua,
e um professor que **não é diretor**, ao digitar uma senha na Produção, simplesmente **não
entra**. É só isso.

## 5. A regra da reverberação — o que desce

**O que a escola declara na Produção desce para os documentos da cena**, sem o professor ter
de reescrever. A regra:

> **Sempre que um documento precisa de um dado da escola, ele olha para os Bastidores. Se
> estiver lá, o campo vem preenchido. Se não estiver, o campo fica aberto.**
>
> **O professor não digita de novo o que a escola já declarou. Ele confirma ou corrige — com
> ajuste.**

O conjunto de campos que **realmente reverberam** foi validado contra o que o sistema já
produz:

| O que a escola declara (no `ESCOLA.conf`) | Desce para | Mecanismo |
|:--|:--|:--|
| **metodologia** | campo `norma` do PO | pré-preenche a seção `## Norma estabelecida` |
| **diretrizes** | PO (contexto e justificativa) e anamnese | pré-preenchem o contexto institucional |
| **lista de professores** | `PROFESSOR` / `RESPONSAVEL` do `.conf` de cada ciclo | quem conduz e quem lança |
| **lista de alunos** | `Sujeitos` do PO | os apelidos estáveis (P-12) |
| **notação adotada** | `DOCS` do ciclo | presença de `notacao` + `glossario` (P-15/P-16) |
| **tetos** (aulas por ciclo, alunos por turma) | limites do `.conf` (`TOTAL_AULAS`, volumes) e do PO | os máximos |

A metodologia pode vir **imposta** pela escola (P-18): quando isso acontece, o PO deriva da
norma institucional (P-14). Se o professor escolhe, o PO é raiz.

### 5.1 O que é candidato a descer — inventário campo a campo

Esta subseção é o **inventário**: olha os três formulários **como existem hoje** e diz, campo
a campo, o que a escola podia ter preenchido antes nos Bastidores. É material de decisão da
pesquisadora — não é implementação, e **não inventa campo novo**.

O critério é a fronteira: **o Bastidores é o que a escola declara como norma antes da cena
começar; o que se decide durante a cena fica na cena.** A coluna «Opcional?» é **proposta a
validar** — a decisão final é da pesquisadora. «Opcional» = o professor confirma ou ajusta;
«Não opcional» = a escola declara e o professor não mexe.

**Anamnese**

| Campo | Origem nos Bastidores | Efeito | É candidato? | Opcional? |
|:--|:--|:--|:--|:--|
| `idade`, `conhecimentoPrevio`, `categoria-etaria`, `historico-de-praticas-corporais` (cabeçalho) | nenhuma | não tem efeito | **Não** — dado de cada aluna, não norma da escola | — |
| Blocos 2 a 9 (estrutura óssea, flexibilidade, escápulo-umeral, pés, coordenação, força, equilíbrio, vestibular) | nenhuma | não tem efeito | **Não** — observação do corpo de cada aluna; facto da avaliação, não norma | — |
| `modulo-a` (validação de nível prévio, 3 ramos) | nenhuma | não tem efeito | **Não** — verifica o nível real de cada aluna | — |
| `modulo-b` · `matriz-metodologica-de-origem` | nenhuma (não é a `METODOLOGIA` da escola) | não tem efeito | **Não** — origem metodológica **da aluna**, não a metodologia atual da escola | — |
| `modulo-b` · `tempo-de-interrupcao`, `auditoria-de-port-de-bras`, `auditoria-de-memoria-motora-sob-destreino` | nenhuma | não tem efeito | **Não** — dado de cada aluna | — |
| `resultado-da-avaliacao` (apta/não apta + nível) — **campo novo** (§8.3) | nenhuma | não tem efeito | **Não** — a conclusão que o professor devolve, não norma da escola | — |

**Plano de Observação (PO)**

| Campo | Origem nos Bastidores | Efeito | É candidato? | Opcional? |
|:--|:--|:--|:--|:--|
| `professor` (Professor responsável) | nenhuma | não tem efeito | **Não** — o PO é do professor (P-13); o sistema sabe quem está logado | — |
| `escola` (Escola/espaço) | `ESCOLA` do `ESCOLA.conf` | vem preenchido | **Sim** — a escola é a dona do dado | Não opcional |
| `norma` (Metodologia de referência) | `METODOLOGIA` do `ESCOLA.conf` | vem preenchido; bloqueado se a escola impõe (P-18) | **Sim** — o caso central da reverberação | Depende (P-18): se a escola impõe, não opcional; se o professor escolhe, opcional |
| `norma-origem` (Quem escolhe a metodologia) | `METODOLOGIA` + flag "imposta?" da escola | vem preenchido quando a escola impõe | **Sim** — o campo **já existe** no PO atual (`po.json`); parte da declaração P-16 | Não opcional quando imposta; opcional quando ele escolhe |
| `notacao` (Notação dominada) | `NOTACAO` do `ESCOLA.conf` | vem preenchido | **Sim** — P-15/P-16: a notação segue a metodologia | Opcional |
| `horizonte` (objetivo geral de conjunto) | nenhuma | não tem efeito | **Não** — planejamento pedagógico, não norma da escola | — |
| Bloco 2 · `dimensoes-de-observacao`, `itens-por-dimensao` | nenhuma | não tem efeito | **Não** — recorte observacional do professor (P-13) | — |
| Bloco 3 · `sujeitos` (Sujeitos observados) | `ALUNOS` (apelidos, P-12) do `ESCOLA.conf` | vem preenchido (a lista de apelidos) | **Sim** — o segundo caso central da reverberação | Opcional (o professor seleciona quem entra) |
| Bloco 3 · `flutuantes` | nenhuma | não tem efeito | **Não** — facto da cena (quem é fixo/eventual) | — |
| Bloco 3 · `linha-de-base` (Ponto de partida) | nenhuma | não tem efeito | **Não** — observação do professor sobre cada aluna (P-10) | — |
| Bloco 3 · `restricoes` (P-22) | nenhuma | não tem efeito | **Não** — facto de cada aluna, declarado pelo professor | — |
| Bloco 4 · `inclusao`, `exclusao` | nenhuma | não tem efeito | **Não** — recorte do professor; as `DIRETRIZES` podem informar, não preencher | — |
| Bloco 5 · `condicoes-de-contorno` | nenhuma | não tem efeito | **Não** — P-11: ânimo, interesse, harmonia são da cena | — |
| Bloco 6 · `referencia-ao-problema`, `explicacao-do-recorte`, `o-que-fica-de-fora`, `base-teorica` | nenhuma | não tem efeito | **Não** — raciocínio do professor | — |
| Bloco 7 · `limitacoes` | nenhuma | não tem efeito | **Não** — do professor | — |
| Bloco 8 · checklist (6 itens) | nenhuma | não tem efeito | **Não** — derivado do próprio preenchimento, não vem de fora | — |
| `modulo-horizonte` · `objetivo-geral-de-conjunto`, `numero-estimado-de-ciclos` | nenhuma | não tem efeito | **Não** — planejamento | — |
| `modulo-reavaliacao` · `marcos-decididos-ate`, `criterio-de-extensao` | nenhuma | não tem efeito | **Não** — planejamento | — |

**Coleta da aula dada**

| Campo | Origem nos Bastidores | Efeito | É candidato? | Opcional? |
|:--|:--|:--|:--|:--|
| `data` | nenhuma | não tem efeito | **Não** — já é sugerido pelo calendário; o dia real é facto da cena | — |
| `presentes`, `ausentes` | nenhuma | não tem efeito | **Não** — quem apareceu é facto da cena | — |
| `inicio`, `fim`, `duracao_min` | nenhuma | não tem efeito | **Não** — a duração real é facto da cena | — |
| `condicoes_contorno` · `plano_seguido`, `animo`, `interesse`, `harmonia`, `mudou` | nenhuma | não tem efeito | **Não** — P-11: condições relacionais da cena | — |
| blocos de captura (`tecnica`, `funcional`, `musicalidade`) | nenhuma | não tem efeito | **Não** — já derivam do PO/plano (que, estes sim, leem os Bastidores) | — |
| `linha_de_base` (revisitada, P-10) | nenhuma | não tem efeito | **Não** — já derivam do PO/plano | — |
| `relatorio` · `texto`, `surpresas`, `ajustes` | nenhuma | não tem efeito | **Não** — o relato do professor sobre a cena | — |
| `materiais` | nenhuma | não tem efeito | **Não** — facto da cena | — |
| `ultimo_lancamento` | nenhuma | não tem efeito | **Não** — carimbo automático, não é campo de preenchimento | — |

**O que é candidato.** Apenas **cinco** campos, todos no PO — nenhum na anamnese, nenhum na
coleta: `escola`, `norma`, `norma-origem`, `notacao`, `sujeitos`. São exatamente os dois casos
centrais que a tabela do §5 já declara (metodologia → `norma`; alunos → `Sujeitos`).

**O que não é candidato.** A razão comum é a fronteira: **o Bastidores é norma, a cena é
facto.** Toda a anamnese é observação do corpo de cada aluna; quase todo o PO é o recorte do
professor (P-13); toda a coleta é facto da cena. Os dois exemplos que a pesquisadora trouxe
estão cobertos: a **mudança de metodologia a meio do ciclo** (decisão da cena, entra como
ajuste no PO seguinte) e a **duração pontual 60→90** (facto daquela aula, já tem onde registar
no lançamento) **não são candidatos**.

**O que o sistema já tem (não duplicar).** `ESCOLA_HABILITADA` (vínculo escola × ciclo) já
existe na variante; `norma` e os apelidos (P-12) já existem no PO; os tetos
(`TOTAL_AULAS`, `VOLUME_MIN/MAX`, `DURACOES`) já vivem no `.conf`; a notação já decide o
`DOCS`; `RESPONSAVEL`/`PROFESSOR` já vivem no `.conf`. A lista `PROFESSORES` do `ESCOLA.conf`
não preenche nenhum formulário — alimenta a vista **Produção**.

**O que fica em aberto.** O flag "a escola impõe / o professor escolhe" (`norma-origem`) não
tem casa hoje — depende de onde for decidido morar; `DIRETRIZES` não preenche nenhum campo
atual (só informa o contexto); e a coluna «Opcional?» é proposta a validar pela pesquisadora.

## 6. A regra da proveniência da escola

A escola tem a sua **própria cadeia de proveniência** — como o ciclo tem a dele. Cada mudança
de metodologia, diretrizes, capacidade ou lista de professores é um **elo novo, com data e
motivo**. Nada se apaga, nada se edita.

Consequência direta:

- **O ciclo 1 fica com `norma: RAD` para sempre** — foi com RAD que ele aconteceu.
- **O ciclo 2 nasce com `norma: Vaganova`** — porque, quando ele nasceu, a escola já era
  Vaganova.
- **O PO do ciclo 2 lê os Bastidores e recebe Vaganova** — não herda do ciclo 1. Herda da
  **escola**.
- **O `ESCOLA.conf` ganha elos novos** — não é reescrito.

**Como a cadeia é guardada** — seguindo o precedente do ciclo (`.conf` + `.fipp`):

- **`ESCOLA.conf`** — o **estado corrente** da escola, em chave=valor (como o `.conf` do
  ciclo). Cada mudança é um **elo** acrescentado, não uma linha reescrita.
- **`ESCOLA.fipp`** — a âncora encadeada (`type: Escola`, com `parentHash`), reancorada a
  cada elo.
- **histórico** — um diretório de elos, um elo por mudança, cada um com **data e motivo**.

**Onde vive:** `escola/<escola>/` — uma pasta própria da escola na raiz, ao lado de
`professores/` e `departamentos/`. **Escola** é a palavra que o sistema já usa (Diaghilev,
Duo, Ritmos…), e é ela que comunica a identidade. `departamentos/` continua sendo **só** o
lugar do **PO de departamento** (P-14) — a norma compartilhada entre professores —, que é
outra coisa: não se mistura com a cadeia da escola.

## 7. A regra da usabilidade

> **Cada leitor vê primeiro o que mudou — não o que existe.**
>
> **O que não mudou fica a um clique.**
>
> **O que mudou está à vista.**

Aplica-se aos dois lados:

| | **Direção (Produção)** | **Professor (Estúdio)** |
|:--|:--|:--|
| **À vista** | a última mudança da escola | a última aula dada |
| **A um clique** | o elo anterior da cadeia | a aluna |
| **A dois cliques** | a cadeia inteira | o ciclo inteiro |

A direção **não abre o Bastidores todos os dias** — abre quando há uma decisão; quando abre,
precisa ver **o que mudou desde a última vez**. O professor **abre todos os dias** — precisa
ver **o que fazer hoje**.

## 8. A camada dos componentes de front-end

**O fluxo dos Bastidores já está desenhado** (§7 e §9). O que faltava era dizer **com que
componentes** cada passo é feito. Esta seção é essa camada: para cada passo do fluxo, qual o
componente e por quê — sempre pelos três critérios do §7: **menos cliques, menos escrita,
formulário com siso**.

A regra que decide cada componente já estava no fluxo; aqui ela vira explícita:

- **Produção** — usa **formulário com select** e **acordeão de agrupamento**: a direção
  declara, e declara raramente.
- **Estúdio** — usa **botão**, **lista** e **acordeão de tempo**: o professor age, e age
  todos os dias.
- **Anamnese** — usa **formulário**, **campo de leitura** e **botão binário**: o professor
  observa e conclui.

### 8.1 O que o sistema já tem — e o que falta criar

Lido no repositório, sem tocar em nada. Para cada componente, o que existe hoje:

| Componente | Existe? | Onde / como está hoje |
|:--|:--|:--|
| **Formulário** | **Sim** | `porta/index.html` (a elicitação, um campo por vez) e `tools/templates/lancamento.html` (o lançamento) |
| **Select** | **Sim** | `porta/index.html` (o campo de escolha da elicitação) e `lancamento.html` (ciclo, aula, aluna, entregável, marca) |
| **Acordeão** (`<details>`/`<summary>`) | **Sim** | `porta/index.html` («Sobre este formulário», «nota», «Avisos»), `lancamento.html` (`<details class="captura">`) e `tools/templates/nav.js` (os menus do pacote) |
| **Botão binário** | **O primitivo existe; o componente não** | o radio (`<input type="radio">` em grupo, em `porta/index.html`) já faz escolha exclusiva — mas não há um componente **nomeado** «apta/não apta» |
| **Campo de leitura** | **Sim** | `detalheDoEnvelope` e `referenciaDaAnamnese` em `porta/index.html` (a «caixa de detalhe» que mostra o envelope sem editar) e os campos `disabled` |
| **Lista** | **Sim** | `.lista` em `porta/index.html` (lista clicável, com o item atual marcado e o check de concluído) |
| **Acordeão de agrupamento** | **O primitivo existe; o nome não** | é o mesmo `<details>`/`<summary>` do acordeão — falta usá-lo como agrupador de categorias na Produção |
| **Acordeão de tempo** | **Não existe** | não há componente que agrupe por tempo (ciclo → aula → semana); seria o `<details>` usado como eixo do tempo |

**Resumo:** formulário, select, acordeão, campo de leitura e lista **já existem e servem**.
O que falta criar é só **nome** para o que é variação do que já existe: o **botão binário**
(apta/não apta), o **acordeão de agrupamento** e o **acordeão de tempo** — três usos
declarados do radio e do `<details>` que ainda não têm componente próprio no sistema.

### 8.2 A tabela — o componente de cada passo do fluxo

| Passo do fluxo | Onde | Componente | Por quê |
|:--|:--|:--|:--|
| **Ver a última mudança da escola** | Produção · página inicial | **Campo de leitura** + **botão** «ver o elo» | A direção lê o que mudou (à vista, §7); o botão abre a cadeia — o resto fica a um clique |
| **Ver o estado da escola** | Produção · página inicial | **Campo de leitura** | Os indicadores (habilitada, motivos, tetos) ficam à vista — zero cliques |
| **Definir o que a escola é** | Produção · identidade | **Formulário com selects** + **acordeão de agrupamento** | A direção declara; o select evita escrita, o acordeão separa as categorias (metodologia, diretrizes, capacidade) |
| **Ajustar um campo** | Produção · identidade | **Botão «ajustar»** | Ajustar abre só aquele campo; guardar cria um elo novo — menos escrita, proveniência preservada |
| **Ver a cadeia da escola** | Produção · cadeia | **Lista** + **acordeão** | Uma linha por elo (data + motivo); abre para ler o motivo inteiro |
| **A produção agregada** | Produção · números | **Campo de leitura** | Números à vista — sem cliques, sem escrita |
| **Abrir o plano da aula** | Estúdio · página inicial | **Botão** | Um clique, uma ação — é o que o professor faz todos os dias |
| **Ver as alunas** | Estúdio · página inicial | **Botão** + **lista** | O botão abre; a lista mostra, clicável, com o estado de cada aluna |
| **Ver o ciclo** | Estúdio · página inicial | **Acordeão de tempo** + **lista clicável** | Agrupa por tempo (ciclo → aulas); clica para abrir a aula |
| **A anamnese** | Estúdio · formulário | **Formulário** + **campo de leitura** + **botão binário** + **select** | O professor observa; o campo de leitura mostra o que veio; o botão decide apta/não apta; o select escolhe o nível |
| **O resultado da avaliação** | Estúdio · anamnese · fim | **Botão binário** + **select** | O professor conclui — apta/não apta, e o nível |
| **A lista de anamneses feitas** | Produção · lista | **Lista** + **acordeão** | A direção vê o que existe; clica para ler o resultado |

### 8.3 O campo «Resultado da avaliação» — a conclusão da anamnese

O campo novo que a anamnese ganha é a **conclusão**: o professor observou, e devolve o que
concluiu. São **dois sub-campos**, ambos no fim da anamnese:

| Sub-campo | Forma | O que é |
|:--|:--|:--|
| **Apta / não apta** | **Botão binário** | Se a aluna está apta a fazer a aula — sim ou não |
| **Nível** | **Select** | Iniciante, básico, intermediário, avançado — **o vocabulário é o que a escola adotar** |

**O que o campo novo NÃO tem** — e por quê:

- **Não tem turma** — é a direção que decide (a anamnese não distribui a aluna).
- **Não tem horário** — é a direção que decide.
- **Não tem frequência semanal** — vem do contrato, não da anamnese.

**A conclusão da anamnese é o nível + apta/não apta.** É o que o professor devolve; o resto
(turma, horário, frequência) é decisão da direção, não observação da cena.

**«Quem aferiu» e «quem coletou»** — verificado no sistema: **não existem como campo do
formulário da anamnese**. O que existe é o **envelope**
(`porta/envelope/elicitacao-schema.json`), que registra **automaticamente** o `respondente`
(`professor` ou `especialista` — quem respondeu) e a `origem` (`perguntado`, `observado` ou
`importado` — como o valor chegou). Ou seja: o sistema já guarda **quem falou** e **como o
dado chegou**, mas como metadados do envelope, não como campo que o professor preenche. Se o
desenho quiser esses dois campos **explícitos e visíveis**, são **campos novos**; se aceitar os
metadados do envelope, já tem o essencial. Fica em aberto (§16).

### 8.4 O que falta criar

O que já existe serve; o que falta é pequeno:

- **Botão binário** — um componente nomeado sobre o radio que já existe (apta/não apta, e
  qualquer escolha de dois).
- **Acordeão de agrupamento** — o `<details>` já existente, usado como agrupador de categorias
  na Produção.
- **Acordeão de tempo** — o `<details>` já existente, usado como eixo do tempo no Estúdio
  (ciclo → aula → semana).

## 9. O que cada vista mostra

**Estúdio de Dança — o professor vê:**

- As suas turmas, as suas alunas, os seus ciclos.
- O processo de cada aluna — a linha de base inicial, revisitada, o que mudou.
- O que ele declarou e o que aconteceu.
- A última aula dada, os ajustes feitos, o plano da próxima.

**Estúdio de Dança — a direção vê o mesmo, agregado:**

- Todas as turmas, todos os professores.
- **Não vê mais do que o professor vê sobre cada aluna.** Vê o **mesmo**, em **conjunto**.

**Produção — a direção vê:**

- A identidade da escola — metodologia, diretrizes, capacidade.
- A cadeia de proveniência da escola — quando mudou o quê, e por quê.
- Os professores — quem são, quantos ciclos têm, quando entraram.
- O alinhamento — cada professor está seguindo o que a escola declarou?
- A produção agregada — quantos ciclos, quantas aulas, quantas não dadas.
- O estado da escola — habilitada, desabilitada, e por quê.

**O professor não vê nada disto.** Não por segredo — por **não ser o lugar dele**.

## 10. O `ESCOLA.conf`

O `ESCOLA.conf` segue o **mesmo formato chave=valor** do `.conf` do ciclo — é assim que ele
se lê e se estende sem aprender uma sintaxe nova.

- **Obrigatórios** — o mínimo que a escola declara para os documentos da cena a consultarem.
  **Obrigatório é o campo, não o valor:** uma escola que não tem diretrizes declara
  `DIRETRIZES="nenhuma"`; uma que não adota notação declara `NOTACAO="nenhuma"` com a
  justificativa (P-15/P-16); uma que não quer teto declara `TETO_AULAS_CICLO="sem teto"`. A
  regra é a P-16 — **declarado, nunca deduzido**: o sistema não deduz que a escola não tem, a
  escola declara que não tem.
  - `ESCOLA` — o nome.
  - `METODOLOGIA` — a metodologia adotada (RAD, Vaganova, Francesa/Cecchetti, escola livre…).
  - `DIRETRIZES` — as diretrizes da escola.
  - `PROFESSORES` — a lista de professores.
  - `ALUNOS` — a lista de alunos, por **apelidos estáveis** (P-12).
  - `NOTACAO` — a notação adotada, ou `nenhuma` com justificativa (P-15/P-16).
  - `TETO_AULAS_CICLO` e `TETO_ALUNOS_TURMA` — os tetos.
  - `HABILITADA` (+ `HABILITADA_MOTIVO` e `HABILITADA_DESDE` quando `nao`) — o estado da
    escola **no servidor**: se ela está pagando, se quer continuar usando o sistema. Cada
    escola é um Worker no Cloudflare; esta flag é o interruptor-mestre daquela escola. A flag
    `ESCOLA_HABILITADA` que já existe na variante de cada ciclo **continua existindo** — são
    dois níveis, e os dois convivem: a escola ligada/desligada no servidor, e o vínculo
    escola × ciclo declarado na variante. **A `HABILITADA` da escola é o interruptor-mestre:
    desligada a escola, nada daquela escola funciona — ciclos, aulas, proveniência, glossário.
    A `ESCOLA_HABILITADA` da variante só tem efeito quando a escola está ligada: é o
    interruptor fino, por ciclo, dentro da escola ligada.**
- **Opcionais / em aberto** — o documento nomeia onde o dado vai morar, sem decidir o valor:
  - `VALOR_HORA` — para o cálculo de horas × valor (onde o valor mora, indeciso — ver §16).
  - `RETENCAO` — a duração da retenção (a decisão está em §14; onde o número mora, em §16).

## 11. O que já existe e serve × o que precisa ser criado

**Já existe e serve** (lido no repositório, sem tocar em nada):

- **A senha por escola** — `tools/lib-senhas.sh` (`SENHA_<ESCOLA>` em `tools/.senhas-locais`).
- **O estado da escola** — `ESCOLA_HABILITADA` (+ motivo e desde) na variante do ciclo: o
  vínculo escola × ciclo. O interruptor-mestre da escola (no servidor) sobe para o
  `ESCOLA.conf`.
- **A âncora encadeada** — `tools/hash-ciclo.sh` → `.fipp`, por ciclo e por aula; o precedente
  da cadeia da escola.
- **A norma institucional** — `departamentos/` (P-14), hoje sem nenhuma escola; o precedente
  do **PO de departamento** (a norma compartilhada entre professores), que é **outra coisa** da
  cadeia da escola.
- **O campo `norma` do PO** — `## Norma estabelecida`; o destino da metodologia que desce.
- **Os `Sujeitos` do PO** — os apelidos estáveis (P-12); o destino da lista de alunos.
- **A metodologia na anamnese** — `matriz-metodologica-de-origem` e a regra *"metodologia e
  notação são declaradas, nunca deduzidas"*.
- **A notação no `DOCS`** — `notacao` + `glossario` quando a metodologia exige.
- **Os tetos no `.conf`** — `TOTAL_AULAS`, `VOLUME_MIN/MAX`, `DURACOES`.
- **O que o sistema produz de facto** — `ciclos.json` (índice por aula, estado derivado,
  prazo), `ciclo-XX-<escola>-dados.json` (a captura) e os `.fipp`.

**Precisa ser criado:**

- O `ESCOLA.conf` e a sua âncora (`ESCOLA.fipp`) com o histórico de elos.
- A variável `SENHA_<ESCOLA>_PRODUCAO` na convenção de senhas.
- As duas vistas — o Estúdio e a Produção — e o grupo de menu «Bastidores».
- A página pública da cadeia e a retenção (já decididas; ver as seções finais).

## 12. O painel de gestão — a outra face do mesmo dado

*(Seção mantida do documento anterior — agora, a face "Produção" do mesmo ambiente.)*

O Bastidores **não cria dado nenhum**. Ele **relê** o que o lançamento do professor já
produz, com outro recorte e outra permissão:

| O que ele mostra | De onde já vem |
|:--|:--|
| aulas dadas, por data e duração | `aulas` do JSON de dados + o calendário |
| quem esteve presente | `presentes` / `ausentes` por aula |
| o que mudou em cada ajuste | `ajuste_de`, `motivo`, `ajustes` (o diff) |
| a cadeia de custódia | os `.fipp` (por ciclo, e por aula) |
| horas trabalhadas × valor-hora | a soma das durações + um valor que **falta definir** |

É por isso que ele é a outra face do mesmo desenho: **o lançamento só é confiável porque a
escola é dona do dado**, e o Bastidores só funciona porque o professor lançou. Os dois se
sustentam.

**O que ele faz (esboço):**

- **Acompanhamento da gestão** — as aulas dadas, por professor, turma, modalidade ou
  disciplina; os filtros são livres, porque a **organização** é por professor e o **recorte**
  é de quem olha.
- **Horas trabalhadas** — a soma das durações executadas (o dado já está em `duracao_min`).
- **Valor-hora** — o cálculo do que a escola deve ao professor; depende de um valor que
  **ainda não tem onde morar**.
- **Cadeia de custódia** — o que mudou e o que não mudou.
- **Como o professor conduz** — a tabela bruto × harmonizado mostra a linguagem com que ele
  fala dos alunos — e **não** é censura: é o registro de como ele interage.
- **Relatórios sob demanda** — a escola gera o que quiser, para si mesma; nada é gerado
  automaticamente.

**O que já está pronto do lado do sistema** (verificado no repositório):

- **A senha já é por escola.** `tools/lib-senhas.sh` deriva `SENHA_<ESCOLA>`. O Bastidores
  usa **a mesma solução de login e senha** do formulário de lançamento.
- **O dado é por professor, e a busca é por professor.** A estrutura é
  `professores/<professor>/` e **vai continuar assim** (decisão de 23/09/2026). É assim que a
  escola procura — *"quero saber as aulas da professora Rita"*. Não raro o professor **é** o
  dono da escola.
- **O modelo de dados tem o que o Bastidores precisa.** O JSON de dados já traz, por ciclo, o
  professor e a escola; e, por aula, a data, a duração, a presença e as marcas por aluna.

**A correção de linguagem.** O mecanismo **já existe** (P-21). Exemplo do que ele faz:

| O professor digita | O sistema oferece |
|:--|:--|
| "essa aluna é muito ruim fazendo demi-plié" | o **fato** permanece, o **juízo** sai: "demi-plié a desenvolver" |

A versão bruta **não é apagada**: o material bruto (`campo/`) preserva a linguagem original,
o documento publicado usa a harmonizada, e a tabela bruto × harmonizado
(`ciclo-XX-<escola>-harmonizacao.md`) fica **visível ao professor** — ele revisa e pode
reescrever com as próprias palavras. **A harmonização é proposta, não imposição.** No
Bastidores, as duas aparecem, porque é isso que a escola quer ver.

## 13. A página pública da cadeia de custódia

*(Seção mantida do documento anterior.)*

A **prestação de contas virada para fora**: pais e alunos consultam o que mudou na cadeia. É
a contraparte pública do Bastidores: onde a direção vê tudo, o público vê o rastro.

**O recorte está decidido (23/09/2026): a página mostra apenas a existência de diferenças**
— *"aqui mudou"* —, e **nunca o conteúdo** do diff. O material é sensível (dados de menores);
a existência da mudança é informação pública, o conteúdo não é.

- **Quem vê o conteúdo precisa solicitar.** O sistema **não prevê nem decide** esse acesso: é
  acordo interno entre as instituições. Se há ou não acordo de direito de imagem, **não é da
  conta do sistema**.
- **O que sustenta o recorte é a âncora** (`ARQUITETURA-AULA.md` §5.2): um hash com metadados
  e **nenhum conteúdo**. É ela que permite dizer *"este documento tem diferenças"* sem expor
  **o que** mudou — e que faz a prestação de contas sobreviver ao selamento.
- **A linguagem é harmonizada (P-21)** por definição, como no resto do publicado.

## 14. A retenção — selar, não apagar

*(Seção mantida do documento anterior.)*

**Decidido (23/09/2026).** Ao fim da retenção, o conteúdo é **selado**, não apagado. Isso
fecha a tensão com a regra central do projeto — *"apagar é proibido, senão não há
proveniência"*: apagar quebraria a cadeia; **selar a preserva**.

- **A duração é política de cada escola.** O Bastidores entrega o **campo**; a escola entrega
  o **valor**. Exemplos declarados: **5 anos**, cem, *"pra sempre, enquanto os servidores
  existirem"*, ou **o prazo que a lei exigir**.
- **A retenção sobrevive ao contrato.** O material **não segue o vínculo**; ele é da escola.
- **O que sobrevive é a âncora.** Só ela permite que a prestação de contas dure *"para
  sempre"*: é hash com metadados e nenhum conteúdo.
- **Selar não é apagar nem liberar.** O conteúdo sai da **custódia corrente** e passa a uma
  **política de acesso ao passado** — porque o material é **memória do processo e do
  conhecimento**.

## 15. A página de consulta do material (possibilidade declarada)

*(Seção mantida do documento anterior.)*

Além da cadeia, foi declarada a possibilidade de uma página de **consulta do material
produzido na escola** — a memória do processo — e, na área de administração e *"de uma forma
mais rebuscada"*, o uso desses planos para **negociar planos de aula com professores de
outras escolas**. **Não está decidida**, e **colide em parte** com o recorte da cadeia (§13):
como o material tem dados de menores, o que se abre é **política da escola**, não decisão do
sistema. Registrada para não se perder.

## 16. O que fica aberto

- **A estrutura das telas.** Não foi desenhada — quantas telas, quais filtros, o que fica no
  Estúdio e o que fica na Produção.
- **O valor-hora.** O Bastidores calcula horas × valor — mas **onde o valor mora** (no
  `ESCOLA.conf`? num cadastro à parte?), **quem o declara**, e se ele pode **mudar no meio do
  ciclo** (e o que acontece com as aulas já dadas) não foi decidido.
- **Onde mora o campo da retenção.** A *decisão* está tomada (§14): **selar, não apagar**, e
  a duração é política de cada escola. Falta **onde** o número é declarado.
- **O nível de detalhe da página pública.** Está decidido que ela mostra **que** houve
  mudança, e **não** o conteúdo (§13). Se mostra também **a data** e **qual aula**, não.
- **A página de consulta do material** (§15) — possibilidade, **não decidida**.
- **A relação com o outro projeto.** A integração com o projeto das secretarias (Projeto
  Cultura) **não foi desenhada** — nem a fronteira de entrada nem a de saída. O Bastidores
  pode ser onde essa fronteira vive; não é uma decisão tomada.
- **O vocabulário do nível.** Iniciante, básico, intermediário, avançado são o exemplo (§8.3);
  **o vocabulário exato é o que a escola adotar** — e onde ele fica declarado (no `ESCOLA.conf`?
  por escola?) não foi decidido.
- **«Quem aferiu» e «quem coletou».** Não existem como campo do formulário da anamnese; o
  envelope já guarda `respondente` e `origem` como metadados (§8.3). Decidir se o desenho quer
  esses dois campos **explícitos e visíveis** — e se «quem aferiu» pode ser pessoa diferente
  de «quem coletou» — fica em aberto.
- **Os três componentes nomeados.** O botão binário, o acordeão de agrupamento e o acordeão de
  tempo são variações do radio e do `<details>` que já existem (§8.1/§8.4); o desenho os
  declara, mas **nada foi implementado** — criar os componentes próprios ainda não foi feito.

## Referências

- `ARQUITETURA-AULA.md` — o desenho da aula (§5.2, §7 e §9 remetem para cá)
- `CONGELAMENTO.md` — a política de segurança dos dados sensíveis
- `PROTOCOLO.md` — P-21 (harmonização), P-12 (apelidos), P-14 (departamento), P-18 (metodologia imposta)
- `tools/lib-senhas.sh` — a senha por escola
- `departamentos/README.md` — o precedente da norma institucional (P-14)
- `IDEIA-CAPTURA.md` — o conceito do formulário
