# Ciclo 01 — Breu · Piano — pacote de entrega (Breu)

> **Objetivo geral:** Objetivo de teste 3: consolidar o alinhamento e a transferência de peso na turma Balé Nível 1 — Teste 3, com musicalidade e controle do movimento.
> **Escola/Espaço:** Breu — Demi Plié
> **Frequência:** 3x/semana · **Duração por dia:** 55 min por encontro
> **Período:** 04/01/2027 a 26/02/2027 (8 semanas) · **Volume semanal:** 249 tempos
> **Professor:** demi-plie

Gerado por `tools/gerar-ciclo.sh 01 breu-piano`. **Não edite os HTML** —
edite os Markdown em `professores/demi-plie/ciclos/` e rode o gerador de novo. Se você
editar o guia do professor, ele está em `biblioteca/guia-do-professor.md` — é
compartilhado por todos os professores do projeto.

## Navegação

- `index.html` — índice geral do ciclo (comece por aqui)
- `plano.html` · `harmonizacao.html` · `aula-01.html` · `captura-aula-01.html` · `notacao.html` · `glossario-codigo_de_danca.html` · `referencias.html`

Todas as páginas têm a mesma barra de navegação fixa no topo, um índice interno,
botão "voltar ao topo" e rodapé com o link de volta ao índice.

**Não há PDF neste pacote, e é de propósito** (20/11/2026). Para ter um, abra a
página que quer e imprima — `Ctrl+P` (ou `Cmd+P`) → *Guardar como PDF*. As
páginas já saem no papel como saíam no PDF: a folha de estilo tem `@media print`,
o cabeçalho não fica fixo, e a paleta é sempre a clara. O PDF saiu porque compilá-lo
obrigava a instalar o TeX em **toda** geração — 61 a 68 s de um trabalho de 5 — para
um ficheiro que quase nunca se abria.

## Calendário desta variante

Veja o [Calendário do Ciclo](plano.html#calendario-do-ciclo) no plano: datas reais
de cada aula, avaliação formativa (aula 12, 29/01/2027) e somativa
(aula 24, 26/02/2027), calculadas a partir da frequência e da
duração por dia desta escola.

## Como usar em aula

1. Abra `index.html` no navegador e navegue até a aula do dia.
2. Para imprimir ou guardar em PDF: `Ctrl+P` / `Cmd+P` na própria página.
3. Para editar: altere os Markdown em `professores/demi-plie/ciclos/` e rode

   ```bash
   tools/gerar-ciclo.sh demi-plie 01 breu-piano
   node tools/check-pacote.js professores/demi-plie/ciclos/ciclo-01-breu-piano
   ```
