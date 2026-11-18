#!/usr/bin/env bash
# ============================================================================
# hash-ciclo.sh — âncora de proveniência encadeada de um ciclo (P-03, P-04, P-08).
#
# A âncora deste repositório é uma APROXIMAÇÃO do FIPP do projeto de mestrado
# (outro diretório), que NÃO está implementado aqui. Ao falar dela, prefira
# "âncora de proveniência encadeada" a "FIPP" — ver a ressalva em README.md.
#
#   uso:
#     tools/hash-ciclo.sh [<professor>] <ciclo> <variante> [--check]
#
#   exemplos:
#     tools/hash-ciclo.sh fokini 01 diaghilev
#     tools/hash-ciclo.sh fokini 01 diaghilev --check
#     tools/hash-ciclo.sh 01 diaghilev             (assume o professor padrão — pendente desde 02/10/2026)
#
# O professor é o primeiro argumento quando há três ou mais (e o terceiro não é
# --check): assim os comandos antigos, sem professor, continuam valendo.
#
# Fórmula (conforme o paper do mestrado):
#
#   hash_conteudo = SHA256( fontes do ciclo, em ordem determinística LC_ALL=C )
#   hash_fipp     = SHA256( id + ":" + type + ":" + parentHash + ":" + conteudo )
#
#   id .......... "ciclo-01-diaghilev"   (identificador do artefato)
#   type ........ "Ciclo"          (tipo fixo)
#   parentHash .. hash da âncora do ciclo anterior, mesma variante (vazio no Ciclo 01)
#   conteudo .... hash das fontes
#
# A âncora POR AULA usa a MESMA fórmula, com id "ciclo-01-diaghilev-aula-01", type
# "Aula", parentHash VAZIO (a âncora de uma aula não encadeia com a da anterior) e
# conteudo restrito às fontes daquela aula. O campo ancorado_em fica FORA da
# fórmula, como o po_state: se entrasse, o --check — que recalcula o hash sobre as
# fontes vivas — falharia no dia seguinte à ancoragem.
#
# Cobertura: apenas FONTES — professores/<professor>/ciclos/ciclo-XX.conf,
# .../ciclo-XX-<variante>.conf e os .../ciclo-XX-*.md QUE NÃO SEJAM de outra
# escola. Como o PO é por escola (ciclo-XX-<escola>-po.md), a coleta exclui os .md
# que começam com o nome de outra variante: o hash do Duo não carrega o PO da
# Ritmos e vice-versa.
# As saídas (HTML, PDF) não entram: são reconstruíveis (P-04). Cada fonte entra
# precedida do seu caminho relativo, de modo que renomear ou trocar um arquivo
# também altere o hash.
#
# O arquivo .fipp é a ÂNCORA da cadeia e por isso é VERSIONADO — não é saída.
#
# Âncora POR AULA (ARQUITETURA-AULA.md §5.2, peça 5): além do .fipp do ciclo,
# cada aula com fonte própria ganha o seu — ciclo-XX-<escola>-aula-NN.fipp — e
# com ele a atribuição (a âncora da aula NN não tem par), a reancoragem cirúrgica
# (lançar a 03 não reancora o ciclo) e o corte antes/depois da aula, que é o que
# dá verificabilidade à regra do §1. O .fipp do ciclo NÃO muda: continua cobrindo
# todas as fontes, inclusive as das aulas. A peça é ADITIVA justamente para poder
# ancorar sobre o passado sem reescrevê-lo.
# ============================================================================

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

if [ "$#" -ge 3 ] && ! printf '%s' "${3:-}" | grep -q '^--'; then
  PROFESSOR="$1"
  shift
fi
PROFESSOR="${PROFESSOR:-tiago}"  # default histórico `tiago` — o professor do teste ativo (maria); passe o professor sempre

# O .conf sobrescreve PROFESSOR com o NOME DE EXIBIÇÃO ("Tiago Menegaz"), que não
# serve para reexecutar o script — o argumento é o diretório. Guardado aqui, antes
# do source, para as dicas de comando saírem executáveis.
PROFESSOR_DIR="$PROFESSOR"

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "uso: tools/hash-ciclo.sh [<professor>] <ciclo> <variante> [--check]" >&2
  exit 2
fi

CICLO_INFORMADO="$1"
VARIANTE="$2"
MODO="${3:-gerar}"

case "$MODO" in
  gerar|--check) ;;
  *) echo "erro: modo desconhecido '$MODO' (use --check ou nada)" >&2; exit 2 ;;
esac

# normaliza o ciclo para dois dígitos: 1 → 01, 10 → 10
CICLO="$(printf '%02d' "$CICLO_INFORMADO" 2>/dev/null || true)"
case "$CICLO" in
  [0-9][0-9]) ;;
  *) echo "erro: ciclo inválido '$CICLO_INFORMADO' (use 1, 01, 2, 02…)" >&2; exit 2 ;;
esac

BASE="professores/$PROFESSOR/ciclos"
CICLOS="$BASE"          # o nome que tools/lib-fontes.sh entende (aqui os caminhos são
                        # relativos de propósito: eles entram no texto hasheado)
CONF_BASE="$BASE/ciclo-$CICLO.conf"
CONF_VARIANTE="$BASE/ciclo-$CICLO-$VARIANTE.conf"
SCHEMA="$BASE/ciclo-$CICLO-schema.json"
ARQUIVO_FIPP="$BASE/ciclo-$CICLO-$VARIANTE.fipp"
ID="ciclo-$CICLO-$VARIANTE"
TIPO="Ciclo"
# A data da ancoragem é informativa: fica FORA da fórmula, como o po_state. Se
# entrasse, o --check — que recalcula o hash sobre as fontes VIVAS — passaria a
# falhar no dia seguinte à ancoragem, e o arquivo nunca mais fecharia.
ANCORADO_EM="$(date +%F)"
TIPO_AULA="Aula"

# O MANIFESTO BASE NÃO É OBRIGATÓRIO (22/10/2026) — e aqui isso vale mais do que no gerador,
# porque esta é a guarda que o `Reancorar a cadeia` encontra em TODOS os manifestos de variante
# do repositório (a matriz dele sai do glob `professores/*/ciclos/ciclo-*-*.conf`).
#
# O `ciclo-NN.conf` nasce em `tools/criar-escola.sh`, sob o professor que CRIA a escola. Uma
# turma pode estar na curadoria de outro professor: o plano dela é elicitado, `compor-conf.js`
# escreve a variante em `professores/<esse professor>/ciclos/`, e a base fica na pasta de quem
# criou a escola. Medido no run `39652992659`: «erro: manifesto base não encontrado:
# professores/murisoca-baiana/ciclos/ciclo-01.conf» — a âncora de um ciclo inteiro ficou sem
# fechar por causa de um arquivo que, depois de `compor-conf.js`, não declara nada que a
# variante já não diga (o `CICLO`, o `NOME`, o `OBJETIVO_GERAL`, o `DOCS`, o `TOTAL_AULAS`, a
# faixa de volume). O que se perde sem a base é conferido pelo schema, abaixo — e é ele que
# nomeia o campo que falta, em vez de reprovar por ausência de arquivo.
[ -f "$CONF_VARIANTE" ] || {
  echo "erro: manifesto da variante não encontrado: $CONF_VARIANTE" >&2
  echo "  variantes disponíveis para o ciclo $CICLO:" >&2
  ls -1 "$BASE"/ciclo-"$CICLO"-*.conf 2>/dev/null | sed 's|.*/|    |' >&2 || true
  exit 1
}

# --- sha256 portável --------------------------------------------------------
if command -v sha256sum >/dev/null 2>&1; then
  sha() { sha256sum | awk '{print $1}'; }
elif command -v shasum >/dev/null 2>&1; then
  sha() { shasum -a 256 | awk '{print $1}'; }
else
  echo "erro: preciso de 'sha256sum' ou 'shasum -a 256' para calcular o hash" >&2
  exit 1
fi

# --- 1) schema (P-08) -------------------------------------------------------
if [ -f "$SCHEMA" ]; then
  # A união dos .conf que EXISTEM: sem a base, a variante tem de satisfazer o schema sozinha.
  confs=("$CONF_VARIANTE")
  if [ -f "$CONF_BASE" ]; then confs=("$CONF_BASE" "$CONF_VARIANTE"); fi
  if ! node tools/validar-schema-ciclo.js "$SCHEMA" "${confs[@]}"; then
    echo "erro: os .conf do ciclo $CICLO não satisfazem $SCHEMA — corrija antes de ancorar." >&2
    exit 1
  fi
fi

# --- 1b) PO do ciclo (P-01, P-08) ------------------------------------------
# O PO é do CICLO (compartilhado pelas variantes). Se ainda não existir, não é
# erro: o ciclo fica sem PO declarado e isso vai registrado no .fipp.
ARQUIVO_PO="$BASE/ciclo-$CICLO-$VARIANTE-po.md"
SCHEMA_PO="$BASE/ciclo-$CICLO-po-schema.json"
PO_INFO=""
PO_STATE=""
if [ -f "$ARQUIVO_PO" ]; then
  if [ -f "$SCHEMA_PO" ]; then
    if ! node tools/validar-po-ciclo.js "$SCHEMA_PO" "$ARQUIVO_PO" > /tmp/hash-po-"$CICLO".log 2>&1; then
      echo "erro: o PO do ciclo $CICLO não satisfaz $SCHEMA_PO — corrija antes de ancorar." >&2
      grep -E '^  - |^erro' /tmp/hash-po-"$CICLO".log | head -8 >&2
      exit 1
    fi
    PO_INFO="$ARQUIVO_PO"
  else
    echo "aviso: $ARQUIVO_PO existe, mas $SCHEMA_PO não — PO não validado" >&2
    PO_INFO="$ARQUIVO_PO (sem schema)"
  fi
  PO_STATE="$(sed -n 's/^state:[[:space:]]*//p' "$ARQUIVO_PO" | head -1)"
else
  echo "aviso: o ciclo $CICLO ainda não tem PO declarado ($ARQUIVO_PO)" >&2
  PO_INFO="ausente — este ciclo ainda não tem PO declarado"
fi

# --- 2) coleta dos fontes, em ordem determinística --------------------------
# A lista vem de tools/lib-fontes.sh — a MESMA definição que o gerador usa para
# montar o pacote. Assim o hash cobre exatamente o que a escola lê: os dois
# manifestos, o PO desta variante e os documentos resolvidos por DOCS, com a
# versão da própria variante tendo precedência sobre a sem sufixo. O material de
# OUTRA escola não entra (P-09/P-10) — nem o documento sem sufixo que esta
# variante substituiu pelo seu. Antes, esta coleta pegava todos os .md do ciclo e
# misturava as escolas: o hash da Ritmos carregava o plano e a aula da Duo.
#
# Para conhecer DOCS é preciso carregar os manifestos (o gerador já faz o mesmo).
# A base entra PRIMEIRO, e só quando existe: a variante sobrescreve-a chave a chave.
if [ -f "$CONF_BASE" ]; then
  # shellcheck disable=SC1090
  source "$CONF_BASE"
else
  echo "nota: sem manifesto base ($(basename "$CONF_BASE")) — a variante é o manifesto inteiro" >&2
fi
# shellcheck disable=SC1090
source "$CONF_VARIANTE"
# shellcheck source=tools/lib-fontes.sh
source "$RAIZ/tools/lib-fontes.sh"

FONTES="$( fontes_do_ciclo \
           | while IFS= read -r fonte; do
               # Só o que é DESTE professor: o ciclo (manifestos, PO, documentos) e os
               # relatórios pós-aula — que são fontes. O guia-do-professor vive na
               # biblioteca e não entra; os acompanhamentos são derivados e ficam fora.
               case "$fonte" in
                 "${BASE%/ciclos}"/*) [ -f "$fonte" ] && printf '%s\n' "$fonte" ;;
               esac
             done \
           | LC_ALL=C sort -u )"
[ -n "$FONTES" ] || { echo "erro: nenhuma fonte encontrada para o ciclo $CICLO" >&2; exit 1; }

# --- 3) hash do conteúdo ----------------------------------------------------
HASH_CONTEUDO="$( for f in $FONTES; do
                    printf 'arquivo: %s\n' "$f"
                    cat "$f"
                    printf '\n'
                  done | sha )"

# --- 4) parentHash: hash da âncora do ciclo anterior, mesma variante ---------
PARENT_HASH=""
NUM="$(printf '%d' "$CICLO")"
if [ "$NUM" -gt 1 ]; then
  ANTERIOR="$(printf '%02d' "$((NUM - 1))")"
  ARQ_ANTERIOR="$BASE/ciclo-$ANTERIOR-$VARIANTE.fipp"
  if [ -f "$ARQ_ANTERIOR" ]; then
    PARENT_HASH="$(sed -n 's/^hash:[[:space:]]*//p' "$ARQ_ANTERIOR" | head -1)"
  else
    echo "aviso: $ARQ_ANTERIOR não existe — o ciclo $CICLO-$VARIANTE fica sem parentHash" >&2
    echo "       ancore o anterior primeiro: tools/hash-ciclo.sh $PROFESSOR_DIR $ANTERIOR $VARIANTE" >&2
  fi
fi

# --- 5) hash da âncora ------------------------------------------------------
HASH_FIPP="$(printf '%s' "$ID:$TIPO:$PARENT_HASH:$HASH_CONTEUDO" | sha)"

# --- 5a) o SELO do alfabeto da notação (28/10/2026, opção B) ----------------
#
# O PROBLEMA. O alfabeto é FONTE do documento de notação, e não estava na âncora: alguém podia
# corrigir um verbete, a página publicada mudar de sentido, e o `.fipp` continuar a dizer
# «íntegro». A âncora media o que o professor escreveu e não o que o motor leu para o escrever.
#
# PORQUE A OPÇÃO B, E NÃO A A. Ancorar o alfabeto (opção A) é acrescentá-lo ao `FONTES`, e isso
# muda a FÓRMULA — todos os hashes da cadeia de todos os ciclos passariam a ser outros, e o
# passado deixaria de fechar. O selo responde à pergunta que a proveniência tem de responder
# («com que alfabeto, em que versão?») sem tocar na fórmula. A opção A fica para quando houver
# mais de uma modalidade e o alfabeto deixar de ser praticamente imutável.
#
# AS CINCO LINHAS FICAM FORA DA FÓRMULA, como o `po_state` e o `ancorado_em`: o `--check`
# recalcula o hash sobre as fontes vivas, e um campo que muda sem o conteúdo mudar não pode
# entrar nele.
SELO_ALFABETO=""
NOTACAO_DECLARADA=""
_plano_fonte="$(fonte_md plano 2>/dev/null || true)"
if [ -n "$_plano_fonte" ] && [ -f "$_plano_fonte" ]; then
  # O RÓTULO DA NOTAÇÃO MUDOU A 18/11/2026 («Notação dominada» → «Notação de dança»), e o selo
  # tem de o encontrar nos dois: um ciclo gerado ontem ainda diz o antigo até ser regerado, e um
  # `--check` num ciclo antigo não pode perder o selo do alfabeto por causa de um rótulo.
  NOTACAO_DECLARADA="$(sed -n 's/^| *\*\*Notação d[eo]minada\*\* *| *\([^|]*[^| ]\) *|.*$/\1/p; s/^| *\*\*Notação de dança\*\* *| *\([^|]*[^| ]\) *|.*$/\1/p' "$_plano_fonte" | head -1)"
fi
if [ -n "$NOTACAO_DECLARADA" ]; then
  SELO_ALFABETO="$(node -e '
    const path = require("path"), fs = require("fs"), crypto = require("crypto");
    const raiz = process.argv[1], declarada = process.argv[2];
    let alfabeto = null;
    try { alfabeto = require(path.join(raiz, "motor", "nucleo", "notacao.js")).paraNotacao(declarada); }
    catch (e) { process.exit(0); }
    if (!alfabeto) {
      console.log("notacao: " + declarada);
      console.log("notacao_alfabeto: (sem alfabeto publicado para esta notacao)");
      process.exit(0);
    }
    const arquivo = path.join(raiz, "biblioteca", "modalidades", alfabeto.modalidade, "notacao.json");
    let sha = "(arquivo nao encontrado)";
    try { sha = crypto.createHash("sha256").update(fs.readFileSync(arquivo)).digest("hex"); } catch (e) {}
    console.log("notacao: " + declarada);
    console.log("notacao_modalidade: " + alfabeto.modalidade);
    console.log("notacao_alfabeto: " + alfabeto.id);
    console.log("notacao_versao: " + alfabeto.versao);
    console.log("notacao_sha: " + sha);
  ' "$RAIZ" "$NOTACAO_DECLARADA" 2>/dev/null || true)"
fi
# A consulta que o `--check` faz, e o `--check` a repete: uma função, para o selo gravado e o
# selo recalculado não poderem divergir na forma.
selo_agora() { printf '%s' "$SELO_ALFABETO"; }

# --- 5b) as aulas que têm fonte própria (§5.2) ------------------------------
# O conjunto de aulas não é declarado: é o que existe no disco, via a MESMA
# função que o gerador usa para montar o pacote (familias_por_aula). Assim o
# .fipp por aula nasce só onde há aula, e nunca onde só há a folha de captura.
AULAS="$( { familias_por_aula aula; familias_por_aula captura-aula; } | LC_ALL=C sort -u )"

# As fontes da aula NN: o documento, a folha de captura e o relatório pós-aula
# da variante. O relatório pertence à AULA — ele já consta da cobertura do ciclo
# (fontes_do_ciclo o injeta por glob, sem passar por fonte_md), e sem alcançá-lo
# aqui mudar o relatório não acusaria na âncora da própria aula.
fontes_da_aula() {   # <nn>
  local nn="$1" doc src rel
  for doc in aula-"$nn" captura-aula-"$nn"; do
    src="$(fonte_md "$doc")"
    if [ -f "$src" ]; then printf '%s\n' "$src"; fi
  done
  rel="${CICLOS%/ciclos}/relatorios/ciclo-$CICLO"
  if [ -f "$rel/aula-$nn-$VARIANTE.md" ]; then
    printf '%s\n' "$rel/aula-$nn-$VARIANTE.md"
  fi
}

# --- 5c) as âncoras por aula (§5.2) -----------------------------------------
# A peça é ADITIVA: o .fipp do ciclo continua existindo e cobrindo todas as
# fontes, inclusive as das aulas. O que a âncora da aula acrescenta é a
# atribuição (a da aula NN não tem par — parentHash vazio) e a reancoragem
# cirúrgica: lançar a 03 não reancora o ciclo. A data, como no ciclo, fica FORA
# da fórmula — o --check recalcula sobre as fontes vivas e falharia no dia
# seguinte à ancoragem.
fontes_da_aula_filtradas() {   # <nn> — só o que está no escopo do professor
  fontes_da_aula "$1" | while IFS= read -r fonte; do
    case "$fonte" in "${BASE%/ciclos}"/*) [ -f "$fonte" ] && printf '%s\n' "$fonte" ;; esac
  done | LC_ALL=C sort -u
}

N_AULAS=0
AULA_NN=(); AULA_ID=(); AULA_HC=(); AULA_HASH=(); AULA_ARQ=()
for nn in $AULAS; do
  FONTES_AULA="$(fontes_da_aula_filtradas "$nn")"
  [ -n "$FONTES_AULA" ] || continue
  HASH_CONTEUDO_AULA="$( for f in $FONTES_AULA; do printf 'arquivo: %s\n' "$f"; cat "$f"; printf '\n'; done | sha )"
  ID_AULA="$ID-aula-$nn"
  AULA_NN[$N_AULAS]="$nn"
  AULA_ID[$N_AULAS]="$ID_AULA"
  AULA_HC[$N_AULAS]="$HASH_CONTEUDO_AULA"
  AULA_HASH[$N_AULAS]="$(printf '%s' "$ID_AULA:$TIPO_AULA::$HASH_CONTEUDO_AULA" | sha)"
  AULA_ARQ[$N_AULAS]="$BASE/ciclo-$CICLO-$VARIANTE-aula-$nn.fipp"
  N_AULAS=$((N_AULAS + 1))
done

# --- 6) verificação (--check) ----------------------------------------------
if [ "$MODO" = "--check" ]; then
  if [ ! -f "$ARQUIVO_FIPP" ]; then
    echo "erro: $ARQUIVO_FIPP não existe — ancore com: tools/hash-ciclo.sh $PROFESSOR_DIR $CICLO $VARIANTE" >&2
    exit 1
  fi
  ARMAZENADO="$(sed -n 's/^hash:[[:space:]]*//p' "$ARQUIVO_FIPP" | head -1)"
  CONTEUDO_ARMAZENADO="$(sed -n 's/^hash_conteudo:[[:space:]]*//p' "$ARQUIVO_FIPP" | head -1)"
  PARENT_ARMAZENADO="$(sed -n 's/^parentHash:[[:space:]]*//p' "$ARQUIVO_FIPP" | head -1)"
  FALHOU=0

  # (a) os fontes deste ciclo mudaram?
  if [ "$CONTEUDO_ARMAZENADO" != "$HASH_CONTEUDO" ]; then
    echo "erro: os fontes do ciclo $CICLO-$VARIANTE mudaram desde a última ancoragem." >&2
    echo "  no .fipp:  $CONTEUDO_ARMAZENADO" >&2
    echo "  agora:     $HASH_CONTEUDO" >&2
    echo "  regere a âncora com: tools/hash-ciclo.sh $PROFESSOR_DIR $CICLO $VARIANTE" >&2
    FALHOU=1
  fi

  # (b) o ciclo anterior mudou?
  if [ "$PARENT_ARMAZENADO" != "$PARENT_HASH" ]; then
    echo "erro: o ciclo anterior mudou — a cadeia de $ID deixou de bater." >&2
    echo "  no .fipp:  ${PARENT_ARMAZENADO:-(vazio)}" >&2
    echo "  agora:     ${PARENT_HASH:-(vazio)}" >&2
    echo "  (os fontes deste ciclo podem estar intactos; reancore para incorporar o novo pai)" >&2
    FALHOU=1
  fi

  # (c) o arquivo .fipp é coerente consigo mesmo?
  if [ "$ARMAZENADO" != "$HASH_FIPP" ] && [ "$FALHOU" -eq 0 ]; then
    echo "erro: o hash registrado não corresponde aos campos do próprio .fipp." >&2
    echo "  no .fipp:  $ARMAZENADO" >&2
    echo "  recalculado: $HASH_FIPP" >&2
    FALHOU=1
  fi

  # (c2) o ALFABETO mudou desde a ancoragem? (selo da opção B, 28/10/2026)
  #
  # Sem isto o selo seria decorativo — e o defeito que ele combate é o silêncio: o verbete muda, o
  # documento publicado muda de sentido, e a âncora continua a dizer «íntegro». A comparação é a do
  # `notacao_sha`, e não a da versão: a versão é declarada por quem edita, o sha é medido.
  #
  # É ERRO, e não aviso, de propósito. Reancorar para incorporar o selo novo NÃO muda o hash — o
  # alfabeto continua fora da fórmula —, portanto o custo de resolver isto é um comando.
  if [ -n "$SELO_ALFABETO" ]; then
    SHA_AGORA="$(printf '%s\n' "$SELO_ALFABETO" | sed -n 's/^notacao_sha:[[:space:]]*//p' | head -1)"
    if grep -q '^notacao_sha:' "$ARQUIVO_FIPP"; then
      SHA_ARMAZENADO="$(sed -n 's/^notacao_sha:[[:space:]]*//p' "$ARQUIVO_FIPP" | head -1)"
      if [ "$SHA_ARMAZENADO" != "$SHA_AGORA" ]; then
        echo "erro: o alfabeto da notação mudou desde a última ancoragem — o documento publicado" >&2
        echo "      de $ID muda de sentido, e o hash das fontes do professor não o vê." >&2
        echo "  no .fipp:  $SHA_ARMAZENADO" >&2
        echo "  agora:     $SHA_AGORA" >&2
        echo "  regere a âncora com: tools/hash-ciclo.sh $PROFESSOR_DIR $CICLO $VARIANTE" >&2
        echo "  (o hash NÃO muda: o alfabeto está fora da fórmula — só o selo é renovado)" >&2
        FALHOU=1
      fi
    else
      echo "aviso: esta âncora não tem o selo do alfabeto (anterior a 28/10/2026)." >&2
      echo "       reancore para o gravar: tools/hash-ciclo.sh $PROFESSOR_DIR $CICLO $VARIANTE" >&2
    fi
  fi

  # a cobertura declarada precisa corresponder aos fontes de hoje
  COBERTURA_ATUAL="$(printf '%s\n' $FONTES | LC_ALL=C sort -u)"
  COBERTURA_FIPP="$(grep '^  - ' "$ARQUIVO_FIPP" | sed 's/^  - //' | LC_ALL=C sort -u || true)"
  if [ "$COBERTURA_ATUAL" != "$COBERTURA_FIPP" ]; then
    echo "erro: a lista de fontes cobertas mudou (arquivo criado ou removido)." >&2
    diff <(printf '%s\n' "$COBERTURA_FIPP") <(printf '%s\n' "$COBERTURA_ATUAL") | sed 's/^/  /' >&2 || true
    FALHOU=1
  fi

  # (d) as âncoras por aula (§5.2). A peça é aditiva: a âncora de aula que ainda
  # não existe é AVISO, não erro — quem ancora sobre o passado não é obrigado a
  # já ter a peça nova. Mas a que existe tem de bater com as fontes de hoje.
  i=0
  while [ "$i" -lt "$N_AULAS" ]; do
    nn="${AULA_NN[$i]}"; arq="${AULA_ARQ[$i]}"
    if [ ! -f "$arq" ]; then
      echo "aviso: a aula $nn ainda não tem âncora ($arq)" >&2
      echo "       ancore-a com: tools/hash-ciclo.sh $PROFESSOR_DIR $CICLO $VARIANTE" >&2
    else
      AULA_HC_ARMAZENADO="$(sed -n 's/^hash_conteudo:[[:space:]]*//p' "$arq" | head -1)"
      AULA_HASH_ARMAZENADO="$(sed -n 's/^hash:[[:space:]]*//p' "$arq" | head -1)"
      if [ "$AULA_HC_ARMAZENADO" != "${AULA_HC[$i]}" ]; then
        echo "erro: as fontes da aula $nn mudaram desde a última ancoragem." >&2
        echo "  no .fipp:  $AULA_HC_ARMAZENADO" >&2
        echo "  agora:     ${AULA_HC[$i]}" >&2
        echo "  regere a âncora com: tools/hash-ciclo.sh $PROFESSOR_DIR $CICLO $VARIANTE" >&2
        FALHOU=1
      fi
      if [ "$AULA_HASH_ARMAZENADO" != "${AULA_HASH[$i]}" ] && [ "$FALHOU" -eq 0 ]; then
        echo "erro: o hash registrado não corresponde aos campos do .fipp da aula $nn." >&2
        echo "  no .fipp:   $AULA_HASH_ARMAZENADO" >&2
        echo "  recalculado: ${AULA_HASH[$i]}" >&2
        FALHOU=1
      fi
      COB_AULA_ATUAL="$(fontes_da_aula_filtradas "$nn")"
      COB_AULA_FIPP="$(grep '^  - ' "$arq" | sed 's/^  - //' | LC_ALL=C sort -u || true)"
      if [ "$COB_AULA_ATUAL" != "$COB_AULA_FIPP" ]; then
        echo "erro: a lista de fontes cobertas da aula $nn mudou (arquivo criado ou removido)." >&2
        diff <(printf '%s\n' "$COB_AULA_FIPP") <(printf '%s\n' "$COB_AULA_ATUAL") | sed 's/^/  /' >&2 || true
        FALHOU=1
      fi
    fi
    i=$((i + 1))
  done

  # âncoras de aula órfãs: o .fipp ficou sem a aula correspondente
  for arq in "$BASE"/ciclo-"$CICLO"-"$VARIANTE"-aula-*.fipp; do
    [ -f "$arq" ] || continue
    case " ${AULA_ARQ[*]:-} " in
      *" $arq "*) ;;
      *) echo "aviso: $arq não corresponde a nenhuma aula de hoje" >&2 ;;
    esac
  done

  [ "$FALHOU" -eq 0 ] || exit 1
  echo "ok: ciclo $CICLO-$VARIANTE íntegro; cadeia intacta"
  echo "    hash: $HASH_FIPP"
  exit 0
fi

# --- 7) gravação do .fipp ---------------------------------------------------
{
  echo "# Âncora de proveniência encadeada — gerada por tools/hash-ciclo.sh"
  echo "# Este arquivo é VERSIONADO: é a âncora da cadeia, não uma saída (P-04)."
  echo "# Fontes cobertas: $CONF_VARIANTE e os .md deste ciclo${CONF_BASE:+, mais a base $(basename "$CONF_BASE") quando existe}."
  echo "# Fórmula: hash = SHA256(id + ':' + type + ':' + parentHash + ':' + conteudo)"
  echo "# Selo do alfabeto (notacao_*): fora da fórmula — diz com que código o documento foi"
  echo "# escrito, e é o que o --check compara para o alfabeto não mudar em silêncio."
  echo ""
  echo "id: $ID"
  echo "type: $TIPO"
  echo "professor: $PROFESSOR"
  echo "ciclo: $CICLO"
  echo "variante: $VARIANTE"
  echo "hash_conteudo: $HASH_CONTEUDO"
  echo "parentHash: $PARENT_HASH"
  echo "hash: $HASH_FIPP"
  echo "algoritmo: SHA-256"
  echo "po: $PO_INFO"
  echo "po_state: $PO_STATE"
  echo "ancorado_em: $ANCORADO_EM"
  # O selo do alfabeto: fora da fórmula, e é ele que diz COM QUE CÓDIGO o documento foi escrito.
  [ -n "$SELO_ALFABETO" ] && printf '%s\n' "$SELO_ALFABETO"
  echo "cobertura:"
  for f in $FONTES; do echo "  - $f"; done
} > "$ARQUIVO_FIPP"

# --- 7b) gravação dos .fipp por aula (§5.2) ---------------------------------
i=0
while [ "$i" -lt "$N_AULAS" ]; do
  {
    echo "# Âncora de proveniência encadeada — gerada por tools/hash-ciclo.sh"
    echo "# Este arquivo é VERSIONADO: é a âncora da cadeia, não uma saída (P-04)."
    echo "# Âncora da AULA ${AULA_NN[$i]} do ciclo $CICLO-$VARIANTE: cobre só as fontes desta aula."
    echo "# Fórmula: hash = SHA256(id + ':' + type + ':' + parentHash + ':' + conteudo)"
    echo "# parentHash vazio por desenho: a âncora de uma aula não encadeia com a da anterior."
    echo ""
    echo "id: ${AULA_ID[$i]}"
    echo "type: $TIPO_AULA"
    echo "professor: $PROFESSOR"
    echo "ciclo: $CICLO"
    echo "variante: $VARIANTE"
    echo "aula: ${AULA_NN[$i]}"
    echo "hash_conteudo: ${AULA_HC[$i]}"
    echo "parentHash: "
    echo "hash: ${AULA_HASH[$i]}"
    echo "algoritmo: SHA-256"
    echo "ancorado_em: $ANCORADO_EM"
    echo "cobertura:"
    for f in $(fontes_da_aula_filtradas "${AULA_NN[$i]}"); do echo "  - $f"; done
  } > "${AULA_ARQ[$i]}"
  i=$((i + 1))
done

echo "ancorado: $ARQUIVO_FIPP"
echo "  id:            $ID"
echo "  hash_conteudo: $HASH_CONTEUDO"
echo "  parentHash:    ${PARENT_HASH:-(vazio — o Ciclo $CICLO abre a cadeia)}"
echo "  hash:          $HASH_FIPP"
echo "  ancorado_em:   $ANCORADO_EM"
if [ -n "$PARENT_HASH" ]; then
  echo "  cadeia: $(printf '%02d' "$((NUM - 1))")-$VARIANTE → $CICLO-$VARIANTE"
fi
i=0
while [ "$i" -lt "$N_AULAS" ]; do
  echo "ancorado: ${AULA_ARQ[$i]}"
  echo "  id:            ${AULA_ID[$i]}"
  echo "  hash_conteudo: ${AULA_HC[$i]}"
  echo "  hash:          ${AULA_HASH[$i]}"
  i=$((i + 1))
done

