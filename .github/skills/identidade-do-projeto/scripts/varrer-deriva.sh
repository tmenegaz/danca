#!/usr/bin/env bash
# ============================================================================
# varrer-deriva.sh — varre os pontos de entrada do Projeto Ciclo atrás de
# deriva de identidade ("projeto de mestrado", "agnóstico", "FIPP" sem ressalva).
#
#   uso: scripts/varrer-deriva.sh [raiz-do-repositorio]
#
# Somente LEITURA. Não escreve, não corrige, não gera hash.
#
# Saída: cada achado como `arquivo:linha: texto`. O script NÃO julga — o achado
# pode ser legítimo (nome de cadeia, campo parentHash, citação com ressalva).
# A classificação (deriva / legítimo / suspeita) é do humano ou do agente.
#
# Termos de deriva (identidade errada):
#   mestrado      — quando este repo é descrito COMO o projeto de mestrado
#   agnóstico     — quando o agnosticismo é atribuído A ESTE projeto
#   FIPP          — quando o FIPP é descrito como implementado AQUI
#
# Os três aparecem legitimamente em vários documentos; leia o contexto da linha.
#
# A FRONTEIRA DE PALAVRA em `agnóstic` não é enfeite (15/10/2026): sem ela o padrão
# casa DENTRO de «Diagnóstico» — e o documento de planejamento do produto, que diz
# «Diagnóstico» a cada parágrafo, passava a ser acusado inteiro pela varredura. Um
# aviso que soa em todo lugar é ruído, e o ruído é o que faz a deriva de verdade
# passar despercebida: `\b` exclui o «Di» e mantém o achado legítimo.
# ============================================================================
set -uo pipefail

# Raiz: 1) argumento; 2) raiz do repositório Git; 3) cwd.
if [ "$#" -ge 1 ]; then
  RAIZ="$1"
elif git rev-parse --show-toplevel >/dev/null 2>&1; then
  RAIZ="$(git rev-parse --show-toplevel)"
else
  RAIZ="$PWD"
fi
cd "$RAIZ" || { echo "erro: raiz inacessível: $RAIZ" >&2; exit 1; }

PADROES=(AGENTS.md README.md README-ciclos.md METODO.md CONGELAMENTO.md
         PROTOCOLO.md REGRAS.md HANDOFF.md)
PADROES+=(IDEIA-*.md ARQUITETURA-*.md)

existentes=()
for p in "${PADROES[@]}"; do
  [ -f "$p" ] && existentes+=("$p")
done

printf 'raiz: %s\n' "$RAIZ"
printf 'pontos de entrada encontrados: %d\n\n' "${#existentes[@]}"

if [ "${#existentes[@]}" -eq 0 ]; then
  echo "aviso: nenhum ponto de entrada nesta raiz — passe a raiz do repositório." >&2
  echo "       uso: scripts/varrer-deriva.sh /caminho/do/repositorio" >&2
  exit 2
fi

printf '== deriva de identidade (mestrado | agnóstico | agostico) ==\n'
grep -nE 'mestrado|\bagnóstic|\bagnostico' "${existentes[@]}" 2>/dev/null || echo '  (nenhum)'

printf '\n== FIPP — confira a ressalva de escopo em cada contexto ==\n'
grep -nE 'FIPP' "${existentes[@]}" 2>/dev/null || echo '  (nenhum)'

printf '\n== .github/ (agentes, instructions, prompts) ==\n'
if [ -d .github ]; then
  # Exclui a própria skill: ela cita os termos de deriva por definição.
  grep -rnE 'mestrado|\bagnóstic|\bagnostico|FIPP' .github \
    --exclude-dir=skills 2>/dev/null || echo '  (nenhum)'
else
  echo '  (.github/ ausente nesta raiz)'
fi

printf '\nLembrete: achado sem ressalva de escopo é suspeita, não violação.\n'
printf 'Confira a decisão congelado/gerado/livre em references/pontos-de-entrada.md.\n'
