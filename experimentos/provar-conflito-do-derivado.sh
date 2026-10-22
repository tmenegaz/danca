#!/usr/bin/env bash
# =============================================================================
# provar-conflito-do-derivado.sh — o rebase que parava em `indices/` (22/10/2026).
#
# O QUE ACONTECEU. O «Guardar» do PO dispara quarenta commits em quarenta segundos, e cada um
# acorda o `Reancorar` e o `Gerar o ciclo`. Os dois commitam com o `GITHUB_TOKEN` e, por isso,
# regeram `indices/` no próprio commit. Quando o push perdia a corrida, o rebase parava em treze
# `indices/*.json` e o laço — que só sabia conciliar `.fipp` — abortava com «conflito de
# conteúdo». Medido: runs 39788794107 (`Reancorar`) e 39788790994 (`Gerar o ciclo`).
#
# O QUE ESTA PROVA FAZ. Monta um repositório git de verdade, com dois ramos que mudam `indices/`
# e `*.fipp` do mesmo jeito que o `main` e os workflows mudam, provoca o conflito real e exercita
# `.github/scripts/conflito-do-derivado.sh` sobre ele. Não simula: o git é o git.
#
#   node? não — bash, porque o que se prova é um script de bash dentro de um rebase.
#   uso: bash experimentos/provar-conflito-do-derivado.sh
# =============================================================================
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
RESOLVEDOR="$RAIZ/.github/scripts/conflito-do-derivado.sh"
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

campo() { printf '%s' "$1" | grep -c "$2"; }

# Um repositório limpo, com um `main` e um ramo que imita um commit do workflow.
preparar() {
  local dir="$1"
  rm -rf "$dir"
  mkdir -p "$dir"
  (
    cd "$dir" || exit 1
    git init -q -b main .
    git config user.email t@t.t; git config user.name t
    mkdir -p indices/escolas professores/p/ciclos
    printf '{"versao":1,"escola":"a"}\n' > indices/acervo.json
    printf '{"escola":"a"}\n' > indices/escolas/a.json
    printf 'ANCORA-VELHA\n' > professores/p/ciclos/ciclo-01-a.fipp
    printf 'OBJETIVO=velho\n' > professores/p/ciclos/ciclo-01-a.conf
    git add -A; git commit -qm 'estado inicial'
  )
}

# O commit do workflow: regera os índices e a âncora sobre o estado ANTIGO.
commit_do_workflow() {
  local dir="$1" marca="$2"
  (
    cd "$dir" || exit 1
    printf '{"versao":1,"escola":"a","%s":true}\n' "$marca" > indices/acervo.json
    printf '{"escola":"a","%s":true}\n' "$marca" > indices/escolas/a.json
    printf 'ANCORA-%s\n' "$marca" > professores/p/ciclos/ciclo-01-a.fipp
    git add -A; git commit -qm "workflow $marca"
  )
}

# O `main` que anda: outro commit, também a mexer no derivado (é o que o CI fez).
main_avanca() {
  local dir="$1" marca="$2"
  (
    cd "$dir" || exit 1
    printf '{"versao":1,"escola":"a","main":%s}\n' "$marca" > indices/acervo.json
    printf '{"escola":"a","main":%s}\n' "$marca" > indices/escolas/a.json
    git add -A; git commit -qm "main $marca"
  )
}

# ── 1. O CASO QUE FALHOU: conflito só em `indices/**` ─────────────────────
dir="$(mktemp -d)/repo"
preparar "$dir"
( cd "$dir" && git checkout -q -b workflow )
commit_do_workflow "$dir" w1
( cd "$dir" && git checkout -q main )
main_avanca "$dir" 2

( cd "$dir" && git checkout -q workflow && git rebase main > /dev/null 2>&1 )
parou_depois_do_rebase=$?
conferir 'o rebase PARA no conflito de `indices/` (é o caso que existia)' \
  "$([ "$parou_depois_do_rebase" != "0" ] && echo 0 || echo 1)" "saiu $parou_depois_do_rebase"

conflitos="$(cd "$dir" && git diff --name-only --diff-filter=U | tr '\n' ' ')"
conferir '…e os caminhos em conflito são os do índice' \
  "$(printf '%s' "$conflitos" | grep -q '^indices/' && echo 0 || echo 1)" "$conflitos"

saida="$(cd "$dir" && bash "$RESOLVEDOR" 2>&1)"
codigo=$?
conferir 'o resolvedor concilia o derivado (sai 0)' "$([ "$codigo" = "0" ] && echo 0 || echo 1)" "$saida"
conferir '…e diz quantos arquivos de índice conciliou' \
  "$(printf '%s' "$saida" | grep -q '2 arquivo(s) de indice' && echo 0 || echo 1)" "$saida"
conferir 'não sobrou nenhum caminho em conflito' \
  "$([ -z "$(cd "$dir" && git diff --name-only --diff-filter=U)" ] && echo 0 || echo 1)" \
  "$(cd "$dir" && git diff --name-only --diff-filter=U)"

conferir 'o que ficou é a versão do MAIN (e não a do commit)' \
  "$(grep -q '"main":2' "$dir/indices/acervo.json" && echo 0 || echo 1)" \
  "$(cat "$dir/indices/acervo.json")"

( cd "$dir" && GIT_EDITOR=true git rebase --continue > /dev/null 2>&1 )
conferir 'o rebase TERMINA depois da conciliação' \
  "$([ ! -d "$dir/.git/rebase-merge" ] && [ ! -d "$dir/.git/rebase-apply" ] && echo 0 || echo 1)" \
  'rebase ainda a decorrer'

# ── 2. A ÂNCORA: fica a do COMMIT, porque o chamador a reancora ────────────
dir2="$(mktemp -d)/repo"
preparar "$dir2"
( cd "$dir2" && git checkout -q -b workflow )
commit_do_workflow "$dir2" w2
( cd "$dir2" && git checkout -q main )
(
  cd "$dir2" || exit 1
  printf 'OBJETIVO=novo\n' > professores/p/ciclos/ciclo-01-a.conf
  printf 'ANCORA-MAIN\n' > professores/p/ciclos/ciclo-01-a.fipp
  printf '{"versao":9}\n' > indices/acervo.json
  git add -A; git commit -qm 'main mexe na fonte e na ancora'
)
( cd "$dir2" && git checkout -q workflow && git rebase main > /dev/null 2>&1 )
saida2="$(cd "$dir2" && bash "$RESOLVEDOR" 2>&1)"
codigo2=$?
conferir 'com âncora E índice em conflito, concilia os dois' \
  "$([ "$codigo2" = "0" ] && echo 0 || echo 1)" "$saida2"
conferir '…e conta 1 âncora' \
  "$(printf '%s' "$saida2" | grep -q '1 ancora(s)' && echo 0 || echo 1)" "$saida2"
conferir 'a âncora que fica é a do COMMIT (o chamador reancora depois)' \
  "$(grep -q 'ANCORA-w2' "$dir2/professores/p/ciclos/ciclo-01-a.fipp" && echo 0 || echo 1)" \
  "$(cat "$dir2/professores/p/ciclos/ciclo-01-a.fipp")"

# ── 3. CONFLITO DE MATERIAL: o resolvedor NÃO toca, e diz o que é ──────────
dir3="$(mktemp -d)/repo"
preparar "$dir3"
( cd "$dir3" && git checkout -q -b workflow )
(
  cd "$dir3" || exit 1
  printf 'OBJETIVO=workflow\n' > professores/p/ciclos/ciclo-01-a.conf
  printf '{"versao":1,"escola":"a","w":true}\n' > indices/acervo.json
  git add -A; git commit -qm 'workflow mexe na FONTE'
)
( cd "$dir3" && git checkout -q main )
(
  cd "$dir3" || exit 1
  printf 'OBJETIVO=main\n' > professores/p/ciclos/ciclo-01-a.conf
  printf '{"versao":1,"escola":"a","m":true}\n' > indices/acervo.json
  git add -A; git commit -qm 'main mexe na MESMA fonte'
)
( cd "$dir3" && git checkout -q workflow && git rebase main > /dev/null 2>&1 )
saida3="$(cd "$dir3" && bash "$RESOLVEDOR" 2>&1)"
codigo3=$?
conferir 'conflito de MATERIAL faz o resolvedor sair 1' \
  "$([ "$codigo3" = "1" ] && echo 0 || echo 1)" "saiu $codigo3: $saida3"
conferir '…e nomeia o arquivo de conteúdo' \
  "$(printf '%s' "$saida3" | grep -q 'ciclo-01-a.conf' && echo 0 || echo 1)" "$saida3"
conferir '…e NÃO mexe no índice que também estava em conflito' \
  "$(cd "$dir3" && git diff --name-only --diff-filter=U | grep -q indices/acervo.json && echo 0 || echo 1)" \
  "$(cd "$dir3" && git diff --name-only --diff-filter=U | tr '\n' ' ')"
( cd "$dir3" && git rebase --abort > /dev/null 2>&1 )

# ── 4. UM LADO APAGA O ARQUIVO (a resolução é a ausência) ─────────────────
dir4="$(mktemp -d)/repo"
preparar "$dir4"
( cd "$dir4" && git checkout -q -b workflow )
( cd "$dir4" && git rm -q indices/escolas/a.json && git commit -qm 'workflow apaga o indice da escola' )
( cd "$dir4" && git checkout -q main )
( cd "$dir4" && printf '{"escola":"a","m":3}\n' > indices/escolas/a.json && git commit -qam 'main mexe nele' )
( cd "$dir4" && git checkout -q workflow && git rebase main > /dev/null 2>&1 )
saida4="$(cd "$dir4" && bash "$RESOLVEDOR" 2>&1)"
codigo4=$?
conferir 'apagar do lado do commit resolve pela ausência (sai 0)' \
  "$([ "$codigo4" = "0" ] && echo 0 || echo 1)" "$saida4"
conferir '…e o arquivo do main fica (é a versão que o main tinha)' \
  "$([ -f "$dir4/indices/escolas/a.json" ] && echo 0 || echo 1)" 'ausente'

# ── 5. SEM CONFLITO REGISTADO: o resolvedor não finge que resolveu ────────
dir5="$(mktemp -d)/repo"
preparar "$dir5"
( cd "$dir5" && bash "$RESOLVEDOR" > /dev/null 2>&1 )
conferir 'sem conflito registado, sai 1 em vez de fingir' \
  "$([ "$?" = "1" ] && echo 0 || echo 1)" 'saiu 0'

echo ''
if [ "$falhas" = "0" ]; then
  echo "TUDO CERTO — $n asserções, 0 falha(s)."
  exit 0
fi
echo "FALHOU — $falhas de $n asserção(ões)."
exit 1
