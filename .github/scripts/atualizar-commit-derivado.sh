#!/usr/bin/env bash
# =============================================================================
# atualizar-commit-derivado.sh — actualiza O COMMIT DESTE JOB, nunca o de outra pessoa.
#
# POR QUE ESTE ARQUIVO EXISTE (22/10/2026).
#
# Os três laços de publicação (`regerar-indices.yml`, `reancorar.yml`, `gerar-ciclo.yml`) fazem
# a mesma coisa depois de um rebase: regeram o derivado e «actualizam» o commit com
# `git commit --amend --no-edit`. Isso ASSUME que o topo do ramo é o commit que o job criou.
# A suposição é falsa em pelo menos um caso — e ele aconteceu:
#
#   o commit do job só carrega `indices/`. O rebase tenta aplicá-lo sobre um `main` novo, o
#   derivado conflita, o `conflito-do-derivado.sh` fica com a versão do `main`... e o commit
#   fica VAZIO. O git, num rebase, DESCARTA o commit vazio e termina com o topo a ser o commit
#   do `main` — que é de outra pessoa. O `--amend` então reescreve ESSE commit, e o ramo deixa
#   de ser descendente do `main`: o push é recusado para sempre («non-fast-forward», depois
#   «behind»), e o job morre depois de oito tentativas.
#
#   Medido no run 39876375641 (`Regerar os índices`, 23/10/2026, 00:09 UTC): o log do próprio
#   job mostra oito tentativas, e no fim `[main fc9de92] chore(estrutura): reancorar a cadeia
#   das fontes alteradas` — a mensagem de OUTRO workflow, criada por este job.
#
# A REGRA: o commit novo é o do job quando o topo traz a MESMA mensagem que ele próprio gravou;
# caso contrário, o commit do job já não existe (o rebase o descartou) e o certo é CRIAR um
# novo. Nunca se amenda, e nunca se descarta, um commit que o job não criou.
#
# USO (de dentro de um laço de publicação, com o derivado já regerado e `git add` feito):
#     .github/scripts/atualizar-commit-derivado.sh <arquivo-de-mensagem>
#
#   → 0: o commit do job foi actualizado (ou descartado, se ficou vazio), ou um novo nasceu.
#   → 1: o topo do ramo não é deste job e não é o `main` — estado que não se sabe desfazer.
#        Falhar é o correcto: reescrever história alheia é pior do que um job vermelho.
# =============================================================================
set -euo pipefail

arquivo="${1:-}"
if [ -z "$arquivo" ] || [ ! -f "$arquivo" ]; then
  echo "uso: atualizar-commit-derivado.sh <arquivo-de-mensagem>" >&2
  exit 2
fi

assunto="$(head -1 "$arquivo")"
if [ -z "$assunto" ]; then
  echo "erro: o arquivo de mensagem está vazio ($arquivo)" >&2
  exit 2
fi

# Sem nada no índice não há o que actualizar — e um `--amend` aqui só criaria um commit vazio.
if git diff --cached --quiet; then
  echo "o derivado regerado não mudou nada — nada a commitar"
  exit 0
fi

# 1) O TOPO É O `main`: o rebase descartou o commit do job (ficou vazio). Nasce outro.
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
  echo "o commit do job ficou vazio no rebase — nasce um commit novo sobre o main"
  git commit -F "$arquivo"
  exit 0
fi

# 2) O TOPO TEM A MENSAGEM DESTE JOB: é o nosso commit, reaplicado. Actualiza-se.
if [ "$(git log -1 --format=%s)" = "$assunto" ]; then
  # A REGENERAÇÃO PODE DAR O QUE O PAI JÁ TRAZ (19/10/2026): aí o commit fica vazio, e
  # `git commit --amend` recusa («would make it empty»). Commit vazio é o resultado CERTO —
  # descarta-se o commit, não a correcção. `--soft` move só o ponteiro.
  if git diff --cached --quiet HEAD^; then
    echo "o derivado regerado é o que o main novo já tinha — commit dispensado"
    git reset --soft HEAD^
  else
    git commit --amend --no-edit
  fi
  exit 0
fi

# 3) NEM UMA COISA NEM OUTRA. O ramo local tem um commit de outro dono no topo — o estado que
#    o `--amend` cego produzia. Reescrevê-lo propagaria o defeito; parar diz onde ele está.
echo "erro: o topo do ramo não é o commit deste job nem o main — não vou amendar história alheia." >&2
echo "  topo:      $(git log -1 --format='%h %s')" >&2
echo "  esperado:  $assunto" >&2
echo "  main:      $(git log -1 --format='%h %s' origin/main)" >&2
exit 1
