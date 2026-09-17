#!/usr/bin/env bash
# ============================================================================
# instalar-hooks.sh — instala os hooks versionados de tools/hooks/ em .git/hooks
#
#   uso: tools/instalar-hooks.sh
#
# Por que existe: o Git NÃO versiona .git/hooks — cada clone nasce sem hook. Então
# a fonte da verdade fica em tools/hooks/ (versionada) e este script liga uma na
# outra, por link simbólico (mantém os dois em sincronia) ou cópia, se o sistema
# de arquivos não permitir link.
# ============================================================================
set -euo pipefail

RAIZ="$(git rev-parse --show-toplevel)"
ORIGEM="$RAIZ/tools/hooks"
DESTINO="$RAIZ/.git/hooks"

[ -d "$ORIGEM" ] || { echo "erro: $ORIGEM não existe" >&2; exit 1; }
[ -d "$DESTINO" ] || { echo "erro: $DESTINO não existe (não é um repositório Git?)" >&2; exit 1; }

for hook in "$ORIGEM"/*; do
  nome="$(basename "$hook")"
  rm -f "$DESTINO/$nome"
  if ln -s "$hook" "$DESTINO/$nome" 2>/dev/null; then
    modo="link simbólico"
  else
    cp "$hook" "$DESTINO/$nome"
    modo="cópia"
  fi
  chmod +x "$hook" "$DESTINO/$nome"
  echo "instalado: .git/hooks/$nome ($modo)"
done

echo
echo "hooks ativos:"
ls -1 "$DESTINO" | grep -v '\.sample$' | sed 's/^/  /'
