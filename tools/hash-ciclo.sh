#!/usr/bin/env bash
# ============================================================================
# hash-ciclo.sh — âncora de proveniência FIPP de um ciclo (P-03, P-04, P-08).
#
#   uso:
#     tools/hash-ciclo.sh [<professor>] <ciclo> <variante> [--check]
#
#   exemplos:
#     tools/hash-ciclo.sh 01 duo             (assume o professor tiago)
#     tools/hash-ciclo.sh tiago 01 duo
#     tools/hash-ciclo.sh 01 duo --check
#
# O professor é o primeiro argumento quando há três ou mais (e o terceiro não é
# --check): assim os comandos antigos, sem professor, continuam valendo.
#
# Fórmula (conforme o paper do mestrado):
#
#   hash_conteudo = SHA256( fontes do ciclo, em ordem determinística LC_ALL=C )
#   hash_fipp     = SHA256( id + ":" + type + ":" + parentHash + ":" + conteudo )
#
#   id .......... "ciclo-01-duo"   (identificador do artefato)
#   type ........ "Ciclo"          (tipo fixo)
#   parentHash .. hash FIPP do ciclo anterior, mesma variante (vazio no Ciclo 01)
#   conteudo .... hash das fontes
#
# Cobertura: apenas FONTES — professores/<professor>/ciclos/ciclo-XX.conf,
# .../ciclo-XX-<variante>.conf e os .../ciclo-XX-*.md QUE NÃO SEJAM de outra
# escola. Como o PO é por escola (ciclo-XX-<escola>-po.md), a coleta exclui os .md
# que começam com o nome de outra variante: o hash do Duo não carrega o PO da
# Ritmos e vice-versa.
# As saídas (HTML, PDF) não entram: são reconstruíveis (P-04). Cada fonte entra
# precedida do seu caminho relativo, de modo que renomear ou trocar um arquivo
# também altere o hash.
#
# O arquivo .fipp é a ÂNCORA da cadeia e por isso é VERSIONADO — não é saída.
# ============================================================================

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

if [ "$#" -ge 3 ] && ! printf '%s' "${3:-}" | grep -q '^--'; then
  PROFESSOR="$1"
  shift
fi
PROFESSOR="${PROFESSOR:-tiago}"

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "uso: tools/hash-ciclo.sh [<professor>] <ciclo> <variante> [--check]" >&2
  exit 2
fi

CICLO_INFORMADO="$1"
VARIANTE="$2"
MODO="${3:-gerar}"

case "$MODO" in
  gerar|--check) ;;
  *) echo "erro: modo desconhecido '$MODO' (use --check ou nada)" >&2; exit 2 ;;
esac

# normaliza o ciclo para dois dígitos: 1 → 01, 10 → 10
CICLO="$(printf '%02d' "$CICLO_INFORMADO" 2>/dev/null || true)"
case "$CICLO" in
  [0-9][0-9]) ;;
  *) echo "erro: ciclo inválido '$CICLO_INFORMADO' (use 1, 01, 2, 02…)" >&2; exit 2 ;;
esac

BASE="professores/$PROFESSOR/ciclos"
CICLOS="$BASE"          # o nome que tools/lib-fontes.sh entende (aqui os caminhos são
                        # relativos de propósito: eles entram no texto hasheado)
CONF_BASE="$BASE/ciclo-$CICLO.conf"
CONF_VARIANTE="$BASE/ciclo-$CICLO-$VARIANTE.conf"
SCHEMA="$BASE/ciclo-$CICLO-schema.json"
ARQUIVO_FIPP="$BASE/ciclo-$CICLO-$VARIANTE.fipp"
ID="ciclo-$CICLO-$VARIANTE"
TIPO="Ciclo"

[ -f "$CONF_BASE" ] || { echo "erro: manifesto base não encontrado: $CONF_BASE" >&2; exit 1; }
[ -f "$CONF_VARIANTE" ] || {
  echo "erro: manifesto da variante não encontrado: $CONF_VARIANTE" >&2
  echo "  variantes disponíveis para o ciclo $CICLO:" >&2
  ls -1 "$BASE"/ciclo-"$CICLO"-*.conf 2>/dev/null | sed 's|.*/|    |' >&2 || true
  exit 1
}

# --- sha256 portável --------------------------------------------------------
if command -v sha256sum >/dev/null 2>&1; then
  sha() { sha256sum | awk '{print $1}'; }
elif command -v shasum >/dev/null 2>&1; then
  sha() { shasum -a 256 | awk '{print $1}'; }
else
  echo "erro: preciso de 'sha256sum' ou 'shasum -a 256' para calcular o hash" >&2
  exit 1
fi

# --- 1) schema (P-08) -------------------------------------------------------
if [ -f "$SCHEMA" ]; then
  if ! node tools/validar-schema-ciclo.js "$SCHEMA" "$CONF_BASE" "$CONF_VARIANTE"; then
    echo "erro: os .conf do ciclo $CICLO não satisfazem $SCHEMA — corrija antes de ancorar." >&2
    exit 1
  fi
fi

# --- 1b) PO do ciclo (P-01, P-08) ------------------------------------------
# O PO é do CICLO (compartilhado pelas variantes). Se ainda não existir, não é
# erro: o ciclo fica sem PO declarado e isso vai registrado no .fipp.
ARQUIVO_PO="$BASE/ciclo-$CICLO-$VARIANTE-po.md"
SCHEMA_PO="$BASE/ciclo-$CICLO-po-schema.json"
PO_INFO=""
PO_STATE=""
if [ -f "$ARQUIVO_PO" ]; then
  if [ -f "$SCHEMA_PO" ]; then
    if ! node tools/validar-po-ciclo.js "$SCHEMA_PO" "$ARQUIVO_PO" > /tmp/hash-po-"$CICLO".log 2>&1; then
      echo "erro: o PO do ciclo $CICLO não satisfaz $SCHEMA_PO — corrija antes de ancorar." >&2
      grep -E '^  - |^erro' /tmp/hash-po-"$CICLO".log | head -8 >&2
      exit 1
    fi
    PO_INFO="$ARQUIVO_PO"
  else
    echo "aviso: $ARQUIVO_PO existe, mas $SCHEMA_PO não — PO não validado" >&2
    PO_INFO="$ARQUIVO_PO (sem schema)"
  fi
  PO_STATE="$(sed -n 's/^state:[[:space:]]*//p' "$ARQUIVO_PO" | head -1)"
else
  echo "aviso: o ciclo $CICLO ainda não tem PO declarado ($ARQUIVO_PO)" >&2
  PO_INFO="ausente — este ciclo ainda não tem PO declarado"
fi

# --- 2) coleta dos fontes, em ordem determinística --------------------------
# A lista vem de tools/lib-fontes.sh — a MESMA definição que o gerador usa para
# montar o pacote. Assim o hash cobre exatamente o que a escola lê: os dois
# manifestos, o PO desta variante e os documentos resolvidos por DOCS, com a
# versão da própria variante tendo precedência sobre a sem sufixo. O material de
# OUTRA escola não entra (P-09/P-10) — nem o documento sem sufixo que esta
# variante substituiu pelo seu. Antes, esta coleta pegava todos os .md do ciclo e
# misturava as escolas: o hash da Ritmos carregava o plano e a aula da Duo.
#
# Para conhecer DOCS é preciso carregar os manifestos (o gerador já faz o mesmo).
# shellcheck disable=SC1090
source "$CONF_BASE"
# shellcheck disable=SC1090
source "$CONF_VARIANTE"
# shellcheck source=tools/lib-fontes.sh
source "$RAIZ/tools/lib-fontes.sh"

FONTES="$( fontes_do_ciclo \
           | while IFS= read -r fonte; do
               # Só o que é DESTE professor: o ciclo (manifestos, PO, documentos) e os
               # relatórios pós-aula — que são fontes. O guia-do-professor vive na
               # biblioteca e não entra; os acompanhamentos são derivados e ficam fora.
               case "$fonte" in
                 "${BASE%/ciclos}"/*) [ -f "$fonte" ] && printf '%s\n' "$fonte" ;;
               esac
             done \
           | LC_ALL=C sort -u )"
[ -n "$FONTES" ] || { echo "erro: nenhuma fonte encontrada para o ciclo $CICLO" >&2; exit 1; }

# --- 3) hash do conteúdo ----------------------------------------------------
HASH_CONTEUDO="$( for f in $FONTES; do
                    printf 'arquivo: %s\n' "$f"
                    cat "$f"
                    printf '\n'
                  done | sha )"

# --- 4) parentHash: hash FIPP do ciclo anterior, mesma variante -------------
PARENT_HASH=""
NUM="$(printf '%d' "$CICLO")"
if [ "$NUM" -gt 1 ]; then
  ANTERIOR="$(printf '%02d' "$((NUM - 1))")"
  ARQ_ANTERIOR="$BASE/ciclo-$ANTERIOR-$VARIANTE.fipp"
  if [ -f "$ARQ_ANTERIOR" ]; then
    PARENT_HASH="$(sed -n 's/^hash:[[:space:]]*//p' "$ARQ_ANTERIOR" | head -1)"
  else
    echo "aviso: $ARQ_ANTERIOR não existe — o ciclo $CICLO-$VARIANTE fica sem parentHash" >&2
    echo "       ancore o anterior primeiro: tools/hash-ciclo.sh $PROFESSOR $ANTERIOR $VARIANTE" >&2
  fi
fi

# --- 5) hash FIPP -----------------------------------------------------------
HASH_FIPP="$(printf '%s' "$ID:$TIPO:$PARENT_HASH:$HASH_CONTEUDO" | sha)"

# --- 6) verificação (--check) ----------------------------------------------
if [ "$MODO" = "--check" ]; then
  if [ ! -f "$ARQUIVO_FIPP" ]; then
    echo "erro: $ARQUIVO_FIPP não existe — ancore com: tools/hash-ciclo.sh $PROFESSOR $CICLO $VARIANTE" >&2
    exit 1
  fi
  ARMAZENADO="$(sed -n 's/^hash:[[:space:]]*//p' "$ARQUIVO_FIPP" | head -1)"
  CONTEUDO_ARMAZENADO="$(sed -n 's/^hash_conteudo:[[:space:]]*//p' "$ARQUIVO_FIPP" | head -1)"
  PARENT_ARMAZENADO="$(sed -n 's/^parentHash:[[:space:]]*//p' "$ARQUIVO_FIPP" | head -1)"
  FALHOU=0

  # (a) os fontes deste ciclo mudaram?
  if [ "$CONTEUDO_ARMAZENADO" != "$HASH_CONTEUDO" ]; then
    echo "erro: os fontes do ciclo $CICLO-$VARIANTE mudaram desde a última ancoragem." >&2
    echo "  no .fipp:  $CONTEUDO_ARMAZENADO" >&2
    echo "  agora:     $HASH_CONTEUDO" >&2
    echo "  regere a âncora com: tools/hash-ciclo.sh $PROFESSOR $CICLO $VARIANTE" >&2
    FALHOU=1
  fi

  # (b) o ciclo anterior mudou?
  if [ "$PARENT_ARMAZENADO" != "$PARENT_HASH" ]; then
    echo "erro: o ciclo anterior mudou — a cadeia de $ID deixou de bater." >&2
    echo "  no .fipp:  ${PARENT_ARMAZENADO:-(vazio)}" >&2
    echo "  agora:     ${PARENT_HASH:-(vazio)}" >&2
    echo "  (os fontes deste ciclo podem estar intactos; reancore para incorporar o novo pai)" >&2
    FALHOU=1
  fi

  # (c) o arquivo .fipp é coerente consigo mesmo?
  if [ "$ARMAZENADO" != "$HASH_FIPP" ] && [ "$FALHOU" -eq 0 ]; then
    echo "erro: o hash registrado não corresponde aos campos do próprio .fipp." >&2
    echo "  no .fipp:  $ARMAZENADO" >&2
    echo "  recalculado: $HASH_FIPP" >&2
    FALHOU=1
  fi

  # a cobertura declarada precisa corresponder aos fontes de hoje
  COBERTURA_ATUAL="$(printf '%s\n' $FONTES | LC_ALL=C sort -u)"
  COBERTURA_FIPP="$(grep '^  - ' "$ARQUIVO_FIPP" | sed 's/^  - //' | LC_ALL=C sort -u || true)"
  if [ "$COBERTURA_ATUAL" != "$COBERTURA_FIPP" ]; then
    echo "erro: a lista de fontes cobertas mudou (arquivo criado ou removido)." >&2
    diff <(printf '%s\n' "$COBERTURA_FIPP") <(printf '%s\n' "$COBERTURA_ATUAL") | sed 's/^/  /' >&2 || true
    FALHOU=1
  fi

  [ "$FALHOU" -eq 0 ] || exit 1
  echo "ok: ciclo $CICLO-$VARIANTE íntegro; cadeia intacta"
  echo "    hash: $HASH_FIPP"
  exit 0
fi

# --- 7) gravação do .fipp ---------------------------------------------------
{
  echo "# Âncora de proveniência FIPP — gerada por tools/hash-ciclo.sh"
  echo "# Este arquivo é VERSIONADO: é a âncora da cadeia, não uma saída (P-04)."
  echo "# Fontes cobertas: $CONF_BASE, $CONF_VARIANTE e os .md deste ciclo."
  echo "# Fórmula: hash = SHA256(id + ':' + type + ':' + parentHash + ':' + conteudo)"
  echo ""
  echo "id: $ID"
  echo "type: $TIPO"
  echo "professor: $PROFESSOR"
  echo "ciclo: $CICLO"
  echo "variante: $VARIANTE"
  echo "hash_conteudo: $HASH_CONTEUDO"
  echo "parentHash: $PARENT_HASH"
  echo "hash: $HASH_FIPP"
  echo "algoritmo: SHA-256"
  echo "po: $PO_INFO"
  echo "po_state: $PO_STATE"
  echo "cobertura:"
  for f in $FONTES; do echo "  - $f"; done
} > "$ARQUIVO_FIPP"

echo "ancorado: $ARQUIVO_FIPP"
echo "  id:            $ID"
echo "  hash_conteudo: $HASH_CONTEUDO"
echo "  parentHash:    ${PARENT_HASH:-(vazio — o Ciclo $CICLO abre a cadeia)}"
echo "  hash:          $HASH_FIPP"
if [ -n "$PARENT_HASH" ]; then
  echo "  cadeia: $(printf '%02d' "$((NUM - 1))")-$VARIANTE → $CICLO-$VARIANTE"
fi

