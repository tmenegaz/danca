#!/usr/bin/env bash
# ============================================================================
# lib-shard.sh — «esta escola está num shard? qual?»
#
# POR QUE EXISTE. Três workflows (criar, gerar, publicar) tinham a mesma pergunta
# por responder, e cada um respondia à sua maneira — que é como duas opiniões sobre
# o mesmo facto começam. A pergunta é uma só, e a resposta é uma linha do índice da
# escola (`escola/<slug>/indice.json`, campo `shard`), escrita pelo
# `criar-escola.sh --shard` quando a escola nasce dentro do shard.
#
# PORQUE É QUE ISTO IMPORTA AO DEPLOY, e não é arrumação: num shard o
# `assets.directory` é `publicacao/`, e a árvore é PARTILHADA. Subir o Worker a
# partir de uma montagem de UMA escola substitui a versão inteira e apaga as
# páginas das outras. Quem publica um shard tem de montar todas as escolas dele.
#
# USO
#   source tools/lib-shard.sh
#   s=$(shard_da_escola calango)     # vazio = Worker próprio (o regime de antes)
# ============================================================================

# O shard que serve uma escola. Silêncio quando não há — e silêncio é a resposta
# «Worker próprio», não um erro: quase todas as escolas continuam assim.
shard_da_escola() {
  local slug="${1:-}"
  [ -n "$slug" ] || return 0
  local raiz
  raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  local arquivo="$raiz/escola/$slug/indice.json"
  [ -f "$arquivo" ] || return 0
  node -e '
    const fs = require("fs");
    try {
      const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      process.stdout.write(String((d && d.shard) || "").trim());
    } catch (erro) { process.stdout.write(""); }
  ' "$arquivo"
}
