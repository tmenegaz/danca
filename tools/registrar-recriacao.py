#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
registrar-recriacao.py — o elo de RECRIAÇÃO no índice da escola (17/10/2026).

Chamado por `tools/criar-escola.sh` quando o índice da escola JÁ EXISTE. Isso tem dois
sentidos, e só um deles se regista aqui:

  a) a escola nunca foi expurgada — o índice é o dela, e nada se acrescenta;
  b) a escola foi expurgada e está a ser RECRIADA com o mesmo nome — o expurgo deixou o elo
     (`expurgo[]`) e o índice sobreviveu (é a memória de que a escola existiu).

No caso (b) acrescenta-se um elo `recriacao[]`. É ele que diz ao `post-merge` e ao
`expurgar.js` que os artefatos são da escola VIVA, e não restos de uma expurgação por
terminar. Sem ele, a primeira sincronização apagava a escola recém-criada: aconteceu à
`valse`, em 17/10/2026 — expurgada, recriada, e limpa pelo `git pull` seguinte.

O índice NÃO é reescrito no sentido de «sobrescrito»: ganha uma entrada nova, e o passado
fica. É a lei da proveniência, aplicada ao registro da escola.

O ELO PASSA A DIZER QUEM RECRIOU (22/10/2026). Antes, a recriação era registada sem autor — e
o índice continuava a dizer que o responsável era o professor da PRIMEIRA criação, para
sempre. Medido na `calango`: recriada com o `oculos-redondo`, o painel mostrava «Sapo
Bailarino» como professor principal, e o `escola/expurgar.js` procurava os arquivos na pasta
do `sapo-bailarino`. O elo novo carrega `professor` (slug e nome), `responsavel` e `ciclo`; o
`professor` do topo fica intacto, como memória de quem criou.

    uso: python3 tools/registrar-recriacao.py escola/<slug>/indice.json \
           [--professor <slug>] [--professor-nome "<nome>"] [--responsavel "<nome>"] \
           [--ciclo <NN>] [--motivo "<texto>"]
"""

import json
import sys
import datetime


def main():
    if len(sys.argv) < 2:
        print('uso: registrar-recriacao.py <indice.json> [--professor <slug>] [--professor-nome <nome>] '
              '[--responsavel <nome>] [--ciclo <NN>] [--motivo <texto>]', file=sys.stderr)
        return 2
    arq = sys.argv[1]

    # OS DADOS DA RECRIAÇÃO (22/10/2026). Sem eles, o elo dizia «recriada» e nada mais — e o
    # responsável continuava a ser o da criação original.
    resto = sys.argv[2:]

    def opcao(nome):
        if nome not in resto:
            return None
        i = resto.index(nome)
        return resto[i + 1] if i + 1 < len(resto) else None

    professor = opcao('--professor')
    professor_nome = opcao('--professor-nome')
    responsavel = opcao('--responsavel')
    ciclo = opcao('--ciclo')
    motivo = opcao('--motivo') or 'recriada por tools/criar-escola.sh'

    try:
        with open(arq, encoding='utf-8') as f:
            indice = json.load(f)
    except (OSError, ValueError) as e:
        print('  aviso: não consegui ler %s (%s) — sem elo de recriação' % (arq, e), file=sys.stderr)
        return 0

    if not indice.get('expurgo'):
        # A escola nunca foi expurgada: nada a registar. Silêncio de propósito — o aviso já
        # foi dado pelo chamador, e um segundo «nada a fazer» só faz ruído.
        return 0

    elo = {
        'em': datetime.datetime.now().astimezone().isoformat(),
        'motivo': motivo,
    }
    # O PROFESSOR DA RECRIAÇÃO, com o NOME que a criação recebeu: é a única fonte dele para
    # quem não foi cadastrado na Produção (o diretório guarda o slug).
    if professor:
        elo['professor'] = {'slug': professor}
        if professor_nome:
            elo['professor']['nome'] = professor_nome
    if responsavel:
        elo['responsavel'] = responsavel
    if ciclo:
        elo['ciclo'] = ciclo

    indice['recriacao'] = indice.get('recriacao', [])
    indice['recriacao'].append(elo)
    # A escola volta a estar habilitada — é o que a recriação significa.
    indice['estado'] = dict(indice.get('estado') or {}, habilitada=True)

    with open(arq, 'w', encoding='utf-8') as f:
        json.dump(indice, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('  indice: elo de RECRIAÇÃO registado em', arq)
    return 0


if __name__ == '__main__':
    sys.exit(main())
