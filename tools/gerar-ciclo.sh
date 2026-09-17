#!/usr/bin/env bash
# ============================================================================
# gerar-ciclo.sh — gera a ENTREGA de um Ciclo de Aprendizagem (Regra 16):
#
#   ciclos/ciclo-XX/            pacote HTML interligado
#     index.html, plano.html, aula-YY.html, notacao.html,
#     pre-requisitos.html, musicalidade.html, apanhado-historico.html,
#     referencias.html, assets/style.css, assets/rizoma-*.svg,
#     ciclo-XX.pdf              PDF único consolidado (índice + bookmarks)
#     README.md                 como navegar e usar o material
#
#   uso:  tools/gerar-ciclo.sh [XX]        (padrão: 01)
#         PDF_ENGINE=lualatex tools/gerar-ciclo.sh 01   (troca o engine)
#
# Fontes (Markdown, editáveis no VS Code):
#   ciclos/ciclo-XX.conf          manifesto do ciclo (nome, objetivo, professor…)
#   ciclos/ciclo-XX-index.md      índice geral
#   ciclos/ciclo-XX-<doc>.md      um arquivo por documento
#
# Regras que o script garante:
#   · barra de navegação fixa em todas as páginas, com a página atual marcada;
#   · índice interno no topo de cada página;
#   · botão "voltar ao topo" e rodapé com identificação do ciclo;
#   · PDF consolidado com capa, índice navegável, links cruzados internos,
#     bookmarks e rodapé numerado (cada documento começa em página nova);
#   · links entre arquivos são reescritos para âncoras internas no PDF.
# ============================================================================

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CICLO="${1:-01}"
CICLOS="$RAIZ/ciclos"
CONF="$CICLOS/ciclo-$CICLO.conf"
PACOTE="$CICLOS/ciclo-$CICLO"
TPL="$RAIZ/tools/templates"
PDF_ENGINE="${PDF_ENGINE:-pdflatex}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ ! -f "$CONF" ]; then
  echo "erro: manifesto não encontrado: $CONF" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$CONF"

: "${NOME:?defina NOME no manifesto}"
: "${OBJETIVO_GERAL:?defina OBJETIVO_GERAL no manifesto}"
: "${PROFESSOR:?defina PROFESSOR no manifesto}"
: "${PERIODO:?defina PERIODO no manifesto}"
: "${DOCS:?defina DOCS (lista ordenada de documentos) no manifesto}"

# ---------------------------------------------------------------------------
# Pré-requisito 4 (Duração da Aula) e Regra 9, etapa 1 (calibração do volume):
# sem duração não se gera aula; e o volume declarado precisa caber na faixa
# correspondente à duração. Estas checagens são o Pré-requisito 4 em código.
# ---------------------------------------------------------------------------
: "${DURACAO:?defina DURACAO (duração da aula, em minutos) no manifesto — Pré-requisito 4}"
case "$DURACAO" in
  *'['*|*Preencher*)
    echo "erro: DURACAO ainda é campo a preencher ('$DURACAO') — informe a duração real da aula." >&2
    exit 1
    ;;
  *min*) ;;
  *)
    echo "erro: DURACAO deve estar em minutos (ex.: 60 min). Recebido: '$DURACAO'." >&2
    exit 1
    ;;
esac

for doc in $DOCS; do
  case "$doc" in aula-*) ;; *) continue ;; esac
  arq="$CICLOS/ciclo-$CICLO-$doc.md"
  [ -f "$arq" ] || continue
  grep -q '^duracao:' "$arq" || {
    echo "erro: $arq não declara 'duracao:' no cabeçalho (Pré-requisito 4)." >&2
    exit 1
  }
  vol="$(sed -n 's/^volume-total:[[:space:]]*"\{0,1\}\([0-9]\{1,\}\).*/\1/p' "$arq" | head -1)"
  if [ -n "$vol" ] && { [ "$vol" -lt "${VOLUME_MIN:-0}" ] || [ "$vol" -gt "${VOLUME_MAX:-9999}" ]; }; then
    echo "erro: $doc declara $vol tempos ativos, fora da faixa ${VOLUME_MIN}–${VOLUME_MAX} para $DURACAO (Regra 9)." >&2
    exit 1
  fi
done

mkdir -p "$PACOTE/assets"

# ---------------------------------------------------------------------------
# 0) Normalização dos ids: TODA fonte passa por aqui antes de virar HTML e PDF,
#    para que os dois formatos tenham exatamente as mesmas âncoras (ASCII).
# ---------------------------------------------------------------------------
mkdir -p "$TMP/src"
for doc in index $DOCS; do
  src="$CICLOS/ciclo-$CICLO-$doc.md"
  [ -f "$src" ] || continue
  python3 "$RAIZ/tools/normalizar-ids.py" "$src" "$TMP/src/ciclo-$CICLO-$doc.md"
done

# Âncoras estáveis: são as mesmas no HTML (#id da página) e no PDF (#id da seção),
# e é isso que permite ligar de um arquivo a outro sem quebrar em nenhum formato.
declare -A ANCORA=(
  [index]="indice-geral"
  [plano]="plano-do-ciclo"
  [notacao]="notacao-em-benesh"
  [pre-requisitos]="condicoes-pre-existentes"
  [musicalidade]="musicalidade"
  [apanhado-historico]="apanhado-historico"
  [referencias]="referencias-bibliograficas"
)
ancora() { printf '%s' "${ANCORA[$1]:-ciclo-$CICLO-$1}"; }

# Rótulo do menu: o título declarado no YAML do próprio documento
rotulo() {
  local src="$CICLOS/ciclo-$CICLO-$1.md"
  if [ -f "$src" ]; then
    sed -n 's/^title:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$src" | head -1
  fi
}

# ---------------------------------------------------------------------------
# Barra de navegação fixa (uma por página, com a atual marcada)
# ---------------------------------------------------------------------------
gerar_nav() {
  local atual="$1" destino="$2" doc r
  {
    echo '<nav class="topnav" aria-label="Navegação do ciclo">'
    echo "  <a class=\"marca\" href=\"index.html\">Ciclo $CICLO</a>"
    for doc in index plano; do
      r="$(rotulo "$doc")"
      [ "$doc" = index ] && r="Início"
      if [ "$doc" = "$atual" ]; then
        echo "  <a class=\"ativo\" href=\"$doc.html\">$r</a>"
      else
        echo "  <a href=\"$doc.html\">$r</a>"
      fi
    done
    echo '  <details class="menu">'
    echo '    <summary>Aulas</summary>'
    echo '    <div class="submenu">'
    for doc in $DOCS; do
      case "$doc" in aula-*) ;; *) continue ;; esac
      r="$(rotulo "$doc")"
      if [ "$doc" = "$atual" ]; then
        echo "      <a class=\"ativo\" href=\"$doc.html\">$r</a>"
      else
        echo "      <a href=\"$doc.html\">$r</a>"
      fi
    done
    echo '    </div>'
    echo '  </details>'
    for doc in notacao pre-requisitos musicalidade apanhado-historico referencias; do
      r="$(rotulo "$doc")"
      if [ "$doc" = "$atual" ]; then
        echo "  <a class=\"ativo\" href=\"$doc.html\">$r</a>"
      else
        echo "  <a href=\"$doc.html\">$r</a>"
      fi
    done
    echo "  <a class=\"pdf\" href=\"ciclo-$CICLO.pdf\">PDF do ciclo</a>"
    echo '</nav>'
  } > "$destino"
}

# ---------------------------------------------------------------------------
# 1) Pacote HTML: um arquivo por documento, todos com a mesma navegação
# ---------------------------------------------------------------------------
TODOS="index $DOCS"
gerados=0
for doc in $TODOS; do
  src="$TMP/src/ciclo-$CICLO-$doc.md"
  if [ ! -f "$src" ]; then
    echo "aviso: fonte ausente, pulando: ciclos/ciclo-$CICLO-$doc.md" >&2
    continue
  fi
  gerar_nav "$doc" "$TMP/nav.html"
  pandoc "$src" \
    -o "$PACOTE/$doc.html" \
    --standalone --toc --toc-depth=3 \
    --from=markdown+raw_tex+header_attributes \
    --to=html5 \
    --template="$TPL/ciclo.html" \
    --css=assets/style.css \
    --include-before-body="$TMP/nav.html" \
    -V "lang=pt-BR" \
    -V "ciclo=$CICLO" \
    -V "ciclo-anchor=$(ancora "$doc")" \
    -V "ciclo-nome=$NOME" \
    -V "ciclo-periodo=$PERIODO" \
    -V "ciclo-professor=$PROFESSOR"
  gerados=$((gerados + 1))
  echo "html: $doc.html"
done
[ "$gerados" -gt 0 ] || { echo "erro: nenhum documento convertido" >&2; exit 1; }

cp "$TPL/ciclo.css" "$PACOTE/assets/style.css"
APRESENTACAO="${APRESENTACAO:-$RAIZ/apresentacoes/apresentacao-01-rizoma}"
for img in "$APRESENTACAO"/rizoma-*.svg; do
  [ -f "$img" ] && cp "$img" "$PACOTE/assets/"
done

# ---------------------------------------------------------------------------
# 2) PDF único consolidado: capa + índice navegável + seções em página nova
# ---------------------------------------------------------------------------
python3 - "$TMP/src" "$CICLO" "$TMP/consolidado.md" "$DOCS" > "$TMP/mapa-ancoras.txt" <<'PY'
import re, sys, pathlib
ciclos, ciclo, destino, docs = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split()
ancoras = {
    'index': 'indice-geral', 'plano': 'plano-do-ciclo', 'notacao': 'notacao-em-benesh',
    'pre-requisitos': 'condicoes-pre-existentes', 'musicalidade': 'musicalidade',
    'apanhado-historico': 'apanhado-historico', 'referencias': 'referencias-bibliograficas',
}
def ancora(d):
    return ancoras.get(d, 'ciclo-%s-%s' % (ciclo, d))

# Cada documento tem suas seções (Exercícios, Musicalidade…) e, no PDF único,
# esses nomes se repetem entre aulas. Para não colidir, todo id interno recebe o
# prefixo do documento (aula-01--exercicios). Links internos acompanham.
def prefixar_ids(corpo, prefixo):
    return re.sub(r'\{#([a-z0-9][a-z0-9-]*)\}',
                  lambda m: '{#' + prefixo + '--' + m.group(1) + '}', corpo)

partes = []
for doc in docs:
    arq = pathlib.Path(ciclos) / ('ciclo-%s-%s.md' % (ciclo, doc))
    if not arq.exists():
        continue
    bruto = arq.read_text(encoding='utf-8')
    meta, corpo = {}, bruto
    m = re.match(r'^---\n(.*?)\n---\n', bruto, re.S)
    if m:
        for linha in m.group(1).splitlines():
            if ':' in linha:
                k, v = linha.split(':', 1)
                meta[k.strip().lower()] = v.strip().strip('"')
        corpo = bruto[m.end():]
    titulo = meta.get('title') or doc

    # 1) links LOCAIS primeiro (enquanto os cruzados ainda têm a forma arquivo.html):
    #    cada um recebe o prefixo deste documento.
    corpo = re.sub(r'\]\(#([a-z0-9][a-z0-9-]*)\)',
                   lambda mm, doc=doc: '](#' + doc + '--' + mm.group(1) + ')', corpo)

    # 2) links para OUTROS documentos → âncora do PDF (o prefixo é o do alvo)
    for d in docs + ['index']:
        if d == 'index':
            continue
        corpo = re.sub(r'\]\(%s\.html#([a-z0-9][a-z0-9-]*)\)' % re.escape(d),
                       lambda mm, d=d: '](#' + d + '--' + mm.group(1) + ')', corpo)
        corpo = corpo.replace('](%s.html)' % d, '](#' + ancora(d) + ')')
    corpo = corpo.replace('](ciclo-%s.pdf)' % ciclo, '](#' + ancoras['index'] + ')')

    # 3) ids dos títulos internos ganham o mesmo prefixo do documento
    corpo = prefixar_ids(corpo, doc)

    partes.append('\n\\clearpage\n\n# %s {#%s}\n\n%s' % (titulo, ancora(doc), corpo.strip()))
    print('%s\t%s\t%s' % (doc, ancora(doc), titulo))

texto = '\n'.join(partes) + '\n'
pathlib.Path(destino).write_text(texto, encoding='utf-8')

# 3) Verificação das referências cruzadas internas do PDF: todo link [](#x)
#    precisa de um título {#x}. Sem isso, o link fica "morto" no leitor.
ids = set(re.findall(r'\{#([a-z0-9][a-z0-9-]*)\}', texto))
links = set(re.findall(r'\]\(#([a-z0-9][a-z0-9-]*)\)', texto))
faltando = sorted(links - ids)
print('REFERENCIAS\t%d links\t%d ancoras\tfaltando: %s' % (len(links), len(ids), ', '.join(faltando) or 'nenhuma'), file=sys.stderr)
if faltando:
    sys.exit(3)
PY

# Cabeçalho LaTeX: rodapé numerado em todas as páginas + índice em página nova
sed -e "s|@NOME@|$(printf '%s' "$NOME" | sed -e 's/[&%#_]/\\&/g')|g" \
    -e "s|@CICLO@|$CICLO|g" \
    -e "s|@PERIODO@|$PERIODO|g" \
    "$TPL/ciclo-cabecalho.tex" > "$TMP/cabecalho.tex"


# Capa + aviso + documentos (o corpo do PDF vem do arquivo consolidado)
{
  echo '---'
  echo "title: \"$NOME\""
  echo "subtitle: \"Objetivo geral: $OBJETIVO_GERAL\""
  echo "author: \"$PROFESSOR\""
  echo "date: \"$PERIODO\""
  echo 'lang: pt-BR'
  echo '---'
  echo
  echo 'Cada documento começa em página nova. O índice é navegável, o rodapé'
  echo 'identifica o ciclo e os links entre documentos levam à seção interna.'
  echo
  cat "$TMP/consolidado.md"
} > "$TMP/consolidado-final.md"

pandoc "$TMP/consolidado-final.md" \
  -o "$PACOTE/ciclo-$CICLO.pdf" \
  --toc --toc-depth=3 \
  --from=markdown+raw_tex+header_attributes \
  --pdf-engine="$PDF_ENGINE" \
  -V geometry:margin=2cm \
  -V colorlinks=true \
  -V lang=pt-BR \
  -V toc-title="Índice" \
  --include-in-header="$TMP/cabecalho.tex"
echo "pdf:  ciclo-$CICLO.pdf · engine $PDF_ENGINE · $(pdfinfo "$PACOTE/ciclo-$CICLO.pdf" | awk '/^Pages/{print $2}') páginas"

# ---------------------------------------------------------------------------
# 3) README do pacote (não sobrescreve um README escrito pelo professor)
# ---------------------------------------------------------------------------
if [ ! -f "$PACOTE/README.md" ]; then
  cat > "$PACOTE/README.md" <<RD
# $NOME — pacote de entrega

> **Objetivo geral:** $OBJETIVO_GERAL
> **Período:** $PERIODO
> **Professor:** $PROFESSOR

Gerado por \`tools/gerar-ciclo.sh\`. **Não edite os HTML** — edite os Markdown em
\`ciclos/\` e rode o gerador de novo.

## Navegação

- \`index.html\` — índice geral do ciclo (comece por aqui)
- \`plano.html\` · \`aula-*.html\` · \`notacao.html\` · \`pre-requisitos.html\` ·
  \`musicalidade.html\` · \`apanhado-historico.html\` · \`referencias.html\`
- \`ciclo-$CICLO.pdf\` — **PDF único consolidado**: capa, índice navegável, bookmarks
  (barra lateral do leitor) e rodapé numerado com a identificação do ciclo

Todas as páginas têm a mesma barra de navegação fixa no topo, um índice interno,
botão "voltar ao topo" e rodapé com o link de volta ao índice.

## Como usar em aula

1. Abra \`index.html\` no navegador e navegue até a aula do dia.
2. Para projetar ou imprimir sem depender do navegador, use \`ciclo-$CICLO.pdf\`.
3. Para editar: altere os Markdown em \`ciclos/\` e rode

   \`\`\`bash
   tools/gerar-ciclo.sh $CICLO
   node tools/check-pacote.js ciclos/ciclo-$CICLO
   \`\`\`
RD
  echo "readme: README.md"
fi

# ---------------------------------------------------------------------------
# 4) Validação automática (links, navegação, índice, PDF)
# ---------------------------------------------------------------------------
node "$RAIZ/tools/check-pacote.js" "$PACOTE"

