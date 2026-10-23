#!/usr/bin/env bash
# =============================================================================
# provar-publicacao-do-derivado.sh — o commit de quem publica o derivado (23/10/2026).
#
# O QUE ACONTECEU. O «Guardar» do PO de `perna-boa/01/calango-bale-nivel-2-teste-1` disparou,
# entre outros, o `Regerar os índices` (run 39876375641, 23/10/2026, 00:09 UTC). O job commitou
# o índice, o push perdeu a corrida, e o laço do rebase morreu nas oito tentativas. No log, a
# assinatura do defeito: `[main fc9de92] chore(estrutura): reancorar a cadeia das fontes
# alteradas` — a mensagem de OUTRO workflow, gravada por este job.
#
# A CAUSA. O commit do job só carrega `indices/`. Ao reaplicá-lo sobre um `main` novo, o derivado
# conflita, o `conflito-do-derivado.sh` fica com a versão do `main` — e o commit fica VAZIO. Num
# rebase, o git DESCARTA o commit vazio e termina com o topo a ser o commit do `main`, que é de
# outra pessoa. O laço fazia então `git commit --amend --no-edit`: reescrevia ESSE commit. O ramo
# deixava de ser descendente do `main`, e o push passava a ser recusado para sempre
# («non-fast-forward», depois «behind»).
#
# O QUE ESTA PROVA FAZ. Monta repositórios git de verdade — um `origin` (bare), um clone que
# imita o job e um segundo clone que imita o workflow concorrente — e reproduz a corrida:
#
#   A. O DEFEITO. Com o laço ANTIGO (rebase + `--amend` cego), o commit do vizinho é reescrito:
#      o `main` deixa de ser descendente dele, e o push é recusado. É o controle negativo — sem
#      ele, a prova não distingue «consertado» de «não aconteceu nada».
#   B. A CORRECÇÃO. Com o laço NOVO (`reset --hard origin/main` + derivar outra vez), o push
#      passa, o commit de origem do vizinho fica intacto (mesmo SHA) e o resultado é linear.
#   C. O GUARDÃO. `.github/scripts/atualizar-commit-derivado.sh` nos três estados possíveis do
#      topo: o commit do job (amenda), o `main` (cria outro), um commit alheio (falha e diz).
#
#   uso: bash experimentos/provar-publicacao-do-derivado.sh
# =============================================================================
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
GUARDIAO="$RAIZ/.github/scripts/atualizar-commit-derivado.sh"
n=0
falhas=0

conferir() {
  n=$((n + 1))
  if [ "$2" = "0" ]; then
    printf '  ok     %s\n' "$1"
  else
    printf '  FALHA  %s  -> %s\n' "$1" "${3:-}"
    falhas=$((falhas + 1))
  fi
}

MSG_INDICE='chore(estrutura): regerar os índices derivados'
MSG_VIZINHO='chore(estrutura): reancorar a cadeia das fontes alteradas'

# O gerador: o índice é FUNÇÃO da árvore — aqui, do que está em `fontes/` — e regista o commit
# de HEAD, como o real (`fonte.commit`). ESSA ÚLTIMA PARTE É O QUE FAZ A PROVA MORDER: o índice
# que um commit carrega foi gerado quando HEAD era o PAI dele; regerar depois do rebase, com HEAD
# a ser outro commit, muda o carimbo — e é por isso que o `--amend` cego encontrava sempre
# «conteúdo novo» e reescrevia o commit do vizinho.
gerar() {
  local dir="$1"
  (
    cd "$dir" || exit 1
    mkdir -p indices
    printf '{"versao":1,"fontes":"%s","commit":"%s"}\n' \
      "$(cat fontes/estado.txt)" "$(git rev-parse --short HEAD 2>/dev/null || echo sem-commit)" \
      > indices/acervo.json
  )
}

# Um origin (bare) com o estado inicial, e dois clones: o do job e o do vizinho.
montar() {
  local base="$1"
  rm -rf "$base"; mkdir -p "$base"
  (
    cd "$base" || exit 1
    git init -q --bare --initial-branch=main origin.git
    git clone -q origin.git trabalho 2>/dev/null
    cd trabalho || exit 1
    git config user.email t@t.t; git config user.name t
    git config commit.gpgsign false
    mkdir -p fontes
    printf 'BASE\n' > fontes/estado.txt
    gerar .
    git add -A; git commit -qm 'estado inicial'
    git push -q origin HEAD:main
    git branch -q --set-upstream-to=origin/main main
  )
}

# O job: clona, deriva, commita. Devolve o SHA do commit do job.
iniciar_job() {
  local base="$1"
  rm -rf "$base/job"; git clone -q "$base/origin.git" "$base/job"
  (
    cd "$base/job" || exit 1
    git config user.email t@t.t; git config user.name t
    git config commit.gpgsign false
    printf 'JOB\n' > fontes/estado.txt
    gerar .
    git add -A
    git commit -qm "$MSG_INDICE"
    git rev-parse HEAD
  )
}

# O vizinho: publica uma mudança de verdade (fonte + índice) enquanto o job tenta o push.
avancar_origin() {
  local base="$1"
  rm -rf "$base/vizinho"; git clone -q "$base/origin.git" "$base/vizinho"
  (
    cd "$base/vizinho" || exit 1
    git config user.email t@t.t; git config user.name t
    git config commit.gpgsign false
    printf 'VIZINHO\n' > fontes/estado.txt
    gerar .
    git add -A
    git commit -qm "$MSG_VIZINHO"
    git push -q origin HEAD:main
    git rev-parse HEAD
  )
}

# ── A. O DEFEITO, com o laço ANTIGO ────────────────────────────────────────
#
# É o código que estava no `regerar-indices.yml` até 23/10/2026, com o resolvedor a fazer o papel
# que faz no CI: o derivado fica com a versão do `main`.
baseA="$(mktemp -d)/a"
montar "$baseA"
iniciar_job "$baseA" > /dev/null
sha_vizinho_A="$(avancar_origin "$baseA")"
(
  cd "$baseA/job" || exit 1
  git fetch -q origin main
  if ! git rebase origin/main > /dev/null 2>&1; then
    for f in $(git diff --name-only --diff-filter=U); do
      git checkout --ours -- "$f" 2>/dev/null || git rm -q --cached -- "$f" 2>/dev/null
      git add -- "$f" 2>/dev/null || true
    done
    GIT_EDITOR=true git rebase --continue > /dev/null 2>&1 || true
  fi
  gerar .
  git add -A -- indices/
  if git diff --cached --quiet HEAD^; then
    git reset --soft HEAD^
  else
    git commit --amend --no-edit > /dev/null 2>&1
  fi
)
topo_A="$(cd "$baseA/job" && git log -1 --format=%s)"
push_A=0
( cd "$baseA/job" && git push -q origin HEAD:main 2>/dev/null ) || push_A=1
ancestral_A=0
( cd "$baseA/job" && git merge-base --is-ancestor "$sha_vizinho_A" HEAD ) || ancestral_A=1

conferir 'A. o laço antigo amenda o commit de OUTRO workflow (o defeito)' \
  "$([ "$topo_A" = "$MSG_VIZINHO" ] && echo 0 || echo 1)" "topo: $topo_A"
conferir 'A. …e o main deixa de ter o commit do vizinho na história (o push morre)' \
  "$([ "$ancestral_A" = "1" ] && echo 0 || echo 1)" 'ainda é ancestral'
conferir 'A. …e o push é RECUSADO, como no run 39876375641' \
  "$([ "$push_A" = "1" ] && echo 0 || echo 1)" 'o push passou'

# ── B. A CORRECÇÃO, com o laço NOVO ────────────────────────────────────────
#
# O `reset --hard` põe o ramo no `main` e não toca em nada de ninguém: este job não tem conteúdo
# próprio. Depois deriva-se outra vez — o índice é função da árvore — e o push é fast-forward.
baseB="$(mktemp -d)/b"
montar "$baseB"
iniciar_job "$baseB" > /dev/null
sha_vizinho_B="$(avancar_origin "$baseB")"
mensagem="$baseB/mensagem.txt"
( cd "$baseB/job" && git log -1 --format=%B > "$mensagem" )
push_B=1
for intento in 1 2 3; do
  if ( cd "$baseB/job" && git push -q origin HEAD:main 2>/dev/null ); then push_B=0; break; fi
  (
    cd "$baseB/job" || exit 1
    git fetch -q origin main
    git reset -q --hard origin/main
    gerar .
    git add -A -- indices/
    git diff --cached --quiet && exit 3
    git commit -q -F "$mensagem"
  ) || break
done

topo_B="$(cd "$baseB/job" && git log -1 --format=%s)"
ancestral_B=0
( cd "$baseB/job" && git merge-base --is-ancestor "$sha_vizinho_B" HEAD ) || ancestral_B=1
sha_no_origin="$(cd "$baseB" && git --git-dir=origin.git log -1 --format=%H main)"
conteudo="$(cd "$baseB" && git --git-dir=origin.git show main:fontes/estado.txt)"

conferir 'B. o laço novo publica (o push passa)' "$([ "$push_B" = "0" ] && echo 0 || echo 1)" 'recusado'
conferir 'B. …o commit do vizinho continua na história, com o MESMO SHA' \
  "$([ "$ancestral_B" = "0" ] && echo 0 || echo 1)" 'não é ancestral'
conferir 'B. …o topo é o commit do índice, não a mensagem de outro workflow' \
  "$([ "$topo_B" = "$MSG_INDICE" ] && echo 0 || echo 1)" "topo: $topo_B"
conferir 'B. …e o índice publicado é o da árvore do main novo (o vizinho)' \
  "$([ "$conteudo" = "VIZINHO" ] && echo 0 || echo 1)" "fontes: $conteudo"
conferir 'B. …e o origin não ficou à frente do clone (história linear)' \
  "$([ "$sha_no_origin" = "$(cd "$baseB/job" && git rev-parse HEAD)" ] && echo 0 || echo 1)" "$sha_no_origin"

# ── C. O GUARDÃO, nos três estados do topo ─────────────────────────────────
baseC="$(mktemp -d)/c"
montar "$baseC"
iniciar_job "$baseC" > /dev/null
msgC="$baseC/mensagem.txt"
( cd "$baseC/job" && git log -1 --format=%B > "$msgC" )

# C1 — o topo é o commit do job: amenda (é o caso normal do rebase que reaplicou o commit).
(
  cd "$baseC/job" || exit 1
  printf 'MAIS\n' >> fontes/estado.txt
  gerar .
  git add -A -- indices/ fontes/
  bash "$GUARDIAO" "$msgC" > /dev/null 2>&1
)
codigo_c1=$?
conferir 'C. topo = commit do job → amenda (sai 0)' "$([ "$codigo_c1" = "0" ] && echo 0 || echo 1)" "saiu $codigo_c1"
conferir 'C. …e o commit continua a ser UM, com a mensagem do índice' \
  "$([ "$(cd "$baseC/job" && git log -1 --format=%s)" = "$MSG_INDICE" ] && echo 0 || echo 1)" \
  "$(cd "$baseC/job" && git log -1 --format=%s)"

# C2 — o topo é o `main` (o rebase descartou o commit vazio): cria um commit NOVO.
baseC2="$(mktemp -d)/c2"
montar "$baseC2"
iniciar_job "$baseC2" > /dev/null
avancar_origin "$baseC2" > /dev/null
msgC2="$baseC2/mensagem.txt"
( cd "$baseC2/job" && git log -1 --format=%B > "$msgC2" )
(
  cd "$baseC2/job" || exit 1
  git fetch -q origin main
  git reset -q --hard origin/main
  gerar .
  git add -A -- indices/
  bash "$GUARDIAO" "$msgC2" > /tmp/saida-c2.txt 2>&1
)
codigo_c2=$?
conferir 'C. topo = main novo → cria commit novo (sai 0)' \
  "$([ "$codigo_c2" = "0" ] && echo 0 || echo 1)" "saiu $codigo_c2"
conferir 'C. …e o topo passa a ter a mensagem do índice' \
  "$([ "$(cd "$baseC2/job" && git log -1 --format=%s)" = "$MSG_INDICE" ] && echo 0 || echo 1)" \
  "$(cd "$baseC2/job" && git log -1 --format=%s)"

# C3 — o topo é um commit ALHEIO (o estado que o `--amend` cego criava): FALHA e diz por quê.
baseC3="$(mktemp -d)/c3"
montar "$baseC3"
iniciar_job "$baseC3" > /dev/null
msgC3="$baseC3/mensagem.txt"
( cd "$baseC3/job" && git log -1 --format=%B > "$msgC3" )
(
  cd "$baseC3/job" || exit 1
  git reset -q --soft HEAD^
  printf 'ALHEIO\n' > alheio.txt
  git add -A
  git commit -qm "$MSG_VIZINHO"
  printf 'MAIS\n' >> fontes/estado.txt
  gerar .
  git add -A
  bash "$GUARDIAO" "$msgC3" > /tmp/saida-c3.txt 2>&1
)
codigo_c3=$?
conferir 'C. topo = commit alheio → recusa amendar (sai 1)' \
  "$([ "$codigo_c3" = "1" ] && echo 0 || echo 1)" "saiu $codigo_c3"
conferir 'C. …e a recusa nomeia o topo e o esperado' \
  "$([ "$(grep -c 'não vou amendar história alheia' /tmp/saida-c3.txt)" -ge 1 ] && echo 0 || echo 1)" \
  "saída: $(cat /tmp/saida-c3.txt)"
conferir 'C. …e o commit alheio fica intacto' \
  "$([ "$(cd "$baseC3/job" && git log -1 --format=%s)" = "$MSG_VIZINHO" ] && echo 0 || echo 1)" 'foi reescrito'

rm -rf "$(dirname "$baseA")" "$(dirname "$baseB")" "$(dirname "$baseC")" 2>/dev/null || true

echo ''
if [ "$falhas" = "0" ]; then
  echo "TUDO CERTO — $n asserções, 0 falha(s)."
  exit 0
fi
echo "FALHOU — $falhas de $n asserção(ões)."
exit 1
