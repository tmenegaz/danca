#!/usr/bin/env bash
# ============================================================================
# criar-escola.sh — o CLI de scaffolding de uma escola nova (do zero).
#
# Cria o AMBIENTE onde um ciclo vai nascer: a pasta do professor (se for novo),
# os manifestos (ciclo-NN.conf + ciclo-NN-<escola>.conf), os schemas do domínio
# (copiados de um ciclo-modelo), o pacote "zero" (índice mínimo + a porta de
# elicitação do Plano de Observação + os assets compartilhados) e o config do
# Worker do Cloudflare (wrangler.<worker>.jsonc). Com --deploy, também sobe o
# Worker e grava o segredo GITHUB_TOKEN.
#
# Nada aqui inventa conteúdo pedagógico: o pacote nasce SEM plano e SEM aulas,
# com o objetivo geral como lacuna explícita [Preencher: ...]. O primeiro
# artefato real do ciclo é o PO, elicitado pela porta — e a geração (a etapa
# seguinte) é que o incorpora como fonte.
#
# Uso:
#   tools/criar-escola.sh \
#     --professor fokini3 --professor-nome "Fokini III" \
#     --escola diaghilev3 --escola-nome "Diaghilev III" --responsavel "Fokini III" \
#     --ciclo 03 --worker diaghilev3 \
#     --frequencia "2x/semana" --dias "2@19:00,4@19:00" \
#     --duracao 60 --data-inicio "20/10/2026" \
#     --deploy
#
# O que faltar é pedido interativamente (a menos que --nao-interativo).
# ============================================================================

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# Estado
# ---------------------------------------------------------------------------
PROFESSOR="";      PROFESSOR_NOME=""
ESCOLA="";         ESCOLA_NOME="";      RESPONSAVEL=""
CICLO="";          WORKER=""
FREQUENCIA="";     DIAS=""
DURACAO="60";      DURACAO_TEXTO=""
DATA_INICIO="";    TOTAL_AULAS="5"
# O MOLDE DE QUE NASCE TODA ESCOLA — e ele NÃO mora em `professores/`: molde não é professor
# (ver `modelo/README.md` e a nota longa em `MODELO_BASE`, mais abaixo).
MODELO="modelo/01"
# A MODALIDADE PRINCIPAL do professor (03/11/2026). Quem cria a escola é quem a vai ensinar, e
# nasce habilitado na modalidade dela — é a decisão da pesquisadora: «cria-se obrigatoriamente um
# professor, o qual já nasce com o pré-requisito de saber ensinar pelo menos a modalidade
# principal». A lista de onde este valor sai é `biblioteca/modalidades/modalidades.json`; o
# padrão é a única modalidade que hoje tem repertório.
MODALIDADE="bale-classico"
DEPLOY=0;          NAO_INTERATIVO=0; SOMENTE_INDICE=0; SOMENTE_PORTA=0

# ---------------------------------------------------------------------------
# Ajuda
# ---------------------------------------------------------------------------
uso() {
  cat <<EOF
uso: tools/criar-escola.sh [opções]

Cria do zero o ambiente de uma escola nova (professor, ciclo, pacote e Worker).

OPÇÕES OBRIGATÓRIAS (pedidas interativamente se faltarem):
  --professor <slug>        pasta em professores/          (ex.: fokini3)
  --professor-nome <texto>  nome de exibição do professor  (ex.: "Fokini III")
  --escola <slug>           slug da variante/escola        (ex.: diaghilev3)
  --escola-nome <texto>     nome de exibição da escola     (ex.: "Diaghilev III")
  --responsavel <texto>     responsável pelo espaço        (ex.: "Fokini III")
  --ciclo <NN>              número do ciclo, dois dígitos  (ex.: 03)
  --frequencia <texto>      frequência semanal             (ex.: "2x/semana")
  --dias <iso>              dias+horas (ISO 1..7)          (ex.: "2@19:00,4@19:00")
  --data-inicio <dd/mm/aaaa> data de início (ajustada pelo calendário)

OPÇÕES COM PADRÃO:
  --worker <nome>           nome do Worker page            (padrão: slug da escola)
  --duracao <min>           duração em minutos (DURACOES)  (padrão: 60)
  --duracao-texto <texto>   DURACAO_POR_DIA                 (padrão: derivado de --duracao)
  --modalidade <slug>       modalidade principal do professor (padrão: bale-classico;
                            a lista é biblioteca/modalidades/modalidades.json)
  --total-aulas <N>         número de aulas                (padrão: 5)
  --modelo <base/ciclo>     ciclo de onde copiar schemas   (padrão: modelo/01)

FLAGS:
  --somente-indice          SÓ regenera a apresentação (index.html) de um pacote que já
                            existe — usa os manifestos como estão e não toca em mais nada
  --somente-porta           SÓ regenera a PORTA (plano-observacao/) de um pacote que já
                            existe: recopia \`porta/\` e reinjeta a barra. Para quando a porta
                            muda e os pacotes ficam velhos
  --shard <script>          A escola nasce DENTRO do shard indicado (ex.: lastro-teste): não
                            escreve \`wrangler.<escola>.jsonc\` e regista o shard no índice.
                            Sem a flag, a escola tem Worker próprio, como sempre
  --deploy                  sobe o Worker e grava GITHUB_TOKEN no Cloudflare
  --nao-interativo          não pergunta: erro se faltar obrigatório
  --help                    esta ajuda

NÃO faz (passos seguintes, manuais ou de outro comando):
  - commit no Git (o deploy de produção lê o main);
  - âncora de proveniência (tools/hash-ciclo.sh <prof> <ciclo> <escola>);
  - geração do pacote a partir do PO (tools/gerar-ciclo.sh — a etapa após o PO).
EOF
}

# ---------------------------------------------------------------------------
# Pergunta interativa (uma linha; escreve direto na variável por nameref)
# ---------------------------------------------------------------------------
perguntar() { # $1 = rótulo ; $2 = nome da variável (por referência)
  local rotulo="$1"
  local -n ref="$2"
  printf '%s: ' "$rotulo" >&2
  IFS= read -r ref
}

# ---------------------------------------------------------------------------
# Argumentos
# ---------------------------------------------------------------------------
while [ "$#" -gt 0 ]; do
  case "$1" in
    --professor)       PROFESSOR="$2"; shift 2 ;;
    --professor-nome)  PROFESSOR_NOME="$2"; shift 2 ;;
    --escola)          ESCOLA="$2"; shift 2 ;;
    --escola-nome)     ESCOLA_NOME="$2"; shift 2 ;;
    --responsavel)     RESPONSAVEL="$2"; shift 2 ;;
    --ciclo)           CICLO="$2"; shift 2 ;;
    --worker)          WORKER="$2"; shift 2 ;;
    --frequencia)      FREQUENCIA="$2"; shift 2 ;;
    --dias)            DIAS="$2"; shift 2 ;;
    --duracao)         DURACAO="$2"; shift 2 ;;
    --duracao-texto)   DURACAO_TEXTO="$2"; shift 2 ;;
    --data-inicio)     DATA_INICIO="$2"; shift 2 ;;
    --total-aulas)     TOTAL_AULAS="$2"; shift 2 ;;
    --modelo)          MODELO="$2"; shift 2 ;;
    --modalidade)      MODALIDADE="$2"; shift 2 ;;
    --somente-indice)  SOMENTE_INDICE=1; shift ;;
    --somente-porta)   SOMENTE_PORTA=1; shift ;;
    --shard)           SHARD_SCRIPT="$2"; shift 2 ;;
    --deploy)          DEPLOY=1; shift ;;
    --nao-interativo)  NAO_INTERATIVO=1; shift ;;
    --help|-h)         uso; exit 0 ;;
    *) echo "erro: opção desconhecida: $1 (use --help)" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Coleta interativa do que faltar
# ---------------------------------------------------------------------------
pedir() { # $1 = rótulo ; $2 = nome da variável
  local rotulo="$1" var="$2"
  local -n ref="$var"
  if [ -z "$ref" ]; then
    if [ "$NAO_INTERATIVO" = 1 ]; then
      echo "erro: $rotulo ausente (passe --$var ou remova --nao-interativo)" >&2
      exit 1
    fi
    printf '%s: ' "$rotulo" >&2
    IFS= read -r ref
  fi
}

# Com --somente-indice (ou --somente-porta) nada disto é perguntado: a identidade do pacote vem dos
# argumentos (--professor/--escola/--ciclo) e o resto, dos manifestos que já existem.
if [ "$SOMENTE_INDICE" != 1 ] && [ "$SOMENTE_PORTA" != 1 ]; then
  pedir "slug do professor"        PROFESSOR
  pedir "nome do professor"        PROFESSOR_NOME
  pedir "slug da escola"           ESCOLA
  pedir "nome da escola"           ESCOLA_NOME
  pedir "responsável"              RESPONSAVEL
  pedir "ciclo (dois dígitos)"     CICLO
  pedir "frequência semanal"       FREQUENCIA
  pedir "dias+horas (ISO)"         DIAS
fi
# A data de início NÃO é pedida aqui: é material do PLANO (o plano elicitado a
# estabelece). O scaffold nasce com a lacuna [Preencher: ...], e o plano a substitui.
[ -z "$WORKER" ] && WORKER="$ESCOLA"
[ -z "$DURACAO_TEXTO" ] && DURACAO_TEXTO="$DURACAO min por encontro"
[ -z "$DATA_INICIO" ] && DATA_INICIO="[Preencher: data de início — o plano elicitado a estabelece]"

# O nav mínimo do ciclo "zero": a página de entrada + Área do Professor → anamnese,
# plano de ensino e PO (ordem alfabética, como o gerar_nav do gerar-ciclo.sh). Sem
# a marca (removida do menu — duplicava o «Início»), sem «Início».
# (As páginas do pacote usam o gerar_nav do gerar-ciclo.sh; aqui, sem DOCS,
#  o nav nasce só com o que existe.)
#
# A FORMA da barra — a marca vazia, o hamburger, o contêiner `.nav-links` e o botão da
# aparência — NÃO se escreve aqui: ela mora em `tools/templates/nav-html.js`, o mesmo
# arquivo que o `gerar-ciclo.sh` e os Bastidores consomem. Aqui fica só a LISTA de itens
# do ciclo zero, que é construção. Antes o esqueleto era copiado à mão também neste
# script, e a escola criada do zero nascia SEM o botão `◐` — a única das cinco
# superfícies que não conseguia escurecer (medido em 17/10/2026, na escola `valse`).
gerar_nav_zero() { # $1 = prefixo de link ('' para o índice, '/' para a porta)
  local p="$1" onde="${2:-}" class_ini="" class_po=""
  if [ "$onde" = "index" ]; then class_ini=' class="ativo"'; fi
  if [ "$onde" = "porta" ]; then class_po=' class="ativo"'; fi
  node "$RAIZ/tools/templates/nav-html.js" --abertura
  cat <<EOF
  <a${class_ini} href="${p}index.html">Sistema Lastro</a>
  <details class="menu">
    <summary>Área do Professor</summary>
    <div class="submenu">
      <a href="${p}anamnese/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO">Anamnese do aluno</a>
      <a href="${p}plano-ensino/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO&fonte=plano">Plano de ensino</a>
      <a${class_po} href="${p}plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO&fonte=po">Plano de Observação</a>
    </div>
  </details>
  <details class="menu">
    <summary>Bastidores</summary>
    <div class="submenu">
      <a href="${p}bastidores/estudio">Estúdio de Dança</a>
      <a href="${p}bastidores/producao">Produção</a>
    </div>
  </details>
EOF
  node "$RAIZ/tools/templates/nav-html.js" --fechamento
}

# ---------------------------------------------------------------------------
# --somente-indice: regenera a APRESENTAÇÃO de um pacote que já existe
#
# Por que existe. A apresentação (`biblioteca/apresentacao.md`) é um DOCUMENTO
# COMPARTILHADO — o mesmo em todas as escolas e em todos os ciclos. Quando o texto dele muda,
# TODA página de entrada fica velha de uma vez. Sem este modo, atualizá-las significaria
# reexecutar este script para cada escola — e ele RECUSA (a proveniência acrescenta, não
# edita), além de reescrever os manifestos, o que apagaria a mão do professor neles.
#
# O que ele faz: lê os manifestos que JÁ existem, regenera `index.html` do pacote e para.
# O que ele NÃO faz: não cria pasta, não copia schema, não escreve manifesto, não gera
# Worker, não toca na porta (`plano-observacao/`) nem em nenhum outro documento.
# ---------------------------------------------------------------------------
somente_indice() {
  local conf="$CICLOS_DIR/ciclo-$CICLO.conf" var="$CICLOS_DIR/ciclo-$CICLO-$ESCOLA.conf"
  [ -f "$conf" ] || { echo "erro: manifesto não encontrado: $conf" >&2; exit 1; }
  [ -f "$var" ]  || { echo "erro: manifesto não encontrado: $var" >&2; exit 1; }
  [ -d "$PACOTE_DIR" ] || { echo "erro: o pacote não existe: $PACOTE_DIR" >&2; exit 1; }

  # Os manifestos são lidos pelo MESMO caminho de sempre: `source`. É o que o gerar-ciclo.sh
  # faz, e é o que garante que a apresentação veja os mesmos valores que o resto do ciclo.
  # O `source` sobrescreve ESCOLA (slug → nome de exibição) e PROFESSOR (slug → nome), que é
  # exatamente o que o índice precisa: os nomes de EXIBIÇÃO.
  source "$conf"
  source "$var"
  local professor_nome="${PROFESSOR:-}" escola_nome="$ESCOLA" responsavel="$RESPONSAVEL"
  local frequencia="$FREQUENCIA" duracao_texto="$DURACAO_POR_DIA" data_inicio="$DATA_INICIO"
  # Depois do `source`, estas são de novo as SLUGS (o resto da função as usa nos links).
  PROFESSOR="$(basename "$PROF_DIR")"; ESCOLA="$VARIANTE"

  local nav; nav="$(mktemp)"
  trap 'rm -f "$nav"' RETURN
  gerar_nav_zero '' 'index' > "$nav"
  local rodape="<a href=\"anamnese/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO\">Anamnese do aluno</a> &middot; <a href=\"plano-ensino/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO&fonte=plano\">Plano de ensino</a> &middot; <a href=\"plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO&fonte=po\">Plano de Observação</a>"
  pandoc "$RAIZ/biblioteca/apresentacao.md" \
    -o "$PACOTE_DIR/index.html" \
    --standalone --toc --toc-depth=3 \
    --from=markdown+raw_tex+header_attributes \
    --to=html5 \
    --template="$RAIZ/tools/templates/ciclo.html" \
    --css=assets/style.css \
    --include-before-body="$nav" \
    -V "lang=pt-BR" \
    -V "ciclo=$CICLO" \
    -V "ciclo-nome=Ciclo $CICLO — $escola_nome" \
    -V "escola=$escola_nome" \
    -V "escola-responsavel=$responsavel" \
    -V "frequencia=$frequencia" \
    -V "duracao-por-dia=$duracao_texto" \
    -V "ciclo-periodo=$data_inicio" \
    -V "ciclo-professor=$professor_nome" \
    -V "rodape-docs=$rodape"

  local base="plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO"
  local lancamento='Lançamento de aula — formulário eletrônico'
  [ -f "$PACOTE_DIR/lancamento.html" ] && \
    lancamento='<a href="lancamento.html">Lançamento de aula — formulário eletrônico</a>'
  sed -e "s|@ANAMNESE_URL@|$(printf '%s' "$base" | sed -e 's/[&%#_]/\\&/g')|g" \
      -e "s|@PLANO_URL@|$(printf '%s' "$base&fonte=plano" | sed -e 's/[&%#_]/\\&/g')|g" \
      -e "s|@PO_URL@|$(printf '%s' "$base&fonte=po" | sed -e 's/[&%#_]/\\&/g')|g" \
      -e "s|{{LANCAMENTO_LINK}}|$(printf '%s' "$lancamento" | sed -e 's/[&%#_]/\\&/g')|g" \
      "$PACOTE_DIR/index.html" > "$PACOTE_DIR/index.html.tmp"
  mv "$PACOTE_DIR/index.html.tmp" "$PACOTE_DIR/index.html"
  echo "  apresentação regerada: $PACOTE_DIR/index.html"
  echo "  (a porta, os documentos e os manifestos NÃO foram tocados)"
}

# ---------------------------------------------------------------------------
# --somente-porta: regenera a PORTA (`plano-observacao/`) de um pacote que já existe
#
# PORQUE EXISTE (12/11/2026). A porta é um DOCUMENTO COMPARTILHADO — o mesmo em todas as escolas
# e em todos os ciclos, copiado de `porta/` —, exactamente como a apresentação. Quando o CSS
# dela muda, TODOS os pacotes ficam velhos de uma vez, e a checagem «Circuito» do
# `check-identidade.js` reprova-os: «divergiu de porta/index.html — regenere o pacote».
#
# NÃO HAVIA COMO. O `gerar-ciclo.sh` regenera os pacotes COM escola (e é caro: compõe os
# documentos e os PDFs), mas o PACOTE-ZERO — o que nasce com a escola, sem plano e sem aulas —
# não tem gerador: quem o escreve é este script, que RECUSA correr sobre o que já existe. A
# única saída seria apagar a escola, que é o contrário de proveniência.
#
# O que ele faz: recopia `porta/` para o pacote e reinjeta a barra no marcador `<!-- NAV -->` —
# os dois passos do scaffolding, e só esses. Não toca no índice, nos manifestos, nos schemas,
# no config do Worker, nem em documento nenhum do ciclo.
# ---------------------------------------------------------------------------
somente_porta() {
  local conf="$CICLOS_DIR/ciclo-$CICLO.conf" var="$CICLOS_DIR/ciclo-$CICLO-$ESCOLA.conf"
  [ -f "$conf" ] || { echo "erro: manifesto não encontrado: $conf" >&2; exit 1; }
  [ -f "$var" ]  || { echo "erro: manifesto não encontrado: $var" >&2; exit 1; }
  [ -d "$PACOTE_DIR" ] || { echo "erro: o pacote não existe: $PACOTE_DIR" >&2; exit 1; }

  # Os valores da barra vêm dos manifestos, e depois do `source` voltam a ser as SLUGS — é com
  # elas que os links da porta se escrevem (`?professor=<slug>&escola=<slug>`).
  source "$conf"
  source "$var"
  PROFESSOR="$(basename "$PROF_DIR")"; ESCOLA="$VARIANTE"

  mkdir -p "$PACOTE_DIR/plano-observacao"
  cp -R "$RAIZ/porta/." "$PACOTE_DIR/plano-observacao/"

  local nav; nav="$(gerar_nav_zero '/' 'porta')"
  python3 - "$PACOTE_DIR/plano-observacao/index.html" "$nav" <<'PY'
import sys, pathlib
pagina, nav = sys.argv[1], sys.argv[2]
texto = pathlib.Path(pagina).read_text(encoding='utf-8')
marca = texto.count('<!-- NAV -->')
if marca != 1:
    sys.exit('porta: marcador <!-- NAV --> nao encontrado (ou repetido) — esperado 1, veio %d' % marca)
pathlib.Path(pagina).write_text(texto.replace('<!-- NAV -->', nav, 1), encoding='utf-8')
PY

  echo "  porta: $PACOTE_DIR/plano-observacao/ (recopiada de porta/ e com a barra do site)"
  echo "  (o índice, os documentos, os manifestos e o Worker NÃO foram tocados)"
}

# ---------------------------------------------------------------------------
# Validação
# ---------------------------------------------------------------------------
slug_ok() { printf '%s' "$1" | grep -qE '^[a-z0-9][a-z0-9-]*$'; }
data_ok()  { printf '%s' "$1" | grep -qE '^[0-9]{2}/[0-9]{2}/[0-9]{4}$'; }
dias_ok()  { printf '%s' "$1" | grep -qE '^[1-7]@([01][0-9]|2[0-3]):[0-5][0-9](,[1-7]@([01][0-9]|2[0-3]):[0-5][0-9])*$'; }

slug_ok "$PROFESSOR" || { echo "erro: --professor inválido (esperado [a-z0-9-]): $PROFESSOR" >&2; exit 1; }
slug_ok "$ESCOLA"    || { echo "erro: --escola inválido (esperado [a-z0-9-]): $ESCOLA" >&2; exit 1; }
slug_ok "$WORKER"    || { echo "erro: --worker inválido (esperado [a-z0-9-]): $WORKER" >&2; exit 1; }
printf '%s' "$CICLO" | grep -qE '^[0-9]{2}$' || { echo "erro: --ciclo deve ter dois dígitos: $CICLO" >&2; exit 1; }
# Com --somente-indice/--somente-porta estes dois vêm dos manifestos, não dos argumentos.
if [ "$SOMENTE_INDICE" != 1 ] && [ "$SOMENTE_PORTA" != 1 ]; then
# A data de início aceita a lacuna [Preencher: ...] (o plano a estabelece) ou uma data real.
{ data_ok "$DATA_INICIO" || printf '%s' "$DATA_INICIO" | grep -q '\['; } \
  || { echo "erro: --data-inicio deve ser dd/mm/aaaa ou a lacuna [Preencher: ...]: $DATA_INICIO" >&2; exit 1; }
dias_ok "$DIAS"       || { echo "erro: --dias fora do padrão ISO (ex.: 2@19:00,4@19:00): $DIAS" >&2; exit 1; }
fi

# Modelo: <base>/<ciclo> de onde copiar os schemas.
#
# O MOLDE NÃO É PROFESSOR, e por isso não mora em `professores/` (15/10/2026). Ele morava em
# `professores/tiago/ciclos/` — e um molde com nome de pessoa aparece em toda lista de
# professores (`/api/professores`, o `HANDOFF.md`), podendo ser escolhido como responsável por
# uma escola; e quem o tomasse por pasta de um professor morto o apagaria, e NENHUMA escola
# nova poderia nascer (foi o que aconteceu com a `ponta`: o run #3 do `criar-escola.yml`
# morreu aqui, com `erro: ciclo-modelo sem schema`). A `base` agora é um caminho a partir da
# raiz — `modelo` por padrão —, e `--modelo professores/<slug>/<ciclo>` continua funcionando
# para quem quiser semear a partir do ciclo de um professor.
MODELO_BASE="${MODELO%%/*}"; MODELO_CICLO="${MODELO##*/}"
MODELO_DIR="$RAIZ/$MODELO_BASE/ciclos"
[ -f "$MODELO_DIR/ciclo-$MODELO_CICLO-schema.json" ] \
  || { echo "erro: ciclo-modelo sem schema: $MODELO_DIR/ciclo-$MODELO_CICLO-schema.json" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Proveniência: não sobrescrever o que já existe
#
# A COLISÃO É POR ESCOLA — e a BASE não é da escola (17/10/2026).
#
# `ciclo-NN.conf` é a base do par (PROFESSOR, CICLO): vale para todas as escolas do mesmo
# professor, e a variante (`ciclo-NN-<escola>.conf`) sobrescreve-a no `source`, chave a chave
# (gerar-ciclo.sh:85-88 e hash-ciclo.sh:100-103 fazem `source` da base e DEPOIS da variante).
# A única chave que a variante não redefine é `PROFESSOR` — que é do professor, não da escola.
#
# Tratá-la como colisão IMPEDIA a segunda escola do mesmo professor. Aconteceu em 17/10/2026:
# o dono do produto criou a escola `valsa` para o professor `tiago-menegaz`, que já tinha a
# `fita` no ciclo 01, e o `criar-escola.yml` morreu no primeiro passo com
# «já existe: …/ciclo-01.conf» — antes de criar o pacote, antes do deploy e antes do commit.
# O Worker `valsa` ficou no ar a servir a página de «implantação em andamento» até ser
# eliminado no mesmo dia, quando esta guarda foi corrigida — o que ele ensinou, fica.
#
# O que continua a ser colisão (e aborta): a VARIANTE da escola, o PACOTE da escola e o
# WRANGLER da escola. O que se REAPROVEITA: a base e os schemas do ciclo — copiados do molde
# uma vez e partilhados, sem reescrita.
# ---------------------------------------------------------------------------
PROF_DIR="$RAIZ/professores/$PROFESSOR"
CICLOS_DIR="$PROF_DIR/ciclos"
PACOTE_DIR="$CICLOS_DIR/ciclo-$CICLO-$ESCOLA"
CONF_BASE="$CICLOS_DIR/ciclo-$CICLO.conf"
CONF_VARIANTE="$CICLOS_DIR/ciclo-$CICLO-$ESCOLA.conf"
WRANGLER="$RAIZ/wrangler.$WORKER.jsonc"

[ "$SOMENTE_INDICE" = 1 ] && { somente_indice; exit 0; }
[ "$SOMENTE_PORTA" = 1 ]  && { somente_porta;  exit 0; }

if [ -e "$CONF_VARIANTE" ] || [ -e "$PACOTE_DIR" ] || [ -e "$WRANGLER" ]; then
  echo "erro: a escola/ciclo já existe — não sobrescrevo (a proveniência acrescenta, não edita)." >&2
  [ -e "$CONF_VARIANTE" ] && echo "  já existe: $CONF_VARIANTE" >&2
  [ -e "$PACOTE_DIR" ]    && echo "  já existe: $PACOTE_DIR" >&2
  [ -e "$WRANGLER" ]      && echo "  já existe: $WRANGLER" >&2
  exit 1
fi

# A base é partilhada: se já existe, é a do ciclo deste professor — reusa-se e diz-se.
BASE_NOVA=1
if [ -e "$CONF_BASE" ]; then
  BASE_NOVA=0
  echo "  base: reusando $CONF_BASE (é do ciclo $CICLO do professor $PROFESSOR, não desta escola)"
else
  # A BASE QUE FALTA COM OUTRA ESCOLA VIVA NO MESMO CICLO (25/11/2026).
  #
  # A base é do PAR (professor, ciclo) e é partilhada por todas as escolas desse professor nesse
  # ciclo — e o `.fipp` de cada uma cita-a. Se ela não existe e outra variante existe, escrever
  # agora uma base nova é escrever uma base com o NOME desta escola no lugar da que as outras
  # citam: as âncoras delas deixam de conferir, e o sintoma aparece longe da causa (como apareceu,
  # ao expurgar a `batata`: a `breu` passou a ser recusada com «a cadeia está partida»).
  #
  # Não se ABORTA: uma base perdida não pode impedir criar. Diz-se, com o comando que a recupera.
  outras_base="$(ls "$CICLOS_DIR" 2>/dev/null | grep -E "^ciclo-${CICLO}-[a-z0-9-]+\.conf$" || true)"
  if [ -n "$outras_base" ]; then
    echo "aviso: a base $CONF_BASE não existe, mas o ciclo $CICLO deste professor tem outra(s)" >&2
    echo "       escola(s): $(echo "$outras_base" | tr '\n' ' ')" >&2
    echo "       A base é do CICLO e as âncoras .fipp dessas escolas citam-na. Recriá-la agora" >&2
    echo "       escreve uma base nova em vez da que elas citam. Se ela desapareceu por engano," >&2
    echo "       restaure-a primeiro:  git log --oneline -- $CONF_BASE" >&2
  fi
fi

echo "criando escola: professor=$PROFESSOR · escola=$ESCOLA · ciclo=$CICLO · worker=$WORKER"

# ---------------------------------------------------------------------------
# 1) Estrutura do professor (se nova)
# ---------------------------------------------------------------------------
mkdir -p "$CICLOS_DIR" "$PROF_DIR/cadernos/ciclo-$CICLO" "$PROF_DIR/relatorios/ciclo-$CICLO" "$PROF_DIR/campo"

# ---------------------------------------------------------------------------
# 1b) O PERFIL DO PROFESSOR — a habilitação nasce com a escola (03/11/2026)
#
# A DECISÃO DELA, e é ela que este bloco implementa: «as habilidades do professor vivem no
# registro da entidade do Professor (`professores/<slug>/perfil.json`), de forma independente do
# tenant da escola». Por isso o ficheiro nasce AQUI — na criação da escola, que é o momento em
# que a pessoa entra no sistema — e NÃO no cofre da escola: no KV, o expurgo levá-lo-ia consigo,
# e o professor ficaria sem saber ensinar no dia em que a escola fechasse.
#
# NÃO SE SOBRESCREVE. Um professor que já tem perfil e cria a SEGUNDA escola conserva as
# habilitações que declarou — a segunda escola não lhe acrescenta nem lhe tira competência. É a
# mesma regra da base do ciclo (`ciclo-NN.conf`), que também é do par (professor, ciclo) e não
# da escola: a variante diz o contexto, não reescreve a pessoa.
#
# A MODALIDADE É VALIDADA contra a lista do catálogo. Um slug que não existe ali produziria um
# perfil que nenhuma tela sabe ler — e o erro aparece agora, na criação, e não meses depois.
# ---------------------------------------------------------------------------
PERFIL="$PROF_DIR/perfil.json"
if [ -e "$PERFIL" ]; then
  echo "  perfil: reusando $PERFIL (as habilitações são da pessoa, não desta escola)"
else
  node - "$RAIZ" "$PERFIL" "$PROFESSOR" "$PROFESSOR_NOME" "$MODALIDADE" <<'NODE' || exit 1
const fs = require('fs');
const path = require('path');
const [raiz, arquivo, slug, nome, modalidade] = process.argv.slice(2);
// O `require` é ABSOLUTO: com `node -` não há `__dirname`, e um caminho relativo ao `cwd`
// quebraria na chamada feita de outro diretório (que é como o workflow a faz).
const nucleo = require(path.join(raiz, 'motor', 'nucleo', 'perfil-do-professor.js'));
const hoje = new Date().toISOString().slice(0, 10);
const validado = nucleo.normalizarPerfil({ slug, nome, modalidades: [modalidade] }, { hoje });
if (!validado.ok) {
  console.error('erro: ' + validado.erros.join('; '));
  process.exit(1);
}
// A NOTA VEM PRIMEIRO: quem abre o ficheiro lê a regra antes do dado. Um `_nota` no fim é o que
// ninguém lê — e este ficheiro existe para dizer, a quem chegar depois, de quem ele é.
const perfil = Object.assign({
  _nota: 'O PERFIL DO PROFESSOR — a habilitação é da PESSOA, não da escola (03/11/2026). '
    + '`modalidades` é o que este professor declara saber ensinar; a escola oferece o que os '
    + 'professores dela declaram, por derivação. O expurgo de uma escola NÃO apaga este '
    + 'ficheiro: a competência de quem ensina não é dado do tenant.',
}, validado.perfil);
fs.writeFileSync(arquivo, JSON.stringify(perfil, null, 2) + '\n');
NODE
  echo "  perfil: criado $PERFIL (habilitado em $MODALIDADE)"
fi

# ---------------------------------------------------------------------------
# 2) Schemas do domínio — UM ESCRITOR SÓ (01/11/2026)
#
# AQUI HAVIA UM `cp`, E ELE ERA A SEGUNDA MANEIRA DE LER O MOLDE. O provisionador do Worker
# (`motor/servidor/schemas-do-ciclo.js`) lia os mesmos cinco ficheiros por HTTP, um `GET` cada, e
# este script copiava-os com `cp`. Duas maneiras de ler a mesma coisa são duas coisas: quando o
# molde ficou atrás dos professores (26/10 → 01/11/2026), nada avisou, e a geração de um ciclo
# morreu em «campo ausente», com o PO já validado.
#
# Agora há UM leitor — `motor/nucleo/schemas.js`, que faz `require` literal de `modelo/ciclos/` e
# é o mesmo que o Worker empacota — e uma porta para o shell: `tools/gerar-schemas.js`. O `cp`
# deixou de existir, e com ele o caso do `cp: are the same file`, que matou o `criar-escola.yml`
# duas vezes a 15/10/2026 (a escola `ponta`, quando o professor novo era o do molde).
#
# A REGRA DA PROVENIÊNCIA FICA: só se escreve o que FALTA. Os schemas são do ciclo (genéricos),
# partilhados pelas escolas do professor, e reescrevê-los numa segunda escola seria editar o que
# já estava certo — é o `pulado` do gerador, e não um `cp` silencioso.
# ---------------------------------------------------------------------------
if [ "$MODELO_DIR" = "$RAIZ/modelo/ciclos" ] && [ "$MODELO_CICLO" = "01" ]; then
  # O CAMINHO NORMAL: do módulo, que é o que o Worker também lê. A condição é a identidade do
  # molde — não «o default de hoje»: se um dia o `MODELO` padrão mudar, este ramo tem de deixar de
  # valer sozinho, em vez de escrever os cinco do 01 sob um nome que diz outra coisa.
  node "$RAIZ/tools/gerar-schemas.js" --professor "$PROFESSOR" --ciclo "$CICLO" \
    || { echo "erro: não escrevi os schemas do ciclo em $CICLOS_DIR" >&2; exit 1; }
else
  # O `--modelo <base>/<ciclo>` CONTINUA A VALER, e é a ÚNICA cópia que resta — declarada. Quem
  # semeia a partir do ciclo de um professor quer aqueles cinco ficheiros, e não os do molde; o
  # módulo não os serve, e o `cp` volta aqui, com a guarda do mesmo-ficheiro que a 15/10/2026
  # faltou.
  for s in schema po-schema plano-schema aula-schema captura-schema; do
    origem="$MODELO_DIR/ciclo-$MODELO_CICLO-$s.json"
    destino="$CICLOS_DIR/ciclo-$CICLO-$s.json"
    [ -e "$destino" ] || [ "$origem" = "$destino" ] || cp "$origem" "$destino"
  done
  echo "  schemas: de $MODELO (ciclo-$MODELO_CICLO-*) — os que faltavam (--modelo declarado)"
fi

# ---------------------------------------------------------------------------
# 3) Manifestos (base + variante) — DOCS vazio: nada foi escrito ainda
#
# A BASE SÓ SE ESCREVE UMA VEZ (17/10/2026). Ela é do par (professor, ciclo): quando o mesmo
# professor abre uma segunda escola, a base já existe e não se toca — a variante é que diz o
# que muda. Sem esta guarda, a segunda escola reescreveria a base (com o `NOME` dela), e o
# `ciclo-01.conf` deixaria de ser do ciclo para passar a ser «da última escola criada».
# ---------------------------------------------------------------------------
if [ "$BASE_NOVA" = 1 ]; then
cat > "$CONF_BASE" <<EOF
# ============================================================================
# Ciclo $CICLO — manifesto BASE. Escola e contexto institucional ficam na
# variante (ciclo-$CICLO-<escola>.conf), que sobrescreve estes valores
# (Pré-requisito 5).
#
#   tools/gerar-ciclo.sh $PROFESSOR $CICLO $ESCOLA
#
# ESCOLA SIMULADA — criada do zero por tools/criar-escola.sh. Nada pedagógico
# foi inventado: o objetivo geral fica como lacuna e o DOCS começa vazio. O
# primeiros artefatos reais são o plano e o PO, elicitados pela porta.
# ============================================================================

CICLO="$CICLO"
NOME="Ciclo $CICLO — $ESCOLA_NOME"

# Objetivo geral: provisório declarado — o plano elicitado é quem o estabelece.
OBJETIVO_GERAL="[Preencher: objetivo geral do ciclo — o plano elicitado o estabelece]"

PROFESSOR="$PROFESSOR_NOME"

# Número de encontros do ciclo (Pré-requisito 1 da Regra 10)
TOTAL_AULAS="$TOTAL_AULAS"

# Faixas de volume ativo por duração de aula (Regra 9, etapa 1)
VOLUME_MIN="80"          # faixa de 60 min
VOLUME_MAX="100"
VOLUME_MIN_120="150"     # faixa de 120 min
VOLUME_MAX_120="200"

# Documentos, na ordem em que aparecem no PDF e no menu. COMEÇA VAZIO: nenhum
# documento foi escrito. O plano elicitado será a primeira fonte
# (ciclo-$CICLO-$ESCOLA-po.md); plano e aulas entram quando forem escritos.
DOCS=""
EOF
else
  echo "  base: mantida como está (não é desta escola)"
fi

cat > "$CONF_VARIANTE" <<EOF
# ============================================================================
# Ciclo $CICLO — variante: $ESCOLA_NOME (professor $PROFESSOR_NOME)
# Pré-requisito 5: contexto institucional e frequência.
#
# ESCOLA SIMULADA — criada do zero por tools/criar-escola.sh (tudo é falso:
# nomes, datas e horas fictícios, como no Diaghilev original).
# ============================================================================

# --- identificação e contexto institucional (Pré-requisito 5) ---------------
VARIANTE="$ESCOLA"
ESCOLA="$ESCOLA_NOME"
RESPONSAVEL="$RESPONSAVEL"

# O NOME DE EXIBIÇÃO do professor também é daqui (17/10/2026). Antes só a base o declarava —
# e a base é partilhada pelas escolas do mesmo professor, pelo que a SEGUNDA escola ficava com
# o nome que a primeira tinha escrito. Cada escola declara o seu; a leitura continua
# base → variante, e uma variante antiga (que não o tenha) segue a ler o da base.
PROFESSOR="$PROFESSOR_NOME"

# --- habilitação desta escola ------------------------------------------------
# Por ESCOLA, não por professor. "sim" é explícito: o estado foi conferido.
ESCOLA_HABILITADA="sim"

FREQUENCIA="$FREQUENCIA"
DIAS="$DIAS"             # HORA FICTÍCIA, como todo este ciclo simulado
DURACAO_POR_DIA="$DURACAO_TEXTO"
DURACOES="$DURACAO"
DATA_INICIO="$DATA_INICIO"

# --- conteúdo do ciclo (próprio desta escola) -------------------------------
NOME="Ciclo $CICLO — $ESCOLA_NOME"

# Objetivo geral: provisório declarado (o plano elicitado o estabelece).
OBJETIVO_GERAL="[Preencher: objetivo geral do ciclo — o plano elicitado o estabelece]"

TOTAL_AULAS="$TOTAL_AULAS"

VOLUME_MIN="80"
VOLUME_MAX="100"
VOLUME_MIN_120="150"
VOLUME_MAX_120="200"

# Nenhum documento ainda — o ciclo começa do zero (ver ciclo-$CICLO.conf).
DOCS=""
EOF

if [ "$BASE_NOVA" = 1 ]; then
  echo "  manifestos: $CONF_BASE (novo) + $CONF_VARIANTE"
else
  echo "  manifestos: $CONF_BASE (já existia) + $CONF_VARIANTE"
fi

# ---------------------------------------------------------------------------
# 4) Validação do conf contra o schema (o mesmo rito do hash-ciclo)
# ---------------------------------------------------------------------------
node "$RAIZ/tools/validar-schema-ciclo.js" \
  "$CICLOS_DIR/ciclo-$CICLO-schema.json" "$CONF_BASE" "$CONF_VARIANTE" \
  || { echo "erro: o conf gerado não fechou com o schema — nada foi criado." >&2; exit 1; }
echo "  conf validado: 11 campos obrigatórios ok"

# ---------------------------------------------------------------------------
# 5) Pacote "zero" — índice mínimo + porta + assets compartilhados
# ---------------------------------------------------------------------------
mkdir -p "$PACOTE_DIR/assets" "$PACOTE_DIR/plano-observacao"
cp -R "$RAIZ/porta/." "$PACOTE_DIR/plano-observacao/"
cp "$RAIZ/tools/templates/ciclo.css" "$PACOTE_DIR/assets/style.css"
cp "$RAIZ/tools/lib-cifra.js" "$PACOTE_DIR/assets/lib-cifra.js"
cp "$RAIZ/tools/templates/nav.js" "$PACOTE_DIR/assets/nav.js"
cp "$RAIZ/tools/templates/marca/favicon.svg" "$PACOTE_DIR/assets/favicon.svg"


# O índice do pacote zero é a MESMA apresentação do sistema («Sistema Lastro»)
# que o pacote cheio usa: renderiza `biblioteca/apresentacao.md` com o template do
# ciclo, em vez de um cartão de visita próprio. A entrada é única e compartilhada.
NAV_ZERO="$(mktemp)"
gerar_nav_zero '' 'index' > "$NAV_ZERO"
RODAPE_ZERO="<a href=\"anamnese/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO\">Anamnese do aluno</a> &middot; <a href=\"plano-ensino/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO&fonte=plano\">Plano de ensino</a> &middot; <a href=\"plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO&fonte=po\">Plano de Observação</a>"
pandoc "$RAIZ/biblioteca/apresentacao.md" \
  -o "$PACOTE_DIR/index.html" \
  --standalone --toc --toc-depth=3 \
  --from=markdown+raw_tex+header_attributes \
  --to=html5 \
  --template="$RAIZ/tools/templates/ciclo.html" \
  --css=assets/style.css \
  --include-before-body="$NAV_ZERO" \
  -V "lang=pt-BR" \
  -V "ciclo=$CICLO" \
  -V "ciclo-nome=Ciclo $CICLO — $ESCOLA_NOME" \
  -V "escola=$ESCOLA_NOME" \
  -V "escola-responsavel=$RESPONSAVEL" \
  -V "frequencia=$FREQUENCIA" \
  -V "duracao-por-dia=$DURACAO_TEXTO" \
  -V "ciclo-periodo=$DATA_INICIO" \
  -V "ciclo-professor=$PROFESSOR_NOME" \
  -V "rodape-docs=$RODAPE_ZERO"
rm -f "$NAV_ZERO"

# A página de entrada traz três atalhos para a porta (anamnese, plano de ensino e PO) cujas
# URLs carregam os slugs da escola; o pandoc não interpola variáveis no corpo, então os
# marcadores `@ANAMNESE_URL@`/`@PLANO_URL@`/`@PO_URL@` são trocados aqui — no índice, relativo
# à pasta do pacote, como o nav mínimo do ciclo zero (que usa `plano-observacao/...`).
ANAMNESE_URL_ZERO="plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO"
PLANO_URL_ZERO="${ANAMNESE_URL_ZERO}&fonte=plano"
PO_URL_ZERO="${ANAMNESE_URL_ZERO}&fonte=po"
# O Passo 4 (Lançamento de aula) tem FALLBACK: no pacote "zero" o `lancamento.html`
# ainda não existe (só nasce quando o PO completo dispara a geração). Sem ele, o nome
# sai em texto simples — nunca como link para um 404.
LANCAMENTO_LINK_ZERO='Lançamento de aula — formulário eletrônico'
[ -f "$PACOTE_DIR/lancamento.html" ] && \
  LANCAMENTO_LINK_ZERO='<a href="lancamento.html">Lançamento de aula — formulário eletrônico</a>'
sed -e "s|@ANAMNESE_URL@|$(printf '%s' "$ANAMNESE_URL_ZERO" | sed -e 's/[&%#_]/\\&/g')|g" \
    -e "s|@PLANO_URL@|$(printf '%s' "$PLANO_URL_ZERO" | sed -e 's/[&%#_]/\\&/g')|g" \
    -e "s|@PO_URL@|$(printf '%s' "$PO_URL_ZERO" | sed -e 's/[&%#_]/\\&/g')|g" \
    -e "s|{{LANCAMENTO_LINK}}|$(printf '%s' "$LANCAMENTO_LINK_ZERO" | sed -e 's/[&%#_]/\\&/g')|g" \
    "$PACOTE_DIR/index.html" > "$PACOTE_DIR/index.html.tmp"
mv "$PACOTE_DIR/index.html.tmp" "$PACOTE_DIR/index.html"

# Injeta o nav (com links de raiz) na porta, no marcador <!-- NAV -->.
NAV_PORTA="$(gerar_nav_zero '/' 'porta')"
python3 - "$PACOTE_DIR/plano-observacao/index.html" "$NAV_PORTA" <<'PY'
import sys, pathlib
pagina, nav = sys.argv[1], sys.argv[2]
texto = pathlib.Path(pagina).read_text(encoding='utf-8')
marca = texto.count('<!-- NAV -->')
if marca != 1:
    sys.exit('porta: marcador <!-- NAV --> nao encontrado (ou repetido) — esperado 1, veio %d' % marca)
pathlib.Path(pagina).write_text(texto.replace('<!-- NAV -->', nav, 1), encoding='utf-8')
PY

echo "  pacote zero: $PACOTE_DIR (índice + plano-observacao/ + assets)"

# ---------------------------------------------------------------------------
# 6) Config do Worker (um projeto por escola) — OU NENHUMA, num shard
# ---------------------------------------------------------------------------
# A ESCOLA DENTRO DE UM SHARD NÃO TEM CONFIG PRÓPRIA (15/11/2026). Num shard o motor é UM, o do
# shard, e uma `wrangler.<escola>.jsonc` a mais não é um ficheiro inerte: o `deploy-escolas.yml`
# lista as configs e sobe um Worker por cada uma. O resultado seria a escola criada dentro do shard
# a receber, no push seguinte, um Worker próprio — e o shard a servir uma escola que já não é dele.
# O que a escola precisa (o pacote, o `.conf`, o perfil) continua a ser escrito: é o que o shard
# serve a partir de `publicacao/`.
# AS CRASES DOS COMENTÁRIOS VÃO ESCAPADAS (13/11/2026). Este heredoc é SEM aspas — é o que
# deixa o nome, o professor, o ciclo e o assets.directory receberem as variáveis —, e num
# heredoc sem aspas a crase é SUBSTITUIÇÃO DE COMANDO. O resultado medido na escola `breu`:
# `publicacao/breu/` foi executado como comando, falhou, e o comentário saiu com um BURACO
# («Aqui esteve , e era ela»). A documentação do ficheiro gerado perdia-se em silêncio, e o
# que sobrava eram ordens inventadas a partir de texto de comentário. Crase aqui dentro leva
# barra invertida — como já se fazia no resumo, no fim deste script.
if [ -n "$SHARD_SCRIPT" ]; then
  echo "  config do Worker: NÃO escrita (--shard $SHARD_SCRIPT) — a escola é servida por esse shard"
  WRANGLER=""
else
cat > "$WRANGLER" <<EOF
// Cloudflare Worker da escola $ESCOLA_NOME (professor $PROFESSOR) — ciclo $CICLO.
//
// UM PROJETO POR ESCOLA — irmão dos wrangler.<escola>.jsonc: mesmo código
// (workers/principal.js), mesmo KV compartilhado (as chaves são prefixadas por
// escola) — muda só o name e o assets.directory. A ESCOLA não está aqui: vem do
// mapa em KV, e é o que deixa a identidade de depender do deploy. A ROTA também não
// está aqui (13/11/2026): quem a cria é \`motor/servidor/dominio-da-escola.js\`, no
// provisionamento — um sítio só, e não um sítio por deploy.
// Gerado por tools/criar-escola.sh.

{
  "\$schema": "node_modules/wrangler/config-schema.json",
  "name": "$WORKER",
  "compatibility_date": "2025-02-04",
  "observability": {
    "enabled": true
  },

  "main": "workers/principal.js",

  // A PUBLICAÇÃO MONTADA, NÃO O ESQUELETO (20/10/2026). Aqui esteve
  // "professores/$PROFESSOR/ciclos/ciclo-$CICLO-$ESCOLA" — o pacote-zero, que é a apresentação do
  // sistema e não tem DOCS: o site nascia sem Ciclo nem Aulas, e o ciclo gerado (que sai ao lado,
  // em ciclo-NN-<escola>-<turma>/) nunca aparecia. Foi assim com a breu, com a batata e com o
  // calango. \`publicacao/$ESCOLA/\` é montado por tools/montar-publicacao.js: o índice das
  // turmas, a apresentação, a porta e um subdirectório por pacote. Não é versionado.
  // OS ASSETS NÃO PRECISAM DE INVOCAR O WORKER (13/11/2026). \`true\` aqui fazia o CSS, o
  // \`nav.js\` e o favicon gastarem uma invocação cada — e o plano gratuito cobra 100.000 por dia
  // e conta cada uma, enquanto um asset servido pelo ASSETS é grátis e ilimitado. As duas
  // negativas (precedência sobre \`/*\`) mandam os assets direto para o ASSETS: a pasta de cada
  // pacote, e a dos prefixos da porta. O HTML e o motor continuam no Worker, que é quem injeta a
  // aparência da escola e o freio. Os scripts GERADOS pelo motor moram em \`/scripts/\`, fora do
  // alcance destas regras — ver \`motor/servidor/producao.js\`.
  "assets": {
    "directory": "publicacao/$ESCOLA",
    "binding": "ASSETS",
    "run_worker_first": [
      "/*",
      "!/assets/*",
      "!/*/assets/*",
      "!/*.pdf"
    ]
  },

  // A ESCOLA NÃO SE DECLARA AQUI (13/11/2026). Aqui esteve \`"ESCOLA_SLUG": "$ESCOLA"\`, e era ela
  // que dizia de quem era o Worker. Passa a vir do mapa \`escolas/por-host\`, em KV
  // (\`motor/servidor/mapa-de-escolas.js\`), que o workflow publica ANTES deste deploy — a ordem é
  // a única que não cria uma escola sem ninguém que a reclame.
  "vars": {
    "ESCOLA_HABILITADA": "sim"
  },

  "kv_namespaces": [
    {
      "binding": "PADD_KV",
      "id": "2ee331c7a5bc446ca86c8f2cb039ec16"
    }
  ]
}
EOF
fi

if [ -n "$WRANGLER" ]; then
  echo "  worker: $WRANGLER"
fi

# ---------------------------------------------------------------------------
# 6.1) A PUBLICAÇÃO DA ESCOLA — o `assets.directory` do Worker (20/10/2026)
#
# AQUI, E NÃO NO RAMO DO DEPLOY. A publicação esteve montada só dentro do `--deploy`, e o
# workflow `criar-escola.yml` chama este script SEM `--deploy` (o deploy é um passo separado,
# logo a seguir, na mesma job e no mesmo workspace). Resultado medido em 20/10/2026: o deploy
# morria em «The directory specified by the "assets.directory" field ... does not exist:
# .../publicacao/batata», com a escola já meio criada.
#
# A regra é a do resto do script: o `wrangler.<escola>.jsonc` aponta a publicação, logo a
# publicação tem de existir quando o script termina. Ela é montada aqui, sempre — barata,
# idempotente, e a partir de um pacote-zero que acabou de nascer.
# ---------------------------------------------------------------------------
echo "  publicação: montando ..."
node "$RAIZ/tools/montar-publicacao.js" "$ESCOLA" | sed 's/^/    /'

# ---------------------------------------------------------------------------
# 7) Senha de criptografia — a REAL, mas que NÃO vive mais no computador local.
#    Ela é a SENHA_CRIPTO, um secret do Worker, GERADA PELA PÁGINA `danca` quando a
#    escola é criada (motor/servidor/provisionar-escola.js). Protege o -dados.json e
#    os acompanhamentos. É DIFERENTE da SENHA_ADMIN (a do professor) e da SENHA_RAIZ.
#    Este CLI NÃO gera senha — se a escola foi criada só por aqui, crie-a também pela
#    página `danca`: o Worker é quem guarda a SENHA_CRIPTO (caminho (a), 100% Cloudflare).
# ---------------------------------------------------------------------------
SENHA_CHAVE="SENHA_CRIPTO"
SENHA_ARQUIVO="Worker (secret)"

# ---------------------------------------------------------------------------
# 8) Índice da escola (escola/<escola>/indice.json) — o que o expurgo lê para a
#    limpeza por checklist (§17.6), e o que SOBREVIVE ao expurgo (a proveniência
#    acrescenta, não edita). NÃO guarda o valor da senha: só a CHAVE (SENHA_CRIPTO,
#    que vive no Worker, fora do Git).
# ---------------------------------------------------------------------------
INDICE_DIR="$RAIZ/escola/$ESCOLA"
INDICE_ARQ="$INDICE_DIR/indice.json"
mkdir -p "$INDICE_DIR"

if [ -e "$INDICE_ARQ" ]; then
  # O ÍNDICE EXISTE — e isso tem dois sentidos, que não podem ser confundidos (17/10/2026).
  #
  #   a) a escola NUNCA foi expurgada: o índice é o dela, e não se toca;
  #   b) a escola FOI expurgada e está a ser RECRIADA com o mesmo nome: o expurgo deixou o
  #      elo (`expurgo[]`) e o índice sobreviveu. Aqui registra-se a RECRIAÇÃO — é o que diz
  #      ao `post-merge` e ao `expurgar.js` que os artefatos que estão a nascer são da escola
  #      VIVA, e não restos de uma expurgação por terminar. Sem este elo, a primeira
  #      sincronização apagava a escola recém-criada: aconteceu à `valse`, que foi expurgada,
  #      recriada, e limpa pelo `git pull` seguinte.
  echo "  aviso: $INDICE_ARQ já existe (o índice sobrevive ao expurgo) — não sobrescrevo."
  # O ELO DIZ QUEM RECRIOU (22/10/2026). Sem os dados da criação, o responsável do índice era
  # o da primeira — e o painel dos Bastidores mostrava a pessoa errada.
  # O `--shard` VAI TAMBÉM AQUI (15/11/2026), e a falta dele era o buraco: o índice sobrevive ao
  # expurgo, e o shard só era escrito quando o índice NASCIA. Uma escola recriada dentro do shard
  # ficava com o elo a dizer `worker: <escola>` e sem `shard` — e o `montar-publicacao --shard`, o
  # mapa de escolas e o `deploy-escolas` leem todos esse campo. Nenhum deles a via.
  python3 "$RAIZ/tools/registrar-recriacao.py" "$INDICE_ARQ" \
    --professor "$PROFESSOR" \
    --professor-nome "$PROFESSOR_NOME" \
    --responsavel "$RESPONSAVEL" \
    --ciclo "$CICLO" \
    ${SHARD_SCRIPT:+--shard "$SHARD_SCRIPT"}
else
  python3 - "$INDICE_ARQ" "$ESCOLA" "$WORKER" "$PROFESSOR" "$PROFESSOR_NOME" "$RESPONSAVEL" "$CICLO" "$SENHA_CHAVE" "$SENHA_ARQUIVO" "$SHARD_SCRIPT" <<'PY'
import sys, json, datetime
arq, escola, worker, professor, professor_nome, responsavel, ciclo, senha_chave, senha_arquivo, shard = sys.argv[1:11]
indice = {
    "escola": escola,
    "worker": worker,
    "criado_em": datetime.datetime.now().astimezone().isoformat(),
    "professor": {"slug": professor, "nome": professor_nome},
    "responsavel": responsavel,
    "ciclo": ciclo,
    "senha": {"chave": senha_chave, "arquivo": senha_arquivo},
    # ONDE A ESCOLA VIVE (15/11/2026). Vazio = Worker próprio (o regime de sempre); preenchido =
    # este shard serve a escola, e não há Worker dela. É o que o expurgo lê para saber que a rota
    # a apagar aponta ao shard, e não a um script com o nome da escola.
    **({"shard": shard} if shard else {}),
    "estado": {"habilitada": True},
    # O CAMPO `arquivos` SAIU DAQUI (18/11/2026) — e a decisão é de quem o leu a fundo.
    #
    # Ele era uma LISTA DE INTENÇÃO escrita na criação: os caminhos que aquela escola iria gerar.
    # Ninguém a lê. O expurgo deriva o que apaga da ÁRVORE (`escolaDosCaminhos`, em
    # `motor/servidor/repo-escola.js`), e o registro do que saiu vive no elo (`expurgo[].apagado`),
    # escrito no instante em que saiu. Medido em `experimentos/provar-lista-do-expurgo.js`: o
    # expurgo corre com este campo a apontar para o professor ERRADO e sem o campo nenhum, e manda
    # ao Git exatamente a mesma lista de remoções.
    #
    # Uma lista que ninguém lê e que envelhece em silêncio não é neutra: ela PARECE autoridade. Foi
    # o que aconteceu — a `breu` nasceu com `sapo-bailarino` em vez de `demi-plie`, e a `batata` e
    # o `calango` ainda têm o de outros professores. Alguém leu aquilo como «a lista que o expurgo
    # lê» e escreveu um relatório inteiro sobre um efeito que não existe. O que não se lê, não se
    # escreve.
}
with open(arq, "w", encoding="utf-8") as f:
    json.dump(indice, f, ensure_ascii=False, indent=2)
    f.write("\n")
PY
  echo "  índice: $INDICE_ARQ"
fi

# ---------------------------------------------------------------------------
# 9) Deploy (opcional)
# ---------------------------------------------------------------------------
if [ "$DEPLOY" = 1 ]; then
  echo "  deploy: subindo o Worker '$WORKER' ..."
  ( cd "$RAIZ" && npx wrangler deploy -c "wrangler.$WORKER.jsonc" )

  # O segredo GITHUB_TOKEN alimenta a escrita da fonte do PO e o disparo da
  # geração. Vem do ambiente ou do .dev.vars local (fora do Git).
  TOKEN="${GITHUB_TOKEN:-}"
  if [ -z "$TOKEN" ] && [ -f "$RAIZ/.dev.vars" ]; then
    TOKEN="$(sed -n "s/^GITHUB_TOKEN=['\"]\{0,1\}\([^'\" ]*\)['\"]\{0,1\}.*/\1/p" "$RAIZ/.dev.vars" | head -1)"
  fi
  if [ -n "$TOKEN" ]; then
    echo "  deploy: gravando o segredo GITHUB_TOKEN ..."
    printf '%s' "$TOKEN" | ( cd "$RAIZ" && npx wrangler secret put GITHUB_TOKEN -c "wrangler.$WORKER.jsonc" )
  else
    echo "  aviso: GITHUB_TOKEN não encontrado (env nem .dev.vars) — o PO não vai disparar a geração" >&2
  fi
fi

# ---------------------------------------------------------------------------
# Resumo e próximos passos
# ---------------------------------------------------------------------------
URL="https://${WORKER}.tmenegaz77.workers.dev"
cat <<EOF

Pronto. Ambiente criado do zero:

  professor : $PROFESSOR ($PROFESSOR_NOME)
  escola    : $ESCOLA ($ESCOLA_NOME) — ciclo $CICLO
  worker    : $WORKER
  pacote    : professores/$PROFESSOR/ciclos/ciclo-$CICLO-$ESCOLA/
  config    : wrangler.$WORKER.jsonc
  senha     : $SENHA_CHAVE (secret do Worker — criada pela página \`danca\`, não por aqui)
  URL       : $URL  (após o deploy)

Próximos passos (manuais, na ordem):
  1. SE A ESCOLA AINDA NÃO FOI CRIADA PELA PÁGINA \`danca\`, crie-a lá primeiro:
     a página gera a SENHA_CRIPTO (o segredo que cifra o -dados.json) e a guarda no
     Worker — sem ela o «Guardar» do PO não cifra e a geração falha como na Maria.
  2. commit + push (o deploy de produção e a geração lêem o main):
       git add -A
       git commit -m 'feat(estrutura): criar a escola $ESCOLA do zero'
       git push
  3. ancore a proveniência (o ciclo é o primeiro do professor; sem parentHash):
       tools/hash-ciclo.sh $PROFESSOR $CICLO $ESCOLA
  4. abra $URL/plano-observacao/ e faça, na ordem, a anamnese, o plano e o PO
     do zero (a porta conduz anamnese → plano → PO).
EOF
