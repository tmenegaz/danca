# Ciclo 01 — Breu · Sala Rosa — pacote de entrega (Breu)

> **Objetivo geral:** Teste
> **Escola/Espaço:** Breu — Colo De Pe
> **Frequência:** 3x/semana · **Duração por dia:** 60 min por encontro
> **Período:** 03/03/2027 a 30/04/2027 (9 semanas) · **Volume semanal:** 270 tempos
> **Professor:** colo-de-pe

Gerado por `tools/gerar-ciclo.sh 01 breu-sala-rosa`. **Não edite os HTML** —
edite os Markdown em `professores/colo-de-pe/ciclos/` e rode o gerador de novo. Se você
editar o guia do professor, ele está em `biblioteca/guia-do-professor.md` — é
compartilhado por todos os professores do projeto.

## Navegação

- `index.html` — índice geral do ciclo (comece por aqui)
- `plano.html` · `harmonizacao.html` · `aula-01.html` · `captura-aula-01.html` · `notacao.html` · `glossario-benesh.html` · `referencias.html`
- `ciclo-01-breu-sala-rosa.pdf` — **PDF único consolidado**: capa, índice navegável, bookmarks
  (barra lateral do leitor) e rodapé numerado com a identificação do ciclo

Todas as páginas têm a mesma barra de navegação fixa no topo, um índice interno,
botão "voltar ao topo" e rodapé com o link de volta ao índice.

## Calendário desta variante

Veja o [Calendário do Ciclo](plano.html#calendario-do-ciclo) no plano: datas reais
de cada aula, avaliação formativa (aula 13, 31/03/2027) e somativa
(aula 26, 30/04/2027), calculadas a partir da frequência e da
duração por dia desta escola.

## Como usar em aula

1. Abra `index.html` no navegador e navegue até a aula do dia.
2. Para projetar ou imprimir sem depender do navegador, use `ciclo-01-breu-sala-rosa.pdf`.
3. Para editar: altere os Markdown em `professores/colo-de-pe/ciclos/` e rode

   ```bash
   tools/gerar-ciclo.sh colo-de-pe 01 breu-sala-rosa
   node tools/check-pacote.js professores/colo-de-pe/ciclos/ciclo-01-breu-sala-rosa
   ```
