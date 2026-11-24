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
#
# MUDANÇA DE 25/10/2026 — O HANDOFF PASSA A APONTAR PARA A FOTOGRAFIA (declarado).
# Motivo: nasceu ao lado dele o ESTADO-ATUAL.md, a fotografia CURADA do estado (o que
# funciona, o que não, o que está decidido, o que é hipótese), com etiquetas factuais
# — CONFIRMADO / DECLARADO / DECIDIDO / HIPÓTESE / PENDENTE. Os dois respondem a
# perguntas diferentes e o risco real era ficarem dois donos do mesmo assunto: sem a
# fronteira escrita, uma sessão nova lê os dois, encontra divergência (o HANDOFF tem
# a data de geração, a fotografia tem a data da curadoria) e não sabe em qual crer.
# A divisão que fica valendo: ESTE arquivo extrai (commit, professores, ciclos,
# âncoras, última entrada do REGISTRO); a FOTOGRAFIA julga. Por isso o cabeçalho
# ganhou uma linha apontando para ela, logo abaixo do «Para: sessão nova».
# O script continua a NÃO escrever análise (P-06) — o que ele acrescenta é uma
# referência, não um juízo. Motivo registado no REGISTRO.md, entrada de 25/10/2026.
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
# `variantes` nasce VAZIA. Ela é preenchida dentro do laço de professores (abaixo) e usada no
# resumo final — mas com ZERO professores o laço não roda e, sob `set -u`, o resumo quebrava
# («variantes: variável não associada»). Descoberto em 15/10/2026, quando as duas escolas de
# teste foram expurgadas: é o estado de um repositório recém-nascido, e o HANDOFF é o primeiro
# artefato que uma sessão nova lê.
variantes=""

# --- ideias documentadas (IDEIA-*.md e ARQUITETURA-*.md na raiz) -------------
# Uma ideia é documento de INTENÇÃO, não de estado: fica fora do CONGELAMENTO, e
# o HANDOFF só precisa dizer que ela existe — para a próxima sessão não ter de
# reconstruir a conversa que a gerou. O resumo vem da linha que o próprio
# documento declara (`> **Resumo (para o HANDOFF):**`); sem ela, vale o título.
# Dois padrões de propósito: `IDEIA-*` (o porquê) e `ARQUITETURA-*` (o como) —
# pares de documentos sobre a mesma ideia. `PLANEJAMENTO-*` (14/10/2026) é o
# terceiro: o MAPA DE EVOLUÇÃO do produto (as frentes de trabalho, com escopo e
# critérios) — nem intenção solta nem arquitetura, o plano do que vem.
ideias="$(ls -1 IDEIA-*.md IDEIAS-*.md ARQUITETURA-*.md PLANEJAMENTO-*.md 2>/dev/null || true)"

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

# OS ARQUIVOS ANUAIS DO REGISTRO (24/11/2026) — a partição do ficheiro único.
#
# Até 24/11/2026 havia um `REGISTRO.md` de 4,3 MB e 60 173 linhas. Passou a haver um `REGISTRO.md`
# que é ÍNDICE e um `REGISTRO-<ANO>.md` por ano, com as entradas. Este script lê os ANUAIS — o
# índice não tem entrada nenhuma (não tem um único `## `), e lê-lo daria «última entrada» vazia.
#
# A ORDEM É A DO NOME, e é isso que faz o ano novo entrar no fim sem ninguém editar isto: `sort`
# põe `REGISTRO-2026.md` antes de `REGISTRO-2027.md`. O `awk` de baixo trata os ficheiros como um
# fluxo só, portanto a «última entrada» continua a ser a do último ano.
#
# Compatibilidade: um repositório anterior à partição (só `REGISTRO.md`) continua a funcionar, e um
# repositório já partido não lê o índice. As duas coisas ao mesmo tempo não acontecem hoje, e a
# ordem da lista resolve o caso se acontecerem.
registros=()
while IFS= read -r f; do registros+=("$f"); done < <(ls -1 REGISTRO-*.md 2>/dev/null | LC_ALL=C sort)
if [ "${#registros[@]}" -eq 0 ] && [ -f REGISTRO.md ]; then
  registros=(REGISTRO.md)
fi

{
  echo "# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)"
  echo
  echo "Gerado em: \`$data_iso\`"
  echo "Commit atual: \`$commit_curto\` — $commit_msg"
  echo "Para: sessão nova (retomar o diálogo)"
  echo
  echo "**Este arquivo EXTRAI; não julga.** O que se pode afirmar sobre o estado — o que"
  echo "funciona, o que não, o que está decidido, o que é ainda hipótese — está em"
  echo "\`ESTADO-ATUAL.md\`, a fotografia curada, com etiquetas factuais. Leia-o depois deste:"
  echo "aqui está onde o repositório está; lá está o que se pode dizer dele."
  echo
  echo "## O que é este projeto"
  echo
  echo "**Nome comercial:** o produto é o **Sistema Lastro** — e este repositório é o **Projeto"
  echo "Ciclo**, o protótipo a partir do qual ele se constrói. Os dois nomes convivem, e a"
  echo "convivência é declarada (não é renomeação): **Lastro** é a marca curta; **Sistema Lastro**"
  echo "é o sistema como um todo; **Plataforma Lastro** destaca a solução tecnológica; e"
  echo "\`Lastro — Sistema de Memória e Observabilidade Pedagógica em Dança\` é a **proposta** de"
  echo "denominação descritiva (proposta, não subtítulo confirmado). O conceito central não muda:"
  echo "o Lastro **registra e organiza evidências para apoiar a reflexão pedagógica; não substitui"
  echo "o professor nem toma decisões sobre o aluno.** O mapa de evolução do produto está em"
  echo "\`PLANEJAMENTO-LASTRO.md\`."
  echo
  echo "**A memória da aula dada** — cada aula é **planejada** antes de ser dada: o plano"
  echo "(\`aula-NN.md\`, fonte da âncora) fixa objetivo, marcos e volume, e é ele que dá a"
  echo "**linha de base**. O que se registra é o processo de ensino-aprendizagem que de fato"
  echo "se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda."
  echo
  echo "- **Planejar e registrar são coisas distintas — e as duas acontecem.** O plano é"
  echo "  **intenção** (editável enquanto a aula está \`planejada\`); depois que a aula acontece,"
  echo "  o registro passa a **fato** e só se acrescenta ajuste (\`ARQUITETURA-AULA.md\`). O"
  echo "  estado é **derivado** do cronograma, do prazo e do registro — não existe campo"
  echo "  \"aula dada\". O formulário de lançamento **consome o plano** como"
  echo "  entrada: sem ele não há marco da aula nem \"o que mudou em relação ao plano\"."
  echo
  echo "- **Não é o projeto de mestrado** (outro diretório, de onde vêm o PO e o FIPP)."
  echo "- **Não implementa o FIPP**: o \`.fipp\` daqui é uma **âncora de proveniência"
  echo "  encadeada** (\`tools/hash-ciclo.sh\`), aproximação do framework — não ele."
  echo "- **PROTÓTIPO, testado no universo da dança** — este projeto **não é agnóstico**; o"
  echo "  projeto agnóstico será criado a partir dele. Nenhum ciclo é igual a outro, nenhuma"
  echo "  aula é igual a outra — nem com o mesmo professor."
  echo "- **Não avalia** — registra o cotidiano do professor; a avaliação é fronteira de"
  echo "  outro módulo, ainda não desenhado."
  echo "- **Proveniência acrescenta, não edita**: um ajuste é um elo novo, nunca sobrescrita."
  echo "- **A integração ainda não existe** — com o projeto das secretarias não foram"
  echo "  desenhadas nem a fronteira de entrada nem a de saída."
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
  if [ "${#registros[@]}" -gt 0 ]; then
    awk '/^## /{bloco=$0"\n"; conteudo=""} /^## /{proximo=1; next} proximo{conteudo=conteudo $0 "\n"} END{printf "%s%s", bloco, conteudo}' "${registros[@]}"
  else
    echo "(REGISTRO ainda não existe)"
  fi
  echo
  echo "## O que está pendente"
  echo
  if [ "${#registros[@]}" -gt 0 ]; then
    awk -v n=5 '
    # F1 — colheita limitada de pendências + índice das anteriores.
    # n = blocos recentes emitidos por inteiro (default 5).

    function normdata(s) {
      if (match(s, /^[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9]/))
        return substr(s, 1, 10)
      if (match(s, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/))
        return substr(s, 9, 2) "/" substr(s, 6, 2) "/" substr(s, 1, 4)
      return ""
    }

    function encurtar(s,   c) {
      if (length(s) <= 60) return s
      c = substr(s, 1, 60)
      if (match(c, /^.* /)) c = substr(c, 1, RLENGTH - 1)
      return c "…"
    }

    BEGIN { if (n == "") n = 5 }

    /^## / {
      dentro = 0
      nent++
      ent_ini[nent] = FNR
      ent_arq[nent] = FILENAME
      ent_tit[nent] = substr($0, 4)
      ent_dat[nent] = normdata(ent_tit[nent])
      next
    }

    /^\*\*O que ainda n/ {
      dentro = 0
      nb++
      blk_ent[nb] = nent
      blk_buf[nb] = ""
      s = $0
      sub(/^\*\*[^*]*\*\*[ \t]*/, "", s)
      if (s != "") blk_buf[nb] = s "\n"
      if (index($0, "~~") > 0) blk_risc[nb] = 1
      dentro = 1
      next
    }

    /^\*\*/ { dentro = 0; next }

    dentro {
      blk_buf[nb] = blk_buf[nb] $0 "\n"
      if (index($0, "~~") > 0) blk_risc[nb] = 1
    }

    END {
      ini = nb - n + 1
      if (ini < 1) ini = 1

      for (i = ini; i <= nb; i++) {
        e = blk_ent[i]
        t = blk_buf[i]
        while (substr(t, length(t), 1) == "\n") t = substr(t, 1, length(t) - 1)
        printf "## %s\n\n", ent_tit[e]
        printf "%s\n\n", t
      }

      if (ini > 1) {
        printf "## Pendências anteriores (índice)\n\n"
        for (i = 1; i < ini; i++) {
          e = blk_ent[i]
          nome = ent_tit[e]
          sub(/^[0-9\/-]+[ \t]+/, "", nome)
          sub(/^[^ \t]+[ \t]+/, "", nome)
          d = ent_dat[e]
          if (d == "") d = substr(ent_tit[e], 1, 10)
          printf "- **%s** — %s → `%s` L%d%s\n", d, encurtar(nome), ent_arq[e], ent_ini[e], (blk_risc[i] ? " *(superado)*" : "")
        }
      }
    }
    ' "${registros[@]}"
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
      aulas_escritas="$(find "professores/$p/ciclos" -maxdepth 1 \( -name "ciclo-$c-aula-*.md" -o -name "ciclo-$c-*-aula-*.md" \) ! -name "*captura*" 2>/dev/null | wc -l)"
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
  echo "- \`professores/<nome>/ciclos/ciclo-XX-<escola>.fipp\` — âncoras de proveniência"
  echo "- \`departamentos/\` — PO de departamento, quando a escola tiver metodologia comum (P-14)"
  echo "- \`biblioteca/guia-do-professor.md\` — o guia de posição (departamento ou PO próprio)"
  echo
  echo "## Como retomar"
  echo
  echo "A próxima sessão deve ler, nesta ordem:"
  echo "1. este arquivo;"
  echo "2. \`PROTOCOLO.md\`;"
  echo "3. as últimas 5 entradas de \`REGISTRO.md\` — não o arquivo inteiro;"
  echo "4. o PO do ciclo ativo."
  echo
  echo "Isso é suficiente para retomar o diálogo sem reconstruir contexto."
  echo
  echo "Acima: a última entrada do \`REGISTRO.md\` por inteiro, as pendências recentes e o"
  echo "índice das anteriores. Consultar o índice antes de abrir o \`REGISTRO.md\` para"
  echo "pendência antiga."
} > "$SAIDA"

echo "gerado: $SAIDA"
echo "  commit: $commit_curto — $commit_msg"
echo "  regras: $total_regras | pétreas: $total_petreas | variantes: $(printf '%s' "$variantes" | wc -w)"
