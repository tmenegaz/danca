#!/usr/bin/env bash
# ============================================================================
# gerar-ciclo.sh — gera a ENTREGA de um Ciclo de Aprendizagem (Regra 16):
#
#   professores/<nome>/ciclos/ciclo-XX/   pacote HTML interligado
#     index.html, plano.html, aula-YY.html, notacao.html,
#     pre-requisitos.html, musicalidade.html, apanhado-historico.html,
#     referencias.html, guia-do-professor.html, assets/style.css,
#     assets/rizoma-*.svg,
#     ciclo-XX.pdf              PDF único consolidado (índice + bookmarks)
#     README.md                 como navegar e usar o material
#
#   uso:  tools/gerar-ciclo.sh [<professor>] [XX] [escola]   (padrão histórico: tiago 01 — pendente desde 02/10/2026)
#         tools/gerar-ciclo.sh fokini 01 diaghilev   → pacote do Diaghilev
#         PDF_ENGINE=lualatex tools/gerar-ciclo.sh fokini 01 diaghilev   (troca o engine)
#
# Fontes (Markdown, editáveis no VS Code):
#   professores/<p>/ciclos/ciclo-XX.conf          manifesto do ciclo (padrões do projeto)
#   professores/<p>/ciclos/ciclo-XX-<escola>.conf contexto institucional + conteúdo da escola
#   professores/<p>/ciclos/ciclo-XX-<escola>-*.md fontes PRÓPRIAS da escola (precedência)
#   professores/<p>/ciclos/ciclo-XX-index.md      índice geral
#   professores/<p>/ciclos/ciclo-XX-<doc>.md      um arquivo por documento
#   biblioteca/guia-do-professor.md               documento COMPARTILHADO (ver abaixo)
#
# A VISTA — hoje o guia de observação — não vem daí: o gerador a ESCREVE a partir do PO e do plano,
# por `tools/gerar-vista.js` (peça 3 da migração). O gatilho é a ausência da fonte escrita à mão:
# `e_vista()` (em lib-fontes.sh) devolve verdadeiro quando o `.md` da variante já saiu.
#
# Decisão — o guia do professor no pacote:
#   O guia é compartilhado (vive na biblioteca), mas o pacote é uma pasta plana.
#   Em vez de duplicar o arquivo em cada professor (sairia de sincronia na primeira
#   edição), o gerador o trata por CAMINHO ESPECIAL: lê de
#   biblioteca/guia-do-professor.md, normaliza e copia para dentro do pacote como
#   `guia-do-professor.html`. A lista `DOCS` de cada ciclo declara
#   `guia-do-professor` (como último item), o que define a ordem no menu, no índice
#   e no PDF. Assim o guia é escrito uma vez e aparece em todos os pacotes.
#
# Regras que o script garante:
#   · Pré-requisito 5: sem escola, frequência, dias e duração por dia, não gera;
#   · Regra 10 (camada 2): calcula o calendário real (datas, avaliações, extensão)
#     e injeta no lugar do marcador <!-- CALENDARIO --> dos documentos;
#   · Regra 9: volume conferido contra a faixa da duração de cada dia do ciclo;
#   · barra de navegação fixa em todas as páginas, com a página atual marcada;
#   · índice interno no topo de cada página;
#   · botão "voltar ao topo" e rodapé com identificação do ciclo;
#   · PDF consolidado com capa, índice navegável, links cruzados internos,
#     bookmarks e rodapé numerado (cada documento começa em página nova);
#   · links entre arquivos são reescritos para âncoras internas no PDF.
# ============================================================================

set -euo pipefail

# O gerador NAO herda o locale de quem o chama (REGISTRO.md, 23/09/2026).
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib-locale.sh" || exit 1
exigir_locale_utf8 || exit 1

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Slug do professor (a pasta em professores/). Não se chama PROFESSOR de propósito: os
# manifestos declaram PROFESSOR com o nome de EXIBIÇÃO ("Tiago Menegaz" — vai para o rodapé
# do pacote e para o author: do README), e a variável seria sobrescrita ao carregar o conf.
PROFESSOR_SLUG="tiago"  # default histórico `tiago` — pendente desde 02/10/2026 (passe o professor; o único ciclo ativo é o de `fokini`)
if [ "$#" -ge 3 ] && ! printf '%s' "${3:-}" | grep -q '^--'; then
  PROFESSOR_SLUG="$1"
  shift
fi
CICLO="${1:-01}"
ESCOLA_SLUG="${2:-}"
CICLOS="$RAIZ/professores/$PROFESSOR_SLUG/ciclos"
CONF_BASE="$CICLOS/ciclo-$CICLO.conf"
CONF_VARIANTE="$CICLOS/ciclo-$CICLO${ESCOLA_SLUG:+-$ESCOLA_SLUG}.conf"
TPL="$RAIZ/tools/templates"
PDF_ENGINE="${PDF_ENGINE:-pdflatex}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ ! -f "$CONF_BASE" ]; then
  echo "erro: manifesto base não encontrado: $CONF_BASE" >&2
  exit 1
fi
if [ ! -f "$CONF_VARIANTE" ]; then
  echo "erro: manifesto da variante não encontrado: $CONF_VARIANTE" >&2
  echo "  O Pré-requisito 5 (contexto institucional) exige uma variante por escola." >&2
  echo "  Variantes disponíveis:" >&2
  ls -1 "$CICLOS"/ciclo-"$CICLO"-*.conf 2>/dev/null | sed 's|.*/||; s|^|    |' >&2 || true
  exit 1
fi
# shellcheck disable=SC1090
source "$CONF_BASE"
# shellcheck disable=SC1090
source "$CONF_VARIANTE"
ID="ciclo-$CICLO${VARIANTE:+-$VARIANTE}"

# Resolução das fontes — definição única, compartilhada com tools/hash-ciclo.sh
# (ver o cabeçalho de tools/lib-fontes.sh). A versão da própria variante
# (ciclo-01-ritmos-plano.md) tem precedência sobre a sem sufixo (ciclo-01-plano.md).
# shellcheck source=tools/lib-fontes.sh
source "$RAIZ/tools/lib-fontes.sh"

: "${NOME:?defina NOME no manifesto}"
: "${OBJETIVO_GERAL:?defina OBJETIVO_GERAL no manifesto}"
: "${PROFESSOR:?defina PROFESSOR no manifesto}"
: "${DOCS:?defina DOCS (lista ordenada de documentos) no manifesto}"

# ---------------------------------------------------------------------------
# Pré-requisito 5 — contexto institucional e frequência (Regra 18):
# sem escola, frequência, dias de aula e duração por dia, não se gera ciclo.
# ---------------------------------------------------------------------------
for campo in ESCOLA FREQUENCIA DIAS DURACOES DATA_INICIO TOTAL_AULAS; do
  valor="${!campo:-}"
  if [ -z "$valor" ] || printf '%s' "$valor" | grep -q '\['; then
    echo "erro: Pré-requisito 5 incompleto — '$campo' não está declarado em $(basename "$CONF_VARIANTE")." >&2
    echo "  Informe escola, frequência, dias de aula, duração por dia e total de aulas." >&2
    exit 1
  fi
done
echo "variante: $ESCOLA — $FREQUENCIA ($DIAS) — $DURACAO_POR_DIA"

DUR_CURTA="${DURACOES%%,*}"
DUR_LONGA="${DURACOES##*,}"
[ "$DUR_LONGA" = "$DUR_CURTA" ] && DUR_LONGA=""

volume_declarado() {   # $1 = arquivo ; $2 = duração em minutos
  local arq="$1" dur="$2" campo
  if [ "$dur" -le 60 ]; then campo="volume-total"; else campo="volume-total-$dur"; fi
  sed -n "s/^$campo:[[:space:]]*\"\{0,1\}\([0-9]\{1,\}\).*/\1/p" "$arq" | head -1
}

# ---------------------------------------------------------------------------
# Pré-requisito 4 + Regra 9: cada aula declara a duração, e o volume tem de caber
# na faixa daquela duração — inclusive quando a variante tem dia mais longo.
# ---------------------------------------------------------------------------
PRIMEIRA_AULA=""
for doc in $DOCS; do
  case "$doc" in aula-*) ;; *) continue ;; esac
  arq="$(fonte_md "$doc")"
  [ -f "$arq" ] || continue
  [ -z "$PRIMEIRA_AULA" ] && PRIMEIRA_AULA="$arq"
  grep -q '^duracao:' "$arq" || {
    echo "erro: $arq não declara 'duracao:' no cabeçalho (Pré-requisito 4)." >&2
    exit 1
  }
  for dur in ${DURACOES//,/ }; do
    if [ "$dur" -le 60 ]; then min="${VOLUME_MIN:-80}"; max="${VOLUME_MAX:-100}"
    else min="${VOLUME_MIN_120:-}"; max="${VOLUME_MAX_120:-}"; fi
    if [ -z "$min" ] || [ -z "$max" ]; then
      echo "erro: sem faixa de volume para $dur min — declare VOLUME_MIN_$dur e VOLUME_MAX_$dur." >&2
      exit 1
    fi
    vol="$(volume_declarado "$arq" "$dur")"
    if [ -z "$vol" ]; then
      campo="volume-total"; [ "$dur" -gt 60 ] && campo="volume-total-$dur"
      echo "erro: $doc não declara '$campo:' para o dia de $dur min (Regra 9)." >&2
      exit 1
    fi
    if [ "$vol" -lt "$min" ] || [ "$vol" -gt "$max" ]; then
      echo "erro: $doc declara $vol tempos em dia de $dur min, fora da faixa $min–$max (Regra 9)." >&2
      exit 1
    fi
  done
done

# ---------------------------------------------------------------------------
# Regra 10, camada 2 — calendário real: datas, avaliações, extensão e volume
# semanal. O bloco gerado substitui o marcador <!-- CALENDARIO --> das fontes.
# ---------------------------------------------------------------------------
VOL_CURTO="$(volume_declarado "$PRIMEIRA_AULA" "$DUR_CURTA")"
VOL_LONGO=""
[ -n "$DUR_LONGA" ] && VOL_LONGO="$(volume_declarado "$PRIMEIRA_AULA" "$DUR_LONGA")"

EXTRA=()
[ -n "$DUR_LONGA" ] && EXTRA=(--duracao-longa "$DUR_LONGA" --volume-longo "$VOL_LONGO")
python3 "$RAIZ/tools/calendario.py" \
  --escola "$ESCOLA" \
  --responsavel "${RESPONSAVEL:-}" \
  --frequencia "$FREQUENCIA" \
  --dias "$DIAS" \
  --inicio "$DATA_INICIO" \
  --total "$TOTAL_AULAS" \
  --duracao-curta "$DUR_CURTA" \
  --volume-curto "$VOL_CURTO" \
  ${EXTRA[@]+"${EXTRA[@]}"} \
  --saida "$TMP/calendario.md" \
  --vars-arquivo "$TMP/calendario.vars" \
  --aulas-arquivo "$TMP/aulas.tsv"
# shellcheck disable=SC1090
source "$TMP/calendario.vars"
echo "calendário: $PERIODO · $SEMANAS semana(s) · $VOLUME_SEMANAL tempos/semana · formativa $AULA_FORMATIVA ($DATA_FORMATIVA)"

PACOTE="$CICLOS/$ID"
mkdir -p "$PACOTE/assets"

# ---------------------------------------------------------------------------
# Os JSONs do FORMULÁRIO (Fase 2.1). O formulário lê tudo o que precisa AO LADO
# DELE, e o deploy publica SÓ a pasta do pacote — o que não estiver aqui não
# existe para quem abre o site. São três arquivos, e os três são DERIVADOS, como
# o HTML e o PDF: não são fonte, não entram na âncora.
#
#   po-$CICLO.json         o PO extraído     (tools/validar-po-ciclo.js --json)
#   plano-$CICLO.json      o plano extraído  (tools/validar-plano-ciclo.js --json)
#   plano-aula-NN.json     o plano DA AULA   (tools/validar-aula-ciclo.js --json)
#   plano-aula-NN-anterior.json   o estado de que o atual veio (só existe a partir da 2ª geração)
#   ciclos.json            o índice que o formulário lê primeiro (`.conf` + calendário)
#
# É o MESMO extrator que o gerador já usa para as vistas — uma definição só —,
# aqui GRAVADO em vez de descartado depois de gerar a página. O JSON de DADOS
# entra cifrado, na fase seguinte.
#
# As quatro primeiras são DERIVADAS e reconstruíveis da fonte; vão para o pacote mesmo
# assim, porque é o pacote que é publicado. O `-anterior` só existe depois de uma SEGUNDA
# geração, e é isso que ele significa: a primeira vez não tem elo nenhum atrás.
# ---------------------------------------------------------------------------
node "$RAIZ/tools/validar-po-ciclo.js" "$CICLOS/ciclo-$CICLO-po-schema.json" \
  "$(fonte_md po)" --json > "$PACOTE/po-$CICLO.json" \
  || { echo "erro: não consegui extrair o PO para o pacote (po-$CICLO.json)." >&2; exit 1; }
node "$RAIZ/tools/validar-plano-ciclo.js" "$CICLOS/ciclo-$CICLO-plano-schema.json" \
  "$(fonte_md plano)" --json > "$PACOTE/plano-$CICLO.json" \
  || { echo "erro: não consegui extrair o plano para o pacote (plano-$CICLO.json)." >&2; exit 1; }

# O PLANO DE CADA AULA (ARQUITETURA-AULA.md §1.2 — o item 8 do §10). O ANTERIOR NÃO SE PERDE
# (P-03/P-04): esta é a proveniência do estado anterior do plano — o ajuste não se declara, ele
# se VÊ. É o elo, e não um histórico: guarda o estado de que o atual veio.
#
# CORREÇÃO DE 28/09/2026 — o formulário NÃO lê mais este par. A redação anterior dizia que ele
# precisava do plano "AO LADO DELE para comparar campo a campo e emitir o bloco de ajuste", e que
# "o botão do modo 'ajuste do plano' não tem entrada"; ambas as afirmações caducaram quando o botão
# `#ajustar-plano` foi removido de `tools/templates/lancamento.html` (era erro de assistente: não
# há consumidor para o elo do plano). Os validadores continuam a usar `plano-aula-NN.json`, e o
# guard do `pre-commit` (§2c) continua a ler o diff da fonte `aula-NN.md`; o PAR segue sendo
# produzido como proveniência. Ver o `REGISTRO.md`, 28/09/2026.
#
# Os NN vêm da família `aula-*` em disco (`familias_por_aula`, a MESMA derivação do DOCS em
# lib-fontes.sh), e ela já resolve as TRÊS formas de nome da fonte da aula — `ciclo-01-aula-01`,
# `ciclo-01-<escola>-aula-01` e `ciclo-01-<outro-nome>-aula-01` —, ao mesmo tempo que exclui a
# família `captura-aula-*` pela guarda interna. A fonte de cada NN é resolvida por `fonte_md`,
# onde a da variante vence a compartilhada, e o `[ -f ]` é obrigatório: `fonte_md` devolve
# caminho mesmo quando o arquivo não existe, e o NN pode ter entrado no glob pela escola de OUTRA.
#
# A ausência do schema NÃO derruba o pacote: o schema da aula é por CICLO e por PROFESSOR, e um
# professor pode ainda não o ter (o `tiago` chegou depois do `fokini`). Sem schema não há
# validação — mas o pacote continua a ser gerado, como qualquer outro documento que a variante
# não declarou. Com schema, a fonte tem de fechar: o pacote não sai torto.
#
# A ORDEM importa: o `cp` do anterior vem ANTES do `mv` do atual, e o `mv` é o mesmo rename que o
# `>` faria. Interrompido entre os dois, o anterior fica igual ao atual — o estado "sem elo", que é
# o de antes da primeira gravação —, e a próxima geração o reescreve. O que não se admite é o
# anterior virar uma cópia do NOVO, e é isso que a ordem evita.
AULA_SCHEMA="$CICLOS/ciclo-$CICLO-aula-schema.json"
if [ -f "$AULA_SCHEMA" ]; then
  for aula_nn in $(familias_por_aula aula); do
    aula_src="$(fonte_md "aula-$aula_nn")"
    [ -f "$aula_src" ] || continue
    node "$RAIZ/tools/validar-aula-ciclo.js" "$AULA_SCHEMA" "$aula_src" --json \
      > "$PACOTE/plano-aula-$aula_nn.json.tmp" \
      || { rm -f "$PACOTE/plano-aula-$aula_nn.json.tmp"; echo "erro: a fonte da aula $aula_nn ($aula_src) não fechou com o schema da aula (plano-aula-$aula_nn.json) — veja o relatório acima." >&2; exit 1; }
    [ -f "$PACOTE/plano-aula-$aula_nn.json" ] \
      && cp "$PACOTE/plano-aula-$aula_nn.json" "$PACOTE/plano-aula-$aula_nn-anterior.json" || true
    mv "$PACOTE/plano-aula-$aula_nn.json.tmp" "$PACOTE/plano-aula-$aula_nn.json"
  done
fi

# O índice do formulário. Os campos são os que ELE lê (`id`, `escola`, `inicio`,
# `fim`, `arquivo`), os que a lib das vistas lê (`duracao_min`) e o `total_aulas`
# do ciclo. `inicio` e `fim` vêm do CALENDÁRIO — a primeira aula é a ajustada
# para dia de aula, não a data declarada no `.conf`.
#
# `arquivo` é o nome do arquivo de dados DESTA variante POR CONVENÇÃO
# (`ciclo-XX-<escola>-dados.json`), e NÃO o que o `fonte_dados()` resolve: ele
# devolve o nome sem a escola quando o arquivo da variante ainda não existe — o
# que fazia o índice do Ritmos declarar `ciclo-01-dados.json`, um arquivo que
# não existe. O formulário lê este nome: ele é que manda.
#
# O `aulas[]` é o ÍNDICE POR AULA (§4.2 de ARQUITETURA-AULA.md): uma entrada por
# aula, com a data e a hora DECLARADAS pelo TSV do calendário. Ele existe porque o
# cronograma real não é uma progressão de passo fixo: o Ritmos tem 21 aulas em 14
# datas (duas no mesmo dia, uma hora depois) e o Diaghilev tem semanas de 5 e 2
# dias. `intervalo_dias` fica FORA de propósito — um número único só descreveria o
# Duo, e declarar um passo para um cronograma não uniforme trocaria um erro
# silencioso por outro. O `prazo` (§3.1) já TEM produtor — o calendário: ele é fixo por
# aula e sai calculado, com o bloco (§3.2) e o piso de 18h (§3.1); com `FECHAMENTO`
# declarado no `.conf` ele é o teto (§3.4). Só `ancora` (§5) ainda não tem produtor e sai
# NULO: não se inventa valor sem fonte medida.
#
# `CAP_FOLHAS` (§4.2): os NN de aula que TÊM folha de captura na fonte, pela MESMA derivação que o
# pacote usa adiante (`familias_por_aula` + `fonte_md`, e o `[ -f ]` porque `fonte_md` devolve
# caminho mesmo quando o arquivo não existe). Sem esta lista o emissor declarava
# `captura-aula-NN.json` para TODA aula, e o `check-pacote.js` acusava 31 avisos nos ciclos que só
# têm a folha da aula 01 — o índice prometia um config que ninguém produz, e o formulário da aula
# apontaria para um 404. O §4.2 já diz o contrato: `config` omitido = não há folha.
CAP_FOLHAS=""
for folha_nn in $(familias_por_aula captura-aula); do
  [ -f "$(fonte_md "captura-aula-$folha_nn")" ] || continue
  CAP_FOLHAS="$CAP_FOLHAS $folha_nn"
done
CICLO="$CICLO" ESCOLA="$ESCOLA" INICIO="$DATA_PRIMEIRA_AULA" FIM="$DATA_ULTIMA_AULA" \
TOTAL_AULAS="$TOTAL_AULAS" DURACAO_MIN="$DUR_CURTA" \
PROFESSOR_SLUG="$PROFESSOR_SLUG" \
ARQUIVO="ciclo-$CICLO${VARIANTE:+-$VARIANTE}-dados.json" \
AULAS_TSV="$TMP/aulas.tsv" PLANO_JSON="$PACOTE/plano-$CICLO.json" \
DADOS_FONTE="$(fonte_dados)" FECHAMENTO="${FECHAMENTO:-}" \
CAP_FOLHAS="$CAP_FOLHAS" \
python3 - "$PACOTE/ciclos.json" <<'PY'
import datetime, json, os, sys

br_para_iso = lambda br: '-'.join(reversed(br.split('/')))

# O TSV do calendário (`calendario.py --aulas-arquivo`): `NN \t data \t início \t fim`,
# uma linha por aula, `fim` JÁ incluindo a duração.
def ler_aulas(caminho):
    if not caminho or not os.path.exists(caminho):
        print('aviso: sem o TSV por aula (%s) — o índice sai sem `aulas[]`.' % caminho, file=sys.stderr)
        return []
    aulas = []
    with open(caminho, encoding='utf-8') as f:
        for linha in f:
            if not linha.strip():
                continue
            n, data, inicio, fim = linha.rstrip('\n').split('\t')
            aulas.append({'n': n, 'data': data, 'inicio': inicio, 'fim': fim})
    return aulas

# O PRAZO POR AULA (§3.1 de ARQUITETURA-AULA.md). Duas coisas aqui NÃO são o que parecem:
#
#   1. o prazo NÃO é contado de um carimbo de gravação, e sim do CALENDÁRIO: é fixo, e
#      já nasce sabido no índice. O contador que reinicia a cada gravação é OUTRA coisa
#      (a janela de ajuste do formulário) e não mora aqui;
#   2. o prazo mora NA AULA — é por isso que a aula pulada não tem prazo e não desloca o
#      de nenhuma outra (§3.3): ela simplesmente não tem elo, e a corrente segue.
#
# O BLOCO é o conjunto das aulas da MESMA data (o Ritmos tem duas, uma hora depois), e
# conta o FIM DA ÚLTIMA delas: a aula dupla lança-se uma vez só. Contar "24h antes da
# próxima AULA" daria prazo NEGATIVO nas 7 datas com duas aulas do Ritmos; a correção é
# o bloco, e o que se olha adiante é a próxima DATA — não o próximo elo.
#
#   fim do bloco = fim da ÚLTIMA aula daquela data
#   próxima data = a próxima DATA de aula
#   prazo        = MAIOR entre
#                    (a) 24h antes da próxima data de aula
#                    (b) fim do bloco + 18h          <- o piso: tempo hábil
#
# O piso de 18h NÃO é código morto: é ele que atende o caso denso (aula às 20h, próxima
# às 8h). Medido nos três ciclos vivos ele não dispara — a menor janela real é 23h
# (Diaghilev, terça → quinta) —, mas a calibração é da pesquisadora e o piso fica.
#
# A ÚLTIMA aula do ciclo não tem próxima data: ela recebe o MAIOR prazo já praticado no
# ciclo — a maior janela que o cronograma dele produz (§3.3).
def calcular_prazos(aulas, fechamento):
    momento = lambda data, hora: datetime.datetime.strptime(data + ' ' + hora, '%Y-%m-%d %H:%M')
    fim_do_bloco, inicio_da_data = {}, {}
    for a in aulas:
        fim = momento(a['data'], a['fim'])
        if a['data'] not in fim_do_bloco or fim > fim_do_bloco[a['data']]:
            fim_do_bloco[a['data']] = fim
        inicio = momento(a['data'], a['inicio'])
        if a['data'] not in inicio_da_data or inicio < inicio_da_data[a['data']]:
            inicio_da_data[a['data']] = inicio
    datas = sorted(inicio_da_data)
    proxima = {d: datas[i + 1] for i, d in enumerate(datas[:-1])}
    prazos, janelas = {}, []
    for a in aulas:
        piso = fim_do_bloco[a['data']] + datetime.timedelta(hours=18)
        if a['data'] in proxima:
            # (a) conta do INÍCIO DA PRÓXIMA DATA — o horário DELA, não o desta aula: usar
            # o relógio do bloco corrente é o defeito que já produziu número falso.
            antes = inicio_da_data[proxima[a['data']]] - datetime.timedelta(hours=24)
            prazo = max(antes, piso)
            # A JANELA é o que o professor tem de fato (`prazo` − fim do bloco): é ela que
            # a §3.2 mede, e é a MAIOR delas que a última aula herda (§3.3) — não o maior
            # instante, que numa aula passada cairia no passado.
            janelas.append(prazo - fim_do_bloco[a['data']])
        else:
            # Sem próxima data, herda a MAIOR JANELA já praticada. Um ciclo de uma única
            # data não pratica nenhuma: aí vale o piso, que é o menor prazo possível.
            prazo = fim_do_bloco[a['data']] + (max(janelas) if janelas else datetime.timedelta(hours=18))
        # §3.4: com `FECHAMENTO` declarado, ele é TETO de tudo. Sem ele, valem só os
        # prazos por aula — e a ausência do campo não se inventa.
        if fechamento and prazo > fechamento:
            prazo = fechamento
        prazos[a['n']] = prazo.strftime('%Y-%m-%dT%H:%M')
    return prazos

# `FECHAMENTO="20/12/2026"` (§3.4) — OPCIONAL: vazio (o normal hoje) = só os prazos por
# aula. Declarado, ele é a data até a qual a escola fecha o ciclo; ilegível, o gerador
# PÁRA em vez de adivinhar — é data de escola, não parâmetro de conveniência.
def ler_fechamento(br):
    if not br:
        return None
    try:
        return datetime.datetime.strptime(br_para_iso(br), '%Y-%m-%d')
    except ValueError:
        raise SystemExit('erro: FECHAMENTO="%s" não é DD/MM/AAAA.' % br)

# O MARCO da aula vem do PLANO do ciclo (`marcosPorAula`), casado por NÚMERO de aula.
# O plano abre com prosa (que não é objeto) e o Ritmos declara um BLOCO (`02–20`) que
# não casa com nenhuma aula singular: as duas coisas são descartadas, e a aula fica sem
# marco — a lacuna que o próprio plano declara. Não se inventa o que a aula persegue.
def ler_marcos(caminho):
    if not caminho or not os.path.exists(caminho):
        return {}
    with open(caminho, encoding='utf-8') as f:
        plano = json.load(f)
    marcos = {}
    for x in plano.get('marcosPorAula') or []:
        if not isinstance(x, dict) or 'n' not in x or 'marco' not in x:
            continue
        try:
            marcos[int(str(x['n']).strip())] = x['marco']
        except ValueError:
            continue
    return marcos

# O ÚNICO sinal GRAVADO que o estado consome: o registro da aula no JSON de dados
# (`aulas['NN']`). Todo o resto é derivado do calendário — não há "ato declarado" para ler.
def ler_lancadas(caminho):
    if not caminho or not os.path.exists(caminho):
        return set()
    try:
        with open(caminho, encoding='utf-8') as f:
            return {str(k) for k in (json.load(f).get('aulas') or {})}
    except (ValueError, OSError):
        return set()

# O ESTADO da aula é DERIVADO (§1) — não existe campo declarado, nem no `.conf`, nem no
# JSON de dados, nem no índice. O corte não é a data solta: é a data CASADA com o prazo
# (§3.1–§3.3), que é o que sabe distinguir "ainda vai acontecer" de "não aconteceu".
#
#   lancada    registro no JSON       o fato virou memória — só ajuste (§1.1)
#   nao_dada   prazo vencido sem
#              registro               a aula pulada (§3.3)
#   dada       prazo aberto e a aula
#              já terminou             o lançamento está em curso
#   planejada  a aula ainda não
#              terminou               a intenção — CRUD livre (§1)
#
# O JUÍZO É CARIMBADO (`gerado_em`, no índice): ele é do INSTANTE DA GERAÇÃO, não um
# atributo atemporal da aula. Quem lê um índice gerado há dias re-deriva com o próprio
# relógio — o formulário faz isso com `agora()` —, em vez de confiar num veredito que o
# tempo já venceu.
def derivar_estado(a, prazo, lancadas, agora):
    if a['n'] in lancadas:
        return 'lancada'
    # `calcular_prazos` dá prazo a toda aula, então este ramo não é o `planejada` normal:
    # é a guarda de quando o prazo NÃO pôde ser calculado — sem ele não se sabe se a aula
    # fechou, e o estado que não afirma nada é o da intenção.
    if prazo is None:
        return 'planejada'
    if agora < datetime.datetime.strptime(prazo, '%Y-%m-%dT%H:%M'):
        fim = datetime.datetime.strptime(a['data'] + ' ' + a['fim'], '%Y-%m-%d %H:%M')
        return 'dada' if agora >= fim else 'planejada'
    return 'nao_dada'

marcos = ler_marcos(os.environ.get('PLANO_JSON', ''))
lancadas = ler_lancadas(os.environ.get('DADOS_FONTE', ''))
fechamento = ler_fechamento(os.environ.get('FECHAMENTO', ''))
aulas = ler_aulas(os.environ.get('AULAS_TSV', ''))
prazos = calcular_prazos(aulas, fechamento)
agora = datetime.datetime.now()
# §4.2: `config` só entra na aula que TEM folha na fonte. A lista vem do shell (CAP_FOLHAS), com a
# mesma resolução da folha que o produtor do pacote usa — a variante vence a compartilhada.
cap_folhas = set(os.environ.get('CAP_FOLHAS', '').split())
indice_aulas = []
for a in aulas:
    nn = a['n']
    prazo = prazos.get(nn)
    entrada = {
        'n': nn,
        'data': a['data'],
        'inicio': a['inicio'],
        'fim': a['fim'],
        'marco': marcos.get(int(nn)),
        'estado': derivar_estado(a, prazo, lancadas, agora),
        'lancada': nn in lancadas,
        'ancora': None,        # o `.fipp` da aula (§5) — sem produtor ainda
        'prazo': prazo,        # a janela do prazo (§3.1) — do calendário, não de carimbo
    }
    # A peça de captura DA AULA: a MESMA convenção que a publicação do pacote já usa
    # (`captura-aula-NN.json`), decidida pelo índice — não uma segunda convenção. Omitida quando
    # não há folha na fonte (§4.2): prometer o arquivo sem fonte faz o formulário apontar para 404.
    if nn in cap_folhas:
        entrada['config'] = 'captura-aula-%s.json' % nn
    indice_aulas.append(entrada)

indice = {
    '_nota': 'Indice gerado por tools/gerar-ciclo.sh (nao editar a mao). O formulario de '
             'lancamento de aula le este arquivo primeiro e, do ciclo escolhido, busca o '
             'arquivo de dados declarado em "arquivo". O `aulas[]` e o INDICE POR AULA: '
             'a data e a hora de cada aula sao DECLARADAS ali, nao derivadas de um passo '
             'fixo. `ancora` sai nulo enquanto nao tiver produtor; `prazo` (§3.1) e o '
             'instante-limite de lancamento da aula, calculado do calendario. `estado` '
             '(§1) e DERIVADO do calendario + do prazo + do registro: nao ha campo '
             'declarado. Ele carrega o juizo do INSTANTE DA GERACAO — quem le depois '
             're-deriva com o proprio relogio.',
    'gerado_em': agora.strftime('%Y-%m-%dT%H:%M'),
    'ciclos': [{
        'id': os.environ['CICLO'],
        # O SLUG da pasta (`professores/<slug>/`), não o nome de exibição: é por ele que o
        # backend endereça o pacote, e o pacote publicado não tem outro lugar de onde tirá-lo.
        # `escola` NÃO serve para isso — ela é o nome de exibição ("Diaghilev"), e o slug da
        # variante só existe dentro do nome do arquivo de dados.
        'professor': os.environ['PROFESSOR_SLUG'],
        'escola': os.environ['ESCOLA'],
        'inicio': br_para_iso(os.environ['INICIO']),
        'fim': br_para_iso(os.environ['FIM']),
        'total_aulas': int(os.environ['TOTAL_AULAS']),
        'duracao_min': int(os.environ['DURACAO_MIN']),
        'arquivo': os.environ['ARQUIVO'],
        'aulas': indice_aulas,
    }],
}
with open(sys.argv[1], 'w', encoding='utf-8') as f:
    json.dump(indice, f, ensure_ascii=False, indent=2)
    f.write('\n')
PY

# A CONFIG DA FOLHA DE CAPTURA (peça d): os blocos, o grão e — por coluna — o rótulo, a CHAVE e o
# TIPO. O extrator lê a folha por FORMA (os títulos mudam por ciclo: "syllabus RAD" no Duo, "método
# RAD" + um bloco "Par" no Ritmos) e a DECLARAÇÃO do schema diz o que a folha não pode dizer (o par
# rótulo ↔ chave e o tipo). Coluna da folha que o schema não declara NÃO é inventada: o extrator sai
# com erro, o pacote não é escrito e a mensagem diz qual coluna falta declarar. Derivado: não é
# fonte, não entra na âncora.
# UM CONFIG POR AULA (Defeito 1, ARQUITETURA-AULA.md §4.1): a folha da aula 02 pode ter colunas
# que a da 01 não tem, e enquanto o config era um só por ciclo os quatro formulários da Diaghilev
# saíam idênticos. Os NN vêm da família `captura-aula-*` em disco (`familias_por_aula`, a MESMA
# derivação que o DOCS usa em lib-fontes.sh) e a folha de cada NN é resolvida por `fonte_md` — a da
# variante vence a compartilhada. O `[ -f ]` é obrigatório: `fonte_md` devolve caminho mesmo quando
# o arquivo não existe, e o NN pode ter entrado no glob pela folha de OUTRA escola.
CAP_SCHEMA="$CICLOS/ciclo-$CICLO-captura-schema.json"
for cap_nn in $(familias_por_aula captura-aula); do
  cap_src="$(fonte_md "captura-aula-$cap_nn")"
  [ -f "$cap_src" ] || continue
  node "$RAIZ/tools/validar-captura-ciclo.js" "$CAP_SCHEMA" "$cap_src" \
    --variante "$VARIANTE" --json > "$PACOTE/captura-aula-$cap_nn.json" \
    || { echo "erro: a folha de captura da aula $cap_nn não fechou com o schema (captura-aula-$cap_nn.json) — veja o relatório acima." >&2; exit 1; }
done

# O CONFIG DO CICLO continua saindo: é o que o formulário publicado lê hoje (`captura-<id do
# ciclo>.json`, tools/templates/lancamento.html) e apagá-lo quebraria o formulário até o B3b. Ele É
# o config da aula 01 — sai do arquivo já validado acima, para não depender de ordem nem de cópia
# fora do disco.
if [ -f "$PACOTE/captura-aula-01.json" ]; then
  cp "$PACOTE/captura-aula-01.json" "$PACOTE/captura-$CICLO.json"
else
  echo "erro: a folha de captura da aula 01 ($(fonte_md captura-aula-01)) não está no disco — sem ela não há captura-$CICLO.json." >&2
  exit 1
fi

# O JSON de DADOS vai para o pacote CIFRADO (decisão de 20/09): o pacote é PÚBLICO e ele traz o
# lançamento por aluna — é o mesmo cuidado dos acompanhamentos, com a mesma senha (a da escola), e
# a definição dela mora em tools/lib-senhas.sh. Sem senha, o arquivo NÃO vai e o check-pacote
# reprova: silêncio, aqui, seria pior que erro.
# shellcheck source=tools/lib-senhas.sh
. "$RAIZ/tools/lib-senhas.sh"
DADOS="$(fonte_dados)"
if [ ! -f "$DADOS" ]; then
  echo "aviso: sem $DADOS — o pacote sai sem o JSON de dados, e o formulário não abre este ciclo" >&2
elif senha="$(senha_da_escola)"; then
  SENHA="$senha" node "$RAIZ/tools/cifrar-dados.js" "$DADOS" \
    "$PACOTE/ciclo-$CICLO${VARIANTE:+-$VARIANTE}-dados.json" \
    || { echo "erro: não consegui cifrar o JSON de dados para o pacote." >&2; exit 1; }
else
  echo "aviso: o JSON de dados NÃO foi para o pacote (sem senha) — o check-pacote.js vai reprovar" >&2
fi

# A PÁGINA DO FORMULÁRIO (Fase 2.3). O formulário nasceu no experimento; aqui ele é TEMPLATE
# versionado (tools/templates/lancamento.html) e o gerador o publica no pacote — junto das duas libs
# que ele consome (lib-vistas.js e lib-cifra.js) e do `nav.js` que ele COMPARTILHA com as páginas de
# documento, porque o pacote é o que se publica e a página lê tudo AO LADO DELA: as libs em assets/,
# o índice, os JSONs de entrada e o JSON de dados cifrado.
cp "$TPL/lancamento.html" "$PACOTE/lancamento.html"
cp "$RAIZ/tools/lib-vistas.js" "$RAIZ/tools/lib-cifra.js" "$TPL/nav.js" "$PACOTE/assets/"

# ---------------------------------------------------------------------------
# 0) Normalização dos ids: TODA fonte passa por aqui antes de virar HTML e PDF,
#    para que os dois formatos tenham exatamente as mesmas âncoras (ASCII).
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Caminho da fonte de um documento: definido em tools/lib-fontes.sh, junto com
# fontes_do_ciclo() — a MESMA definição usada por tools/hash-ciclo.sh, para que o
# que entra no pacote e o que entra no hash nunca divirjam (foi essa divergência
# que fez o pacote da Ritmos sair com o plano da Duo).
# ---------------------------------------------------------------------------

mkdir -p "$TMP/src"
# Acompanhamentos: vista por aluna, gerada sob demanda a partir do PO e dos
# relatórios pós-aula. NÃO entram em DOCS (aquela lista é estática; estes são por
# aluna) e, por isso, também não entram no hash da âncora: são derivados, não fontes.
if [ -x "$RAIZ/tools/gerar-acompanhamento.sh" ]; then
  "$RAIZ/tools/gerar-acompanhamento.sh" "$PROFESSOR_SLUG" "$CICLO" "$VARIANTE" || \
    echo "aviso: não foi possível gerar os acompanhamentos deste ciclo" >&2
fi
ACOMP_DOCS=""
for f in "$CICLOS"/ciclo-"$CICLO"-"$VARIANTE"-acompanhamento-*.md; do
  [ -f "$f" ] || continue
  ACOMP_DOCS="$ACOMP_DOCS $(basename "$f" | sed "s/^ciclo-$CICLO-$VARIANTE-//; s/\.md$//")"
done
ACOMP_DOCS="${ACOMP_DOCS# }"

# As páginas de FERRAMENTA: têm HTML no pacote mas NÃO são documento — não entram em DOCS, não vão
# ao PDF e não têm fonte `.md` (o rótulo do menu é declarado no gerador, como o do caderno). Hoje é
# uma só: o formulário de lançamento (Fase 2.3).
FERRAMENTAS="lancamento"

# O LINK do Plano de Observação — a porta de elicitação, promovida ao Worker de produção. É um
# item EXTERNO (uma rota do Worker), não um `$doc.html` do pacote — por isso não entra em DOCS
# nem em FERRAMENTAS e é tratado à parte, dentro do grupo "Área do Professor". O caminho leva o
# contexto do ciclo, para a porta abrir já identificada. A rota `/plano-observacao/` é servida
# pelo Worker de produção (`workers/principal.js`, `motor/servidor/producao.js`).
# A porta serve TRÊS fontes por `?fonte=` (anamnese, plano, po). O menu da Área do
# Professor expõe DUAS delas: a anamnese (default) e o PO. O plano entra pelo PO.
ANAMNESE_URL="/plano-observacao/?professor=$PROFESSOR_SLUG&escola=${VARIANTE:-$ESCOLA_SLUG}&ciclo=$CICLO"
PO_URL="${ANAMNESE_URL}&fonte=po"

for doc in index $DOCS $ACOMP_DOCS; do
  if e_vista "$doc"; then
    # A VISTA é GERADA (peça 3 da migração): o PO e o plano passam pelos extratores e pela lib das
    # vistas, e o texto sai DETERMINÍSTICO — sem carimbo — para o pacote ser reconstruível. A fonte
    # escrita à mão saiu; quem escreve agora é esta linha.
    src="$TMP/src/ciclo-$CICLO-$doc.de-vista.md"
    if ! node "$RAIZ/tools/gerar-vista.js" "$PROFESSOR_SLUG" "$CICLO" "$VARIANTE" "$doc" > "$src"; then
      echo "erro: não consegui gerar a vista '$doc' (ciclo $CICLO-$VARIANTE)." >&2
      exit 1
    fi
  else
    src="$(fonte_md "$doc")"
  fi
  [ -f "$src" ] || continue
  destino="$TMP/src/ciclo-$CICLO-$doc.md"
  python3 "$RAIZ/tools/normalizar-ids.py" "$src" "$destino"
  # Regra 10, camada 2: injeta o calendário real (calculado da variante) no lugar
  # do marcador <!-- CALENDARIO -->, se o documento tiver o marcador
  if grep -q '<!-- CALENDARIO -->' "$destino"; then
    python3 - "$destino" "$TMP/calendario.md" <<'PY'
import sys, pathlib
alvo = pathlib.Path(sys.argv[1])
cal = pathlib.Path(sys.argv[2]).read_text(encoding='utf-8').strip()
texto = alvo.read_text(encoding='utf-8')
# Mesma armadilha do `<!-- NAV -->` (ver o bloco do `lancamento.html`): o `replace` sem limite
# injetaria o calendário em TODAS as ocorrências do marcador, e o bloco duplicado repetiria o
# `id="calendario-do-ciclo"` na página. Falha alto em vez de duplicar calado.
marca = texto.count('<!-- CALENDARIO -->')
if marca != 1:
    sys.exit('%s: marcador <!-- CALENDARIO --> aparece %d vezes (esperado 1).'
             % (alvo.name, marca))
alvo.write_text(texto.replace('<!-- CALENDARIO -->', cal), encoding='utf-8')
PY
  fi
done

# Âncoras estáveis: são as mesmas no HTML (#id da página) e no PDF (#id da seção),
# e é isso que permite ligar de um arquivo a outro sem quebrar em nenhum formato.
declare -A ANCORA=(
  [index]="indice-geral"
  [plano]="plano-do-ciclo"
  [notacao]="notacao-em-benesh"
  [pre-requisitos]="condicoes-pre-existentes"
  [musicalidade]="musicalidade"
  [apanhado-historico]="apanhado-historico"
  [referencias]="referencias-bibliograficas"
  [guia-do-professor]="guia-do-professor"
  [metodo]="metodo"
)
ancora() { printf '%s' "${ANCORA[$1]:-ciclo-$CICLO-$1}"; }

# A fonte que o PACOTE lê de um documento. Para a VISTA, é o texto que o gerador acabou de
# escrever (em $TMP): a fonte dela não existe no disco antes de o pacote rodar — e o menu, o
# rodapé e o corpo precisam da MESMA resposta. Para os demais, é o .md versionado.
src_do_doc() {
  if e_vista "$1"; then
    printf '%s' "$TMP/src/ciclo-$CICLO-$1.de-vista.md"
  else
    fonte_md "$1"
  fi
}

# Rótulo do menu: o título declarado no YAML do próprio documento
rotulo() {
  local src
  # O caderno não tem front-matter (é registro, não documento): sem este caso o
  # item do menu sairia vazio, porque a extração abaixo depende de `title:`.
  # O METODO.md também não tem front-matter — e é documento congelado: o rótulo
  # vem daqui, não de um `title:` acrescentado à fonte (`Método` é o H1 dele).
  case "$1" in
    caderno-*) printf 'Caderno'; return ;;
    metodo) printf 'Método'; return ;;
    # A página do formulário não tem fonte `.md` — o rótulo é declarado aqui (decisão de 20/09:
    # "Lançamento de aula — formulário eletrônico", ao lado da captura, na Área do Professor).
    lancamento) printf 'Lançamento de aula — formulário eletrônico'; return ;;
    # Havia um caso para `relatorio-aula-*` aqui até 2026-09-20: a fonte se chamava
    # `relatorio-aula-NN` e o `title:` dela dizia "Relatório pós-aula … (preview)" — o
    # rótulo era corrigido no gerador porque a CHAVE MENTIA. A chave passou a se chamar
    # `guia-de-observacao-NN` e o `title:` da fonte diz o que o documento é; o caso saiu,
    # porque o rótulo agora vem da fonte e o remendo não tem mais razão de existir.
  esac
  src="$(src_do_doc "$1")"
  if [ -f "$src" ]; then
    sed -n 's/^title:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$src" | head -1
  fi
}

# Rótulo de item do MENU. Igual ao `rotulo()`, com uma marca de DÍVIDA: a Musicalidade e o Guia de
# observação são gerados por demanda (o formulário de lançamento) e saem do menu quando a verificação
# da cadeia de custódia existir — até lá ficam marcados. SÓ NO MENU: o `title:` da página e o
# sumário do PDF continuam limpos, porque o que está marcado é a NAVEGAÇÃO, não o documento. Por isso
# a marca não entra no `rotulo()`: ele serve o menu, o rodapé e o README, e o rodapé não é o menu.
rotulo_no_menu() {
  case "$1" in
    musicalidade|guia-de-observacao-*) printf '%s (remover)' "$(rotulo "$1")" ;;
    *) rotulo "$1" ;;
  esac
}

# ---------------------------------------------------------------------------
# Rodapé: a lista de documentos é DERIVADA de DOCS, não fixa no template.
# Antes o template trazia as páginas do ciclo de fundamentos (notação,
# pré-requisitos, musicalidade, apanhado histórico) escritas à mão — e num ciclo
# que não tem esses documentos (pas de deux) o rodapé saía com links mortos, o
# que o validador reprovava. Agora o rodapé mostra o que o ciclo realmente tem.
# ---------------------------------------------------------------------------
rodape_docs() {
  # O «Índice do ciclo» (index.html) saiu do rodapé junto com o «Início» do menu: repetia
  # o Plano. O rodapé começa no Plano, que é a porta de entrada do conteúdo do ciclo.
  local doc r saida='<a href="plano.html">Plano</a>'
  for doc in $DOCS; do
    case "$doc" in aula-*|plano) continue ;; esac
    [ -f "$(src_do_doc "$doc")" ] || continue
    r="$(rotulo "$doc")"
    saida="$saida &middot; <a href=\"$doc.html\">$r</a>"
  done
  printf '%s &middot; <a href="%s.pdf">PDF do ciclo</a>' "$saida" "$ID"
}

# ---------------------------------------------------------------------------
# Barra de navegação fixa (uma por página, com a atual marcada)
# ---------------------------------------------------------------------------
gerar_nav() {
  # $1 = doc atual (ou "plano-observacao" para a porta); $2 = arquivo de saída;
  # $3 = prefixo de link OPCIONAL (vazio nas páginas do pacote, "/" na porta).
  local atual="$1" destino="$2" prefixo="${3:-}" doc r
  # O href de um link interno: prefixa com $prefixo — menos quando o caminho já é
  # absoluto (começa com `/`, ex. o PO_URL) ou externo. Assim a MESMA nav serve o
  # pacote (links relativos) e a porta (links de raiz, um nível abaixo).
  link_href() { # $1 = caminho (index.html, /plano-observacao/?, …)
    case "$1" in
      /*|https:*|http:*|mailto:*|data:*) printf '%s' "$1" ;;
      *) printf '%s%s' "$prefixo" "$1" ;;
    esac
  }
  {
    echo '<nav class="topnav" aria-label="Navegação do ciclo">'
    # A marca («Ciclo NN · escola») saiu do menu: duplicava o «Início» do grupo
    # «Ciclos» (o mesmo destino). Fica um espaço reservado, sem conteúdo, para o
    # menu não colar na borda esquerda — a largura mora no `ciclo.css` (`.marca`).
    echo '  <span class="marca" aria-hidden="true"></span>'
    # botão do menu mobile: só aparece em tela pequena (ver ciclo.css); o estado
    # aberto/fechado é anunciado por aria-expanded, e o painel é .nav-links
    echo '  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">'
    echo '    <span></span><span></span><span></span>'
    echo '  </button>'
    echo '  <div class="nav-links" id="nav-links">'
    # ------------------------------------------------------------------
    # Menu: sequência DECLARATIVA. Cada item é "Nome|padrões":
    #   - um padrão só, sem glob  → link direto para esse documento
    #   - um ou mais padrões      → dropdown (padrão é glob: aula-*, glossario-*)
    # A LISTA de documentos continua vindo de DOCS + ACOMP_DOCS (documento novo
    # entra sozinho); o que é declarativo é o AGRUPAMENTO. O que não cair em
    # grupo nenhum vai para "Outros" — nada some do menu por esquecimento.
    # ------------------------------------------------------------------
    link_menu() {   # $1 = doc (link de topo)
      local d="$1" rot
      rot="$(rotulo_no_menu "$d")"
      if [ "$d" = "$atual" ]; then
        echo "  <a class=\"ativo\" href=\"$(link_href "$d.html")\">$rot</a>"
      else
        echo "  <a href=\"$(link_href "$d.html")\">$rot</a>"
      fi
    }
    item_menu() {   # $1 = doc (item de submenu)
      local d="$1" rot=""
      # no acompanhamento o rótulo é o apelido (P-12), não o título do documento
      case "$d" in
        acompanhamento-*) rot="$(sed -n 's/^aluna:[[:space:]]*//p' "$(fonte_md "$d")" | head -1)" ;;
      esac
      [ -n "$rot" ] || rot="$(rotulo_no_menu "$d")"
      if [ "$d" = "$atual" ]; then
        echo "      <a class=\"ativo\" href=\"$(link_href "$d.html")\">$rot</a>"
      else
        echo "      <a href=\"$(link_href "$d.html")\">$rot</a>"
      fi
    }

    membros=""
    # ------------------------------------------------------------------
    # Sequência do menu (decisões da pesquisadora, 19/09/2026):
    #   "Apoio" deixou de existir — notação e glossário vão para Planejamento;
    #   "musicalidade" (a do professor) saiu de Planejamento para Área do
    #   Professor; "musicalidade-aluna" (a folha da aluna) fica em Planejamento.
    #   E a separação por NATUREZA: "Acompanhamento" tem só conteúdo real (o que
    #   aconteceu — os acompanhamentos por aluna e o caderno); "Área do Professor"
    #   tem as ferramentas e os guias — por isso o GUIA DE OBSERVAÇÃO
    #   (`guia-de-observacao-*`) e a folha de captura (`captura-aula-*`) saíram do
    #   Acompanhamento e entraram aqui, junto do guia-do-professor e do METODO.
    # ------------------------------------------------------------------
    for item in \
      "Nós, Por Exemplo|index" \
      "Ciclos|plano referencias" \
      "Aulas|aula-*" \
      "Acompanhamento|acompanhamento-* caderno-*" \
      "Planejamento|pre-requisitos musicalidade-aluna notacao glossario-*" \
      "Área do Professor|musicalidade harmonizacao guia-do-professor metodo guia-de-observacao-* captura-aula-* lancamento"
    do
      nome="${item%%|*}"
      padroes="${item#*|}"
      # link direto: um único padrão, sem glob
      case "$padroes" in
        *'*'*|*' '*) ;;
        *) link_menu "$padroes"; continue ;;
      esac
      membros=""
      for pat in $padroes; do
        for doc in $DOCS $ACOMP_DOCS $FERRAMENTAS; do
          case "$doc" in
            $pat)
              case " $membros " in
                *" $doc "*) ;;
                *) membros="$membros $doc" ;;
              esac
              ;;
          esac
        done
      done
      # O «Início» (o índice do ciclo) foi removido: repetia o «Plano» (mesmo conteúdo) e
      # o menu não o lista mais. O grupo «Ciclos» é um grupo normal — aparece só quando tem
      # membros (plano, referências, …), e some num ciclo "do zero" que ainda não os tem.
      [ -n "$membros" ] || continue
      echo '  <details class="menu">'
      echo "    <summary>$nome</summary>"
      echo '    <div class="submenu">'
      for doc in $membros; do item_menu "$doc"; done
      # A anamnese e o Plano de Observação são itens EXTERNOS (rota do Worker), não docs do
      # pacote: entram aqui, no fim do grupo, com os seus próprios links — e não passam pelo
      # `item_menu` (`$doc.html`). Na PORTA (`atual=plano-observacao`) o PO é o ATIVO; a anamnese
      # é um item irmão (a porta distingue as duas por `?fonte=`, mas a nav é estática).
      if [ "$nome" = "Área do Professor" ]; then
        if [ "$atual" = "plano-observacao" ]; then
          echo "      <a class=\"ativo\" href=\"$PO_URL\">Plano de Observação</a>"
        else
          echo "      <a href=\"$PO_URL\">Plano de Observação</a>"
        fi
        echo "      <a href=\"$ANAMNESE_URL\">Anamnese do aluno</a>"
      fi
      echo '    </div>'
      echo '  </details>'
    done

    # catch-all: documento que não caiu em grupo nenhum
    sobra=""
    for doc in $DOCS $ACOMP_DOCS; do
      case "$doc" in
        index|plano|referencias|aula-*) ;;
        guia-de-observacao-*|captura-aula-*|acompanhamento-*|caderno-*) ;;
        pre-requisitos|musicalidade|musicalidade-aluna) ;;
        notacao|glossario-*|harmonizacao|guia-do-professor|metodo) ;;
        apanhado-historico) ;;
        *) sobra="$sobra $doc" ;;
      esac
    done
    if [ -n "$sobra" ]; then
      echo '  <details class="menu">'
      echo '    <summary>Outros</summary>'
      echo '    <div class="submenu">'
      for doc in $sobra; do item_menu "$doc"; done
      echo '    </div>'
      echo '  </details>'
    fi
    echo "  <a class=\"pdf\" href=\"$(link_href "$ID.pdf")\">PDF do ciclo</a>"
    echo '  </div>'
    echo '</nav>'
  } > "$destino"
}

# ---------------------------------------------------------------------------
# 1) Pacote HTML: um arquivo por documento, todos com a mesma navegação
# ---------------------------------------------------------------------------
TODOS="index $DOCS $ACOMP_DOCS"

# A barra de navegação do PACOTE entra no formulário (ele é uma página do site, não uma página fora
# dele): aqui a MESMA `gerar_nav` das demais páginas é escrita no lugar do marcador `<!-- NAV -->`.
# Fica aqui, e não junto do `cp`, porque a função se define mais abaixo — e bash lê o script na ordem.
gerar_nav lancamento "$TMP/nav-lancamento.html"
python3 - "$PACOTE/lancamento.html" "$TMP/nav-lancamento.html" <<'PY'
import pathlib, sys
alvo = pathlib.Path(sys.argv[1])
nav = pathlib.Path(sys.argv[2]).read_text(encoding='utf-8')
texto = alvo.read_text(encoding='utf-8')
marca = texto.count('<!-- NAV -->')
if marca == 0:
    sys.exit('lancamento.html: marcador <!-- NAV --> não encontrado')
if marca > 1:
    sys.exit('lancamento.html: marcador <!-- NAV --> aparece %d vezes (esperado 1) — a nav '
             'sairia duplicada. Há uma ocorrência solta no template, provavelmente dentro de '
             'um comentário em prosa.' % marca)
# Troca UMA vez: a nav é um bloco único, e um `replace` sem limite injetaria a barra em todas as
# ocorrências do marcador que o template trouxesse.
alvo.write_text(texto.replace('<!-- NAV -->', nav, 1), encoding='utf-8')
PY
gerados=0
for doc in $TODOS; do
  src="$TMP/src/ciclo-$CICLO-$doc.md"
  if [ ! -f "$src" ]; then
    echo "aviso: fonte ausente, pulando: $doc ($(fonte_md "$doc"))" >&2
    continue
  fi
  gerar_nav "$doc" "$TMP/nav.html"
  # O caderno não tem front-matter (é registro, não documento): sem um título
  # explícito, o pandoc usa o nome do arquivo e a aba do navegador sai
  # "ciclo-01-caderno-01". Os demais documentos trazem `title:` da própria fonte.
  METADADOS=()
  case "$doc" in
    caderno-*) METADADOS=(--metadata "title=Caderno — Ciclo $CICLO · $ESCOLA") ;;
    metodo) METADADOS=(--metadata "title=Método") ;;
    # O título visível do GUIA DE OBSERVAÇÃO vem da FONTE, como o de todo documento com
    # front-matter: desde 2026-09-20 o `title:` dela diz "Guia de observação — Aula NN",
    # quando a chave passou a se chamar o que o documento É (antes era `relatorio-aula-NN`,
    # e o rótulo tinha de ser corrigido aqui, porque a chave mentia). Este caso mantém o
    # rótulo para a aba e o cabeçalho — e é ele que o `check-pacote` compara com o título
    # da seção do PDF.
    guia-de-observacao-*)
      METADADOS=(--metadata "title=Guia de observação — Aula ${doc#guia-de-observacao-}") ;;
  esac
  # A ficha (Escola · frequência · duração · Ciclo · data · volume) NÃO aparece na
  # página de entrada («Nós, Por Exemplo», o `index`): ela é material do sistema, não
  # do ciclo. As demais páginas mantêm a ficha. O template `ciclo.html` mostra a ficha
  # só quando `ficha` está declarado.
  FICHA_VAR=()
  [ "$doc" = index ] || FICHA_VAR=(-V "ficha=1")
  pandoc "$src" \
    -o "$PACOTE/$doc.html" \
    --standalone --toc --toc-depth=3 \
    --from=markdown+raw_tex+header_attributes \
    --to=html5 \
    --template="$TPL/ciclo.html" \
    --css=assets/style.css \
    --include-before-body="$TMP/nav.html" \
    "${METADADOS[@]}" \
    -V "lang=pt-BR" \
    -V "ciclo=$CICLO" \
    -V "ciclo-id=$ID" \
    -V "ciclo-anchor=$(ancora "$doc")" \
    -V "ciclo-nome=$NOME" \
    -V "ciclo-periodo=$PERIODO" \
    -V "ciclo-professor=$PROFESSOR" \
  -V "rodape-docs=$(rodape_docs)" \
    -V "escola=$ESCOLA" \
    -V "escola-responsavel=${RESPONSAVEL:-}" \
    -V "frequencia=$FREQUENCIA" \
    -V "duracao-por-dia=$DURACAO_POR_DIA" \
    -V "volume-semanal=$VOLUME_SEMANAL tempos/semana" \
    -V "ciclo-semanas=$SEMANAS" \
    "${FICHA_VAR[@]}"
  # A página de entrada («Nós, Por Exemplo», o `index`) traz dois atalhos para a porta —
  # a anamnese e o PO — cujas URLs carregam os slugs do ciclo (professor, escola, ciclo).
  # O pandoc não interpola variáveis no CORPO do documento; os marcadores `@ANAMNESE_URL@`
  # e `@PO_URL@` são trocados aqui, só no `index`, pelo mesmo padrão de injeção do cabeçalho
  # LaTeX (`@NOME@`). O `&` da query é escapado para o `sed` não lê-lo como "a linha toda".
  #
  # O Passo 3 (Lançamento de aula) tem um FALLBACK: só vira link se o `lancamento.html`
  # existir no pacote. Num ciclo "do zero" (ainda sem PO completo) ele não existe — e um
  # `<a href="lancamento.html">` apontaria para um 404. Sem o arquivo, o nome sai em texto
  # simples (sem link), para não quebrar a página.
  if [ "$doc" = index ]; then
    LANCAMENTO_LINK='Lançamento de aula — formulário eletrônico'
    [ -f "$PACOTE/lancamento.html" ] && \
      LANCAMENTO_LINK='<a href="lancamento.html">Lançamento de aula — formulário eletrônico</a>'
    sed -e "s|@ANAMNESE_URL@|$(printf '%s' "$ANAMNESE_URL" | sed -e 's/[&%#_]/\\&/g')|g" \
        -e "s|@PO_URL@|$(printf '%s' "$PO_URL" | sed -e 's/[&%#_]/\\&/g')|g" \
        -e "s|{{LANCAMENTO_LINK}}|$(printf '%s' "$LANCAMENTO_LINK" | sed -e 's/[&%#_]/\\&/g')|g" \
        "$PACOTE/index.html" > "$TMP/index-p.html"
    mv "$TMP/index-p.html" "$PACOTE/index.html"
  fi
  gerados=$((gerados + 1))
  echo "html: $doc.html"
done
[ "$gerados" -gt 0 ] || { echo "erro: nenhum documento convertido" >&2; exit 1; }

cp "$TPL/ciclo.css" "$PACOTE/assets/style.css"
APRESENTACAO="${APRESENTACAO:-$RAIZ/apresentacoes/apresentacao-01-rizoma}"
for img in "$APRESENTACAO"/rizoma-*.svg; do
  [ -f "$img" ] && cp "$img" "$PACOTE/assets/"
done

# ---------------------------------------------------------------------------
# 1b) A PORTA de elicitação (o Plano de Observação) — cópia + a navegação do site
# ---------------------------------------------------------------------------
# A porta é um SUBDIRETÓRIO do pacote (`plano-observacao/`), servida pelo Worker de produção
# sob `/plano-observacao/`. Ela recebe a MESMA navegação das demais páginas (a `gerar_nav`),
# com links de RAIZ (`/index.html`, …) porque vive um nível abaixo do pacote — e o item
# "Plano de Observação" sai marcado como ATIVO. O marcador `<!-- NAV -->` do template é
# substituído, como no `lancamento.html`; sem ele, a porta fica sem a barra, mas inteira.
if [ -d "$RAIZ/porta" ]; then
  mkdir -p "$PACOTE/plano-observacao"
  cp -R "$RAIZ/porta/." "$PACOTE/plano-observacao/"
  gerar_nav plano-observacao "$TMP/nav-po.html" "/"
  python3 - "$PACOTE/plano-observacao/index.html" "$TMP/nav-po.html" <<'PY'
import sys, pathlib
pagina, nav = sys.argv[1], pathlib.Path(sys.argv[2]).read_text(encoding='utf-8')
texto = pathlib.Path(pagina).read_text(encoding='utf-8')
marca = texto.count('<!-- NAV -->')
if marca != 1:
    sys.exit('porta: marcador <!-- NAV --> nao encontrado (ou repetido) — esperado 1, veio %d' % marca)
pathlib.Path(pagina).write_text(texto.replace('<!-- NAV -->', nav, 1), encoding='utf-8')
PY
  echo "porta: plano-observacao/ (com a navegacao do site)"
fi

# ---------------------------------------------------------------------------
# 1b) Acompanhamentos: criptografia (PageCrypt) — depois do HTML, antes de validar
# ---------------------------------------------------------------------------
# O HTML do acompanhamento acaba de nascer; a validação ainda não rodou. É o
# único ponto do fluxo em que dá para criptografar o pacote completo — dentro do
# gerador, ninguém esquece a etapa. A senha vem de tools/.senhas-locais (fora do
# repositório); sem ela, a criptografia falha e o check-pacote.js reprova o
# pacote: acompanhamento de aluna não vai para o site em claro.
if [ -n "$ACOMP_DOCS" ]; then
  "$RAIZ/tools/gerar-acompanhamento.sh" "$PROFESSOR_SLUG" "$CICLO" "$VARIANTE" --criptografar || \
    echo "aviso: acompanhamentos NÃO criptografados — o check-pacote.js vai reprovar" >&2
fi

# ---------------------------------------------------------------------------
# 2) PDF único consolidado: capa + índice navegável + seções em página nova
# ---------------------------------------------------------------------------
# Os ACOMPANHAMENTOS NÃO entram no PDF. Ele é publicado no site e ficaria em
# claro: a política de segurança dos dados sensíveis protege por camadas, e esta
# é uma delas (ver CONGELAMENTO.md). Eles existem no site, cifrados.
python3 - "$TMP/src" "$CICLO" "$TMP/consolidado.md" "$DOCS" "$ESCOLA" > "$TMP/mapa-ancoras.txt" <<'PY'
import re, sys, pathlib
ciclos, ciclo, destino, docs, escola = \
    sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(), sys.argv[5]
ancoras = {
    'index': 'indice-geral', 'plano': 'plano-do-ciclo', 'notacao': 'notacao-em-benesh',
    'pre-requisitos': 'condicoes-pre-existentes', 'musicalidade': 'musicalidade',
    'apanhado-historico': 'apanhado-historico', 'referencias': 'referencias-bibliograficas',
    'guia-do-professor': 'guia-do-professor', 'metodo': 'metodo',
}
# Documento sem front-matter não tem `title:`, e a seção do PDF sairia com a chave
# interna. Aqui o nome legível de quem não traz `title:` na própria fonte.
titulos = {'metodo': 'Método'}
# O preview do relatório aparece no site como "Guia de observação — Aula NN"
# (decisão de 19/09/2026): o PDF usa o MESMO nome — o check-pacote compara os
# títulos das páginas HTML com o texto do PDF, e acusa quando divergem.
# O título de cada seção do PDF tem de ser o MESMO que a página HTML mostra: o
# check-pacote compara os dois e reprova quando divergem. Dois documentos não
# trazem `title:` na fonte, e o nome deles é declarado no gerador (não na fonte,
# que entra no hash) — a dupla declaração está de propósito, e a divergência
# entre as duas é pega pela validação.
def titulo_legivel(doc, meta):
    if doc.startswith('guia-de-observacao-'):
        return 'Guia de observação — Aula %s' % doc[len('guia-de-observacao-'):]
    if doc.startswith('caderno-'):
        return 'Caderno — Ciclo %s · %s' % (ciclo, escola)
    return meta.get('title') or titulos.get(doc) or doc
def ancora(d):
    return ancoras.get(d, 'ciclo-%s-%s' % (ciclo, d))

# Cada documento tem suas seções (Exercícios, Musicalidade…) e, no PDF único,
# esses nomes se repetem entre aulas. Para não colidir, todo id interno recebe o
# prefixo do documento (aula-01--exercicios). Links internos acompanham.
def prefixar_ids(corpo, prefixo):
    return re.sub(r'\{#([a-z0-9][a-z0-9-]*)\}',
                  lambda m: '{#' + prefixo + '--' + m.group(1) + '}', corpo)

partes = []
for doc in docs:
    arq = pathlib.Path(ciclos) / ('ciclo-%s-%s.md' % (ciclo, doc))
    if not arq.exists():
        continue
    bruto = arq.read_text(encoding='utf-8')
    meta, corpo = {}, bruto
    m = re.match(r'^---\n(.*?)\n---\n', bruto, re.S)
    if m:
        for linha in m.group(1).splitlines():
            if ':' in linha:
                k, v = linha.split(':', 1)
                meta[k.strip().lower()] = v.strip().strip('"')
        corpo = bruto[m.end():]
    titulo = titulo_legivel(doc, meta)

    # 1) links LOCAIS primeiro (enquanto os cruzados ainda têm a forma arquivo.html):
    #    cada um recebe o prefixo deste documento.
    corpo = re.sub(r'\]\(#([a-z0-9][a-z0-9-]*)\)',
                   lambda mm, doc=doc: '](#' + doc + '--' + mm.group(1) + ')', corpo)

    # 2) links para OUTROS documentos → âncora do PDF (o prefixo é o do alvo)
    for d in docs + ['index']:
        if d == 'index':
            continue
        corpo = re.sub(r'\]\(%s\.html#([a-z0-9][a-z0-9-]*)\)' % re.escape(d),
                       lambda mm, d=d: '](#' + d + '--' + mm.group(1) + ')', corpo)
        corpo = corpo.replace('](%s.html)' % d, '](#' + ancora(d) + ')')
    corpo = corpo.replace('](ciclo-%s.pdf)' % ciclo, '](#' + ancoras['index'] + ')')

    # 3) ids dos títulos internos ganham o mesmo prefixo do documento
    corpo = prefixar_ids(corpo, doc)

    partes.append('\n\\clearpage\n\n# %s {#%s}\n\n%s' % (titulo, ancora(doc), corpo.strip()))
    print('%s\t%s\t%s' % (doc, ancora(doc), titulo))

texto = '\n'.join(partes) + '\n'
pathlib.Path(destino).write_text(texto, encoding='utf-8')

# 3) Verificação das referências cruzadas internas do PDF: todo link [](#x)
#    precisa de um título {#x}. Sem isso, o link fica "morto" no leitor.
ids = set(re.findall(r'\{#([a-z0-9][a-z0-9-]*)\}', texto))
links = set(re.findall(r'\]\(#([a-z0-9][a-z0-9-]*)\)', texto))
faltando = sorted(links - ids)
print('REFERENCIAS\t%d links\t%d ancoras\tfaltando: %s' % (len(links), len(ids), ', '.join(faltando) or 'nenhuma'), file=sys.stderr)
if faltando:
    sys.exit(3)
PY

# Cabeçalho LaTeX: rodapé numerado em todas as páginas + índice em página nova.
# As cores da identidade são INJETADAS da fonte de verdade (tools/lib-tokens.js lê
# o ciclo.css): o LaTeX não sabe ler CSS, e repetir os valores aqui criaria a
# segunda lista que o IDENTIDADE-VISUAL.md proíbe.
sed -e "s|@NOME@|$(printf '%s' "$NOME" | sed -e 's/[&%#_]/\\&/g')|g" \
    -e "s|@CICLO@|$CICLO|g" \
    -e "s|@PERIODO@|$PERIODO|g" \
    "$TPL/ciclo-cabecalho.tex" > "$TMP/cabecalho.tex"
if grep -q '@CORES@' "$TMP/cabecalho.tex"; then
  node "$RAIZ/tools/lib-tokens.js" --latex > "$TMP/cores.tex"
  python3 - "$TMP/cabecalho.tex" "$TMP/cores.tex" <<'PY'
import sys
# A substituição é feita em Python, e não com `sed`: o bloco tem `\`, `{`, `}` e
# `\n`, que o `sed` interpretaria — e o `@CORES@` fica numa linha só, então o
# texto multilinha precisa entrar por arquivo, não por argumento de comando.
#
# Substitui APENAS a linha que é só o marcador. O cabeçalho CITA `@CORES@` em dois
# comentários, para documentar a injeção; um `replace` global injetaria o bloco
# inteiro dentro deles e quebraria o preâmbulo (o LaTeX compila, mas com o
# primeiro `\definecolor` dentro do comentário e as três cópias do bloco).
alvo, cores = sys.argv[1], sys.argv[2]
with open(alvo, encoding='utf-8') as f:
    linhas = f.read().split('\n')
with open(cores, encoding='utf-8') as f:
    bloco = f.read().rstrip('\n')
marcadores = [i for i, l in enumerate(linhas) if l.strip() == '@CORES@']
if len(marcadores) != 1:
    sys.exit(f'@CORES@: esperava exatamente 1 linha de injeção, achei {len(marcadores)}')
linhas[marcadores[0]:marcadores[0] + 1] = bloco.split('\n')
with open(alvo, 'w', encoding='utf-8') as f:
    f.write('\n'.join(linhas))
PY
fi


# Capa + aviso + documentos (o corpo do PDF vem do arquivo consolidado)
{
  echo '---'
  echo "title: \"$NOME\""
  echo "subtitle: \"$ESCOLA — $FREQUENCIA, $DURACAO_POR_DIA\""
  echo "author: \"$PROFESSOR\""
  echo "date: \"$PERIODO\""
  echo 'lang: pt-BR'
  echo '---'
  echo
  echo "**Escola:** $ESCOLA — ${RESPONSAVEL:-não informado} · **Frequência:** $FREQUENCIA · "
  echo "**Duração por dia:** $DURACAO_POR_DIA · **Volume semanal:** $VOLUME_SEMANAL tempos."
  echo
  echo 'Cada documento começa em página nova. O índice é navegável, o rodapé'
  echo 'identifica o ciclo e os links entre documentos levam à seção interna.'
  echo
  cat "$TMP/consolidado.md"
} > "$TMP/consolidado-final.md"

# PDF reprodutível. Sem isto, cada geração grava a hora atual em /CreationDate e o PDF
# versionado aparece como modificado mesmo sem nenhuma mudança de conteúdo. Com
# SOURCE_DATE_EPOCH + FORCE_SOURCE_DATE o pdfTeX usa uma data determinística: a do último
# commit que tocou as FONTES do ciclo — estável enquanto o ciclo não muda, e diferente
# quando ele muda. (Os pacotes passaram a ser versionados para o deploy automático.)
SOURCE_DATE_EPOCH="$(git -C "$RAIZ" log -1 --format=%ct -- "professores/$PROFESSOR_SLUG/ciclos" 2>/dev/null || true)"
[ -n "$SOURCE_DATE_EPOCH" ] || SOURCE_DATE_EPOCH="$(date +%s)"
export SOURCE_DATE_EPOCH
export FORCE_SOURCE_DATE=1

pandoc "$TMP/consolidado-final.md" \
  -o "$PACOTE/$ID.pdf" \
  --toc --toc-depth=3 \
  --from=markdown+raw_tex+header_attributes \
  --pdf-engine="$PDF_ENGINE" \
  -V geometry:margin=2cm \
  -V colorlinks=true \
  -V lang=pt-BR \
  -V toc-title="Índice" \
  --include-in-header="$TMP/cabecalho.tex"
echo "pdf:  $ID.pdf · engine $PDF_ENGINE · $(pdfinfo "$PACOTE/$ID.pdf" | awk '/^Pages/{print $2}') páginas"

# ---------------------------------------------------------------------------
# 3) README do pacote (não sobrescreve um README escrito pelo professor)
# ---------------------------------------------------------------------------
# Lista de navegação do README, derivada de DOCS — pela mesma razão do rodapé: a
# lista fixa apontava para documentos do ciclo de fundamentos, que um ciclo de pas
# de deux não tem. Os backticks são literais (a expansão do heredoc não os executa).
DOCS_README="$( for doc in $DOCS; do printf '`%s.html` · ' "$doc"; done )"
DOCS_README="${DOCS_README% · }"

if [ ! -f "$PACOTE/README.md" ]; then
  cat > "$PACOTE/README.md" <<RD
# $NOME — pacote de entrega ($ESCOLA)

> **Objetivo geral:** $OBJETIVO_GERAL
> **Escola/Espaço:** $ESCOLA — ${RESPONSAVEL:-não informado}
> **Frequência:** $FREQUENCIA · **Duração por dia:** $DURACAO_POR_DIA
> **Período:** $PERIODO ($SEMANAS semanas) · **Volume semanal:** $VOLUME_SEMANAL tempos
> **Professor:** $PROFESSOR

Gerado por \`tools/gerar-ciclo.sh $CICLO ${VARIANTE:-}\`. **Não edite os HTML** —
edite os Markdown em \`professores/$PROFESSOR_SLUG/ciclos/\` e rode o gerador de novo. Se você
editar o guia do professor, ele está em \`biblioteca/guia-do-professor.md\` — é
compartilhado por todos os professores do projeto.

## Navegação

- \`index.html\` — índice geral do ciclo (comece por aqui)
- $DOCS_README
- \`$ID.pdf\` — **PDF único consolidado**: capa, índice navegável, bookmarks
  (barra lateral do leitor) e rodapé numerado com a identificação do ciclo

Todas as páginas têm a mesma barra de navegação fixa no topo, um índice interno,
botão "voltar ao topo" e rodapé com o link de volta ao índice.

## Calendário desta variante

Veja o [Calendário do Ciclo](plano.html#calendario-do-ciclo) no plano: datas reais
de cada aula, avaliação formativa (aula $AULA_FORMATIVA, $DATA_FORMATIVA) e somativa
(aula $TOTAL_AULAS, $DATA_ULTIMA_AULA), calculadas a partir da frequência e da
duração por dia desta escola.

## Como usar em aula

1. Abra \`index.html\` no navegador e navegue até a aula do dia.
2. Para projetar ou imprimir sem depender do navegador, use \`$ID.pdf\`.
3. Para editar: altere os Markdown em \`professores/$PROFESSOR_SLUG/ciclos/\` e rode

   \`\`\`bash
   tools/gerar-ciclo.sh $PROFESSOR_SLUG $CICLO ${VARIANTE:-}
   node tools/check-pacote.js professores/$PROFESSOR_SLUG/ciclos/$ID
   \`\`\`
RD
  echo "readme: README.md"
fi

# ---------------------------------------------------------------------------
# 4) Validação automática (links, navegação, índice, PDF)
# ---------------------------------------------------------------------------
node "$RAIZ/tools/check-pacote.js" "$PACOTE"

