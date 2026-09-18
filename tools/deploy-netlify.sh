#!/usr/bin/env bash
# ============================================================================
# deploy-netlify.sh — publica um pacote de ciclo no Netlify.
#
#   uso: tools/deploy-netlify.sh <professor> <ciclo> <variante>
#   ex.: tools/deploy-netlify.sh tiago 01 duo
#
# UMA CONTA POR ESCOLA. Cada escola (duo, ritmos, debora) tem a sua conta no
# Netlify, com o seu token e o seu site. Os dois valores ficam em
# tools/.netlify-tokens (NÃO versionado — ver .gitignore), um par por escola:
#
#   NETLIFY_TOKEN_DUO="..."     NETLIFY_SITE_DUO="..."
#   NETLIFY_TOKEN_RITMOS="..."  NETLIFY_SITE_RITMOS="..."
#   NETLIFY_TOKEN_DEBORA="..."  NETLIFY_SITE_DEBORA="..."
#
# Na primeira execução, se o arquivo não existir, o script cria o template
# vazio e sai — é só preencher e rodar de novo. Se o token da escola ainda
# estiver vazio, ele diz qual variável falta, sem tentar deploy.
#
# O token vai para o Netlify como NETLIFY_AUTH_TOKEN (variável de ambiente
# daquela execução), então NÃO é preciso `netlify login` nem trocar de conta
# à mão: o deploy de cada escola usa o token dela.
#
# O arquivo de tokens é lido como shell (`source`), então trate-o como
# credencial: não versione, não copie de terceiros, não deixe em pasta
# compartilhada.
# ============================================================================

set -euo pipefail

PROFESSOR="${1:-}"
CICLO="${2:-}"
VARIANTE="${3:-}"

if [ -z "$PROFESSOR" ] || [ -z "$CICLO" ] || [ -z "$VARIANTE" ]; then
  echo "uso: tools/deploy-netlify.sh <professor> <ciclo> <variante>" >&2
  echo "ex.: tools/deploy-netlify.sh tiago 01 duo" >&2
  exit 2
fi

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

# normaliza o ciclo para dois dígitos: 1 -> 01
CICLO="$(printf '%02d' "$((10#$CICLO))")"
VARIANTE_UPPER="$(printf '%s' "$VARIANTE" | tr '[:lower:]' '[:upper:]')"

PACOTE="professores/$PROFESSOR/ciclos/ciclo-$CICLO-$VARIANTE"
TOKENS="tools/.netlify-tokens"

if [ ! -d "$PACOTE" ]; then
  echo "erro: pacote não encontrado: $PACOTE" >&2
  echo "  gere antes: tools/gerar-ciclo.sh $PROFESSOR $CICLO $VARIANTE" >&2
  exit 1
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "erro: netlify-cli não instalado" >&2
  echo "  instale com: npm install -g netlify-cli" >&2
  exit 1
fi

# --- primeira vez: cria o template de tokens e sai ---------------------------
if [ ! -f "$TOKENS" ]; then
  cat > "$TOKENS" <<'EOF'
# tools/.netlify-tokens — tokens e site IDs por escola. NÃO VERSIONAR.
# Lido por tools/deploy-netlify.sh. Uma conta do Netlify por escola.
#
# Para preencher:
#   1. entre na conta Netlify DA ESCOLA (netlify login)
#   2. gere um token em: https://app.netlify.com/user/applications#personal-access-tokens
#   3. copie o site ID: `netlify sites:list` (ou o painel do site)
#   4. cole os dois valores abaixo, na escola correspondente

NETLIFY_TOKEN_DUO=""
NETLIFY_SITE_DUO=""

NETLIFY_TOKEN_RITMOS=""
NETLIFY_SITE_RITMOS=""

NETLIFY_TOKEN_DEBORA=""
NETLIFY_SITE_DEBORA=""
EOF
  echo "criado: $TOKENS (template vazio)"
  echo "  preencha o token e o site ID da escola $VARIANTE e rode de novo."
  exit 1
fi

# --- carrega os tokens -------------------------------------------------------
# shellcheck disable=SC1090
source "$TOKENS"

TOKEN_VAR="NETLIFY_TOKEN_${VARIANTE_UPPER}"
SITE_VAR="NETLIFY_SITE_${VARIANTE_UPPER}"
TOKEN="${!TOKEN_VAR:-}"
SITE="${!SITE_VAR:-}"

if [ -z "$TOKEN" ]; then
  echo "erro: $TOKEN_VAR está vazio em $TOKENS" >&2
  echo "  preencha o token da conta da escola $VARIANTE." >&2
  exit 1
fi

if [ -z "$SITE" ]; then
  echo "aviso: $SITE_VAR está vazio — o deploy vai usar o site vinculado ao diretório." >&2
  echo "  para ir ao site certo com segurança, preencha o site ID em $TOKENS." >&2
fi

# --- deploy ------------------------------------------------------------------
# o token viaja só nesta execução; nenhuma conta fica "logada" no ambiente
export NETLIFY_AUTH_TOKEN="$TOKEN"

echo "deploy: $PACOTE"
echo "  escola: $VARIANTE (token $TOKEN_VAR)"
[ -n "$SITE" ] && echo "  site:   $SITE"

if [ -n "$SITE" ]; then
  netlify deploy --prod --dir="$PACOTE" --site="$SITE"
else
  netlify deploy --prod --dir="$PACOTE"
fi

echo "ok: deploy concluído — confira com: netlify status"
