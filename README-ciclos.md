# Ciclos de Aprendizagem — formato de entrega (Regra 16)

Este documento descreve como o material de um ciclo é **gerado e entregue** neste
repositório: os arquivos-fonte, os dois formatos obrigatórios (PDF único e pacote
HTML), as regras de navegação e como validar tudo antes de entregar ao professor.

> **Estado atual.** Cada escola tem o seu ciclo, gerado e validado: o **Duo**
> (Fundamentos do Balé Clássico, 12 aulas de 60 min, com Aula 01 de 90 tempos em
> solo/barra/centro) e a **Ritmos e Movimento** (pas de deux, 20 encontros de 60 e
> 120 min, com Aula 01 de 90 tempos e 180 no dia longo). O que ainda depende do
> professor vem marcado `[Preencher]`; o que depende de conferência de edição/ano
> vem marcado `[conferir]`.

## O que a entrega contém

| Item | Onde | Observação |
|:--|:--|:--|
| **Markdown-fonte** | `professores/<professor>/ciclos/ciclo-XX-*.md` | o que o professor edita no VS Code |
| **Manifesto do ciclo** | `professores/<professor>/ciclos/ciclo-XX.conf` | nome, objetivo geral, **duração da aula**, período, faixa de volume e ordem dos documentos |
| **PDF único consolidado** | `professores/<professor>/ciclos/ciclo-XX/ciclo-XX.pdf` | capa, índice navegável, bookmarks, rodapé numerado (23 páginas no ciclo 01) |
| **Pacote HTML** | `professores/<professor>/ciclos/ciclo-XX/*.html` | 8 páginas interligadas, com barra de navegação fixa |
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
tools/gerar-ciclo.sh tiago 01 duo                 # gera HTML + PDF da variante "duo" e valida
tools/gerar-ciclo.sh 01 duo                       # o mesmo: sem professor, assume tiago
node tools/check-pacote.js professores/tiago/ciclos/ciclo-01-duo  # valida avulso, se quiser
```

O segundo argumento é a **escola** (Pré-requisito 5): sem ele o gerador recusa,
porque o ciclo não tem calendário nem volume semanal sem contexto institucional.
As variantes disponíveis ficam em `professores/<professor>/ciclos/ciclo-XX-<escola>.conf`.

O script, em ordem:

1. lê o manifesto **base** (`ciclo-XX.conf`) e a **variante** (`ciclo-XX-<escola>.conf`);
2. confere o Pré-requisito 5 (escola, frequência, dias, duração por dia, total de aulas);
3. confere o Pré-requisito 4 e a Regra 9 **por duração de dia** (60 min → 80–100 tempos;
   120 min → 150–200);
4. **calcula o calendário real** (`tools/calendario.py`) e injeta no lugar do marcador
   `<!-- CALENDARIO -->` das fontes;
5. **normaliza os ids** de todos os títulos (`tools/normalizar-ids.py`);
6. converte cada documento em HTML com o template `tools/templates/ciclo.html`;
7. monta o **PDF consolidado** com pandoc + cabeçalho LaTeX próprio;
8. copia a folha de estilo e os mapas; escreve o `README.md` do pacote (se não existir);
9. roda a validação final e falha se algo estiver quebrado.

## Uma entrega por escola (Pré-requisito 5 / Regra 18)

**Cada escola tem o seu próprio ciclo** — objetivo, marcos, aulas e volumes
distintos. Duas escolas com o mesmo número de ciclo não são a mesma coisa:

| Ciclo | Escola | Frequência e duração | Calendário | Volume semanal |
|:--|:--|:--|:--|--:|
| `ciclo-01-duo` | Duo (Fernando) | 1x/semana (sextas), 60 min | 18/09 → 04/12/2026 (12 semanas) | 90 tempos |
| `ciclo-01-ritmos` | Ritmos e Movimento (Gabi) | 2x/semana (terças e sábados), 60 min + 120 min | 19/09 → 24/11/2026 (10 semanas) | 90 + 180 = 270 tempos |

> **17/09/2026 é uma quinta-feira** — não é dia de aula em nenhuma das escolas. O
> cálculo **não arredonda para a data informada**: ele avisa e usa o próximo dia de
> aula real. As avaliações (formativa e somativa) saem dessas datas.

**O ciclo da Débora (Marau) ainda não existe.** Houve cópias do ciclo da Duo nos
nomes das outras escolas; elas foram removidas em 18/09/2026 (ver `REGISTRO.md`).
O conteúdo de uma escola nunca é o de outra: o que a variante declara em
`ciclo-XX-<escola>.conf` e nos arquivos `ciclo-XX-<escola>-*.md` tem precedência
sobre os arquivos sem sufixo (`tools/lib-fontes.sh`).

Saídas: `professores/tiago/ciclos/ciclo-01-duo/` (13 páginas HTML) e
`professores/tiago/ciclos/ciclo-01-ritmos/` (4 páginas HTML), cada uma com
`assets/`, `README.md` e o PDF do ciclo.


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
| Índice interno no topo | `<nav class="toc-local">` — índice da própria página (pandoc `--toc --toc-depth=3`) |
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
| Numeração e identificação no rodapé | `fancyhdr`, com o estilo `plain` redefinido para valer **também na capa** | checagem página a página: `p. N` e "Ciclo" em todas as 17 páginas |
| Cada documento em página nova | `\clearpage` antes de cada título | 17 páginas para 9 documentos + capa + índice |

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
  ok    páginas verificadas: 8
  ok    links internos verificados: 276
  ok    PDF: bookmarks (barra lateral do leitor) presentes
  ok    PDF: 109 links internos clicáveis
  ok    PDF: 23 páginas (mínimo esperado: 9)
  ok    PDF: rodapé com identificação do ciclo e número nas 23 páginas
  ok    PDF: nenhum texto passa da margem do texto (2 cm)
OK: 0 erro(s), 0 aviso(s).
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
cp professores/tiago/ciclos/ciclo-01.conf ciclos/ciclo-02.conf       # ajuste nome, objetivo, período, DOCS
cp professores/tiago/ciclos/ciclo-01-plano.md ciclos/ciclo-02-plano.md
# escreva os demais com o prefixo ciclo-02- (index, aula-01, notacao,
# pre-requisitos, musicalidade, apanhado-historico, referencias)
tools/gerar-ciclo.sh 02
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
| **Escopos** | `ciclo-XX` · `aula-XX` · `notacao` · `pre-requisitos` · `musicalidade` · `apanhado` · `apresentacao-XX` · `biblioteca` · `tools` · `regras` |
| **Branches** | `main` só recebe conteúdo auditado; `ciclo-XX` e `apresentacao-XX` são linhas de trabalho, mergeadas após auditoria |
| **Hooks** | `tools/instalar-hooks.sh` instala `pre-commit` e `commit-msg` (a fonte versionada fica em `tools/hooks/`, porque o Git não versiona `.git/hooks`) |
| **Ignorado** | `out/`, `.pptx`, PNGs de slide da apresentação, `tools/.netlify-tokens`, `.vscode/settings.json`. Os **pacotes de ciclo são versionados** (HTML, PDF e `assets/`), porque o deploy automático lê o repositório |

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

