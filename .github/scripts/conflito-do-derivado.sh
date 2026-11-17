#!/usr/bin/env bash
# =============================================================================
# conflito-do-derivado.sh — resolve o conflito do que é DERIVADO, e falha no resto.
#
# POR QUE ESTE ARQUIVO EXISTE (22/10/2026).
#
# O `derivados.yml` e o `gerar-ciclo.yml` commitam com o `GITHUB_TOKEN`, que por desenho não
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
#
# OS DERIVADOS DO CHAMADOR (08/11/2026). O `indices/**` e o `*.fipp` são derivados de QUALQUER
# chamador. Há um terceiro que só o é para quem sabe regerá-lo: o PACOTE de um ciclo é saída de
# `tools/gerar-ciclo.sh`, e o `gerar-ciclo.yml` acabou de o correr. Quando é ele que está a
# rebasear, os arquivos do PRÓPRIO pacote (o PDF da aula, o PDF do ciclo, o `ciclos.json`, o
# `po-01.json`, o `index.html`…) são derivados — e resolver o conflito é refazê-los, nunca
# escolher um dos dois lados.
#
# O QUE ISTO CONSERTA, medido. A 08/11/2026 correram três gerações do mesmo ciclo em cinquenta
# segundos (o «Guardar» do PO disparava uma a cada gravação). A terceira perdeu a corrida e o
# rebase parou com «CONFLICT (content)» em `aula-01.pdf` e no PDF do ciclo — dois binários
# gerados, sem conteúdo a conciliar — e a execução morreu com «conflito de MATERIAL». O pacote
# ficou entregue pela metade: o `-po.md` de um PO, o `-dados.json` de outro.
#
# A FRONTEIRA CONTINUA A EXISTIR: só os caminhos declarados em `$DERIVADOS_DO_CHAMADOR` (uma
# pasta por linha, prefixo) são tratados assim — e só se lá estiverem. Qualquer outro conflito
# continua a ser MATERIAL, e o rebase continua a abortar, como deve.
eh_derivado() {
  case "$1" in
    indices/*) return 0 ;;        # tools/gerar-indices.js
    *.fipp) return 0 ;;           # tools/hash-ciclo.sh
  esac
  while IFS= read -r prefixo; do
    [ -n "$prefixo" ] || continue
    case "$1" in "$prefixo"*) return 0 ;; esac
  done <<< "${DERIVADOS_DO_CHAMADOR:-}"
  return 1
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
n_pacote=0
while IFS= read -r caminho; do
  [ -n "$caminho" ] || continue
  case "$caminho" in
    indices/*) resolver "$caminho" ours; n_indices=$((n_indices + 1)) ;;
    *.fipp)    resolver "$caminho" theirs; n_fipp=$((n_fipp + 1)) ;;
    *)
      # Os do PACOTE do chamador: fica a versão do `main`, e quem chamou REGERA. O `--ours` é o
      # mesmo critério do `indices/`: o que está a ser aplicado foi gerado sobre um estado que o
      # rebase vai mudar, e escolher entre duas saídas do mesmo gerador seria escolher o gerador
      # errado. Regenerar é a única resposta que não inventa.
      if eh_derivado "$caminho"; then
        resolver "$caminho" ours
        n_pacote=$((n_pacote + 1))
      fi
      ;;
  esac
done <<< "$conflitos"

echo "derivado conciliado: ${n_indices} arquivo(s) de indice (ficou o do main, sera regerado)," \
     "${n_fipp} ancora(s) (ficou a do commit, sera reancorada)," \
     "${n_pacote} arquivo(s) do pacote do chamador (ficou o do main, sera REGERADO)"
# A ÚLTIMA LINHA É PARA O CHAMADOR, e é legível por máquina: é ela que lhe diz se tem de voltar a
# correr o gerador. Uma frase para humanos obrigaria o workflow a fazer `grep` de prosa.
echo "pacote-do-chamador=${n_pacote}"
exit 0
