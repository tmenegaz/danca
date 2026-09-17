#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
calendario.py — calcula o calendário real de um ciclo (Pré-requisito 5 / Regra 10, camada 2).

    uso:
      python3 tools/calendario.py \
        --escola "Duo" --responsavel "Fernando" \
        --frequencia "1x/semana" --dias "5" \
        --inicio 17/09/2026 --total 12 \
        --duracao-curta 60 --volume-curto 90 \
        [--duracao-longa 120 --volume-longo 180]

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

`--dias` usa números ISO de dia da semana: 1=segunda … 7=domingo.
"""

import argparse
import datetime as dt
import sys

DIAS_SEMANA = {1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta',
               5: 'sexta', 6: 'sábado', 7: 'domingo'}


def datas_das_aulas(inicio: dt.date, dias: list, total: int) -> list:
    """Datas reais: começa no primeiro dia de aula a partir de `inicio`."""
    aulas = []
    dia = inicio
    while dia.isoweekday() not in dias:
        dia += dt.timedelta(days=1)
    while len(aulas) < total:
        if dia.isoweekday() in dias:
            aulas.append(dia)
        dia += dt.timedelta(days=1)
    return aulas


def br(d: dt.date) -> str:
    return d.strftime('%d/%m/%Y')


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--escola', required=True)
    p.add_argument('--responsavel', default='')
    p.add_argument('--frequencia', required=True)
    p.add_argument('--dias', required=True, help='dias ISO separados por vírgula: 2,6')
    p.add_argument('--inicio', required=True, help='dd/mm/aaaa')
    p.add_argument('--total', type=int, required=True)
    p.add_argument('--duracao-curta', type=int, required=True)
    p.add_argument('--volume-curto', type=int, required=True)
    p.add_argument('--duracao-longa', type=int, default=0)
    p.add_argument('--volume-longo', type=int, default=0)
    p.add_argument('--saida', default='-')
    p.add_argument('--vars-arquivo', default='', help='escreve variáveis de shell (KEY=valor) para o gerador')
    a = p.parse_args()

    dias = [int(x) for x in a.dias.replace(' ', '').split(',') if x]
    if not dias:
        print('erro: --dias vazio', file=sys.stderr)
        return 2
    try:
        inicio = dt.datetime.strptime(a.inicio, '%d/%m/%Y').date()
    except ValueError:
        print(f'erro: data inválida "{a.inicio}" (use dd/mm/aaaa)', file=sys.stderr)
        return 2

    aulas = datas_das_aulas(inicio, dias, a.total)
    por_semana = len(dias)
    semanas = (a.total + por_semana - 1) // por_semana

    # dias_do_ciclo: o primeiro dia da lista é o "curto" quando as durações diferem
    if a.duracao_longa and a.volume_longo:
        dias_do_ciclo = [(dias[0], a.duracao_curta, a.volume_curto)] + \
                        [(d, a.duracao_longa, a.volume_longo) for d in dias[1:]]
    else:
        dias_do_ciclo = [(d, a.duracao_curta, a.volume_curto) for d in dias]
    volume_semanal = sum(v for _, _, v in dias_do_ciclo)

    formativa = (a.total + 1) // 2
    extensao_semanas = 4 // por_semana

    L = ['## Calendário do Ciclo {#calendario-do-ciclo}', '']
    L.append(f'- **Escola/Espaço:** {a.escola}' + (f' — {a.responsavel}' if a.responsavel else ''))
    L.append(f'- **Frequência semanal:** {a.frequencia} '
             f'({", ".join(DIAS_SEMANA[d] for d in dias)})')
    if a.duracao_longa and a.volume_longo:
        L.append(f'- **Duração por dia:** {a.duracao_curta} min ({DIAS_SEMANA[dias[0]]}) e '
                 f'{a.duracao_longa} min ({", ".join(DIAS_SEMANA[d] for d in dias[1:])})')
    else:
        L.append(f'- **Duração por dia:** {a.duracao_curta} minutos')
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
    L.append('| Aula | Data | Dia | Duração |')
    L.append('|:---:|:---|:---|:---:|')
    for i, d in enumerate(aulas, 1):
        idx = (i - 1) % por_semana
        if a.duracao_longa and a.volume_longo and idx > 0:
            dur = a.duracao_longa
        else:
            dur = a.duracao_curta
        marco = ' *(formativa)*' if i == formativa else (' *(somativa)*' if i == a.total else '')
        L.append(f'| {i:02d}{marco} | {br(d)} | {DIAS_SEMANA[d.isoweekday()]} | {dur} min |')
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
