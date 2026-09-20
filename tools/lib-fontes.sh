#!/usr/bin/env bash
# ============================================================================
# lib-fontes.sh — resolução das fontes de um ciclo. Definição ÚNICA.
#
# Nasceu de um erro real (18/09/2026): o gerador e o hasher resolviam as fontes
# cada um do seu jeito. O gerador lia sempre o arquivo SEM sufixo de variante
# (ciclo-01-plano.md), então o pacote da escola Ritmos saía com o plano e a aula
# da Duo; e o hasher cobria todos os .md do ciclo, misturando as escolas no hash.
#
# Regra única: o documento `ciclo-XX-<doc>.md` pode ter uma versão PRÓPRIA da
# variante — `ciclo-XX-<variante>-<doc>.md` — que tem precedência quando existe.
# É isso que permite que cada escola tenha o seu próprio ciclo.
#
# Requer, de quem faz o `source`: RAIZ, CICLOS, CICLO e VARIANTE.
# ============================================================================

# Caminho da fonte de um documento (`plano`, `aula-01`, `index`, ...).
# Dois documentos são COMPARTILHADOS por todos os professores e não vivem no ciclo:
#   guia-do-professor  → biblioteca/   (o guia de posição)
#   metodo             → raiz          (METODO.md, declaração de princípio)
# Por viverem fora do ciclo, os dois ficam FORA do hash por construção: o hasher
# só aceita caminho sob `professores/<professor>/` (ver hash-ciclo.sh).
fonte_md() {
  case "$1" in
    guia-do-professor) printf '%s' "$RAIZ/biblioteca/guia-do-professor.md"; return ;;
    metodo) printf '%s' "$RAIZ/METODO.md"; return ;;
    caderno-*)
      # O caderno é por ciclo e por escola, e vive FORA da pasta do ciclo:
      #   professores/<professor>/cadernos/ciclo-XX/caderno-XX-<escola>.md
      # É fonte do ciclo (entra no DOCS e no hash) e, publicado no pacote, é
      # copiado como qualquer outro documento — decisão de 19/09/2026.
      printf '%s' "${CICLOS%/ciclos}/cadernos/ciclo-$(printf '%02d' "${CICLO:-01}")/$1-${VARIANTE}.md"
      return
      ;;
  esac
  local proprio="$CICLOS/ciclo-$CICLO-${VARIANTE:-}-$1.md"
  if [ -n "${VARIANTE:-}" ] && [ -f "$proprio" ]; then
    printf '%s' "$proprio"
    return
  fi
  printf '%s' "$CICLOS/ciclo-$CICLO-$1.md"
}

# Fontes que COMPÕEM o ciclo desta variante: os dois manifestos, o PO (quando
# existe) e os documentos que o pacote de fato lê (`index $DOCS`), já resolvidos
# por fonte_md(). O que é de outra escola não entra, e o documento sem sufixo que
# esta variante substituiu pelo seu também não.
#
# Requer: CONF_BASE, CONF_VARIANTE, ARQUIVO_PO (opcional) e DOCS (do manifesto).
fontes_do_ciclo() {
  local doc src
  printf '%s\n' "$CONF_BASE" "$CONF_VARIANTE"
  if [ -n "${ARQUIVO_PO:-}" ] && [ -f "$ARQUIVO_PO" ]; then
    printf '%s\n' "$ARQUIVO_PO"
  fi
  for doc in index ${DOCS:-}; do
    src="$(fonte_md "$doc")"
    if [ -f "$src" ]; then
      printf '%s\n' "$src"
    fi
  done
  # Relatórios pós-aula desta escola: são FONTES — registram a aula, e a P-02
  # declara o PO do ciclo seguinte a partir deles. Caminho derivado de CICLOS,
  # para continuar relativo no hasher e absoluto no gerador.
  local rel r
  rel="${CICLOS%/ciclos}/relatorios/ciclo-$(printf '%02d' "${CICLO:-01}")"
  for r in "$rel"/aula-*-"$VARIANTE".md; do
    if [ -f "$r" ]; then
      printf '%s\n' "$r"
    fi
  done
  # Os ACOMPANHAMENTOS ficam fora de propósito: são vista derivada do PO e dos
  # relatórios, não fonte. Por isso não entram em DOCS nem aqui.
}
