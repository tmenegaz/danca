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
MODELO="fokini/01"
DEPLOY=0;          NAO_INTERATIVO=0

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
  --total-aulas <N>         número de aulas                (padrão: 5)
  --modelo <prof/ciclo>     ciclo de onde copiar schemas   (padrão: fokini/01)

FLAGS:
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

pedir "slug do professor"        PROFESSOR
pedir "nome do professor"        PROFESSOR_NOME
pedir "slug da escola"           ESCOLA
pedir "nome da escola"           ESCOLA_NOME
pedir "responsável"              RESPONSAVEL
pedir "ciclo (dois dígitos)"     CICLO
pedir "frequência semanal"       FREQUENCIA
pedir "dias+horas (ISO)"         DIAS
pedir "data de início"           DATA_INICIO
[ -z "$WORKER" ] && WORKER="$ESCOLA"
[ -z "$DURACAO_TEXTO" ] && DURACAO_TEXTO="$DURACAO min por encontro"

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
data_ok "$DATA_INICIO" || { echo "erro: --data-inicio deve ser dd/mm/aaaa: $DATA_INICIO" >&2; exit 1; }
dias_ok "$DIAS"       || { echo "erro: --dias fora do padrão ISO (ex.: 2@19:00,4@19:00): $DIAS" >&2; exit 1; }

# Modelo: <prof>/<ciclo> de onde copiar os schemas.
MODELO_PROF="${MODELO%%/*}"; MODELO_CICLO="${MODELO##*/}"
MODELO_DIR="$RAIZ/professores/$MODELO_PROF/ciclos"
[ -f "$MODELO_DIR/ciclo-$MODELO_CICLO-schema.json" ] \
  || { echo "erro: ciclo-modelo sem schema: $MODELO_DIR/ciclo-$MODELO_CICLO-schema.json" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Proveniência: não sobrescrever o que já existe
# ---------------------------------------------------------------------------
PROF_DIR="$RAIZ/professores/$PROFESSOR"
CICLOS_DIR="$PROF_DIR/ciclos"
PACOTE_DIR="$CICLOS_DIR/ciclo-$CICLO-$ESCOLA"
CONF_BASE="$CICLOS_DIR/ciclo-$CICLO.conf"
CONF_VARIANTE="$CICLOS_DIR/ciclo-$CICLO-$ESCOLA.conf"
WRANGLER="$RAIZ/wrangler.$WORKER.jsonc"

if [ -e "$CONF_BASE" ] || [ -e "$CONF_VARIANTE" ] || [ -e "$PACOTE_DIR" ] || [ -e "$WRANGLER" ]; then
  echo "erro: a escola/ciclo já existe — não sobrescrevo (a proveniência acrescenta, não edita)." >&2
  [ -e "$CONF_BASE" ]     && echo "  já existe: $CONF_BASE" >&2
  [ -e "$CONF_VARIANTE" ] && echo "  já existe: $CONF_VARIANTE" >&2
  [ -e "$PACOTE_DIR" ]    && echo "  já existe: $PACOTE_DIR" >&2
  [ -e "$WRANGLER" ]      && echo "  já existe: $WRANGLER" >&2
  exit 1
fi

echo "criando escola: professor=$PROFESSOR · escola=$ESCOLA · ciclo=$CICLO · worker=$WORKER"

# ---------------------------------------------------------------------------
# 1) Estrutura do professor (se nova)
# ---------------------------------------------------------------------------
mkdir -p "$CICLOS_DIR" "$PROF_DIR/cadernos/ciclo-$CICLO" "$PROF_DIR/relatorios/ciclo-$CICLO" "$PROF_DIR/campo"

# ---------------------------------------------------------------------------
# 2) Schemas do domínio (copiados do modelo — genéricos, sem número de ciclo)
# ---------------------------------------------------------------------------
for s in schema po-schema plano-schema aula-schema captura-schema; do
  cp "$MODELO_DIR/ciclo-$MODELO_CICLO-$s.json" "$CICLOS_DIR/ciclo-$CICLO-$s.json"
done
echo "  schemas: copiados de $MODELO (ciclo-$MODELO_CICLO-*)"

# ---------------------------------------------------------------------------
# 3) Manifestos (base + variante) — DOCS vazio: nada foi escrito ainda
# ---------------------------------------------------------------------------
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

echo "  manifestos: $CONF_BASE + $CONF_VARIANTE"

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

# O nav mínimo do ciclo "zero": a página de entrada + Área do Professor → PO e
# anamnese. Sem a marca (removida do menu — duplicava o «Início»), sem «Início».
# (As páginas do pacote usam o gerar_nav do gerar-ciclo.sh; aqui, sem DOCS,
#  o nav nasce só com o que existe.)
gerar_nav_zero() { # $1 = prefixo de link ('' para o índice, '/' para a porta)
  local p="$1" onde="${2:-}" class_ini="" class_po=""
  if [ "$onde" = "index" ]; then class_ini=' class="ativo"'; fi
  if [ "$onde" = "porta" ]; then class_po=' class="ativo"'; fi
  cat <<EOF
<nav class="topnav" aria-label="Navegação do ciclo">
  <span class="marca" aria-hidden="true"></span>
  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">
    <span></span><span></span><span></span>
  </button>
  <div class="nav-links" id="nav-links">
  <a${class_ini} href="${p}index.html">Nós, Por Exemplo</a>
  <details class="menu">
    <summary>Área do Professor</summary>
    <div class="submenu">
      <a${class_po} href="${p}plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO&fonte=po">Plano de Observação</a>
      <a href="${p}plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO">Anamnese do aluno</a>
    </div>
  </details>
  </div>
</nav>
EOF
}

# O índice do pacote zero é a MESMA página de entrada do sistema («Nós, Por Exemplo»)
# que o pacote cheio usa: renderiza `biblioteca/nos-por-exemplo.md` com o template do
# ciclo, em vez de um cartão de visita próprio. A entrada é única e compartilhada.
NAV_ZERO="$(mktemp)"
gerar_nav_zero '' 'index' > "$NAV_ZERO"
RODAPE_ZERO="<a href=\"plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO&fonte=po\">Plano de Observação</a>"
pandoc "$RAIZ/biblioteca/nos-por-exemplo.md" \
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

# A página de entrada traz dois atalhos para a porta (anamnese e PO) cujas URLs
# carregam os slugs da escola; o pandoc não interpola variáveis no corpo, então os
# marcadores `@ANAMNESE_URL@`/`@PO_URL@` são trocados aqui — no índice, relativo à
# pasta do pacote, como o nav mínimo do ciclo zero (que usa `plano-observacao/...`).
ANAMNESE_URL_ZERO="plano-observacao/?professor=$PROFESSOR&escola=$ESCOLA&ciclo=$CICLO"
PO_URL_ZERO="${ANAMNESE_URL_ZERO}&fonte=po"
# O Passo 3 (Lançamento de aula) tem FALLBACK: no pacote "zero" o `lancamento.html`
# ainda não existe (só nasce quando o PO completo dispara a geração). Sem ele, o nome
# sai em texto simples — nunca como link para um 404.
LANCAMENTO_LINK_ZERO='Lançamento de aula — formulário eletrônico'
[ -f "$PACOTE_DIR/lancamento.html" ] && \
  LANCAMENTO_LINK_ZERO='<a href="lancamento.html">Lançamento de aula — formulário eletrônico</a>'
sed -e "s|@ANAMNESE_URL@|$(printf '%s' "$ANAMNESE_URL_ZERO" | sed -e 's/[&%#_]/\\&/g')|g" \
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
# 6) Config do Worker (um projeto por escola)
# ---------------------------------------------------------------------------
cat > "$WRANGLER" <<EOF
// Cloudflare Worker da escola $ESCOLA_NOME (professor $PROFESSOR) — ciclo $CICLO.
//
// UM PROJETO POR ESCOLA — irmão do wrangler.jsonc (Diaghilev/fokini): mesmo código
// (workers/principal.js), mesmo KV compartilhado (as chaves são prefixadas por
// escola) — muda só o name, o assets.directory e o routes. Gerado por
// tools/criar-escola.sh.

{
  "\$schema": "node_modules/wrangler/config-schema.json",
  "name": "$WORKER",
  "compatibility_date": "2025-02-04",
  "observability": {
    "enabled": true
  },

  "main": "workers/principal.js",

  "assets": {
    "directory": "professores/$PROFESSOR/ciclos/ciclo-$CICLO-$ESCOLA",
    "binding": "ASSETS"
  },

  "kv_namespaces": [
    {
      "binding": "PADD_KV",
      "id": "2ee331c7a5bc446ca86c8f2cb039ec16"
    }
  ]
}
EOF

echo "  worker: $WRANGLER"

# ---------------------------------------------------------------------------
# 7) Deploy (opcional)
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
  URL       : $URL  (após o deploy)

Próximos passos (manuais, na ordem):
  1. commit + push (o deploy de produção e a geração lêem o main):
       git add -A
       git commit -m 'feat(estrutura): criar a escola $ESCOLA do zero'
       git push
  2. ancore a proveniência (o ciclo é o primeiro do professor; sem parentHash):
       tools/hash-ciclo.sh $PROFESSOR $CICLO $ESCOLA
  3. abra $URL/plano-observacao/ e faça, na ordem, a anamnese, o plano e o PO
     do zero (a porta conduz anamnese → plano → PO).
EOF
