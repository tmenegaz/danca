#!/usr/bin/env bash
# ============================================================================
# lib-senhas.sh — a senha da escola, numa definição só.
#
#   uso:  . tools/lib-senhas.sh
#         senha="$(senha_da_escola)" || ...
#
#   precisa: RAIZ e ESCOLA_SLUG (e ID, quando existir, para as mensagens).
#
# A senha NUNCA entra no repositório (ele é público): mora em
# tools/.senhas-locais (não versionado — ver .senhas-locais.exemplo) ou é pedida
# no terminal. O .conf só declara a intenção, por ACOMPANHAMENTO_CRIPTOGRAFADO="sim".
#
# Quem usa: tools/gerar-acompanhamento.sh (cifra os acompanhamentos) e
# tools/gerar-ciclo.sh (cifra o JSON de dados do ciclo). Era uma função dentro do
# primeiro; virou lib quando o segundo passou a precisar dela — a mesma classe de
# divergência que o lib-fontes.sh existe para evitar.
# ============================================================================

senha_da_escola() {
  local var arquivo s
  var="SENHA_$(printf '%s' "$ESCOLA_SLUG" | tr 'a-z' 'A-Z')"
  arquivo="$RAIZ/tools/.senhas-locais"
  if [ -f "$arquivo" ]; then
    # shellcheck disable=SC1090
    . "$arquivo"
    if [ -n "${!var:-}" ]; then printf '%s' "${!var}"; return 0; fi
    echo "aviso: $var não está definida em tools/.senhas-locais" >&2
  else
    echo "aviso: tools/.senhas-locais não existe (veja o .senhas-locais.exemplo)" >&2
  fi
  if [ -t 0 ]; then
    printf 'Senha para criptografar (%s): ' "$ESCOLA_SLUG" >&2
    read -rs s || true
    printf '\n' >&2
    if [ -n "$s" ]; then printf '%s' "$s"; return 0; fi
  fi
  echo "erro: sem senha para ${ID:-$ESCOLA_SLUG} — defina $var em tools/.senhas-locais" >&2
  return 1
}
