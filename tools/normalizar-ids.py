#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
normalizar-ids.py — dá ids ASCII explícitos a todos os títulos de um Markdown.

    uso: python3 tools/normalizar-ids.py entrada.md saida.md

Por que existe: o pandoc preserva acentos ao gerar o id de um título
(`## Rubrica de avaliação final` → `id="rubrica-de-avaliação-final"`). Como os
links internos do ciclo são escritos em ASCII (`#rubrica-de-avaliacao-final`),
as âncoras não casavam — e no PDF o id é escapado de outra forma ainda.

Em vez de corrigir cada link à mão, o gerador passa TODO arquivo-fonte por aqui
antes de converter para HTML e antes de montar o PDF. Assim:

  · os dois formatos usam exatamente os mesmos ids (por construção);
  · o professor pode escrever acentos nos títulos sem quebrar as âncoras;
  · ids já declarados pelo autor (`## Título {#meu-id}`) são respeitados.

Este script não altera nenhum outro trecho do arquivo.
"""

import re
import sys
import unicodedata
import pathlib


def id_ascii(texto: str) -> str:
    """Mesma ideia do 'auto_identifiers' do pandoc, mas forçando ASCII.

    Numeração inicial de seção é descartada ('6. Distribuição do volume' →
    'distribuicao-do-volume'), para que os links não precisem repetir o número.
    """
    texto = re.sub(r'^\s*\d+(?:[.)]\d+)*[.)]?\s+', '', texto)
    t = unicodedata.normalize('NFKD', texto)
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = t.lower()
    t = re.sub(r'[*_`\[\]()"\'.,;:!?/\\|]', '', t)   # marcação e pontuação
    t = re.sub(r'[^a-z0-9\s-]', '', t)
    t = re.sub(r'[\s]+', '-', t.strip())
    t = re.sub(r'-{2,}', '-', t).strip('-')
    return t or 'secao'


def processar(texto: str) -> str:
    usados = {}
    saida = []

    for linha in texto.split('\n'):
        m = re.match(r'^(#{1,6})\s+(.*?)(?:\s*\{#([^}]+)\})?\s*$', linha)
        if not m:
            saida.append(linha)
            continue

        nivel, titulo, declarado = m.group(1), m.group(2).strip(), m.group(3)
        identificador = declarado or id_ascii(titulo)

        # evita ids repetidos no mesmo arquivo (pandoc faria o mesmo com -1, -2)
        if identificador in usados:
            usados[identificador] += 1
            identificador = '%s-%d' % (identificador, usados[identificador])
        else:
            usados[identificador] = 0

        saida.append('%s %s {#%s}' % (nivel, titulo, identificador))

    return '\n'.join(saida)


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    origem, destino = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(processar(origem.read_text(encoding='utf-8')), encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main())
