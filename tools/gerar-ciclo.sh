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
#         tools/gerar-ciclo.sh tiago 01 ritmos   → pacote de Ritmos e Movimento
#         PDF_ENGINE=lualatex tools/gerar-ciclo.sh 01 duo   (troca o engine)
#   (o ciclo da Débora, em Marau, ainda não existe)
#
# Fontes (Markdown, editáveis no VS Code):
#   professores/<p>/ciclos/ciclo-XX.conf          manifesto do ciclo (padrões do projeto)
#   professores/<p>/ciclos/ciclo-XX-<escola>.conf contexto institucional + conteúdo da escola
#   professores/<p>/ciclos/ciclo-XX-<escola>-*.md fontes PRÓPRIAS da escola (precedência)
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
# Slug do professor (a pasta em professores/). Não se chama PROFESSOR de propósito: os
# manifestos declaram PROFESSOR com o nome de EXIBIÇÃO ("Tiago Menegaz" — vai para o rodapé
# do pacote e para o author: do README), e a variável seria sobrescrita ao carregar o conf.
PROFESSOR_SLUG="tiago"
if [ "$#" -ge 3 ] && ! printf '%s' "${3:-}" | grep -q '^--'; then
  PROFESSOR_SLUG="$1"
  shift
fi
CICLO="${1:-01}"
ESCOLA_SLUG="${2:-}"
CICLOS="$RAIZ/professores/$PROFESSOR_SLUG/ciclos"
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

# Resolução das fontes — definição única, compartilhada com tools/hash-ciclo.sh
# (ver o cabeçalho de tools/lib-fontes.sh). A versão da própria variante
# (ciclo-01-ritmos-plano.md) tem precedência sobre a sem sufixo (ciclo-01-plano.md).
# shellcheck source=tools/lib-fontes.sh
source "$RAIZ/tools/lib-fontes.sh"

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
  arq="$(fonte_md "$doc")"
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
# Caminho da fonte de um documento: definido em tools/lib-fontes.sh, junto com
# fontes_do_ciclo() — a MESMA definição usada por tools/hash-ciclo.sh, para que o
# que entra no pacote e o que entra no hash nunca divirjam (foi essa divergência
# que fez o pacote da Ritmos sair com o plano da Duo).
# ---------------------------------------------------------------------------

mkdir -p "$TMP/src"
# Acompanhamentos: vista por aluna, gerada sob demanda a partir do PO e dos
# relatórios pós-aula. NÃO entram em DOCS (aquela lista é estática; estes são por
# aluna) e, por isso, também não entram no hash FIPP: são derivados, não fontes.
if [ -x "$RAIZ/tools/gerar-acompanhamento.sh" ]; then
  "$RAIZ/tools/gerar-acompanhamento.sh" "$PROFESSOR_SLUG" "$CICLO" "$VARIANTE" || \
    echo "aviso: não foi possível gerar os acompanhamentos deste ciclo" >&2
fi
ACOMP_DOCS=""
for f in "$CICLOS"/ciclo-"$CICLO"-"$VARIANTE"-acompanhamento-*.md; do
  [ -f "$f" ] || continue
  ACOMP_DOCS="$ACOMP_DOCS $(basename "$f" | sed "s/^ciclo-$CICLO-$VARIANTE-//; s/\.md$//")"
done
ACOMP_DOCS="${ACOMP_DOCS# }"

for doc in index $DOCS $ACOMP_DOCS; do
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
  # O caderno não tem front-matter (é registro, não documento): sem este caso o
  # item do menu sairia vazio, porque a extração abaixo depende de `title:`.
  case "$1" in
    caderno-*) printf 'Caderno'; return ;;
  esac
  src="$(fonte_md "$1")"
  if [ -f "$src" ]; then
    sed -n 's/^title:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$src" | head -1
  fi
}

# ---------------------------------------------------------------------------
# Rodapé: a lista de documentos é DERIVADA de DOCS, não fixa no template.
# Antes o template trazia as páginas do ciclo de fundamentos (notação,
# pré-requisitos, musicalidade, apanhado histórico) escritas à mão — e num ciclo
# que não tem esses documentos (pas de deux) o rodapé saía com links mortos, o
# que o validador reprovava. Agora o rodapé mostra o que o ciclo realmente tem.
# ---------------------------------------------------------------------------
rodape_docs() {
  local doc r saida='<a href="index.html">Índice do ciclo</a> &middot; <a href="plano.html">Plano</a>'
  for doc in $DOCS; do
    case "$doc" in aula-*|plano) continue ;; esac
    [ -f "$(fonte_md "$doc")" ] || continue
    r="$(rotulo "$doc")"
    saida="$saida &middot; <a href=\"$doc.html\">$r</a>"
  done
  printf '%s &middot; <a href="%s.pdf">PDF do ciclo</a>' "$saida" "$ID"
}

# ---------------------------------------------------------------------------
# Barra de navegação fixa (uma por página, com a atual marcada)
# ---------------------------------------------------------------------------
gerar_nav() {
  local atual="$1" destino="$2" doc r
  {
    echo '<nav class="topnav" aria-label="Navegação do ciclo">'
    echo "  <a class=\"marca\" href=\"index.html\">Ciclo $CICLO${ESCOLA_SLUG:+ · $ESCOLA_SLUG}</a>"
    # botão do menu mobile: só aparece em tela pequena (ver ciclo.css); o estado
    # aberto/fechado é anunciado por aria-expanded, e o painel é .nav-links
    echo '  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">'
    echo '    <span></span><span></span><span></span>'
    echo '  </button>'
    echo '  <div class="nav-links" id="nav-links">'
    # ------------------------------------------------------------------
    # Menu: sequência DECLARATIVA. Cada item é "Nome|padrões":
    #   - um padrão só, sem glob  → link direto para esse documento
    #   - um ou mais padrões      → dropdown (padrão é glob: aula-*, glossario-*)
    # A LISTA de documentos continua vindo de DOCS + ACOMP_DOCS (documento novo
    # entra sozinho); o que é declarativo é o AGRUPAMENTO. O que não cair em
    # grupo nenhum vai para "Outros" — nada some do menu por esquecimento.
    # ------------------------------------------------------------------
    link_menu() {   # $1 = doc (link de topo)
      local d="$1" rot
      rot="$(rotulo "$d")"
      [ "$d" = index ] && rot="Início"
      if [ "$d" = "$atual" ]; then
        echo "  <a class=\"ativo\" href=\"$d.html\">$rot</a>"
      else
        echo "  <a href=\"$d.html\">$rot</a>"
      fi
    }
    item_menu() {   # $1 = doc (item de submenu)
      local d="$1" rot=""
      # no acompanhamento o rótulo é o apelido (P-12), não o título do documento
      case "$d" in
        acompanhamento-*) rot="$(sed -n 's/^aluna:[[:space:]]*//p' "$(fonte_md "$d")" | head -1)" ;;
      esac
      [ -n "$rot" ] || rot="$(rotulo "$d")"
      if [ "$d" = "$atual" ]; then
        echo "      <a class=\"ativo\" href=\"$d.html\">$rot</a>"
      else
        echo "      <a href=\"$d.html\">$rot</a>"
      fi
    }

    membros=""
    # ------------------------------------------------------------------
    # Sequência do menu (decisão da pesquisadora, 19/09/2026):
    #   "Apoio" deixou de existir — notação e glossário vão para Planejamento;
    #   "musicalidade" (a do professor) saiu de Planejamento para Área do
    #   Professor; "musicalidade-aluna" (a folha da aluna) fica em Planejamento.
    # `caderno-*` já está previsto no Acompanhamento: entra sozinho no dia em que
    # o caderno for publicado no pacote (hoje ele vive fora, em cadernos/).
    # ------------------------------------------------------------------
    for item in \
      "Início|index" \
      "Ciclos|plano referencias" \
      "Aulas|aula-*" \
      "Acompanhamento|acompanhamento-* relatorio-aula-* captura-aula-* caderno-*" \
      "Planejamento|pre-requisitos musicalidade-aluna notacao glossario-*" \
      "Apanhado Histórico|apanhado-historico" \
      "Área do Professor|musicalidade harmonizacao guia-do-professor"
    do
      nome="${item%%|*}"
      padroes="${item#*|}"
      # link direto: um único padrão, sem glob
      case "$padroes" in
        *'*'*|*' '*) ;;
        *) link_menu "$padroes"; continue ;;
      esac
      membros=""
      for pat in $padroes; do
        for doc in $DOCS $ACOMP_DOCS; do
          case "$doc" in
            $pat)
              case " $membros " in
                *" $doc "*) ;;
                *) membros="$membros $doc" ;;
              esac
              ;;
          esac
        done
      done
      [ -n "$membros" ] || continue
      echo '  <details class="menu">'
      echo "    <summary>$nome</summary>"
      echo '    <div class="submenu">'
      for doc in $membros; do item_menu "$doc"; done
      echo '    </div>'
      echo '  </details>'
    done

    # catch-all: documento que não caiu em grupo nenhum
    sobra=""
    for doc in $DOCS $ACOMP_DOCS; do
      case "$doc" in
        index|plano|referencias|aula-*) ;;
        relatorio-aula-*|captura-aula-*|acompanhamento-*|caderno-*) ;;
        pre-requisitos|musicalidade|musicalidade-aluna) ;;
        notacao|glossario-*|harmonizacao|guia-do-professor) ;;
        apanhado-historico) ;;
        *) sobra="$sobra $doc" ;;
      esac
    done
    if [ -n "$sobra" ]; then
      echo '  <details class="menu">'
      echo '    <summary>Outros</summary>'
      echo '    <div class="submenu">'
      for doc in $sobra; do item_menu "$doc"; done
      echo '    </div>'
      echo '  </details>'
    fi
    echo "  <a class=\"pdf\" href=\"$ID.pdf\">PDF do ciclo</a>"
    echo '  </div>'
    echo '</nav>'
  } > "$destino"
}

# ---------------------------------------------------------------------------
# 1) Pacote HTML: um arquivo por documento, todos com a mesma navegação
# ---------------------------------------------------------------------------
TODOS="index $DOCS $ACOMP_DOCS"
gerados=0
for doc in $TODOS; do
  src="$TMP/src/ciclo-$CICLO-$doc.md"
  if [ ! -f "$src" ]; then
    echo "aviso: fonte ausente, pulando: $doc ($(fonte_md "$doc"))" >&2
    continue
  fi
  gerar_nav "$doc" "$TMP/nav.html"
  # O caderno não tem front-matter (é registro, não documento): sem um título
  # explícito, o pandoc usa o nome do arquivo e a aba do navegador sai
  # "ciclo-01-caderno-01". Os demais documentos trazem `title:` da própria fonte.
  METADADOS=()
  case "$doc" in
    caderno-*) METADADOS=(--metadata "title=Caderno — Ciclo $CICLO · $ESCOLA") ;;
  esac
  pandoc "$src" \
    -o "$PACOTE/$doc.html" \
    --standalone --toc --toc-depth=3 \
    --from=markdown+raw_tex+header_attributes \
    --to=html5 \
    --template="$TPL/ciclo.html" \
    --css=assets/style.css \
    --include-before-body="$TMP/nav.html" \
    "${METADADOS[@]}" \
    -V "lang=pt-BR" \
    -V "ciclo=$CICLO" \
    -V "ciclo-id=$ID" \
    -V "ciclo-anchor=$(ancora "$doc")" \
    -V "ciclo-nome=$NOME" \
    -V "ciclo-periodo=$PERIODO" \
    -V "ciclo-professor=$PROFESSOR" \
  -V "rodape-docs=$(rodape_docs)" \
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
# 1b) Acompanhamentos: criptografia (PageCrypt) — depois do HTML, antes de validar
# ---------------------------------------------------------------------------
# O HTML do acompanhamento acaba de nascer; a validação ainda não rodou. É o
# único ponto do fluxo em que dá para criptografar o pacote completo — dentro do
# gerador, ninguém esquece a etapa. A senha vem de tools/.senhas-locais (fora do
# repositório); sem ela, a criptografia falha e o check-pacote.js reprova o
# pacote: acompanhamento de aluna não vai para o site em claro.
if [ -n "$ACOMP_DOCS" ]; then
  "$RAIZ/tools/gerar-acompanhamento.sh" "$PROFESSOR_SLUG" "$CICLO" "$VARIANTE" --criptografar || \
    echo "aviso: acompanhamentos NÃO criptografados — o check-pacote.js vai reprovar" >&2
fi

# ---------------------------------------------------------------------------
# 2) PDF único consolidado: capa + índice navegável + seções em página nova
# ---------------------------------------------------------------------------
# Os ACOMPANHAMENTOS NÃO entram no PDF. Ele é publicado no site e ficaria em
# claro: a política de segurança dos dados sensíveis protege por camadas, e esta
# é uma delas (ver CONGELAMENTO.md). Eles existem no site, cifrados.
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

# PDF reprodutível. Sem isto, cada geração grava a hora atual em /CreationDate e o PDF
# versionado aparece como modificado mesmo sem nenhuma mudança de conteúdo. Com
# SOURCE_DATE_EPOCH + FORCE_SOURCE_DATE o pdfTeX usa uma data determinística: a do último
# commit que tocou as FONTES do ciclo — estável enquanto o ciclo não muda, e diferente
# quando ele muda. (Os pacotes passaram a ser versionados para o deploy automático.)
SOURCE_DATE_EPOCH="$(git -C "$RAIZ" log -1 --format=%ct -- "professores/$PROFESSOR_SLUG/ciclos" 2>/dev/null || true)"
[ -n "$SOURCE_DATE_EPOCH" ] || SOURCE_DATE_EPOCH="$(date +%s)"
export SOURCE_DATE_EPOCH
export FORCE_SOURCE_DATE=1

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
# Lista de navegação do README, derivada de DOCS — pela mesma razão do rodapé: a
# lista fixa apontava para documentos do ciclo de fundamentos, que um ciclo de pas
# de deux não tem. Os backticks são literais (a expansão do heredoc não os executa).
DOCS_README="$( for doc in $DOCS; do printf '`%s.html` · ' "$doc"; done )"
DOCS_README="${DOCS_README% · }"

if [ ! -f "$PACOTE/README.md" ]; then
  cat > "$PACOTE/README.md" <<RD
# $NOME — pacote de entrega ($ESCOLA)

> **Objetivo geral:** $OBJETIVO_GERAL
> **Escola/Espaço:** $ESCOLA — ${RESPONSAVEL:-não informado}
> **Frequência:** $FREQUENCIA · **Duração por dia:** $DURACAO_POR_DIA
> **Período:** $PERIODO ($SEMANAS semanas) · **Volume semanal:** $VOLUME_SEMANAL tempos
> **Professor:** $PROFESSOR

Gerado por \`tools/gerar-ciclo.sh $CICLO ${VARIANTE:-}\`. **Não edite os HTML** —
edite os Markdown em \`professores/$PROFESSOR_SLUG/ciclos/\` e rode o gerador de novo. Se você
editar o guia do professor, ele está em \`biblioteca/guia-do-professor.md\` — é
compartilhado por todos os professores do projeto.

## Navegação

- \`index.html\` — índice geral do ciclo (comece por aqui)
- $DOCS_README
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
3. Para editar: altere os Markdown em \`professores/$PROFESSOR_SLUG/ciclos/\` e rode

   \`\`\`bash
   tools/gerar-ciclo.sh $PROFESSOR_SLUG $CICLO ${VARIANTE:-}
   node tools/check-pacote.js professores/$PROFESSOR_SLUG/ciclos/$ID
   \`\`\`
RD
  echo "readme: README.md"
fi

# ---------------------------------------------------------------------------
# 4) Validação automática (links, navegação, índice, PDF)
# ---------------------------------------------------------------------------
node "$RAIZ/tools/check-pacote.js" "$PACOTE"

