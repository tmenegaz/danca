#!/usr/bin/env bash
# ============================================================================
# gerar-handoff.sh — gera HANDOFF.md na raiz do repositório.
#
#   uso: tools/gerar-handoff.sh
#
# Para que serve: dar a uma sessão nova (de IA ou de pessoa) o estado atual do
# projeto sem reconstruir contexto. O script NÃO escreve análise: só extrai e
# organiza o que já está no repositório (P-06 — descritivo, não analítico).
#
# Lê: git log, os .fipp das variantes, os POs (state e campos [Preencher]),
# PROTOCOLO.md (pétreas), REGRAS.md (regras), os manifestos de ciclo e a última
# entrada do REGISTRO.md. Escreve: HANDOFF.md.
#
# Estrutura por professor: o projeto tem professores/ com uma pasta por professor.
# O HANDOFF lista cada um com os seus ciclos, POs e âncoras — o material de
# observação é do professor (P-13), não do projeto.
# ============================================================================

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"
SAIDA="HANDOFF.md"

data_iso="$(date +%Y-%m-%dT%H:%M:%S%z)"
commit_curto="$(git rev-parse --short HEAD)"
commit_msg="$(git log -1 --pretty=%s)"

# --- pétreas (PROTOCOLO.md) e regras (REGRAS.md) ----------------------------
arquivo_protocolo="PROTOCOLO.md"
[ -f "$arquivo_protocolo" ] || { echo "erro: $arquivo_protocolo não encontrado" >&2; exit 1; }
total_petreas="$(grep -c '^\*\*P-[0-9]\{2\} —' "$arquivo_protocolo" || true)"
total_regras="$(awk '/^## As 17 regras/{f=1;next} /^## /{f=0} f' REGRAS.md 2>/dev/null | grep -c '^| [0-9]\+ | \*\*' || echo 0)"

# --- professores, ciclos e variantes ---------------------------------------
professores="$(ls -1d professores/*/ 2>/dev/null | sed 's|professores/||; s|/$||' | LC_ALL=C sort || true)"

# --- ideias documentadas (IDEIA-*.md na raiz) --------------------------------
# Uma ideia é documento de INTENÇÃO, não de estado: fica fora do CONGELAMENTO, e
# o HANDOFF só precisa dizer que ela existe — para a próxima sessão não ter de
# reconstruir a conversa que a gerou. O resumo vem da linha que o próprio
# documento declara (`> **Resumo (para o HANDOFF):**`); sem ela, vale o título.
ideias="$(ls -1 IDEIA-*.md IDEIAS-*.md 2>/dev/null || true)"

# ciclos de um professor: números dos manifestos base (ciclo-XX.conf)
ciclos_de() {
  ls -1 "professores/$1/ciclos"/ciclo-[0-9]*.conf 2>/dev/null \
    | sed 's|.*/ciclo-||; s|\.conf$||' | grep -E '^[0-9]+$' | LC_ALL=C sort -u || true
}
# variantes (escolas) de um professor num ciclo: os manifestos de variante
variantes_de() {
  ls -1 "professores/$1/ciclos"/ciclo-"$2"-*.conf 2>/dev/null \
    | sed "s|.*/ciclo-$2-||; s|\.conf$||" | grep -vE '^[0-9]+$' | LC_ALL=C sort -u || true
}

{
  echo "# Handoff — Projeto Ciclo"
  echo
  echo "Gerado em: \`$data_iso\`"
  echo "Commit atual: \`$commit_curto\` — $commit_msg"
  echo "Para: sessão nova (retomar o diálogo)"
  echo
  echo "## Estado do projeto"
  echo
  echo "- **Regras:** $(awk '/^## As 17 regras/{f=1;next} /^## /{f=0} f' REGRAS.md 2>/dev/null | grep -c '^| [0-9]\+ | \*\*' || echo '?') em \`REGRAS.md\`"
  echo "  + **$total_petreas pétreas** em \`PROTOCOLO.md\`"
  echo "- **Professores:** ${professores:-nenhum} ($(printf '%s' "$professores" | wc -w))"
  echo "- **Ciclos com manifesto:** $(ls -1 professores/*/ciclos/ciclo-*.conf 2>/dev/null | grep -cE 'ciclo-[0-9]+-.*\.conf$' || echo 0) variante(s)"
  echo "- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)"
  echo
  echo "## Ideias documentadas"
  echo
  if [ -n "$ideias" ]; then
    for i in $ideias; do
      titulo="$(sed -n 's/^# //p' "$i" | head -1)"
      resumo="$(awk '
        /^> \*\*Resumo \(para o HANDOFF\):/ { f=1 }
        f {
          l=$0
          sub(/^> ?/, "", l)
          if (l ~ /^[[:space:]]*$/) exit
          print l
        }' "$i" | tr '\n' ' ' | sed 's/\*\*Resumo (para o HANDOFF):\*\*//; s/  */ /g; s/^ //; s/ $//')"
      [ -n "$resumo" ] || resumo="$titulo"
      echo "- **\`$i\`** — $resumo"
    done
  else
    echo "Nenhuma ideia documentada."
  fi
  echo
  echo "## Últimos commits"
  echo
  echo '```'
  git --no-pager log --oneline -20
  echo '```'
  echo
  echo "## Por professor"
  echo
  for p in $professores; do
    n_ciclos="$(ciclos_de "$p" | grep -c . || true)"
    echo "### $p — $n_ciclos ciclo(s)"
    echo
    for c in $(ciclos_de "$p"); do
      variantes="$(variantes_de "$p" "$c")"
      echo "**Ciclo $c** — variante(s): $(printf '%s' "$variantes" | tr '\n' ' ' | sed 's/ $//; s/ /, /g')"
      echo
      echo "| Escola | PO | state | Marcadores [Preencher] |"
      echo "|:--|:--|:--|--:|"
      for v in $variantes; do
        po="professores/$p/ciclos/ciclo-$c-$v-po.md"
        if [ -f "$po" ]; then
          estado="$(sed -n 's/^state:[[:space:]]*//p' "$po" | head -1)"
          pend="$(grep -c '\[Preencher' "$po" || true)"
          rotulo="$(sed -n 's/^escola:[[:space:]]*//p' "$po" | head -1)"
          printf '| %s | %s | %s | %s |\n' "${rotulo:-$v}" "$(basename "$po")" "${estado:-?}" "$pend"
        else
          printf '| %s | (sem PO) | — | — |\n' "$v"
        fi
      done
      echo
      echo "| Variante | .fipp | hash (12) | parentHash | po_state |"
      echo "|:--|:--|:--|:--|:--|"
      for v in $variantes; do
        fipp="professores/$p/ciclos/ciclo-$c-$v.fipp"
        if [ -f "$fipp" ]; then
          h="$(sed -n 's/^hash:[[:space:]]*//p' "$fipp" | head -1)"
          pa="$(sed -n 's/^parentHash:[[:space:]]*//p' "$fipp" | head -1)"
          ps="$(sed -n 's/^po_state:[[:space:]]*//p' "$fipp" | head -1)"
          printf '| %s | %s | `%s` | %s | %s |\n' "$v" "$(basename "$fipp")" "${h:0:12}" "${pa:-(vazio)}" "${ps:-—}"
        else
          printf '| %s | (sem âncora) | — | — | — |\n' "$v"
        fi
      done
      echo
    done
  done
  echo "## Pétreas (\`PROTOCOLO.md\`)"
  echo
  grep '^\*\*P-[0-9]\{2\} —' "$arquivo_protocolo" | sed 's/^\*\*/**/' | sed 's/\*\*$//' | sed 's/^/- /'
  echo
  echo "## Regras (\`REGRAS.md\`)"
  echo
  awk '/^## As 17 regras/{f=1;next} /^## /{f=0} f' REGRAS.md | grep '^| [0-9]\+ | \*\*' | sed 's/^| \([0-9]\+\) | \*\*\([^*]*\)\*\* |.*/- **\1. \2**/'
  echo
  echo "## Última entrada do REGISTRO"
  echo
  if [ -f REGISTRO.md ]; then
    awk '/^## /{bloco=$0"\n"; conteudo=""} /^## /{proximo=1; next} proximo{conteudo=conteudo $0 "\n"} END{printf "%s%s", bloco, conteudo}' REGISTRO.md
  else
    echo "(REGISTRO.md ainda não existe)"
  fi
  echo
  echo "## O que está pendente"
  echo
  if [ -f REGISTRO.md ]; then
    awk '/^\*\*O que ainda não está feito\.\*\*/{flag=1; next} /^\*\*/{flag=0} flag' REGISTRO.md
  fi
  for p in $professores; do
    for c in $(ciclos_de "$p"); do
      for v in $(variantes_de "$p" "$c"); do
        po="professores/$p/ciclos/ciclo-$c-$v-po.md"
        [ -f "$po" ] || continue
        estado="$(sed -n 's/^state:[[:space:]]*//p' "$po" | head -1)"
        case "$estado" in
          *Aguardando*) echo "- PO de **$p · $v** segue \`$estado\` — será declarado quando houver aula (P-02)." ;;
        esac
      done
      total_aulas="$(sed -n 's/^TOTAL_AULAS="\{0,1\}\([0-9]\{1,\}\).*/\1/p' "professores/$p/ciclos/ciclo-$c.conf" | head -1)"
      aulas_escritas="$(ls -1 "professores/$p/ciclos"/ciclo-"$c"-aula-*.md 2>/dev/null | wc -l)"
      if [ -n "$total_aulas" ]; then
        echo "- **$p · ciclo $c:** aulas escritas em detalhe: $aulas_escritas de $total_aulas (as demais entram depois da aula anterior)."
      fi
    done
    # material de campo do professor: eventos versionados e respostas digitadas
    if [ -d "professores/$p/campo" ]; then
      eventos="$(ls -1d professores/"$p"/campo/[0-9]*-*/ 2>/dev/null || true)"
      n_eventos="$(printf '%s' "$eventos" | grep -c . || true)"
      sem_resposta=""
      for e in $eventos; do
        [ -f "${e}respostas.md" ] || sem_resposta="$sem_resposta $(basename "$e")"
      done
      echo "- Material de campo de **$p**: $n_eventos evento(s) versionado(s)$([ -n "$sem_resposta" ] && echo " — sem respostas digitadas:$sem_resposta")."
    fi
  done
  echo
  echo "## Documentos-chave (para leitura)"
  echo
  echo "- \`PROTOCOLO.md\` — pétreas"
  echo "- \`REGRAS.md\` — regras"
  echo "- \`REGISTRO.md\` — marcos metodológicos"
  echo "- \`professores/<nome>/\` — um professor por pasta (P-13): ciclos, cadernos, relatórios, campo"
  echo "- \`professores/<nome>/ciclos/ciclo-XX-<escola>-po.md\` — POs por escola"
  echo "- \`professores/<nome>/ciclos/ciclo-XX-<escola>.fipp\` — âncoras FIPP"
  echo "- \`departamentos/\` — PO de departamento, quando a escola tiver metodologia comum (P-14)"
  echo "- \`biblioteca/guia-do-professor.md\` — o guia de posição (departamento ou PO próprio)"
  echo
  echo "## Como retomar"
  echo
  echo "A próxima sessão deve ler, nesta ordem:"
  echo "1. este arquivo;"
  echo "2. \`PROTOCOLO.md\`;"
  echo "3. \`REGISTRO.md\`;"
  echo "4. o PO do ciclo ativo."
  echo
  echo "Isso é suficiente para retomar o diálogo sem reconstruir contexto."
} > "$SAIDA"

echo "gerado: $SAIDA"
echo "  commit: $commit_curto — $commit_msg"
echo "  regras: $total_regras | pétreas: $total_petreas | variantes: $(printf '%s' "$variantes" | wc -w)"
