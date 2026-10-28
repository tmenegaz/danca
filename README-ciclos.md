# Ciclos de Aprendizagem — formato de entrega (Regra 16)

> **Onde isto se encaixa.** O **Projeto Ciclo** é a memória da aula dada. Cada aula é
> **planejada** antes de ser dada — o plano (`aula-NN.md`) fixa objetivo, marcos e volume e
> é ele que dá a **linha de base** —, e o que se registra é o processo de ensino-aprendizagem
> que de fato se aplicou: **o que mudou em relação ao plano**. **Ele é protótipo, e está
> sendo testado no universo da dança**; a partir dele será criado o projeto que deve ser
> **agnóstico**. Este documento descreve a **entrega** de um ciclo, e os exemplos que usa são
> do protótipo de balé.
>
> A âncora de proveniência deste repositório (`tools/hash-ciclo.sh` → `.fipp`) é uma
> **aproximação** do FIPP, que pertence a outro projeto e **não está implementado aqui**.

**Dois nomes parecidos, três referentes.** O plano (`aula-NN.md`) é a **linha de base daquela
aula**: é contra ele que se registra o que mudou. Separadamente, o PO declara a **linha de base
dos sujeitos** (P-10) — o estado inicial de que a primeira aula parte. Depois do primeiro
lançamento essa referência **desloca**, e passa a ser a **linha de corte**: o registro da
última aula que teve dado, e é ela que alimenta o formulário da aula seguinte. A regra e os
dois cenários estão em `ARQUITETURA-AULA.md` §2.

Este documento descreve como o material de um ciclo é **gerado e entregue** neste
repositório: os arquivos-fonte, os dois formatos obrigatórios (PDF único e pacote
HTML), as regras de navegação e como validar tudo antes de entregar ao professor.

> **Estado atual.** Cada escola tem o seu ciclo, gerado e validado: o **Diaghilev**
> (Formação em Balé Clássico, **5 aulas** de 60 min em dois encontros semanais —
> terças e quintas, 19:00 —, de **06/10 a 20/10/2026, 3 semanas**, com aulas de
> **84–94 tempos** e **176 tempos/semana**). O que ainda depende do professor
> vem marcado `[Preencher]`; o que depende de conferência de edição/ano vem
> marcado `[conferir]`.

## O que a entrega contém

| Item | Onde | Observação |
|:--|:--|:--|
| **Markdown-fonte** | `professores/<professor>/ciclos/ciclo-XX-*.md` | o que o professor edita no VS Code |
| **Manifesto do ciclo** | `professores/<professor>/ciclos/ciclo-XX.conf` | nome, objetivo geral, **duração da aula**, período, faixa de volume e ordem dos documentos |
| **PDF único consolidado** | `professores/<professor>/ciclos/ciclo-XX/ciclo-XX.pdf` | capa, índice navegável, bookmarks, rodapé numerado (**52 páginas** no Diaghilev) |
| **PDF individual da aula** | `professores/<professor>/ciclos/ciclo-XX/aula-NN.pdf` | leitura da aula em prosa, com a mesma informação da página HTML |
| **Pacote HTML** | `professores/<professor>/ciclos/ciclo-XX/*.html` | **21 páginas** interligadas no Diaghilev, com barra de navegação fixa |
| **Folha de estilo única** | `professores/<professor>/ciclos/ciclo-XX/assets/style.css` | gerada de `tools/templates/ciclo.css` |
| **Mapas do rizoma** | `professores/<professor>/ciclos/ciclo-XX/assets/rizoma-*.svg` | copiados do projeto para o Apanhado Histórico |
| **README do pacote** | `professores/<professor>/ciclos/ciclo-XX/README.md` | gerado uma única vez; o professor pode editar depois |

## Pré-requisito 4 e Regra 9 verificados em código

A duração não é mais um campo decorativo: o gerador **recusa** construir a aula
quando ela falta ou quando o volume planejado não cabe na faixa da duração.

| Verificação | Onde vive | O que acontece se falhar |
|:--|:--|:--|
| `DURACAO` declarada no manifesto e em minutos | `tools/gerar-ciclo.sh` | geração interrompida com mensagem explicando o Pré-requisito 4 |
| Cada `aula-*.md` com `duracao:` no cabeçalho | idem | geração interrompida apontando o arquivo |
| `volume-total:` dentro de `VOLUME_MIN–VOLUME_MAX` | idem | geração interrompida apontando o volume e a faixa (Regra 9, etapa 1) |

No Ciclo 01: `DURACAO="60 min"` → faixa **80–100 tempos** → aula 01 declara
**90 tempos** ✓ — Solo 30 (33%), Barra 20 (22%), Centro 32 (36%), Musicalidade 8
(9%), todas as proporções dentro das faixas da Regra 9.

### Regra de aritmética de volume (aprendida aplicando a recalibração)

Duas incoerências apareceram no rascunho da Aula 01 e foram corrigidas no material
(o que mudou está documentado **dentro** da própria aula):

| Situação no rascunho | Problema | Correção |
|:--|:--|:--|
| 12 transferências × "1,5 tempo" = 18 tempos | **não existe 1,5 tempo em 4/4**; a mesma tabela descreve a frase em 4 tempos | 5 transferências × 4 tempos = 20 tempos |
| "Pré-requisitos: 48 tempos (dentro do bloco Solo)" | 48 tempos não cabem em um bloco de 30 | preparação **fora da conta** do volume ativo (Regra 4 separa as duas coisas) |

**Regra adotada:** o teto vem da duração, as frases são inteiras em 4/4 e a
preparação não consome o volume da aula. Se um exercício não fecha em tempos
inteiros, quem está errado é a conta — não o tempo musical.



## Comando único

```bash
tools/gerar-ciclo.sh fokini 01 diaghilev          # gera HTML + PDF da variante "diaghilev" e valida
tools/gerar-ciclo.sh <professor> 01 <escola>      # sempre com o professor explícito: os scripts
                                                  # ainda trazem `tiago` como default
node tools/check-pacote.js professores/fokini/ciclos/ciclo-01-diaghilev  # valida avulso, se quiser
```

O segundo argumento é a **escola** (Pré-requisito 5): sem ele o gerador recusa,
porque o ciclo não tem calendário nem volume semanal sem contexto institucional.
As variantes disponíveis ficam em `professores/<professor>/ciclos/ciclo-XX-<escola>.conf`.

O script, em ordem:

1. lê o manifesto **base** (`ciclo-XX.conf`) e a **variante** (`ciclo-XX-<escola>.conf`);
2. confere o Pré-requisito 5 (escola, frequência, dias e horários, duração por dia, total de aulas);
3. confere o Pré-requisito 4 e a Regra 9 **por duração de dia** (60 min → 80–100 tempos;
   120 min → 150–200);
4. **calcula o calendário real** (`tools/calendario.py`) e injeta no lugar do marcador
   `<!-- CALENDARIO -->` das fontes;
5. **normaliza os ids** de todos os títulos (`tools/normalizar-ids.py`);
6. converte cada documento em HTML com o template `tools/templates/ciclo.html`;
7. monta o **PDF individual de cada aula** e o **PDF consolidado** com pandoc + cabeçalho LaTeX próprio;
8. copia a folha de estilo e os mapas; escreve o `README.md` do pacote (se não existir);
9. roda a validação final e falha se algo estiver quebrado.

## Uma entrega por escola (Pré-requisito 5 / Regra 18)

**Cada escola tem o seu próprio ciclo** — objetivo, marcos, aulas e volumes
distintos. Duas escolas com o mesmo número de ciclo não são a mesma coisa:

| Ciclo | Escola | Frequência e duração | Calendário | Volume semanal |
|:--|:--|:--|:--|--:|
| `ciclo-01-diaghilev` | Diaghilev (Fokini) | 2x/semana (terças e quintas), 60 min | 06/10 → 20/10/2026 (3 semanas) | 176 tempos/semana |

> **17/09/2026 é uma quinta-feira** — não é dia de aula em nenhuma das escolas. O
> cálculo **não arredonda para a data informada**: ele avisa e usa o próximo dia de
> aula real. As avaliações (formativa e somativa) saem dessas datas.

O conteúdo de uma escola nunca é o de outra: o que a variante declara em
`ciclo-XX-<escola>.conf` e nos arquivos `ciclo-XX-<escola>-*.md` tem precedência
sobre os arquivos sem sufixo (`tools/lib-fontes.sh`).

Saídas: `professores/fokini/ciclos/ciclo-01-diaghilev/` (21 páginas HTML), com
`assets/`, `README.md` e o PDF do ciclo.


## Habilitar e desabilitar uma escola (`ESCOLA_HABILITADA`)

A variante pode declarar se a escola está **habilitada** a receber o ciclo:

```bash
# no ciclo-XX-<escola>.conf
ESCOLA_HABILITADA="sim"                 # habilitada (é também o que vale se o campo faltar)
ESCOLA_HABILITADA="nao"                 # desabilitada — e então o schema EXIGE os dois campos abaixo
ESCOLA_HABILITADA_MOTIVO="inadimplencia"   # POR QUE
ESCOLA_HABILITADA_DESDE="01/10/2026"       # DESDE QUANDO (dd/mm/aaaa)
```

**A flag é por ESCOLA, não por professor.** Desabilitar `ciclo-01-diaghilev` não toca
nas outras escolas do mesmo professor — é o que o painel da escola precisa para tratar
inadimplência, *churn* ou queda do sistema num vínculo sem derrubar os demais
([`IDEIA-PAINEL-ESCOLA.md`](IDEIA-PAINEL-ESCOLA.md)).

**Não é um booleano solto.** Quem declara `nao` assume o contrato do `allOf` do schema:
**por que** e **desde quando** passam a ser campos obrigatórios daquele `.conf`. Faltando
qualquer um, a validação recusa — e a recusa diz qual ramo exigiu o quê:

```
$ node tools/validar-schema-ciclo.js professores/fokini/ciclos/ciclo-01-schema.json \
      professores/fokini/ciclos/ciclo-01.conf professores/fokini/ciclos/ciclo-01-desabilitada.conf
faltam 2 campo(s) obrigatório(s):
  - ESCOLA_HABILITADA_MOTIVO
  - ESCOLA_HABILITADA_DESDE
  (ramo "then": exige ESCOLA_HABILITADA_MOTIVO, ESCOLA_HABILITADA_DESDE)
```

**O campo é opcional, e isso é deliberado.** A ausência vale como habilitada: nenhum ciclo
já ancorado precisa ser tocado, e o rito não reescreve o passado para acomodar capacidade
nova (P-04). Declarar `"sim"` é escolha de quem quer deixar o estado **conferido** no
arquivo, em vez de herdado da ausência.

**Reancorar já valida a flag.** `tools/hash-ciclo.sh` valida os `.conf` contra o schema
antes de calcular o hash, então

```bash
tools/hash-ciclo.sh fokini 01 diaghilev --check
```

já pega um `"nao"` sem motivo ou sem data — não é preciso rodar o validador à parte.

> **O que a flag ainda NÃO faz.** Ela é **declarada e validada**, não **imposta**: hoje um
> ciclo com `ESCOLA_HABILITADA="nao"` continua sendo gerado por `tools/gerar-ciclo.sh`. O
> **bloqueio da geração** é capacidade à parte, ainda não implementada. A flag existe para
> que o **painel** saiba o estado e o motivo, com a data.


## Ambiente: por que o engine é `pdflatex` (e não `xelatex`)

O comando sugerido na Regra 16 (`--pdf-engine=xelatex`) **não funciona nesta
máquina**, e isso foi verificado, não suposto:

| Engine | Situação | Consequência |
|:--|:--|:--|
| `xelatex` | **não instalado** | o comando da Regra 16 falha aqui |
| `lualatex` | **quebrado** — falta `lualatex-math.sty` e o `luaotfload` erra ao carregar as fontes OpenType do Latin Modern | também falha |
| `pdflatex` | **funciona** | é o engine usado; acentuação portuguesa sai correta com `babel-portuguese` |

Por isso o script usa `pdflatex` e **não** usa `fontspec` (o que impede trocar de
fonte por `-V mainfont=`). Para usar `xelatex`:

```bash
sudo apt install texlive-xetex texlive-latex-extra      # xelatex + pacotes
PDF_ENGINE=xelatex tools/gerar-ciclo.sh 01              # troca sem editar o script
```

Outra diferença em relação ao comando sugerido: o conteúdo **não** vem de um único
Markdown escrito à mão, mas da junção dos documentos do ciclo (cada um precedido de
`\clearpage`, para que cada documento comece em página nova).

## Regras de navegação implementadas

### No pacote HTML

| Regra 16 | Como está implementado |
|:--|:--|
| Barra de navegação fixa em todas as páginas | `<nav class="topnav">` gerado página a página, com a **página atual marcada** (`class="ativo"`), menu "Aulas" e atalho para o PDF |
| Índice interno da página | `<nav class="toc-local">` — índice da própria página (pandoc `--toc --toc-depth=3`); em tela **≥ 1200px** vai para uma **coluna à direita, presa abaixo da navbar** (`position: sticky`), que acompanha a rolagem; em tela estreita fica no topo, como antes |
| Links cruzados entre arquivos | escritos na fonte como `[notação](notacao.html#exemplo-didatico-um-tendu)`; o validador confere arquivo **e** âncora |
| Citação → referência completa | links como `[Referências](referencias.html#pedagogia-do-bale)`, apontando ao grupo certo da bibliografia |
| Botão "voltar ao topo" | `<a class="topo">` fixo no canto inferior direito |
| Rodapé com identificação | ciclo, período e professor + links para índice, plano, apoio, referências e PDF |

### No PDF

| Regra 16 | Como está implementado | Como foi verificado |
|:--|:--|:--|
| Índice navegável | `--toc --toc-depth=3 -V toc-title="Índice"`, em página própria | "Índice" presente nas primeiras páginas (`pdftotext`) |
| Referências cruzadas internas | links `arquivo.html#ancora` reescritos para `#ancora` com prefixo do documento | toda âncora usada tem título correspondente (checado no gerador) |
| Bookmarks na barra lateral | `hyperref` + `bookmark.sty` | presença de `/Outlines` nos streams inflados do PDF |
| Numeração e identificação no rodapé | `fancyhdr`, com o estilo `plain` redefinido para valer **também na capa** | checagem página a página: `p. N` e "Ciclo" em todas as páginas (52 no Diaghilev) |
| Cada documento em página nova | `\clearpage` antes de cada título | 52 páginas para 15 documentos + capa + índice (Diaghilev) |

## Âncoras: a armadilha que custou uma rodada

O pandoc **preserva acentos** ao gerar o id de um título
(`## Rubrica de avaliação final` → `id="rubrica-de-avaliação-final"`), enquanto os
links do texto são escritos em ASCII (`#rubrica-de-avaliacao-final`). Resultado:
links mortos — e silenciosos — nos dois formatos.

A solução é uma etapa única antes de gerar qualquer coisa: `tools/normalizar-ids.py`
dá ids ASCII explícitos a todos os títulos, e **os dois formatos usam o mesmo
arquivo normalizado** — então as âncoras coincidem por construção. No PDF, cada id
ainda recebe o prefixo do documento (`aula-01--exercicios`), porque "Exercícios"
aparece em toda aula e, sem o prefixo, o link da Aula 02 levaria à seção da Aula 01.

**Convenções ao escrever novos documentos:**

- Os ids vêm dos títulos: use títulos curtos e estáveis.
- De um arquivo para outro: `[texto](arquivo.html#id-do-titulo)`.
- Dentro do próprio arquivo: `[texto](#id-do-titulo)`.
- Id fixo fora do padrão: declare-o — `## Título {#meu-id}`.
- Onde faltar decisão pedagógica ou fonte, escreva `[Preencher: ...]`: o validador
  não reclama, mas o material fica marcado para não ser entregue assim.

## O que `tools/check-pacote.js` verifica

1. todos os arquivos obrigatórios existem, não estão vazios, e há ao menos uma aula;
2. toda página tem barra de navegação, índice interno, botão "voltar ao topo",
   rodapé, `lang="pt-BR"` e folha de estilo — e **exatamente um** link marcado como
   página atual;
3. todo link interno resolve: arquivo existe e âncora existe no arquivo alvo;
4. no PDF: bookmarks, links internos, número mínimo de páginas, rodapé numerado e
   com identificação do ciclo **em todas as páginas**, título "Índice", todos os
   documentos das páginas HTML presentes no texto e **nenhum texto passando da
   margem** (medida pelas coordenadas reais do PDF, com `pdftotext -bbox` — foi
   essa checagem que encontrou um cabeçalho de tabela 25 pt fora da margem).

Saída esperada hoje (Ciclo 01):

```
  ok    cifrada: acompanhamento-ana.html (21198 B, 4 marca(s) de cifra)
  ...   (os acompanhamentos por aluna saem cifrados — ver "Política de segurança")
  ok    páginas verificadas: 19
  ok    links internos verificados: 876
  ok    PDF: bookmarks (barra lateral do leitor) presentes
  ok    PDF: 305 links internos clicáveis
  ok    PDF: 49 páginas (mínimo esperado: 20)
  ok    PDF: rodapé com identificação do ciclo e número nas 49 páginas
  ok    PDF: nenhum texto passa da margem do texto (2 cm)
OK: 0 erro(s), 5 aviso(s).
```

## Símbolos que o LaTeX não traz (e como foram resolvidos)

O `pdflatex` falha com `Unicode character ... not set up for use with LaTeX` para
glifos fora do Latin-1. O ciclo usa cinco deles — `≠`, `✓`, `●`, `↺`, `⌒` — e todos
são mapeados no cabeçalho `tools/templates/ciclo-cabecalho.tex` com
`newunicodechar` + `amssymb`:

```latex
\newunicodechar{≠}{\ensuremath{\neq}}
\newunicodechar{✓}{\ensuremath{\checkmark}}
\newunicodechar{●}{\textbullet}
\newunicodechar{↺}{\ensuremath{\circlearrowleft}}
\newunicodechar{⌒}{\ensuremath{\frown}}
```

Para descobrir todos os caracteres de risco de um ciclo novo:

```bash
grep -oP '[^\x00-\x7F]' professores/<professor>/ciclos/ciclo-XX-*.md | sort -u
```


## Criar um ciclo novo

```bash
# 1) os manifestos: o base (compartilhado) e o da variante
cp professores/fokini/ciclos/ciclo-01.conf     professores/fokini/ciclos/ciclo-02.conf
cp professores/fokini/ciclos/ciclo-01-diaghilev.conf professores/fokini/ciclos/ciclo-02-diaghilev.conf

# 2) as fontes: com sufixo da escola quando o conteúdo é dela, sem sufixo quando é comum
cp professores/fokini/ciclos/ciclo-01-plano.md professores/fokini/ciclos/ciclo-02-plano.md
# escreva as demais com o prefixo ciclo-02- (index, aula-01, notacao, pre-requisitos,
# musicalidade, musicalidade-aluna, apanhado-historico, referencias). `guia-do-professor`
# não precisa de cópia: é compartilhado e vive na biblioteca (tools/lib-fontes.sh).

# 3) o caderno desta escola NÃO vive na pasta do ciclo, e é fonte do hash:
#    professores/fokini/cadernos/ciclo-02/caderno-02-diaghilev.md

# 4) declare o ciclo no DOCS dos DOIS manifestos — o da variante sobrescreve o base,
#    então declarar só no base não chega à escola. Ex.:
#    DOCS="plano harmonizacao aula-01 guia-de-observacao-01 captura-aula-01 caderno-02 ..."
#    O DOCS é TIPOS + ORDEM, não lista nominal: `aula-*` e `captura-aula-*` expandem para todo
#    NN que existir no disco (tools/lib-fontes.sh), na posição do primeiro membro declarado —
#    escrever `aula-01` cobre `aula-01..04`. Declare a família onde ela deve começar.
#    (o `guia-de-observacao-NN` é VISTA: o pacote o GERA do PO e do plano — não precisa de um
#     `.md` escrito à mão, e é o único documento de DOCS que funciona assim.)

# 5) gere e valide
tools/gerar-ciclo.sh fokini 02 diaghilev
node tools/check-pacote.js professores/fokini/ciclos/ciclo-02-diaghilev
```

Cada documento começa com um bloco YAML que alimenta o cabeçalho e a ficha da
página (`projeto`, `frente`, `ciclo`, `aula`, `data`, `objetivo-especifico`,
`referencias`), conforme a Premissa 6 — o `title:` é o que aparece na navegação.

## Estrutura do repositório e versionamento (Regra 17)

O projeto é um repositório único com as duas frentes. Os **pacotes de ciclo são
versionados** (o deploy automático lê o repositório); as demais saídas geradas
ficam fora do Git, porque são reconstruíveis das fontes por `tools/` (P-04):

```
apresentacoes/apresentacao-01-rizoma/   frente Apresentação (deck + mapas)
professores/<professor>/ciclos/         frente Aula (fontes + pacote gerado)
biblioteca/                             referências compartilhadas pelas duas frentes
tools/                                  geradores, validadores e hooks
REGRAS.md · README.md · README-ciclos.md
```

| Convenção | Como está |
|:--|:--|
| **Commit** | `tipo(escopo): resumo` + rodapé obrigatório `Refs:` · `Regras:` · `Auditoria:` |
| **Tipos** | `feat` · `fix` · `docs` · `refactor` · `style` · `chore` · `audit` |
| **Escopos** | `ciclo-NN` · `aula-NN` · `apresentacao-NN` · `apresentacao-01-rizoma` · `caderno` · `caderno-NN` · `relatorio` · `relatorio-NN` · `notacao` · `pre-requisitos` · `musicalidade` · `apanhado` · `biblioteca` · `po` · `campo` · `schema` · `registro` · `protocolo` · `metodo` · `ideia` · `experimentos` · `entrega` · `estrutura` · `template` · `tools` · `regras` · `prompts` — a lista é a do hook (`tools/hooks/commit-msg`); escopo fora dela **recusa o commit** |
| **Branches** | `main` só recebe conteúdo auditado; `ciclo-XX` e `apresentacao-XX` são linhas de trabalho, mergeadas após auditoria |
| **Hooks** | `tools/instalar-hooks.sh` instala `pre-commit` e `commit-msg` (a fonte versionada fica em `tools/hooks/`, porque o Git não versiona `.git/hooks`) |
| **Ignorado** | `out/`, `.pptx`, PNGs de slide da apresentação, `.vscode/settings.json`. Os **pacotes de ciclo são versionados** (HTML, PDF e `assets/`), porque o deploy automático lê o repositório |

O que o `pre-commit` faz, na prática:

1. **barra saída gerada no stage** (defesa extra contra `.gitignore` furado);
2. para cada ciclo tocado, **roda o gerador e o validador** — se o volume sair da
   faixa da duração, o commit é recusado com a mensagem da Regra 9;
3. se a apresentação foi tocada, roda `check-overflow.js` e `check-mapa.js`.

Os hooks foram testados com casos que **devem** ser recusados:

```
mensagem fora do padrão ..................... recusada ✓
mensagem sem rodapé de proveniência ......... recusada ✓
PDF gerado no stage ......................... recusada ✓
ciclo com volume fora da faixa (140 tempos) . recusada ✓ (Regra 9)
```

## Arquivos desta entrega

| Arquivo | Papel |
|:--|:--|
| `tools/gerar-ciclo.sh` | gerador do pacote (HTML + PDF + README + validação) |
| `tools/normalizar-ids.py` | ids ASCII explícitos para todos os títulos |
| `tools/check-pacote.js` | validador da entrega (links, navegação, PDF) |
| `tools/templates/ciclo.html` | template HTML do pandoc (ficha, índice, rodapé) |
| `tools/templates/ciclo.css` | folha de estilo única do pacote |
| `tools/templates/ciclo-cabecalho.tex` | rodapé numerado e índice em página nova |

> As ferramentas do material do rizoma (`gerar-animacao.js`, `check-mapa.js`,
> `medir-rotulos.js`, `sincronizar-slide.js`) são do **deck** e estão descritas no
> `README.md` da raiz.
