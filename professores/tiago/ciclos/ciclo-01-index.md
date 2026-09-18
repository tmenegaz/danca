---
projeto: Formação em Balé Clássico
frente: Índice
ciclo: "01"
title: "Ciclo 01 — Fundamentos do Balé Clássico"
subtitle: "Índice geral do ciclo"
---

> **Objetivo geral:** construir a estabilidade nas cinco posições dos pés e a
> coordenação braço-perna (1ª, 2ª e intermediários), com transferência de peso
> "por cima", musicalidade e resistência progressiva.
> **Duração:** 12 aulas (extensível a 16) · **cada aula: 60 minutos**
> **Data de início:** 17/09/2026
> **Encerramento previsto:** 10/12/2026
> **Professor:** [Nome do professor]

---

<!-- CALENDARIO -->

## 1. Plano do Ciclo

- [Objetivo geral](plano.html#objetivo-geral)
- [Marcos parciais por aula](plano.html#marcos-parciais-por-aula)
- [Calibração do volume pela duração](plano.html#calibracao-do-volume-pela-duracao-regra-9-etapa-1)
- [Distribuição do volume pelos blocos](plano.html#distribuicao-do-volume-pelos-blocos-regra-9-etapa-2)
- [Rubrica de avaliação final](plano.html#rubrica-de-avaliacao-final)

## 2. Aulas

- [Aula 01 — Isolar o alinhamento dos metatarsos e a saída do calcanhar nas cinco posições dos pés, no solo](aula-01.html)
- Aula 02 — Coordenação de braços na 1ª e 2ª posições *(a escrever; o marco está no [plano](plano.html#marcos-parciais-por-aula))*
- Aulas 03–12 *(a escrever, uma por vez, depois da aula anterior)*

> Para acrescentar uma aula: crie `ciclos/ciclo-01-aula-02.md`, inclua `aula-02`
> na lista `DOCS` de `ciclos/ciclo-01.conf` e rode `tools/gerar-ciclo.sh 01`.
> O gerador só aceita aulas com **`duracao:`** declarada no cabeçalho
> (Pré-requisito 4) e volume dentro da faixa da duração (Regra 9).

## 3. Documentos de Apoio

- [Notação em Benesh](notacao.html)
- [Condições Pré-Existentes (Força e Flexibilidade)](pre-requisitos.html)
- [Musicalidade](musicalidade.html)
- [Apanhado Histórico](apanhado-historico.html)

## 4. Referências Bibliográficas

- [Bibliografia completa](referencias.html)

---

## Como usar este pacote

1. **Em aula:** abra `index.html` e vá para a aula do dia pela barra de navegação.
2. **Para projetar ou imprimir:** use `ciclo-01.pdf` — mesmo conteúdo, arquivo
   único, com índice clicável e bookmarks no leitor de PDF.
3. **Para editar:** mexa nos Markdown em `ciclos/` e rode `tools/gerar-ciclo.sh 01`.
   Os HTML e o PDF são gerados: não os edite à mão.

> **Documento-fonte:** `ciclos/ciclo-01-index.md`.
