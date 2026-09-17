# O Repertório Vivo — Apresentação (Marp)

Apresentação para **professoras de ballet de escola de dança** (turmas de 7 a 12 anos) sobre
história da dança, pedagogia e ética na formação em balé clássico.

- **Formato:** Markdown com sintaxe [Marp](https://marp.app/) (`marp: true` no frontmatter)
- **Apresentação:** Tiago Menegaz — Studio Ritmo e Movimentos (Passo Fundo, RS) — 3 de outubro de 2026
- **Estrutura:** 72 slides, separados por `---`
  - Slides 1–35: Parte A — Uma breve história da dança: de corte à arte cênica
    (glossário conceitual, história, curiosidades Tchaikovsky/Petipa, Marquês de Cuevas,
    Hugo Delavalle, **Vaslav Veltchek, Yellê Bittencourt e Ady Addor**, Ana Botafogo,
    **o rizoma brasileiro** — Yanka Rudzka, Rolf Gelewski, Maria Olenewa, Maria Pia Finócchio,
    o Balé da Cidade de SP e **Alphonse Poulin** — até a metáfora do rizoma, a **duração de
    Bergson** e o fechamento "de aluno a professor")
  - Slides 36–47: Parte B — Desafios da prática pedagógica contemporânea
    (agenciamento, aula-playlist, progressão, exemplos de exercícios, ética e imagem)
  - Slides 48–65: Parte C — Grandes balés de repertório e suas releituras
    (contexto dos criadores → evolução e linha do tempo do Quebra-Nozes → **crítica da época**
    → Romeu e Julieta (contexto, semiótica, **crítica**) → destilação do conhecimento →
    o perigo de copiar a "casca" → Giselle (contexto, análise, **crítica**) → fechamento)
  - Slides 66–67: Referências bibliográficas (1/2 e 2/2)
  - **Slide 68: o mapa do rizoma** (mapa de projeção + botões para a versão animada e o mapa completo) —
    o mapa visível no deck é `rizoma-slide.svg`; as versões completas estão em `rizoma-animado.html`
    e `rizoma-corrigido.svg`
  - **Slides 69–71: os tipos de conhecimento e a tese** — "Os Tipos de Conhecimento no Rizoma"
    (arquivo / repertório / interpretação), "Por Que o Repertório é Mais Rico que o Arquivo" e
    "O Repertório é o Que Torna o Processo Rico"
  - Slide 72: Agradecimento
- **Notas do apresentador:** comentários `<!-- _notes: ... -->` em cada slide (não aparecem no
  slide; saem no modo apresentador e na exportação de notas).

## Regras pétreas (não negociáveis)

Válidas para **todos os slides** e para qualquer edição futura.

### A. Linguagem e conceito

1. **Agenciamento (Deleuze & Guattari) nunca em sentido mecânico.** Nada de robô, linha de montagem,
   fábrica, trilho, trem, computador, algoritmo ou IA como metáfora positiva. O agenciamento é uma
   configuração real e viva de forças heterogêneas — o encontro entre o corpo da aluna e a música,
   o espaço, a barra, o espelho, a professora, o syllabus. Ele **potencializa**, não robotiza;
   **singulariza**, não padroniza.
2. **Sem a palavra "culpa".** Ela pertence a uma tradição moral que não é a desta apresentação.
   Usar: "tomar as decisões certas", "responsabilidade", "prevenção".
3. **Contexto histórico obrigatório.** Todo balé de repertório precisa ser situado na sua época:
   o balé não é objeto estático; cada versão reflete um contexto político, social e artístico.
4. **Semiótica dos gestos.** Ao analisar uma versão, dizer **o que o gesto significa ali**
   (a promenade de Nureyev × a mesma cena em Peter Wright × a leitura de Baryshnikov).
5. **Não copiar a "casca".** Alertar contra juntar fragmentos de versões diferentes sem entender
   **por que** cada coreógrafo fez suas escolhas — o que falta é o conhecimento de destilação.

### B. Construção de slides

1. **Contexto antes de análise.** Nenhum balé é analisado antes de ser contextualizado — quem criou,
   quando, por quê, sob qual regime; depois a recepção; só então a análise coreográfica.
   (Giselle: contexto em 49–50 → análise em 51 → crítica em 52. Nunca o inverso.)
2. **Zero redundância entre slides.** Se dois slides dizem o mesmo, um é eliminado e o conteúdo
   essencial é incorporado ao que permanece — o slide redundante é **removido**, não reescrito, e a
   numeração posterior se ajusta. (Ex.: o antigo "Contexto Soviético" foi absorvido por 42–43.)
3. **Crítica da época é obrigatória.** Cada balé de repertório tem ao menos um slide com a recepção
   crítica **datada** (veículo + ano); havendo várias versões, a crítica cobre as principais:
   Quebra-Nozes (41), Romeu e Julieta (45), Giselle (52).
4. **Coerência de progressão.** A ordem narrativa é fixa: história geral → contexto local →
   conceitos pedagógicos → contexto dos criadores → crítica da época → análise coreográfica →
   ética e fechamento.
5. **Tom e vocabulário.** Sem alarmismo e sem julgamento moral: "culpa" proibida; "agenciamento"
   vigiada; preferir "decisão", "responsabilidade", "prevenção".
6. **Validação técnica antes de exportar.** `node tools/check-overflow.js` sempre; se mexeu em mapa,
   também `tools/check-mapa.js` e `tools/medir-rotulos.js`; reexportar PDF/PPTX/HTML a cada edição;
   conferir os slides novos no preview do Marp.

Onde cada regra aparece no deck: **A1** → 5, 36–37, 47 · **A2** → 45–46 · **A3 e A4** → 48–64 ·
**A5** → 58–60 · **B1** → 48–64 · **B2** → bloco de Romeu (54–57) · **B3** → 53, 57, 64 ·
**B4** → 1–72 · **B5** → todo o deck · **B6** → scripts em `tools/` (`check-overflow.js`,
`check-mapa.js`, `medir-rotulos.js`, `gerar-animacao.js`, `sincronizar-slide.js`).

## Arquivos

| Arquivo | Descrição |
|---|---|
| `apresentacao-ballet.md` | Fonte da apresentação (Markdown + Marp), 72 slides |
| `rizoma-animado.html` | Mapa **animado** (autônomo e offline; desenha as três linhagens em ~8 s; teclas `P`/`R`). **Gerado** — não editar à mão: `node tools/gerar-animacao.js` |
| `rizoma-slide.svg` | Mapa **para projeção** (fontes grandes) — é o que aparece no slide 68 e, portanto, no PDF/PPTX. **Fonte da verdade** do mapa do slide: `node tools/sincronizar-slide.js` injeta-o no deck |
| `rizoma-corrigido.svg` | Mapa **completo** (todos os nós, hierarquia por tamanho de fonte) — abre em tela cheia pelo botão |
| `slides/rizoma-mapa-inline.md` | **Documentação do fluxo do mapa** (o backup manual virou nota de processo: o mapa do slide é gerado por `tools/sincronizar-slide.js`) |
| `.vscode/settings.json` | Ajustes do workspace (HTML habilitado, preview do Marp) |
| `README-ciclos.md` | **Formato de entrega dos Ciclos de Aprendizagem (Regra 16)**: gerador, pacote HTML interligado e PDF único consolidado |
| `tools/check-overflow.js` | Valida se nenhum slide estourou a área útil (limite calculado por slide) |
| `tools/check-mapa.js` | Valida a geometria dos mapas: colisões entre caixas, arestas soltas no vazio, nós órfãos |
| `tools/medir-rotulos.js` | Abre o SVG no Chrome e mede **de verdade** se algum rótulo passa da própria caixa |
| `tools/gerar-animacao.js` | Gera `rizoma-animado.html` a partir de `rizoma-corrigido.svg` |
| `tools/sincronizar-slide.js` | Injeta `rizoma-slide.svg` no slide 68 do deck (entre os marcadores `MAPA:INICIO`/`MAPA:FIM`) |

## Ambiente verificado neste workspace

| Item | Versão / status |
|---|---|
| Node.js | v20.9.0 |
| npm | 10.1.0 |
| VS Code | 1.134.0 |
| Extensão Marp for VS Code | `marp-team.marp-vscode` — instalada |
| Chrome (necessário para PDF) | `/usr/bin/google-chrome` |

## Visualizar no VS Code

1. Abra `apresentacao-ballet.md`.
2. Pressione `Ctrl+Shift+V` (preview). O frontmatter `marp: true` já ativa o modo Marp.
3. Se o preview não abrir em modo Marp: `Ctrl+Shift+P` →
   **Marp: Toggle Marp Feature for Current Markdown**.
4. Para apresentar/exportar: `Ctrl+Shift+P` →
   - **Marp: Open Preview to the Side** (acompanhar em tempo real), ou
   - **Marp: Export Slide Deck…** (PDF, PPTX, HTML, PNG).

## Exportar pela linha de comando (Marp CLI)

> **Onde rodar:** os comandos `marp` desta seção rodam **dentro desta pasta**
> (`apresentacoes/apresentacao-01-rizoma/`); os comandos `node tools/...` rodam na
> **raiz do repositório**. Os validadores resolvem o caminho da apresentação
> sozinhos (e aceitam `APRESENTACAO=/outro/caminho`).

```bash
npm install -g @marp-team/marp-cli

# HTML (arquivo único; o mapa aparece e o link do slide 68 funciona)
marp apresentacao-ballet.md --html --allow-local-files -o out/apresentacao-ballet.html

# PDF (usa o Chrome do sistema; evita depender do download do Puppeteer)
CHROME_PATH=/usr/bin/google-chrome marp apresentacao-ballet.md \
  --pdf --html --allow-local-files -o out/apresentacao-ballet.pdf

# PPTX (as notas do apresentador já vão embutidas, uma por slide)
marp apresentacao-ballet.md --pptx --html --allow-local-files -o out/apresentacao-ballet.pptx

# Extrair as notas do apresentador para um arquivo de texto
marp apresentacao-ballet.md --notes -o out/notas-do-apresentador.txt

# PDF com as notas anotadas e marcadores (bom para imprimir o script)
CHROME_PATH=/usr/bin/google-chrome marp apresentacao-ballet.md \
  --pdf --pdf-notes --pdf-outlines --html --allow-local-files -o out/apresentacao-com-notas.pdf

# Pré-visualização em PNG (uma por slide), renderizada pelo Chrome:
CHROME_PATH=/usr/bin/google-chrome marp apresentacao-ballet.md \
  --images png --html --allow-local-files -o out/img/slide.png
# (gera out/img/slide.001.png … slide.072.png; neste projeto eles estão renomeados
#  para o padrão slide-01.png … slide-72.png)
```

> ### ⚠️ Duas flags que não podem faltar
>
> **`--html`** — nesta versão do Marp CLI ela **habilita as tags HTML do Markdown** (o *formato*
> HTML de saída é decidido pela extensão do arquivo, não pela flag). Sem ela, **PDF e PPTX escapam
> todo o HTML do deck**: o mapa do slide 68 aparece como **código-fonte** e os botões como texto.
> Foi exatamente esse o defeito que encontramos e corrigimos — o HTML exportado sempre esteve certo,
> só o PDF/PPTX estava errado. **Use `--html` em todas as exportações.**
>
> **`--allow-local-files`** — necessária quando o Markdown referencia arquivos locais
> (é o caso do link do slide 68). Sem ela, o Marp bloqueia o arquivo por segurança.
>
> **Sobre a pré-visualização em PNG:** prefira `--images png` (Chrome). O `pdftoppm` do poppler
> **não consegue renderizar as últimas páginas** deste PDF (erros de *hex string* no subconjunto de
> fontes do SVG) e gera imagens em branco para os slides 68 e 69.

> Observação: no marp-cli v4.5.1 a opção `--notes` não pode ser combinada com `--pptx`
> (`marp --pptx` já embute as notas automaticamente). As opções `--pdf`, `--pptx` e `--images`
> exigem um navegador — por isso `CHROME_PATH=/usr/bin/google-chrome`.

## Saídas geradas em `out/`

| Arquivo | Descrição |
|---|---|
| `out/apresentacao-ballet.html` | Deck auto-contido (abre em qualquer navegador; os botões do slide 68 funcionam) |
| `out/apresentacao-ballet.pdf` | PDF 16:9 com 72 páginas |
| `out/apresentacao-com-notas.pdf` | Mesmo PDF, com as notas do apresentador como anotações e marcadores |
| `out/apresentacao-ballet.pptx` | PowerPoint com 72 slides e as notas do apresentador embutidas |
| `out/notas-do-apresentador.txt` | Notas extraídas slide a slide |
| `out/img/slide-01.png` … `slide-72.png` | Pré-visualização de cada slide em PNG (renderizada pelo Chrome) |
| `out/rizoma-animado.html`, `out/rizoma-slide.svg`, `out/rizoma-corrigido.svg` | Cópias dos ativos do mapa, para a imagem e os links do slide 68 resolverem a partir de `out/` |

> Nota sobre as notas: o Marp importa o comentário `<!-- _notes: ... -->` **literalmente**, então o
> texto exportado começa com o prefixo `_notes:`. Isso funciona como marcador visual no arquivo
> fonte; se preferir as notas limpas nos arquivos exportados, rode uma vez:
> `sed -i 's/<!-- _notes: /<!-- /g' apresentacao-ballet.md`

## Apresentar ao vivo — o mapa no slide 68

O slide **68** é o único a mostrar o mapa dentro do deck: ele traz `rizoma-slide.svg` (variante com
fontes grandes, feita para projeção) e dois botões para as versões completas.

| Situação | O que fazer |
|---|---|
| Apresentando pelo **PDF/PPTX** | O mapa aparece no slide 68 ✓. Os botões não abrem arquivos — abra `out/rizoma-animado.html` **antes** de começar e alterne (Alt+Tab) quando chegar lá |
| Apresentando pelo **HTML** (`out/apresentacao-ballet.html`) | Os botões funcionam, porque os ativos estão copiados em `out/` |
| A animação falhar ou o navegador bloquear animações | Abra `rizoma-corrigido.svg` (mapa completo) ou use o próprio mapa do slide |
| Nada abrir | Narre o mapa — as três linhagens estão na nota do slide 68 |

**Recomendação prática:** abra `out/rizoma-animado.html` em uma aba do navegador antes da
apresentação e apenas alterne de aba no momento do mapa.

### Controles da animação (canto inferior direito)

| Controle | Ação |
|---|---|
| **⏸ Pausar / ▶ Continuar** (botão) | Congela a animação no meio e retoma **de onde parou** (não reinicia) |
| Tecla **P** (ou **Espaço**) | O mesmo que o botão |
| **⟲ Reiniciar** (botão) ou tecla **R** | Volta ao zero e roda de novo |
| **Mapa completo** (botão) | Abre `rizoma-corrigido.svg` em tela cheia |

> **Sobre a barra de espaço:** ela funciona **nesta página** (não há navegação de slides aqui).
> Se algum dia você portar a animação para dentro do HTML exportado do Marp, **use só P e R** —
> lá a barra de espaço pertence ao Bespoke.js e avançaria o slide.

A animação foi testada headless, com verificação de todos os comportamentos (26 caixas + você +
legenda = 28 elementos animados; 33 arestas): a pausa **não** reinicia (5/28 → 5/28 após 2,6 s),
a retomada **avança** (5 → 12), o **R** volta ao zero (0/28) e a animação roda de novo; o **R
durante uma pausa** também volta a rodar (caso em que um reinício ingênuo deixaria a tela
congelada); e a rede de segurança (que revela o mapa inteiro se as animações estiverem bloqueadas)
**não dispara** enquanto está pausado.

> Os caminhos do slide 68 são relativos (`rizoma-slide.svg`, `rizoma-animado.html`,
> `rizoma-corrigido.svg`). Se mover o HTML exportado para outra pasta, copie os três ativos junto.
>
> **O mapa do slide é gerado, não copiado à mão:** `rizoma-slide.svg` é a fonte da verdade e
> `node tools/sincronizar-slide.js` injeta-o no deck (entre os marcadores `MAPA:INICIO`/`MAPA:FIM`).
> O antigo backup manual `slides/rizoma-mapa-inline.md` ficou apenas como documentação do fluxo.

## Linhagem do mapa (corrigida)

O mapa respeita as **três linhagens** reais que chegam até você — mais o ramo de São Paulo:

| Linhagem | Caminho |
|---|---|
| **Clássica (escola russa)** | Weaver 1717 → Noverre 1760 → **Didelot** (a ponte para a escola russa) → **Petipa** → **Ivanov** (O Quebra-Nozes, 1892) → **Maria Olenewa** (Rio, 1927) → **Vaslav Veltchek** (1939) → **Yellê Bittencourt**; e Olenewa → **Ady Addor** (solista do ABT em 1957) |
| **Europeia do séc. XX** | Petipa → **Fokine**/Ballets Russes (1909) → Balanchine (NYCB, 1948) e **Marquês de Cuevas** (Paris, 1940-60) → **Hugo Delavalle** (BTG · Passo Fundo) |
| **Moderna alemã** (linhagem paralela, não deriva de Noverre) | **Mary Wigman** → **Yanka Rudzka** (Bahia, 1952) → **Rolf Gelewski** (Bahia, 1960) |
| **Ramo de São Paulo** | **Escola Municipal de Bailados** (SP, 1940 — herdeira da tradição russa) → **Maria Pia** → **Balé da Cidade SP** (1968) → **Alphonse Poulin** (1974-77), **Yellê** e **Ady Addor** |
| **Intérpretes / a escola continuada** (ramos que não passam por você) | Fokine → **Nureyev** (acolhido por Cuevas) e → **Baryshnikov** (ABT); Petipa → **Osipova** (Academia Bolshoi); Veltchek → **Marcia Haydée** (formada no Rio, estrela e diretora do Stuttgart Ballet) |

### Os três tipos de linha do mapa (espelham os slides 69–71)

| Traço | Significado | Exemplos no mapa |
|---|---|---|
| **Sólida** | **Formação** — transmissão corpo a corpo | Petipa → **Ivanov**; Petipa → Maria Olenewa; Veltchek → Yellê; **Veltchek → Marcia Haydée**; Wigman → Yanka; Balé da Cidade → Yellê / Poulin / **Ady Addor** |
| **Tracejada** (`7 5`) | **Influência institucional** — transmissão indireta | Noverre → Bournonville / Cecchetti / Petipa; **Noverre → Didelot → Petipa** (a reforma desembocando na escola russa); **Ivanov → Fokine** (inspirou a geração seguinte); **Petipa → Osipova** (Academia Bolshoi); **Maria Olenewa → Escola Municipal de Bailados** (a tradição russa chegando a São Paulo); Fokine → Cuevas (**herdeiro direto** dos Ballets Russes) |
| **Pontilhada** (`2 4`) | **Interpretação** — coexistência com a obra, não com o criador | Fokine → **Nureyev**; Fokine → **Baryshnikov** |

> Correções aplicadas nesta rodada: as **três setas do Balé da Cidade** terminavam todas no mesmo
> ponto (a Ady Addor ficava sem conexão) — agora são três setas distintas (**Yellê**, **Poulin**,
> **Ady Addor**); foi acrescentado o nó **Nureyev** (acolhido por Cuevas e intérprete de Fokine),
> que dá à linha pontilhada um exemplo real; as linhas ganharam os três estilos acima; e a
> **Maria Pia deixou de ser órfã** — entrou o nó **Escola Municipal de Bailados (SP, 1940)**, ligado
> à tradição russa por uma **linha tracejada** (influência institucional, não transmissão direta
> documentada) e a ela por uma linha sólida.
>
> Segunda rodada (mapa completo com **26 caixas de nó e 33 arestas**; a animação desenha
> **28 elementos** — as 26 caixas, o ponto "você" e a legenda): entraram **Didelot** e **Ivanov**
> (a ponte séc. XVIII → escola russa: Didelot por influência tracejada, Ivanov por formação
> sólida a partir de Petipa), **Baryshnikov** (interpretação pontilhada de Fokine, como Nureyev),
> **Osipova** (a escola russa continuada hoje — ligada a Petipa por **linha tracejada**, pois o
> elo é a Academia Bolshoi, não um encontro pessoal) e **Marcia Haydée** (formada no Rio por
> **Veltchek**, linha sólida; estrela e diretora do Stuttgart Ballet). Nenhum desses nomes caberia
> no mapa de projeção sem virar letra miúda — por isso vivem no mapa completo, que agora traz a
> **legenda dos três traços** na base. Também se corrigiu um defeito real de projeção: o rótulo
> "Escola Mun. de Bailados" estava **29 px mais largo que a caixa** no slide 68 (medido no Chrome);
> a caixa foi alargada para 200 px e o rótulo reduzido para 17 px.
>
> **Sobre a grafia do Marquês de Cuevas:** a formulação usada é **"herdeiro direto dos Ballets
> Russes"** — nunca "último herdeiro" (o "último" é uma afirmação forte demais para o que as fontes
> sustentam). Não há nenhuma ocorrência de "último herdeiro" nos arquivos do projeto.

Correções aplicadas em relação ao mapa anterior:

| Nó | Antes (errado) | Agora (correto) |
|---|---|---|
| Maria Olenewa | vinha de Noverre | vem da **escola russa (Petipa)** — formada na Academia Nelidowa, em Moscou; solista de Anna Pavlova |
| Yanka Rudzka | vinha de Noverre | vem da **dança moderna alemã (Mary Wigman)** — linhagem paralela ao balé clássico |
| Alphonse Poulin | vinha de Yanka | vem do **Balé da Cidade SP** / Escola Municipal de Bailados (tradição americana: Boston Ballet) |
| Vaslav Veltchek | não aparecia | **Maria Olenewa → Veltchek** (temporada no Theatro Municipal do Rio) |
| Yellê Bittencourt | não aparecia | **Veltchek → Yellê** + **Balé da Cidade → Yellê** |
| Ady Addor | não aparecia | **Maria Olenewa → Ady** + **Balé da Cidade → Ady** |

## Validar que nenhum slide estoura

Marp **não** redimensiona texto automaticamente: se o conteúdo passar da área útil, ele é cortado.
O limite é calculado **por slide** (720 − padding-bottom da classe daquele slide): slides comuns
param em `y = 654`; o slide do mapa (classe `map`) vai até `y = 708`. Depois de editar o texto, rode:

```bash
marp apresentacao-ballet.md --html -o out/apresentacao-ballet.html
node tools/check-overflow.js
node tools/check-mapa.js rizoma-corrigido.svg
node tools/check-mapa.js rizoma-slide.svg
node tools/medir-rotulos.js rizoma-corrigido.svg rizoma-slide.svg
```

Se editar um mapa, a ordem é: **1)** editar o SVG → **2)** `node tools/gerar-animacao.js`
(se for o mapa completo) e/ou `node tools/sincronizar-slide.js` (se for o do slide) → **3)** os três
validadores acima → **4)** reexportar.

A saída lista a sobra de cada slide e marca com `<== ESTOURA` os que precisam de ajuste.
Para corrigir, acrescente (ou troque) a classe na diretiva do slide:

| Classe | Fonte | Uso atual |
|---|---|---|
| `mid` | 23 px | 10 slides com mais texto: Curiosidades (12), Exemplos (30–31), Contexto e Evolução do Quebra-Nozes (36–39) e os três slides da tese (69–71) |
| `table-xl` | 1,12 em na tabela | tabelas de 3 colunas, células curtas (Progressão 1/2 e 2/2, slides 28–29) |
| `table-lg` | 0,80 em na tabela | tabela de 4 colunas com texto longo (Linha do Tempo do Quebra-Nozes, slide 40 — 8 linhas) |
| `lead` | — | capa (slide 1) e agradecimento (slide 72) |
| `map` | — | slide 68 (hub do mapa): padding 10/14/12 px, sem header/footer; a paginação continua visível |
| `dense` / `denser` / `refs` | 19,5 / 16,8 / 16,5 px | reservas na CSS — **não usadas** (todo o restante do deck está em 26 px) |

```markdown
<!-- _class: denser -->

## Título do Slide
```

## Ciclos de Aprendizagem (Regra 16)

Além do deck, o repositório gera o **material de aula em ciclos**, no formato de
entrega da Regra 16 — PDF único consolidado + pacote HTML interligado:

```bash
tools/gerar-ciclo.sh 01                       # HTML + PDF + validação, de uma vez
node tools/check-pacote.js ciclos/ciclo-01    # validação avulsa
```

- Fontes editáveis: `ciclos/ciclo-XX-*.md` (+ manifesto `ciclos/ciclo-XX.conf`).
- Saída: `ciclos/ciclo-01/` (8 páginas HTML com barra de navegação fixa, índice
  interno, botão "voltar ao topo" e rodapé) + `ciclos/ciclo-01/ciclo-01.pdf`
  (23 páginas: capa, índice navegável, bookmarks, referências cruzadas e rodapé).
- Estado: **Ciclo 01 gerado com conteúdo real** — plano (12 marcos + rubrica) e
  Aula 01 completa, calibrada para **60 min**: 90 tempos ativos distribuídos em
  solo 30 (33%), barra 20 (22%), centro 32 (36%) e musicalidade 8 (9%).
- A duração não é decorativa: o gerador **recusa** construir aula sem `duracao:` no
  cabeçalho (Pré-requisito 4) e barra volume fora da faixa da duração (Regra 9).

> **Atenção ao engine:** o `xelatex` não está instalado nesta máquina e o
> `lualatex` está quebrado (falta `lualatex-math.sty`); o PDF é gerado com
> `pdflatex`. Detalhes e como trocar em **`README-ciclos.md`**.

## Próximos passos sugeridos

- **Ensaiar o tempo da animação:** a abertura completa do rizoma leva ~7,7 s (28 elementos: 26 caixas
  + você + legenda, e 33 arestas).
  Se quiser mais rápido ao vivo, diminua `PASSO` em `tools/gerar-animacao.js` (hoje 0,21 s) e rode
  o gerador de novo; se quiser pausar a meio, use `P` (o `R` reinicia do zero).
- Substituir os campos `[Nome da apresentadora]`, `[Data]` e `[Contato]` (slides 1 e 30).
- Inserir imagens em uma pasta `assets/` no workspace e referenciá-las como
  `![w:600](assets/arquivo.jpg)` — use `--allow-local-files` no Marp CLI ao exportar.
- Rodar `marp apresentacao-ballet.md --pdf` novamente após qualquer edição de conteúdo
  (e, se mexeu em mapa, `node tools/gerar-animacao.js` + `node tools/sincronizar-slide.js` antes).

