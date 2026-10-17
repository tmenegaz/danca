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

    uso: python3 tools/registrar-recriacao.py escola/<slug>/indice.json
"""

import json
import sys
import datetime


def main():
    if len(sys.argv) < 2:
        print('uso: registrar-recriacao.py <indice.json>', file=sys.stderr)
        return 2
    arq = sys.argv[1]
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

    indice['recriacao'] = indice.get('recriacao', [])
    indice['recriacao'].append({
        'em': datetime.datetime.now().astimezone().isoformat(),
        'motivo': 'recriada por tools/criar-escola.sh',
    })
    # A escola volta a estar habilitada — é o que a recriação significa.
    indice['estado'] = dict(indice.get('estado') or {}, habilitada=True)

    with open(arq, 'w', encoding='utf-8') as f:
        json.dump(indice, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('  indice: elo de RECRIAÇÃO registado em', arq)
    return 0


if __name__ == '__main__':
    sys.exit(main())
