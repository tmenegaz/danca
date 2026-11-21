#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
calendario.py — calcula o calendário real de um ciclo (Pré-requisito 5 / Regra 10, camada 2).

    uso:
      python3 tools/calendario.py \
        --escola "Diaghilev" --responsavel "Fokini" \
        --frequencia "1x/semana" --dias "5@18:30" \
        --inicio 17/09/2026 --total 12 \
        --duracao-curta 60 --volume-curto 90 \
        [--duracao-longa 120 --volume-longo 180]

      python3 tools/calendario.py --escola "Diaghilev" --frequencia "1x/semana" --dias "5@18:30" \
        --inicio 17/09/2026 --total 12 --aula 01
      → 2026-09-18     (a data da aula 01, em ISO — para quem precisa da data, não do bloco)

      ... --aulas-arquivo /tmp/aulas.tsv
      → 01  2026-09-18  18:30  19:30   (uma linha por aula: NN, data ISO, início, fim)

Saída: bloco Markdown com o calendário (escola, frequência, volume semanal, datas,
avaliação formativa e somativa, extensão e tabela aula → data) no stdout; resumo de
uma linha no stderr, para o gerador mostrar no terminal.

Regras de cálculo:
  · se a data de início não cai em dia de aula, a primeira aula é o próximo dia da
    lista — e o bloco diz isso (nada de data "quase certa");
  · avaliação formativa = aula do meio (arredondando para cima);
  · avaliação somativa = última aula;
  · extensão de +4 aulas = +4 semanas com 1x/semana, +2 semanas com 2x/semana;
  · volume semanal = soma do volume das aulas da semana (dias curtos e longos).

`--dias` usa números ISO de dia da semana: 1=segunda … 7=domingo. O número pode
ser **repetido** para indicar mais de uma aula no mesmo dia: `"2,6,6"` = terça com
1 aula e sábado com 2 aulas (as duas na mesma data, numeradas 1ª e 2ª). O total de
aulas por semana é o número de entradas da lista.

Cada entrada pode declarar a **hora de início**, com `@`: `"2@19:00,6@09:00,6@11:00"`
(terça 19h · sábado 9h e 11h). A hora é **obrigatória** — a forma antiga, só com o
número, é recusada —, porque o **prazo de lançamento** conta do **fim do bloco**
(ARQUITETURA-AULA.md §3.1) e, sem hora, não tem de onde contar. A hora fica **junto
do dia**, e não em lista paralela: quem editasse uma sem a outra desalinharia em
silêncio. Cada ocorrência do dia traz a SUA hora — é isso que distingue as duas
aulas do sábado.
"""

import argparse
import datetime as dt
import re
import sys

DIAS_SEMANA = {1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta',
               5: 'sexta', 6: 'sábado', 7: 'domingo'}


def parse_dias(texto: str) -> list:
    """`"2@19:00,6@09:00,6@11:00"` → [(2, 19*60), (6, 9*60), (6, 11*60)].

    O dia pode repetir (duas aulas na mesma data) e cada ocorrência traz a SUA hora.
    A hora é obrigatória: sem ela o prazo (§3.1) não tem de onde contar. A antiga
    forma só-número é recusada com uma mensagem que diz o que fazer — migrar três
    `.conf` é barato; descobrir depois que o prazo saiu errado, não.
    """
    itens = []
    for bruto in texto.replace(' ', '').split(','):
        if not bruto:
            continue
        dia_s, _, hora_s = bruto.partition('@')
        if not dia_s.isdigit() or not 1 <= int(dia_s) <= 7:
            raise ValueError(f'dia inválido "{bruto}" (use 1=segunda … 7=domingo)')
        if not hora_s:
            raise ValueError(f'"{bruto}" não declara a hora — use o formato DIA@HH:MM '
                             f'(ex.: 5@18:30). A hora é obrigatória desde 25/09/2026: o '
                             f'prazo de lançamento conta do fim da aula.')
        try:
            h, m = (int(x) for x in hora_s.split(':'))
            if not 0 <= h <= 23 or not 0 <= m <= 59:
                raise ValueError
        except ValueError:
            raise ValueError(f'hora inválida "{hora_s}" em "{bruto}" (use HH:MM, 24h)')
        itens.append((int(dia_s), h * 60 + m))
    if not itens:
        raise ValueError('--dias vazio')
    return itens


def datas_das_aulas(inicio: dt.date, dias: list, total: int) -> list:
    """Datas reais: uma aula por OCORRÊNCIA do dia na lista `dias`.

    `dias` é o que sai de `parse_dias()` — pares (dia, minuto) —, tratado como
    multiconjunto: se um dia aparece mais de uma vez (ex.: "2,6,6"), ele gera mais de
    uma aula na MESMA data, é o caso de duas aulas no mesmo sábado (1 de balé como
    preparação + 1 de pas de deux). A contagem por dia é o número de vezes que ele
    aparece — a hora não interfere na contagem.
    """
    numeros = [d for d, _ in dias]
    aulas = []
    dia = inicio
    while dia.isoweekday() not in numeros:
        dia += dt.timedelta(days=1)
    while len(aulas) < total:
        for _ in range(numeros.count(dia.isoweekday())):
            if len(aulas) >= total:
                break
            aulas.append(dia)
        dia += dt.timedelta(days=1)
    return aulas


def minutos_do_dia(dias: list, dow: int, ocorrencia: int) -> int:
    """O minuto do início da N-ésima aula daquele dia da semana (1 = a primeira)."""
    vistos = 0
    for dia, minuto in dias:
        if dia == dow:
            vistos += 1
            if vistos == ocorrencia:
                return minuto
    raise ValueError(f'pedi a {ocorrencia}ª aula de {DIAS_SEMANA[dow]} e a lista não a tem')


def br(d: dt.date) -> str:
    return d.strftime('%d/%m/%Y')


def celula_da_coluna_criar(nn: int, prontas: set, criar: bool) -> str:
    """A quinta coluna: o botão que CRIA a aula, ou a ligação para a que já existe.

    AS DUAS FORMAS, e porquê:

      · a aula que já tem documento → uma LIGAÇÃO para ele. O botão não faz sentido numa aula
        que existe, e escondê-lo sem dizer nada faria a coluna parecer quebrada naquela linha;
      · a aula que ainda não tem → um BOTÃO, com o número DELA (`02`) e nada mais. Quem sabe o
        resto — a data, o dia, a duração — é a linha da tabela em que ele está, e o script da
        página lê-a daí. Não se copia o dado para o atributo: uma segunda cópia é uma segunda
        verdade, e a data que o calendário calcula é a única.

    A CLASSE É A MESMA DAS OUTRAS ACÇÕES (`.acao secundario pequena`), que é a peça do botão na
    folha — nenhuma classe nova nasce aqui. `data-criar-aula` é GANCHO de JavaScript: não pinta
    nada, existe para o script achar o botão, e está declarado em `tools/check-identidade.js`.

    Sem `--criar-aula`, a coluna não existe — é o modo que as provas usam, e o que mantém o
    bloco do calendário igual ao que era para quem só quer as datas.
    """
    if not criar:
        return ''
    dois = f'{nn:02d}'
    if dois in prontas:
        return (f'<a class="acao secundario pequena" href="aula-{dois}.html">'
                f'Abrir</a>')
    return (f'<button type="button" class="acao secundario pequena" '
            f'data-criar-aula="{dois}">Criar aula</button>')


def hhmm(minutos: int) -> str:
    return f'{minutos // 60:02d}:{minutos % 60:02d}'


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--escola', required=True)
    p.add_argument('--responsavel', default='')
    p.add_argument('--frequencia', required=True)
    p.add_argument('--dias', required=True,
                   help='aulas da semana: DIA@HH:MM separados por vírgula (ex.: 2@19:00,6@09:00). '
                        'Repetir o dia = mais de uma aula na mesma data, cada uma com sua hora.')
    p.add_argument('--inicio', required=True, help='dd/mm/aaaa')
    p.add_argument('--total', type=int, required=True)
    # Duração e volume do dia curto: obrigatórios para gerar o BLOCO (o volume aparece nele) e
    # dispensados no modo `--aula`, que só quer a data — a conta das datas não usa nenhum dos dois.
    p.add_argument('--duracao-curta', type=int, default=0)
    p.add_argument('--volume-curto', type=int, default=0)
    p.add_argument('--duracao-longa', type=int, default=0)
    p.add_argument('--volume-longo', type=int, default=0)
    p.add_argument('--saida', default='-')
    p.add_argument('--vars-arquivo', default='', help='escreve variáveis de shell (KEY=valor) para o gerador')
    p.add_argument('--aula', type=int, default=0,
                   help='imprime SÓ a data da aula NN, em ISO (aaaa-mm-dd) — os argumentos de '
                        'duração/volume são dispensados neste modo')
    p.add_argument('--aulas-arquivo', default='',
                   help='escreve uma linha por aula (NN\\tdata ISO\\tinício\\tfim) — é o que o '
                        'índice por aula e o prazo (ARQUITETURA-AULA.md §3 e §4.2) consomem')
    # A COLUNA «CRIAR A AULA» (21/11/2026) — ver `celula_da_coluna_criar`.
    p.add_argument('--criar-aula', action='store_true',
                   help='acrescenta a coluna «Criar a aula»: botão para a aula que ainda não tem '
                        'documento, ligação para a que já tem')
    p.add_argument('--aulas-prontas', default='',
                   help='as aulas que JÁ têm documento, separadas por espaço ou vírgula (ex.: '
                        '"01 02"); só é lida com --criar-aula')
    a = p.parse_args()

    prontas = {n for n in re.split(r'[^0-9]+', a.aulas_prontas or '') if n}
    prontas = {f'{int(n):02d}' for n in prontas if int(n) > 0}

    try:
        dias = parse_dias(a.dias)
    except ValueError as e:
        print(f'erro: --dias — {e}', file=sys.stderr)
        return 2
    try:
        inicio = dt.datetime.strptime(a.inicio, '%d/%m/%Y').date()
    except ValueError:
        print(f'erro: data inválida "{a.inicio}" (use dd/mm/aaaa)', file=sys.stderr)
        return 2

    aulas = datas_das_aulas(inicio, dias, a.total)

    # Modo `--aula NN`: SÓ a data, em ISO — como as datas do JSON. Quem mostra dd/mm/aaaa é a lib
    # das vistas (`dataBr`). É por aqui que o guia gerado recebe a data da aula: do CALENDÁRIO, não
    # de um texto escrito à mão. A data da aula 01 do Duo é 18/09/2026 porque o início declarado
    # (17/09) não é dia de aula — a regra do ajuste vive AQUI, não no chamador.
    if a.aula:
        if not 1 <= a.aula <= a.total:
            print(f'erro: --aula {a.aula} fora do ciclo (1..{a.total})', file=sys.stderr)
            return 2
        print(aulas[a.aula - 1].isoformat())
        return 0
    if not a.duracao_curta or not a.volume_curto:
        print('erro: --duracao-curta e --volume-curto são obrigatórios para o bloco do calendário '
              '(--aula os dispensa)', file=sys.stderr)
        return 2

    por_semana = len(dias)
    numeros = [d for d, _ in dias]
    semanas = (a.total + por_semana - 1) // por_semana

    # dias_do_ciclo: o primeiro dia da lista é o "curto" quando as durações diferem
    if a.duracao_longa and a.volume_longo:
        dias_do_ciclo = [(numeros[0], a.duracao_curta, a.volume_curto)] + \
                        [(d, a.duracao_longa, a.volume_longo) for d in numeros[1:]]
    else:
        dias_do_ciclo = [(d, a.duracao_curta, a.volume_curto) for d in numeros]
    volume_semanal = sum(v for _, _, v in dias_do_ciclo)

    # A hora de início e a duração de CADA aula, na ordem cronológica. A duração segue
    # a posição da aula dentro da semana (a 1ª é a curta quando há dia longo); a hora
    # vem da N-ésima ocorrência daquele dia na lista.
    ocorrencia_no_dia = {}
    por_aula = []          # (data, início em min, duração em min)
    for i, d in enumerate(aulas, 1):
        k = ocorrencia_no_dia[d] = ocorrencia_no_dia.get(d, 0) + 1
        inicio_min = minutos_do_dia(dias, d.isoweekday(), k)
        idx = (i - 1) % por_semana
        dur = a.duracao_longa if (a.duracao_longa and a.volume_longo and idx > 0) else a.duracao_curta
        por_aula.append((d, inicio_min, dur))

    if a.aulas_arquivo:
        # O contrato com o gerador: uma linha por aula. `fim` já inclui a duração, então
        # quem calcula o prazo (§3.1) sabe quando a aula TERMINA — é do fim do bloco que
        # ele conta, não do início.
        with open(a.aulas_arquivo, 'w', encoding='utf-8') as f:
            for i, (d, ini, dur) in enumerate(por_aula, 1):
                f.write(f'{i:02d}\t{d.isoformat()}\t{hhmm(ini)}\t{hhmm(ini + dur)}\n')

    formativa = (a.total + 1) // 2
    extensao_semanas = 4 // por_semana

    L = ['## Calendário do Ciclo {#calendario-do-ciclo}', '']
    L.append(f'- **Escola/Espaço:** {a.escola}' + (f' — {a.responsavel}' if a.responsavel else ''))
    # Um dia pode ter mais de uma aula (ex.: sábado com balé + pas de deux): a
    # lista `dias` então repete o número. Quando não repete, a saída abaixo é
    # byte a byte a mesma de antes — nenhum ciclo existente muda de calendário.
    distinctos = [d for i, d in enumerate(numeros) if d not in numeros[:i]]
    horas_do_dia = {}
    for d, m in dias:
        horas_do_dia.setdefault(d, []).append(hhmm(m))
    if len(distinctos) != len(numeros):
        L.append(f'- **Frequência semanal:** {a.frequencia} (' + '; '.join(
            f'{DIAS_SEMANA[d]}' + (f' ×{numeros.count(d)}' if numeros.count(d) > 1 else '')
            for d in distinctos) + ')')
        L.append('- **Duração por dia:** ' + ' · '.join(
            f'{DIAS_SEMANA[d]}: {a.duracao_curta * numeros.count(d)} min'
            + (f' ({numeros.count(d)} aulas de {a.duracao_curta} min)' if numeros.count(d) > 1 else '')
            for d in distinctos))
    else:
        L.append(f'- **Frequência semanal:** {a.frequencia} '
                 f'({", ".join(DIAS_SEMANA[d] for d in distinctos)})')
        if a.duracao_longa and a.volume_longo:
            L.append(f'- **Duração por dia:** {a.duracao_curta} min ({DIAS_SEMANA[distinctos[0]]}) e '
                     f'{a.duracao_longa} min ({", ".join(DIAS_SEMANA[d] for d in distinctos[1:])})')
        else:
            L.append(f'- **Duração por dia:** {a.duracao_curta} minutos')
    L.append('- **Horário:** ' + ' · '.join(
        f'{DIAS_SEMANA[d]} ' + ' e '.join(horas_do_dia[d]) for d in distinctos))
    L.append('- **Volume semanal:** ' + ' + '.join(str(v) for _, _, v in dias_do_ciclo) +
             f' = **{volume_semanal} tempos/semana**')
    if aulas[0] != inicio:
        L.append(f'- **Data de início informada:** {br(inicio)} — não é dia de aula; a primeira '
                 f'aula é **{br(aulas[0])}** ({DIAS_SEMANA[aulas[0].isoweekday()]})')
    L.append(f'- **Data de início:** {br(aulas[0])}')
    L.append(f'- **Data prevista de encerramento:** {br(aulas[-1])} '
             f'({a.total} aulas em {semanas} semana(s))')
    L.append(f'- **Avaliação formativa:** aula {formativa:02d}, {br(aulas[formativa - 1])}')
    L.append(f'- **Avaliação somativa:** aula {a.total:02d}, {br(aulas[-1])}')
    L.append(f'- **Critério de extensão:** +4 aulas = +{extensao_semanas} semana(s), '
             f'encerrando em {br(datas_das_aulas(inicio, dias, a.total + 4)[-1])}')
    L.append('')
    # A TABELA EM DUAS PARTES, PELO MARCO (28/10/2026). Antes eram 26 linhas seguidas: o
    # professor que procurava «a aula de março» percorria a lista inteira, e os dois marcos
    # do ciclo (a formativa e a somativa) eram só uma etiqueta no meio das linhas. Cada
    # parte agora começa pelo seu marco, e a segunda retoma o cabeçalho — sem ele, no
    # telefone a tabela de baixo chega sem dizer de que coluna é cada número.
    #
    # A QUINTA COLUNA — «AÇÃO» (21/11/2026). O calendário já dizia QUANDO cada aula
    # acontece; o que ele não dizia era o que fazer com isso. A coluna fecha o circuito: a aula
    # que já tem documento ganha o botão que a abre, e a que ainda não tem ganha o botão que a
    # cria (e que sabe o número dela, `02`). A célula não é escrita à mão em nenhum sítio — sai
    # da lista de aulas que o ciclo declara, que é o `DOCS` do manifesto.
    #
    # O NOME DA COLUNA É «AÇÃO», e não «Criar a aula» (21/11/2026): ela deixou de ter uma acção
    # só — passaram a ser duas, abrir e criar —, e um título que nomeia metade das coisas que a
    # coluna faz obriga a procurar a outra metade.
    cabecalho_da_tabela = ['| Aula | Data | Dia | Duração | Ação |',
                           '|:---:|:---|:---|:---:|:---|']

    def inicio_de_tabela(titulo, id_ascii):
        # A ÂNCORA VAI ESCRITA (28/10/2026). O título tem acentos («avaliação»), e o `id`
        # que o pandoc derivaria dele carregaria os acentos — contra a regra das âncoras
        # ASCII estáveis do projeto. Os dois leitores do gerador (HTML e PDF) leem
        # `header_attributes`, então a marca `{#…}` não aparece em nenhum dos dois.
        L.append(f'### {titulo} {{#{id_ascii}}}')
        L.append('')
        L.extend(cabecalho_da_tabela)

    # Posição da aula dentro do próprio dia: quando o dia tem mais de uma aula
    # (sábado 1ª, sábado 2ª), o rótulo diz qual é — sem isso, duas linhas com a
    # mesma data ficariam indistinguíveis.
    vistos_no_dia = {}

    def rotulo_do_dia(d):
        vistos_no_dia[d] = vistos_no_dia.get(d, 0) + 1
        nome = DIAS_SEMANA[d.isoweekday()]
        if numeros.count(d.isoweekday()) > 1:
            return f'{nome} ({vistos_no_dia[d]}ª)'
        return nome

    # Um ciclo de uma aula só não se divide: a segunda parte nasceria vazia, e um
    # título de secção sem linha nenhuma é pior do que a tabela inteira.
    if formativa < a.total:
        inicio_de_tabela(f'Aulas 01–{formativa:02d} · até a avaliação formativa',
                         f'aulas-01-{formativa:02d}')
    else:
        inicio_de_tabela('Aula 01' if a.total == 1 else 'Aulas', 'aulas')

    for i, (d, _, dur) in enumerate(por_aula, 1):
        if formativa < a.total and i == formativa + 1:
            L.append('')
            inicio_de_tabela(f'Aulas {formativa + 1:02d}–{a.total:02d} · até a avaliação somativa',
                             f'aulas-{formativa + 1:02d}-{a.total:02d}')
        marco = ' *(formativa)*' if i == formativa else (' *(somativa)*' if i == a.total else '')
        L.append(f'| {i:02d}{marco} | {br(d)} | {rotulo_do_dia(d)} | {dur} min | '
                 f'{celula_da_coluna_criar(i, prontas, a.criar_aula)} |')
    L.append('')
    L.append('> O volume de trabalho ativo de cada aula está na própria aula; o volume '
             'semanal acima é calculado sobre o volume declarado na Aula 01 (Regra 9).')

    texto = '\n'.join(L) + '\n'
    if a.saida == '-':
        sys.stdout.write(texto)
    else:
        with open(a.saida, 'w', encoding='utf-8') as f:
            f.write(texto)

    if a.vars_arquivo:
        with open(a.vars_arquivo, 'w', encoding='utf-8') as f:
            f.write(f'PERIODO="{br(aulas[0])} a {br(aulas[-1])}"\n')
            f.write(f'SEMANAS="{semanas}"\n')
            f.write(f'VOLUME_SEMANAL="{volume_semanal}"\n')
            f.write(f'DATA_PRIMEIRA_AULA="{br(aulas[0])}"\n')
            f.write(f'DATA_ULTIMA_AULA="{br(aulas[-1])}"\n')
            f.write(f'DATA_FORMATIVA="{br(aulas[formativa - 1])}"\n')
            f.write(f'AULA_FORMATIVA="{formativa:02d}"\n')

    print(f'calendario: {a.escola} · {a.frequencia} · {a.total} aulas em {semanas} semanas '
          f'({br(aulas[0])} a {br(aulas[-1])}) · {volume_semanal} tempos/semana', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
