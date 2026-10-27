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

O PRESENTE É CORRIGIDO, E O PASSADO GUARDA-SE NO ELO (27/10/2026). A metade que faltava. Com o
elo a dizer quem recriou, `indices.js` passou a LER o elo para o responsável — mas a lista
`professores[]` continuou a ser lida tal e qual, e ela é append-only: em 27/10 a `calango` foi
recriada com o `murisoca-baiana` e o painel continuou a mostrar «Perna Boa → calango», um
professor que só tinha os schemas compartilhados na pasta. Medido no portal, coluna
«Professores»: `perna-boa` ligado à `calango`, ao lado do professor real.

A REGRA, e a diferença que a torna certa: numa recriação, o vínculo dos professores anteriores
é da encarnação que saiu — não da que nasce. Por isso `professores[]` passa a ser o do professor
que recria (mais o que já tenha ciclo na escola, que a derivação junta por si), e os vínculos
anteriores NÃO se perdem: vão para o elo, em `professores_anteriores`, com o slug, o nome e o
`desde` que tinham. É a lei da proveniência aplicada ao presente: o que muda deixa elo, e o que
fica é o que é verdade agora.

O QUE NÃO SE TOCA: `criado_em` (a criação original — a data que o painel mostra é a da última
recriação, derivada em `indices.js`, e a primeira continua no elo) e o `expurgo[]`.

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

    # O PASSADO VAI PARA O ELO ANTES DE O PRESENTE SER CORRIGIDO (27/10/2026). A ordem importa:
    # depois de reescrever `professores[]` já não haveria de onde copiar, e o vínculo anterior
    # desaparecia sem elo — que é exactamente o que a proveniência não permite.
    anteriores = [p for p in (indice.get('professores') or [])
                  if isinstance(p, dict) and p.get('slug') and p['slug'] != professor]
    if anteriores:
        elo['professores_anteriores'] = anteriores
    professor_anterior = indice.get('professor')
    if isinstance(professor_anterior, dict) and professor_anterior.get('slug') \
            and professor_anterior.get('slug') != professor:
        elo['professor_anterior'] = professor_anterior

    indice['recriacao'] = indice.get('recriacao', [])
    indice['recriacao'].append(elo)

    # O PRESENTE: a escola que nasce agora é desta pessoa. Sem `professor` (o chamador não o
    # passou), não se mexe — não se inventa identidade a partir do nada.
    if professor:
        indice['professor'] = {'slug': professor}
        if professor_nome:
            indice['professor']['nome'] = professor_nome
        if responsavel:
            indice['responsavel'] = responsavel
        # A LISTA FICA VAZIA, E NÃO GANHA O NOVO — a regra é a do `repo-escola.js`, que é quem
        # escreve `professores[]` no dia a dia: «o responsável já está no singular (`professor`)
        # e não se repete na lista». Pô-lo aqui seria a mesma pessoa em dois sítios, e a
        # derivação contaria duas vezes o que é uma.
        #
        # Os vínculos da encarnação anterior SAÍRAM da lista e estão no elo
        # (`professores_anteriores`). O que tiver ciclo na escola volta pela derivação, que lê os
        # caminhos — e é essa a prova de que trabalha ali hoje.
        indice['professores'] = []

    # A escola volta a estar habilitada — é o que a recriação significa.
    indice['estado'] = dict(indice.get('estado') or {}, habilitada=True)

    with open(arq, 'w', encoding='utf-8') as f:
        json.dump(indice, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('  indice: elo de RECRIAÇÃO registado em', arq)
    return 0


if __name__ == '__main__':
    sys.exit(main())
