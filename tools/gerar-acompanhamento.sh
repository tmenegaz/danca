#!/usr/bin/env bash
# ============================================================================
# gerar-acompanhamento.sh — vista por aluna de um ciclo (memória visitável).
#
# uso:  tools/gerar-acompanhamento.sh [<professor>] <ciclo> <variante>
#       tools/gerar-acompanhamento.sh [<professor>] <ciclo> <variante> --criptografar
#
# --criptografar: criptografa (PageCrypt) os acompanhamento-*.html já escritos
# no pacote. É um modo separado porque o HTML nasce no gerar-ciclo.sh, a partir
# dos .md escritos aqui — o gerador chama este modo DEPOIS da conversão e ANTES
# da validação do pacote. A senha mora em tools/.senhas-locais (não versionado)
# ou é pedida no terminal; nunca entra no repositório, que é público.
#
# Para cada aluna do PO, escreve
#   professores/<p>/ciclos/ciclo-XX-<escola>-acompanhamento-<aluna>.md
# com linha de base, linha do tempo por aula, estado atual e diferenças.
#
# Fontes (somente leitura): o PO do ciclo e os relatórios pós-aula.
#   - apelidos:        do PO (sujeitos), nunca nome próprio (P-12)
#   - linha de base:   do PO
#   - por aula:        das tabelas "Técnica", "Funcional", "Musicalidade" e
#                      "Estado da aula" do relatório da aula
#
# DETERMINISMO: nada aqui carrega data de geração. A data que aparece é a da
# AULA, lida do relatório. Rodar duas vezes produz o mesmo arquivo — é o que
# torna o documento uma vista conferível, e não um instantâneo.
#
# O acompanhamento NÃO entra no hash da âncora: ele é derivado (PO + relatórios), e
# o hash cobre as fontes. Ver tools/lib-fontes.sh.
# ============================================================================

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

# modo: escrever os .md (padrão) ou criptografar os .html já gerados
MODO="gerar"
if [ "$#" -gt 0 ]; then
  resto=()
  for a in "$@"; do
    case "$a" in
      --criptografar) MODO="criptografar" ;;
      *) resto+=("$a") ;;
    esac
  done
  if [ "${#resto[@]}" -gt 0 ]; then set -- "${resto[@]}"; else set --; fi
fi

PROFESSOR_SLUG="tiago"  # default histórico `tiago` — pendente desde 02/10/2026 (passe o professor; o único ciclo ativo é o de `fokini`)
if [ "$#" -ge 3 ] && ! printf '%s' "${3:-}" | grep -q '^--'; then
  PROFESSOR_SLUG="$1"; shift
fi
CICLO="${1:-01}"
ESCOLA_SLUG="${2:-}"

BASE="professores/$PROFESSOR_SLUG/ciclos"
REL="professores/$PROFESSOR_SLUG/relatorios/ciclo-$(printf '%02d' "$CICLO")"
PO="$BASE/ciclo-$CICLO-$ESCOLA_SLUG-po.md"

[ -f "$PO" ] || { echo "erro: PO não encontrado: $PO" >&2; exit 1; }
ID="ciclo-$CICLO-$ESCOLA_SLUG"

# --- apelidos, do PO --------------------------------------------------------
# Aceita as duas formas em uso: a linha "Apelidos estáveis (P-12): ..." (com
# sufixo explicando a correspondência) e a lista em negrito nos sujeitos.
apelidos() {
  local secao lista
  # as linhas são unidas antes de procurar: o PO quebra a lista em duas linhas
  secao="$(sed -n '/^## Sujeitos/,/^## /p' "$PO" | tr '\n' ' ' | sed 's/  */ /g')"
  lista="$(printf '%s\n' "$secao" | grep -oE '\*\*[^*]+\*\*' | grep ',' | tail -1)" || true
  [ -n "$lista" ] || return 0
  printf '%s' "$lista" | sed 's/^\*\*//; s/\*\*$//' \
    | tr ',' '\n' \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//; s/\.$//' \
    | sed 's/[[:space:]]*(.*)$//' \
    | grep -v '^$'
}

slug() {
  # transliteração explícita: `tr` com conjunto multibyte deixa byte cru no nome
  printf '%s' "$1" | sed 'y/ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç/AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc/' \
    | tr 'A-Z' 'a-z' | tr ' ' '-' | sed 's/[^a-z0-9-]//g'
}

# --- linha de base de uma aluna, do PO --------------------------------------
linha_de_base() {
  local aluna="$1" secao bloco
  secao="$(sed -n '/^### Linha de base por aluna/,$p' "$PO" | sed -n '1,/^## /p')"
  [ -n "$secao" ] || secao="$(sed -n '/^## Linha de base/,/^## /p' "$PO")"
  # bloco que começa pela aluna (com ou sem bullet, com ou sem negrito)
  bloco="$(printf '%s\n' "$secao" | grep -A2 -E "^[-*]? ?\*\*$aluna\*\*|^[-*] ?$aluna\b" | head -3 \
    | sed 's/^[-*] //; s/\*\*//g')" || true
  if [ -n "$bloco" ]; then printf '%s' "$bloco"; else printf '%s' '[Preencher: linha de base individual não localizada no PO.]'; fi
}

# --- restrições físicas (P-22), quando existirem ----------------------------
restricoes() {
  local aluna="$1" secao linha
  secao="$(sed -n '/Restrições físicas declaradas (P-22)/,/^## /p' "$PO" 2>/dev/null)"
  if [ -z "$secao" ]; then printf '%s' 'nada declarado no PO.'; return; fi
  linha="$(printf '%s\n' "$secao" | grep -E "^\| \*\*$aluna\*\* \|" | head -1)" || true
  if [ -n "$linha" ]; then
    printf '%s' "$linha" | awk -F'|' '{print $3}' | sed 's/^ //; s/ $//'
  else
    printf '%s' 'nada declarado no PO.'
  fi
}

# --- dos relatórios ---------------------------------------------------------
relatorios_da_escola() {
  ls -1 "$REL"/aula-*-"$ESCOLA_SLUG".md 2>/dev/null | sort || true
}

# valor da célula da aluna numa tabela do relatório, dado o texto do título
celula() {
  local arq="$1" titulo="$2" aluna="$3" linha
  linha="$(awk -v t="$titulo" '
    /^#/ && index($0, t) > 0 { dentro=1; next }
    dentro && /^#/ { exit }
    dentro && /^\|/ { print }
  ' "$arq" | grep -E "^\| \*{0,2}$aluna\*{0,2} \|" | head -1)" || true
  if [ -z "$linha" ]; then printf '%s' '[aluna ausente nesta aula]'; return; fi
  printf '%s' "$linha" | sed 's/^|//; s/|$//' | awk -F'|' '{for (i=2;i<=NF;i++){gsub(/^ +| +$/,"",$i); printf (i>2?" · ":""); printf "%s", $i}}'
}

# nota "**Nota sobre <aluna> — ...**", quando o relatório tiver
nota_sobre() {
  local arq="$1" aluna="$2"
  awk -v a="$aluna" '
    $0 ~ "\\*\\*Nota sobre " a { dentro=1 }
    dentro { print; if (/^$/ && NR>1) exit }
  ' "$arq" | sed 's/^\*\*Nota sobre [^*]*\*\* //' | tr '\n' ' ' | sed 's/  */ /g; s/ $//'
}

# primeira linha "| ... |" do bloco (o cabeçalho da tabela)
cabecalho() {
  local arq="$1" titulo="$2"
  awk -v t="$titulo" '
    /^#/ && index($0, t) > 0 { dentro=1; next }
    dentro && /^#/ { exit }
    dentro && /^\|/ { print; exit }
  ' "$arq" | sed 's/^|//; s/|$//' | awk -F'|' '{for (i=1;i<=NF;i++){gsub(/^ +| +$/,"",$i); printf (i>1?" | ":""); printf "%s", $i}}'
}

linha_do_tempo() {
  local aluna="$1" R n data nota
  if [ "$N_REL" -eq 0 ]; then
    printf '> *Nenhum relatório pós-aula registrado ainda. A linha do tempo será\n'
    printf '> preenchida à medida que as aulas acontecerem.*\n'
    return
  fi
  printf '%s\n' "$RELATORIOS" | while IFS= read -r R; do
    [ -n "$R" ] || continue
    n="$(basename "$R" | sed -n 's/^aula-\([0-9][0-9]\)-.*/\1/p')"
    data="$(sed -n 's/^data:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$R" | head -1)"
    printf '### Aula %s — %s\n\n' "$n" "$data"
    printf -- '- **Técnica:** %s\n' "$(celula "$R" 'Técnica' "$aluna")"
    printf -- '- **Funcional:** %s\n' "$(celula "$R" 'Funcional' "$aluna")"
    printf -- '- **Musicalidade:** %s\n' "$(celula "$R" 'Musicalidade' "$aluna")"
    printf -- '- **Estado da aula:** %s\n' "$(celula "$R" 'Estado da aula' "$aluna")"
    nota="$(nota_sobre "$R" "$aluna")"
    [ -n "$nota" ] && printf '\n> %s\n' "$nota"
    printf '\n'
  done
}

ultimo_relatorio() { printf '%s\n' "$RELATORIOS" | grep . | tail -1; }

# --- a senha da escola: a definição mora em tools/lib-senhas.sh --------------
# Ela saiu daqui quando o gerar-ciclo.sh também passou a precisar dela (o JSON de dados vai cifrado
# para o pacote). Uma definição só — como o lib-fontes.sh —, e a senha continua fora do repositório.
# shellcheck source=tools/lib-senhas.sh
. "$RAIZ/tools/lib-senhas.sh"

criptografar() {
  local conf="$BASE/ciclo-$CICLO-$ESCOLA_SLUG.conf"
  local pacote="$BASE/$ID"
  local declarado senha bin f tmp n=0
  local arquivos=()

  if [ ! -f "$conf" ]; then
    echo "erro: manifesto não encontrado: $conf" >&2
    return 1
  fi
  declarado="$(sed -n 's/^ACOMPANHAMENTO_CRIPTOGRAFADO="\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$conf" | head -1)"
  if [ "$declarado" != "sim" ]; then
    echo "acompanhamento: criptografia não declarada em $(basename "$conf") — HTML fica aberto"
    return 0
  fi
  [ -d "$pacote" ] || { echo "erro: pacote não encontrado: $pacote" >&2; return 1; }

  for f in "$pacote"/acompanhamento-*.html; do
    [ -f "$f" ] && arquivos+=("$f")
  done
  if [ "${#arquivos[@]}" -eq 0 ]; then
    echo "acompanhamento: nenhum HTML de acompanhamento em $ID"
    return 0
  fi

  senha="$(senha_da_escola)" || return 1

  bin="$RAIZ/node_modules/.bin/pagecrypt"
  if [ -x "$bin" ]; then
    :
  elif command -v npx >/dev/null 2>&1; then
    bin="npx pagecrypt"
  else
    echo "erro: pagecrypt ausente — npm install --save-dev pagecrypt" >&2
    return 1
  fi

  for f in "${arquivos[@]}"; do
    if grep -qE 'AES-GCM|PBKDF2|Protected Page' "$f" 2>/dev/null; then
      echo "erro: $(basename "$f") já está cifrado — regenere o HTML antes (tools/gerar-ciclo.sh)" >&2
      return 1
    fi
    tmp="$(mktemp)"
    if $bin "$f" "$tmp" "$senha" >/dev/null 2>&1 && [ -s "$tmp" ]; then
      mv "$tmp" "$f"
      echo "  criptografado: $(basename "$f")"
      n=$((n + 1))
    else
      rm -f "$tmp"
      echo "erro: pagecrypt falhou em $(basename "$f")" >&2
      return 1
    fi
  done
  echo "acompanhamento: $n arquivo(s) criptografado(s) — $ESCOLA_SLUG"
}

if [ "$MODO" = "criptografar" ]; then
  criptografar
  exit $?
fi

# --- escrita ----------------------------------------------------------------
RELATORIOS="$(relatorios_da_escola)"
N_REL="$(printf '%s\n' "$RELATORIOS" | grep -c . || true)"
ESCOLA_NOME="$(sed -n 's/^ESCOLA="\(.*\)"/\1/p' "$BASE/ciclo-$CICLO-$ESCOLA_SLUG.conf" | head -1)"
[ -n "$ESCOLA_NOME" ] || ESCOLA_NOME="$ESCOLA_SLUG"
N_ALUNAS="$(apelidos | grep -c . || true)"
echo "acompanhamento: $ID · $N_ALUNAS aluna(s) · $N_REL relatório(s)"

apelidos | while IFS= read -r ALUNA; do
  [ -n "$ALUNA" ] || continue
  ARQ="$BASE/$ID-acompanhamento-$(slug "$ALUNA").md"
  {
    printf -- '---\n'
    printf 'projeto: Formação em Balé Clássico\nfrente: Acompanhamento\n'
    printf 'ciclo: "%s"\nescola: %s\naluna: %s\n' "$CICLO" "$ESCOLA_NOME" "$ALUNA"
    printf 'title: "Acompanhamento — %s"\n' "$ALUNA"
    printf -- '---\n\n# Acompanhamento — %s\n\n' "$ALUNA"
    printf '> **Material do professor.** Acompanha a evolução individual ao longo do ciclo,\n'
    printf '> gerado do PO (linha de base) e dos relatórios pós-aula, e regenerado sob\n'
    printf '> demanda — não se escreve à mão. O detalhe de uma aula está no relatório dela.\n\n'
    printf '## Linha de base\n\n*(Declarada antes da primeira aula — fonte: PO do ciclo.)*\n\n'
    printf '%s\n\n' "$(linha_de_base "$ALUNA")"
    printf '**Restrições físicas (P-22):** %s\n\n' "$(restricoes "$ALUNA")"
    printf '## Linha do tempo\n\n'
    linha_do_tempo "$ALUNA"
    printf '## Estado atual\n\n'
    UM="$(ultimo_relatorio)" || true
    if [ -n "$UM" ]; then
      printf '*(Última observação registrada — fonte: relatório da aula %s, de %s.)*\n\n' \
        "$(basename "$UM" | sed -n 's/^aula-\([0-9][0-9]\)-.*/\1/p')" \
        "$(sed -n 's/^data:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$UM" | head -1)"
      printf -- '- **Técnica:** %s\n' "$(celula "$UM" 'Técnica' "$ALUNA")"
      printf -- '- **Funcional:** %s\n' "$(celula "$UM" 'Funcional' "$ALUNA")"
      printf -- '- **Musicalidade:** %s\n' "$(celula "$UM" 'Musicalidade' "$ALUNA")"
      printf -- '- **Estado da aula:** %s\n\n' "$(celula "$UM" 'Estado da aula' "$ALUNA")"
    else
      printf 'Nenhum relatório registrado ainda — não há estado a mostrar.\n\n'
    fi
    printf '## Diferenças observadas em relação à linha de base\n\n'
    printf '*(Descritivo. Não classifica: uma aula não é evolução — é estado. O que difere\n'
    printf 'da linha de base está abaixo, sem juízo sobre melhora ou piora.)*\n\n'
    if [ -n "$UM" ]; then
      CAB="$(cabecalho "$UM" 'Estado da aula')"
      printf '| %s |\n' "$CAB"
      printf '|%s\n' "$(printf '%s' "$CAB" | awk -F' \\| ' '{for (i=1;i<=NF;i++) printf "---|"}')"
      printf '| %s |\n\n' "$(celula "$UM" 'Estado da aula' "$ALUNA")"
      printf 'O detalhe de cada aula está na linha do tempo, acima.\n'
    else
      printf '[relatório pendente] — sem relatório, não há diferença a observar.\n'
    fi
  } > "$ARQ"
  echo "  escreveu: $(basename "$ARQ")"
done
