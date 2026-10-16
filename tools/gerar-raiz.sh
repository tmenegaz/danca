#!/usr/bin/env bash
# ============================================================================
# gerar-raiz.sh — regera o corpo da página raiz («Sistema Lastro») a partir da
# fonte ÚNICA biblioteca/apresentacao.md.
#
#   uso: tools/gerar-raiz.sh
#
# A página raiz (raiz/index.html) tem o MESMO texto da entrada dos ciclos, com
# UMA diferença: a raiz não é uma escola, então não tem links para a anamnese nem
# para o PO. As linhas «Acessar …» da fonte (que nos ciclos viram links) saem, e o
# resto do texto é renderizado como está — igual para todos.
#
# O casco próprio da raiz (cabeçalho, botão «Criar nova escola», modal, CSS e JS)
# NÃO é tocado: só o corpo (entre `<div class="conteudo">` e o primeiro `<style>`)
# é regerado. O texto não tem lastro nem vínculo com dados — é material de
# apresentação, replicado, não versionado com proveniência.
# ============================================================================
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
FONTE="$RAIZ/biblioteca/apresentacao.md"
ALVO="$RAIZ/raiz/index.html"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1. O corpo da raiz: a fonte SEM os atalhos de link (as linhas «Acessar …»).
sed -e '/^\*\*\[Acessar/d' "$FONTE" > "$TMP/corpo.md"

# 2. Markdown → fragmento HTML (sem standalone, sem TOC — a raiz não tem índice).
pandoc "$TMP/corpo.md" \
  --from=markdown+raw_tex+header_attributes \
  --to=html5 \
  > "$TMP/corpo.html"

# 3. Injeta o fragmento no casco da raiz, entre `<div class="conteudo">` e o
#    primeiro `<style>` que vem depois (o CSS e o JS do casco ficam intactos).
python3 - "$ALVO" "$TMP/corpo.html" <<'PY'
import io, sys
alvo, corpo = sys.argv[1], sys.argv[2]
html = io.open(alvo, encoding='utf-8').read()
frag = io.open(corpo, encoding='utf-8').read().strip('\n')

ini = html.index('<div class="conteudo">') + len('<div class="conteudo">')
fim = html.index('<style>', ini)

# Recuo visual próximo do casco: 8 espaços por linha do fragmento.
corpo_indentado = '\n'.join(('        ' + l if l.strip() else l) for l in frag.split('\n'))

html = html[:ini] + '\n' + corpo_indentado + '\n      ' + html[fim:]
io.open(alvo, 'w', encoding='utf-8').write(html)
print('gerado: raiz/index.html')
PY
