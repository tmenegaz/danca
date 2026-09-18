#!/usr/bin/env bash
# ============================================================================
# gerar-ciclo.sh — gera a ENTREGA de um Ciclo de Aprendizagem (Regra 16):
#
#   professores/<nome>/ciclos/ciclo-XX/   pacote HTML interligado
#     index.html, plano.html, aula-YY.html, notacao.html,
#     pre-requisitos.html, musicalidade.html, apanhado-historico.html,
#     referencias.html, guia-do-professor.html, assets/style.css,
#     assets/rizoma-*.svg,
#     ciclo-XX.pdf              PDF único consolidado (índice + bookmarks)
#     README.md                 como navegar e usar o material
#
#   uso:  tools/gerar-ciclo.sh [<professor>] [XX] [escola]   (padrão: tiago 01)
#         tools/gerar-ciclo.sh 01 duo            → pacote do Duo (assume tiago)
#         tools/gerar-ciclo.sh tiago 01 duo      → idem, explícito
#         tools/gerar-ciclo.sh 01 ritmos         → pacote de Ritmos e Movimento
#         tools/gerar-ciclo.sh 01 debora         → pacote de Débora (Marau)
#         PDF_ENGINE=lualatex tools/gerar-ciclo.sh 01 duo   (troca o engine)
#
# Fontes (Markdown, editáveis no VS Code):
#   professores/<p>/ciclos/ciclo-XX.conf          manifesto BASE (compartilhado)
#   professores/<p>/ciclos/ciclo-XX-<escola>.conf contexto institucional (Pré-req. 5)
#   professores/<p>/ciclos/ciclo-XX-index.md      índice geral
#   professores/<p>/ciclos/ciclo-XX-<doc>.md      um arquivo por documento
#   biblioteca/guia-do-professor.md               documento COMPARTILHADO (ver abaixo)
#
# Decisão — o guia do professor no pacote:
#   O guia é compartilhado (vive na biblioteca), mas o pacote é uma pasta plana.
#   Em vez de duplicar o arquivo em cada professor (sairia de sincronia na primeira
#   edição), o gerador o trata por CAMINHO ESPECIAL: lê de
#   biblioteca/guia-do-professor.md, normaliza e copia para dentro do pacote como
#   `guia-do-professor.html`. A lista `DOCS` de cada ciclo declara
#   `guia-do-professor` (como último item), o que define a ordem no menu, no índice
#   e no PDF. Assim o guia é escrito uma vez e aparece em todos os pacotes.
#
# Regras que o script garante:
#   · Pré-requisito 5: sem escola, frequência, dias e duração por dia, não gera;
#   · Regra 10 (camada 2): calcula o calendário real (datas, avaliações, extensão)
#     e injeta no lugar do marcador <!-- CALENDARIO --> dos documentos;
#   · Regra 9: volume conferido contra a faixa da duração de cada dia do ciclo;
#   · barra de navegação fixa em todas as páginas, com a página atual marcada;
#   · índice interno no topo de cada página;
#   · botão "voltar ao topo" e rodapé com identificação do ciclo;
#   · PDF consolidado com capa, índice navegável, links cruzados internos,
#     bookmarks e rodapé numerado (cada documento começa em página nova);
#   · links entre arquivos são reescritos para âncoras internas no PDF.
# ============================================================================

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFESSOR="tiago"
if [ "$#" -ge 3 ] && ! printf '%s' "${3:-}" | grep -q '^--'; then
  PROFESSOR="$1"
  shift
fi
CICLO="${1:-01}"
ESCOLA_SLUG="${2:-}"
CICLOS="$RAIZ/professores/$PROFESSOR/ciclos"
CONF_BASE="$CICLOS/ciclo-$CICLO.conf"
CONF_VARIANTE="$CICLOS/ciclo-$CICLO${ESCOLA_SLUG:+-$ESCOLA_SLUG}.conf"
TPL="$RAIZ/tools/templates"
PDF_ENGINE="${PDF_ENGINE:-pdflatex}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ ! -f "$CONF_BASE" ]; then
  echo "erro: manifesto base não encontrado: $CONF_BASE" >&2
  exit 1
fi
if [ ! -f "$CONF_VARIANTE" ]; then
  echo "erro: manifesto da variante não encontrado: $CONF_VARIANTE" >&2
  echo "  O Pré-requisito 5 (contexto institucional) exige uma variante por escola." >&2
  echo "  Variantes disponíveis:" >&2
  ls -1 "$CICLOS"/ciclo-"$CICLO"-*.conf 2>/dev/null | sed 's|.*/||; s|^|    |' >&2 || true
  exit 1
fi
# shellcheck disable=SC1090
source "$CONF_BASE"
# shellcheck disable=SC1090
source "$CONF_VARIANTE"
ID="ciclo-$CICLO${VARIANTE:+-$VARIANTE}"

: "${NOME:?defina NOME no manifesto}"
: "${OBJETIVO_GERAL:?defina OBJETIVO_GERAL no manifesto}"
: "${PROFESSOR:?defina PROFESSOR no manifesto}"
: "${DOCS:?defina DOCS (lista ordenada de documentos) no manifesto}"

# ---------------------------------------------------------------------------
# Pré-requisito 5 — contexto institucional e frequência (Regra 18):
# sem escola, frequência, dias de aula e duração por dia, não se gera ciclo.
# ---------------------------------------------------------------------------
for campo in ESCOLA FREQUENCIA DIAS DURACOES DATA_INICIO TOTAL_AULAS; do
  valor="${!campo:-}"
  if [ -z "$valor" ] || printf '%s' "$valor" | grep -q '\['; then
    echo "erro: Pré-requisito 5 incompleto — '$campo' não está declarado em $(basename "$CONF_VARIANTE")." >&2
    echo "  Informe escola, frequência, dias de aula, duração por dia e total de aulas." >&2
    exit 1
  fi
done
echo "variante: $ESCOLA — $FREQUENCIA ($DIAS) — $DURACAO_POR_DIA"

DUR_CURTA="${DURACOES%%,*}"
DUR_LONGA="${DURACOES##*,}"
[ "$DUR_LONGA" = "$DUR_CURTA" ] && DUR_LONGA=""

volume_declarado() {   # $1 = arquivo ; $2 = duração em minutos
  local arq="$1" dur="$2" campo
  if [ "$dur" -le 60 ]; then campo="volume-total"; else campo="volume-total-$dur"; fi
  sed -n "s/^$campo:[[:space:]]*\"\{0,1\}\([0-9]\{1,\}\).*/\1/p" "$arq" | head -1
}

# ---------------------------------------------------------------------------
# Pré-requisito 4 + Regra 9: cada aula declara a duração, e o volume tem de caber
# na faixa daquela duração — inclusive quando a variante tem dia mais longo.
# ---------------------------------------------------------------------------
PRIMEIRA_AULA=""
for doc in $DOCS; do
  case "$doc" in aula-*) ;; *) continue ;; esac
  arq="$CICLOS/ciclo-$CICLO-$doc.md"
  [ -f "$arq" ] || continue
  [ -z "$PRIMEIRA_AULA" ] && PRIMEIRA_AULA="$arq"
  grep -q '^duracao:' "$arq" || {
    echo "erro: $arq não declara 'duracao:' no cabeçalho (Pré-requisito 4)." >&2
    exit 1
  }
  for dur in ${DURACOES//,/ }; do
    if [ "$dur" -le 60 ]; then min="${VOLUME_MIN:-80}"; max="${VOLUME_MAX:-100}"
    else min="${VOLUME_MIN_120:-}"; max="${VOLUME_MAX_120:-}"; fi
    if [ -z "$min" ] || [ -z "$max" ]; then
      echo "erro: sem faixa de volume para $dur min — declare VOLUME_MIN_$dur e VOLUME_MAX_$dur." >&2
      exit 1
    fi
    vol="$(volume_declarado "$arq" "$dur")"
    if [ -z "$vol" ]; then
      campo="volume-total"; [ "$dur" -gt 60 ] && campo="volume-total-$dur"
      echo "erro: $doc não declara '$campo:' para o dia de $dur min (Regra 9)." >&2
      exit 1
    fi
    if [ "$vol" -lt "$min" ] || [ "$vol" -gt "$max" ]; then
      echo "erro: $doc declara $vol tempos em dia de $dur min, fora da faixa $min–$max (Regra 9)." >&2
      exit 1
    fi
  done
done

# ---------------------------------------------------------------------------
# Regra 10, camada 2 — calendário real: datas, avaliações, extensão e volume
# semanal. O bloco gerado substitui o marcador <!-- CALENDARIO --> das fontes.
# ---------------------------------------------------------------------------
VOL_CURTO="$(volume_declarado "$PRIMEIRA_AULA" "$DUR_CURTA")"
VOL_LONGO=""
[ -n "$DUR_LONGA" ] && VOL_LONGO="$(volume_declarado "$PRIMEIRA_AULA" "$DUR_LONGA")"

EXTRA=()
[ -n "$DUR_LONGA" ] && EXTRA=(--duracao-longa "$DUR_LONGA" --volume-longo "$VOL_LONGO")
python3 "$RAIZ/tools/calendario.py" \
  --escola "$ESCOLA" \
  --responsavel "${RESPONSAVEL:-}" \
  --frequencia "$FREQUENCIA" \
  --dias "$DIAS" \
  --inicio "$DATA_INICIO" \
  --total "$TOTAL_AULAS" \
  --duracao-curta "$DUR_CURTA" \
  --volume-curto "$VOL_CURTO" \
  ${EXTRA[@]+"${EXTRA[@]}"} \
  --saida "$TMP/calendario.md" \
  --vars-arquivo "$TMP/calendario.vars"
# shellcheck disable=SC1090
source "$TMP/calendario.vars"
echo "calendário: $PERIODO · $SEMANAS semana(s) · $VOLUME_SEMANAL tempos/semana · formativa $AULA_FORMATIVA ($DATA_FORMATIVA)"

PACOTE="$CICLOS/$ID"
mkdir -p "$PACOTE/assets"

# ---------------------------------------------------------------------------
# 0) Normalização dos ids: TODA fonte passa por aqui antes de virar HTML e PDF,
#    para que os dois formatos tenham exatamente as mesmas âncoras (ASCII).
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Caminho da fonte de um documento.
#
# Documentos do ciclo vivem em $CICLOS. A exceção é `guia-do-professor`: ele é
# COMPARTILHADO por todos os professores e vive na biblioteca, então é copiado para
# dentro do pacote (como os mapas do rizoma) em vez de ficar em ciclos/. A decisão
# de tratar por caminho especial, em vez de duplicar o arquivo em cada professor,
# está registrada no cabeçalho deste script.
# ---------------------------------------------------------------------------
fonte_md() {
  case "$1" in
    guia-do-professor) printf '%s' "$RAIZ/biblioteca/guia-do-professor.md" ;;
    *) printf '%s' "$CICLOS/ciclo-$CICLO-$1.md" ;;
  esac
}

mkdir -p "$TMP/src"
for doc in index $DOCS; do
  src="$(fonte_md "$doc")"
  [ -f "$src" ] || continue
  destino="$TMP/src/ciclo-$CICLO-$doc.md"
  python3 "$RAIZ/tools/normalizar-ids.py" "$src" "$destino"
  # Regra 10, camada 2: injeta o calendário real (calculado da variante) no lugar
  # do marcador <!-- CALENDARIO -->, se o documento tiver o marcador
  if grep -q '<!-- CALENDARIO -->' "$destino"; then
    python3 - "$destino" "$TMP/calendario.md" <<'PY'
import sys, pathlib
alvo = pathlib.Path(sys.argv[1])
cal = pathlib.Path(sys.argv[2]).read_text(encoding='utf-8').strip()
alvo.write_text(alvo.read_text(encoding='utf-8').replace('<!-- CALENDARIO -->', cal), encoding='utf-8')
PY
  fi
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
  [guia-do-professor]="guia-do-professor"
)
ancora() { printf '%s' "${ANCORA[$1]:-ciclo-$CICLO-$1}"; }

# Rótulo do menu: o título declarado no YAML do próprio documento
rotulo() {
  local src
  src="$(fonte_md "$1")"
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
    echo "  <a class=\"marca\" href=\"index.html\">Ciclo $CICLO${ESCOLA_SLUG:+ · $ESCOLA_SLUG}</a>"
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
    # demais documentos: o que está em DOCS e não é aula nem é o plano/index
    # (a lista é derivada de DOCS, então um documento novo entra sozinho no menu)
    for doc in $DOCS; do
      case "$doc" in aula-*|plano) continue ;; esac
      r="$(rotulo "$doc")"
      if [ "$doc" = "$atual" ]; then
        echo "  <a class=\"ativo\" href=\"$doc.html\">$r</a>"
      else
        echo "  <a href=\"$doc.html\">$r</a>"
      fi
    done
    echo "  <a class=\"pdf\" href=\"$ID.pdf\">PDF do ciclo</a>"
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
    echo "aviso: fonte ausente, pulando: $doc ($(fonte_md "$doc"))" >&2
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
    -V "ciclo-id=$ID" \
    -V "ciclo-anchor=$(ancora "$doc")" \
    -V "ciclo-nome=$NOME" \
    -V "ciclo-periodo=$PERIODO" \
    -V "ciclo-professor=$PROFESSOR" \
    -V "escola=$ESCOLA" \
    -V "escola-responsavel=${RESPONSAVEL:-}" \
    -V "frequencia=$FREQUENCIA" \
    -V "duracao-por-dia=$DURACAO_POR_DIA" \
    -V "volume-semanal=$VOLUME_SEMANAL tempos/semana" \
    -V "ciclo-semanas=$SEMANAS"
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
    'guia-do-professor': 'guia-do-professor',
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
  echo "subtitle: \"$ESCOLA — $FREQUENCIA, $DURACAO_POR_DIA\""
  echo "author: \"$PROFESSOR\""
  echo "date: \"$PERIODO\""
  echo 'lang: pt-BR'
  echo '---'
  echo
  echo "**Escola:** $ESCOLA — ${RESPONSAVEL:-não informado} · **Frequência:** $FREQUENCIA · "
  echo "**Duração por dia:** $DURACAO_POR_DIA · **Volume semanal:** $VOLUME_SEMANAL tempos."
  echo
  echo 'Cada documento começa em página nova. O índice é navegável, o rodapé'
  echo 'identifica o ciclo e os links entre documentos levam à seção interna.'
  echo
  cat "$TMP/consolidado.md"
} > "$TMP/consolidado-final.md"

pandoc "$TMP/consolidado-final.md" \
  -o "$PACOTE/$ID.pdf" \
  --toc --toc-depth=3 \
  --from=markdown+raw_tex+header_attributes \
  --pdf-engine="$PDF_ENGINE" \
  -V geometry:margin=2cm \
  -V colorlinks=true \
  -V lang=pt-BR \
  -V toc-title="Índice" \
  --include-in-header="$TMP/cabecalho.tex"
echo "pdf:  $ID.pdf · engine $PDF_ENGINE · $(pdfinfo "$PACOTE/$ID.pdf" | awk '/^Pages/{print $2}') páginas"

# ---------------------------------------------------------------------------
# 3) README do pacote (não sobrescreve um README escrito pelo professor)
# ---------------------------------------------------------------------------
if [ ! -f "$PACOTE/README.md" ]; then
  cat > "$PACOTE/README.md" <<RD
# $NOME — pacote de entrega ($ESCOLA)

> **Objetivo geral:** $OBJETIVO_GERAL
> **Escola/Espaço:** $ESCOLA — ${RESPONSAVEL:-não informado}
> **Frequência:** $FREQUENCIA · **Duração por dia:** $DURACAO_POR_DIA
> **Período:** $PERIODO ($SEMANAS semanas) · **Volume semanal:** $VOLUME_SEMANAL tempos
> **Professor:** $PROFESSOR

Gerado por \`tools/gerar-ciclo.sh $CICLO ${VARIANTE:-}\`. **Não edite os HTML** —
edite os Markdown em \`professores/$PROFESSOR/ciclos/\` e rode o gerador de novo. Se você
editar o guia do professor, ele está em \`biblioteca/guia-do-professor.md\` — é
compartilhado por todos os professores do projeto.

## Navegação

- \`index.html\` — índice geral do ciclo (comece por aqui)
- \`plano.html\` · \`aula-*.html\` · \`notacao.html\` · \`pre-requisitos.html\` ·
  \`musicalidade.html\` · \`apanhado-historico.html\` · \`referencias.html\`
- \`$ID.pdf\` — **PDF único consolidado**: capa, índice navegável, bookmarks
  (barra lateral do leitor) e rodapé numerado com a identificação do ciclo

Todas as páginas têm a mesma barra de navegação fixa no topo, um índice interno,
botão "voltar ao topo" e rodapé com o link de volta ao índice.

## Calendário desta variante

Veja o [Calendário do Ciclo](plano.html#calendario-do-ciclo) no plano: datas reais
de cada aula, avaliação formativa (aula $AULA_FORMATIVA, $DATA_FORMATIVA) e somativa
(aula $TOTAL_AULAS, $DATA_ULTIMA_AULA), calculadas a partir da frequência e da
duração por dia desta escola.

## Como usar em aula

1. Abra \`index.html\` no navegador e navegue até a aula do dia.
2. Para projetar ou imprimir sem depender do navegador, use \`$ID.pdf\`.
3. Para editar: altere os Markdown em \`professores/$PROFESSOR/ciclos/\` e rode

   \`\`\`bash
   tools/gerar-ciclo.sh $PROFESSOR $CICLO ${VARIANTE:-}
   node tools/check-pacote.js professores/$PROFESSOR/ciclos/$ID
   \`\`\`
RD
  echo "readme: README.md"
fi

# ---------------------------------------------------------------------------
# 4) Validação automática (links, navegação, índice, PDF)
# ---------------------------------------------------------------------------
node "$RAIZ/tools/check-pacote.js" "$PACOTE"

