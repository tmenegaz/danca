#!/usr/bin/env bash
# =============================================================================
# conflito-do-derivado.sh — resolve o conflito do que é DERIVADO, e falha no resto.
#
# POR QUE ESTE ARQUIVO EXISTE (22/10/2026).
#
# O `reancorar.yml` e o `gerar-ciclo.yml` commitam com o `GITHUB_TOKEN`, que por desenho não
# redispara workflows — logo cada um regera `indices/` no próprio commit, porque ninguém o faria
# depois. Isso deu ao commit DOIS tipos de conteúdo, e só um deles se pode conciliar:
#
#   · o MATERIAL — o pacote gerado, as fontes, o que o workflow produz. Se dois workflows
#     escrevem o mesmo caminho, é um problema de desenho e o rebase TEM de falhar;
#   · o DERIVADO — `indices/**` (saída de `tools/gerar-indices.js`) e as âncoras `*.fipp`
#     (saída de `tools/hash-ciclo.sh`). Nenhum dos dois se escolhe nem se concilia: os dois são
#     RECALCULADOS sobre a árvore que o rebase deixar.
#
# A versão anterior tratava só o `.fipp`. Quando o `indices/` entrou no mesmo commit, o primeiro
# push recusado virou um vermelho com treze linhas de «conflito de conteúdo» que não eram conteúdo
# — medido em 22/10/2026 nos runs 39788794107 (`Reancorar`) e 39788790994 (`Gerar o ciclo`), com o
# «Guardar» do PO a disparar quarenta commits em quarenta segundos.
#
# A REGRA, numa frase: no rebase, o derivado fica com a versão que o `main` já tinha, e o chamador
# regera-o depois. É por isso que este script NÃO regera nada — ele devolve a árvore conciliável e
# sai; quem chama sabe qual é o seu gerador (um reancora, o outro reancora e regera o índice).
#
# USO (de dentro de um rebase parado):
#     .github/scripts/conflito-do-derivado.sh
#   → 0: todos os conflitos eram derivados, já resolvidos e marcados; o chamador faz
#        `git rebase --continue` e regera.
#   → 1: há conflito de MATERIAL. O script diz quais e NÃO toca em nada; o chamador aborta.
# =============================================================================
set -euo pipefail

# Um caminho é derivado quando o repositório o sabe refazer sozinho.
eh_derivado() {
  case "$1" in
    indices/*) return 0 ;;        # tools/gerar-indices.js
    *.fipp) return 0 ;;           # tools/hash-ciclo.sh
    *) return 1 ;;
  esac
}

conflitos="$(git diff --name-only --diff-filter=U || true)"
if [ -z "$conflitos" ]; then
  # Sem caminhos em conflito o rebase não está parado onde este script sabe agir. Dizer isso é
  # melhor do que sair 0 e deixar o chamador concluir que resolveu.
  echo "erro: o rebase está parado mas não há conflito registado — não sei o que fazer" >&2
  exit 1
fi

de_material=""
while IFS= read -r caminho; do
  [ -n "$caminho" ] || continue
  eh_derivado "$caminho" || de_material="${de_material}${caminho}"$'\n'
done <<< "$conflitos"

if [ -n "$de_material" ]; then
  echo "erro: conflito de MATERIAL — não se resolve automaticamente:" >&2
  printf '%s' "$de_material" >&2
  echo " (o derivado — indices/**, *.fipp — é o único que este script concilia)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# O DERIVADO. `--ours`, num rebase, é o ramo PARA ONDE se rebaseia (o `main`); `--theirs` é o
# commit que está a ser aplicado.
#
#   · `indices/**`  → `--ours`. O `main` já traz um índice válido do estado dele, e o que está a
#                     ser aplicado foi calculado sobre o estado ANTES. Conciliar os dois seria
#                     escolher linhas de um JSON gerado; o certo é ficar o do `main` e regerar.
#   · `*.fipp`      → `--theirs`, e depois o chamador reancora. A âncora do commit foi calculada
#                     sobre as fontes que ele carrega — e são essas fontes que vão passar a valer
#                     depois do rebase. Ficar com a do `main` seria ancorar o conteúdo errado.
#                     (É a regra que já existia desde 19/10/2026, e continua certa.)
#
# O `checkout` pode falhar quando o caminho não existe do lado escolhido (um lado apagou o
# arquivo). Nesse caso a resolução correcta é a AUSÊNCIA, e é isso que o `rm --cached` diz — sem
# inventar um conteúdo vazio.
# ---------------------------------------------------------------------------
resolver() {
  local caminho="$1" lado="$2"
  if git checkout --"$lado" -- "$caminho" 2>/dev/null; then
    git add -- "$caminho"
    return 0
  fi
  git rm -q -f --ignore-unmatch -- "$caminho"
  return 0
}

n_indices=0
n_fipp=0
while IFS= read -r caminho; do
  [ -n "$caminho" ] || continue
  case "$caminho" in
    indices/*) resolver "$caminho" ours; n_indices=$((n_indices + 1)) ;;
    *.fipp)    resolver "$caminho" theirs; n_fipp=$((n_fipp + 1)) ;;
  esac
done <<< "$conflitos"

echo "derivado conciliado: ${n_indices} arquivo(s) de indice (ficou o do main, sera regerado)," \
     "${n_fipp} ancora(s) (ficou a do commit, sera reancorada)"
exit 0
