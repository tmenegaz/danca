#!/usr/bin/env bash
# ============================================================================
# lib-fontes.sh — resolução das fontes de um ciclo. Definição ÚNICA.
#
# Nasceu de um erro real (18/09/2026): o gerador e o hasher resolviam as fontes
# cada um do seu jeito. O gerador lia sempre o arquivo SEM sufixo de variante
# (ciclo-01-plano.md), então o pacote da escola Ritmos saía com o plano e a aula
# da Duo; e o hasher cobria todos os .md do ciclo, misturando as escolas no hash.
# (Narrativa preservada: Duo e Ritmos saíram do caminho ativo em 02/10/2026 — o
# elo fica, e é ele que sustenta a «Regra única» abaixo.)
#
# Regra única: o documento `ciclo-XX-<doc>.md` pode ter uma versão PRÓPRIA da
# variante — `ciclo-XX-<variante>-<doc>.md` — que tem precedência quando existe.
# É isso que permite que cada escola tenha o seu próprio ciclo.
#
# Requer, de quem faz o `source`: RAIZ, CICLOS, CICLO e VARIANTE.
# ============================================================================

# Caminho da fonte de um documento (`plano`, `aula-01`, `index`, ...).
# Três documentos são COMPARTILHADOS por todos os professores e não vivem no ciclo:
#   guia-do-professor  → biblioteca/   (o guia de posição)
#   metodo             → raiz          (METODO.md, declaração de princípio)
#   index              → biblioteca/   (a página de entrada «Nós, Por Exemplo»)
# O `index` deixa de ser o «índice geral do ciclo» (repetia o plano) e passa a ser a
# página de entrada do SISTEMA, igual para todos — por isso fica FORA do hash, como os
# outros dois: o hasher só aceita caminho sob `professores/<professor>/` (ver hash-ciclo.sh).
fonte_md() {
  case "$1" in
    guia-do-professor) printf '%s' "$RAIZ/biblioteca/guia-do-professor.md"; return ;;
    metodo) printf '%s' "$RAIZ/METODO.md"; return ;;
    index) printf '%s' "$RAIZ/biblioteca/nos-por-exemplo.md"; return ;;
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

# Caminho do JSON de DADOS do ciclo — a captura em JSON (peça 1 da migração). É FONTE: entra no
# hash da âncora, e NÃO é publicado (não está em DOCS). A variante vence a base, como em fonte_md():
# a captura é POR ESCOLA, como o PO e os relatórios.
fonte_dados() {
  local proprio="$CICLOS/ciclo-$CICLO-${VARIANTE:-}-dados.json"
  if [ -n "${VARIANTE:-}" ] && [ -f "$proprio" ]; then
    printf '%s' "$proprio"
    return
  fi
  printf '%s' "$CICLOS/ciclo-$CICLO-dados.json"
}

# Uma VISTA é um documento DERIVADO — hoje, o guia de observação, que sai das duas ENTRADAS (o PO
# e o plano) e não da captura. Ela passa a ser GERADA pelo pacote quando a fonte escrita à mão
# SAI: assim a migração acontece POR VARIANTE e de forma explícita — apagar o `.md` é o ato —, e
# nenhuma escola é migrada por acidente.
e_vista() {
  case "$1" in
    guia-de-observacao-*) [ ! -f "$(fonte_md "$1")" ] ;;
    *) return 1 ;;
  esac
}

# ============================================================================
# DOCS DERIVADO — as famílias POR AULA
#
# O DOCS nasceu de quando só a primeira aula estava escrita, e por isso virou uma lista NOMINAL à
# mão, que drifta: as folhas `captura-aula-02..04` existem no disco e o sistema não as via — apagar
# a folha da aula 02 não quebrava a âncora (Defeito 2, ARQUITETURA-AULA.md §4.1). Aqui a lista
# deixa de ser nominal e passa a ser DECLARAÇÃO DE TIPOS + ORDEM: `aula-*` e `captura-aula-*`
# expandem para todo NN que existir no disco, no lugar em que o tipo foi declarado.
#
# Esta expansão mora AQUI, e não no gerador, por uma razão medida: o gerador e o hasher leem o DOCS
# em PROCESSOS SEPARADOS, e o único ponto que os dois atravessam é esta lib
# (gerar-ciclo.sh:99 e hash-ciclo.sh:150). Se ela ficasse só no gerador, a âncora cobriria um
# conjunto de arquivos diferente do pacote publicado — e cada `--check` acusaria uma divergência
# inexistente. O `export` é porque o hasher consome o DOCS num subshell.
#
# Três cuidados, todos pagos por medição:
#   * roda UMA vez, ao carregar a lib, e é IDEMPOTENTE (o `source` pode repetir);
#   * a família expande UMA vez, na posição do seu PRIMEIRO membro declarado, e os membros
#     seguintes são absorvidos: expandir cada nome declarado duplicaria (o DOCS do fokini declara
#     `aula-01` a `aula-04` — seriam 16 entradas em vez de 4);
#   * a expansão só ACRESCENTA documento que existe: onde nada foi declarado, nada muda — e o
#     `guia-de-observacao-NN` (que é VISTA, sem `.md`) segue resolvido por `e_vista()`.
# ============================================================================

# Os NN desta família que existem em disco, crescentes, um por linha.
familias_por_aula() {   # <tipo>  (ex.: aula, captura-aula)
  local tipo="$1" f base nn
  # O `*` casa também VAZIO: pega `ciclo-01-aula-01.md` (compartilhado) e
  # `ciclo-01-<escola>-aula-01.md` (da variante), que é a precedência de fonte_md().
  for f in "$CICLOS/ciclo-$CICLO-"*"$tipo-"*.md; do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    # `aula-01` é conteúdo de `captura-aula-01`: sem esta guarda o curinga levaria as duas famílias
    # juntas e `captura-aula-01` viraria membro da família `aula`.
    [ "$tipo" = aula ] && case "$base" in *-captura-*) continue ;; esac
    nn="$(printf '%s' "$base" | sed 's/.*-\([0-9][0-9]*\)\.md$/\1/')"
    case "$nn" in ''|*[!0-9]*) continue ;; esac
    printf '%s\n' "$nn"
  done | sort -u
}

# O DOCS efetivo: a lista declarada, com cada família trocada pelos seus NN em disco.
docs_derivado() {
  local doc familia nn vistas=" " out=""
  for doc in ${DOCS:-}; do
    case "$doc" in
      aula-*|captura-aula-*) familia="${doc%-*}" ;;
      *) out="$out $doc"; continue ;;
    esac
    case "$vistas" in *" $familia "*) continue ;; esac   # o resto da família já foi absorvido
    vistas="$vistas$familia "
    for nn in $(familias_por_aula "$familia"); do
      out="$out $familia-$nn"
    done
  done
  printf '%s' "${out# }"
}

if [ -n "${DOCS:-}" ]; then
  DOCS="$(docs_derivado)"
  export DOCS
fi

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
  # O JSON de DADOS do ciclo (a captura): é FONTE — entra no hash como o PO, e não é publicado.
  # Quando as vistas passarem a ser geradas, ELAS saem da cobertura e este fica no lugar
  # (peça 4 da migração); até lá, os dois convivem.
  local dados
  dados="$(fonte_dados)"
  if [ -f "$dados" ]; then
    printf '%s\n' "$dados"
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
