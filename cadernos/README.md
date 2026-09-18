# Cadernos de Ciclo

Registro descritivo do que aconteceu em cada aula, escrito **enquanto acontece**.
As regras de conteúdo estão em
[`protocolo/governanca-caderno.md`](../protocolo/governanca-caderno.md) — este
arquivo é o guia prático de preenchimento.

## Estrutura de diretórios

```
cadernos/
├── README.md                       este guia
└── ciclo-01/
    ├── caderno-01-duo.md           Duo (Fernando) — sextas, 60 min
    ├── caderno-01-ritmos.md        Ritmos e Movimento (Gabi) — ter 60 + sáb 120
    └── caderno-01-debora.md        Débora (Marau) — seg e qua, 120 min
```

**Um caderno por ciclo, por escola** (P-09): as turmas não se misturam — nem nos
registros. O nome do arquivo segue o mesmo identificador da variante do ciclo
(`ciclo-01-duo` → `caderno-01-duo.md`), para que a rastreabilidade entre plano e
registro seja imediata.

## Diferença do relatório pós-aula

| | Caderno (`cadernos/`) | Relatório pós-aula |
|:--|:--|:--|
| Tempo | o que aconteceu na aula, na hora | a leitura do ciclo inteiro, no fim |
| Linguagem | descritiva, datada, sem revisão | revistos, com análise e decisão |
| Classifica | **nunca** | **nunca** (classificação é do PPQ) |
| Alimenta | a declaração do PO do ciclo seguinte (P-02) | o plano do próximo ciclo |

## Como preencher

Uma entrada por aula (ou por momento relevante dentro dela), nesta forma:

```markdown
## [dd/mm/aaaa] · [aula 01 — solo, alinhamento dos metatarsos]

### O que aconteceu
- descrição seca do que se viu, na ordem em que aconteceu

### O que decidi
- decisão tomada em aula e o que a motivou naquele momento

### O que me surpreendeu
- o que fugiu do previsto (para melhor ou para pior)

### Pergunta emergente
- a pergunta que ficou aberta, formulada como pergunta
```

Regras de escrita:

- **datas** sempre no cabeçalho da entrada;
- **uma observação por linha**, começando pelo fato (não pela interpretação);
- **citações diretas** entre aspas, marcadas como fala da aluna;
- **espaço para ajuste**: se a decisão da aula mudou o plano da seguinte, isso é
  uma linha, não um parágrafo;
- **sem adjetivo essencializante** sobre pessoas (ver a tabela "O que evitar").

## Exemplo preenchido (fictício, para ilustração)

> Este exemplo é **inventado** para mostrar a forma. Não descreve aula real de
> nenhuma turma.

```markdown
# Caderno — Ciclo 01 · Duo (Fernando) · sextas, 60 min

## 18/09/2026 · aula 01 — solo, alinhamento dos metatarsos

### O que aconteceu
- 5 alunas presentes; 1 chegou 8 minutos depois (transporte).
- Exercício 1.1 (sentada, 1ª → 2ª → 3ª → 4ª → 5ª): nas posições 3ª e 4ª, três
  alunas travaram o joelho para "achar" o pé.
- Exercício 1.2 (relevé sentado): a subida aconteceu no tempo 1 em 4 das 5
  primeiras repetições; da 4ª em diante, em 2 repetições o calcanhar saiu antes.
- A aluna que chegou atrasada fez o 1.1 deitada, com apoio.

### O que decidi
- Reduzi o 1.2 de 2 séries para 1 e usei os 3 minutos restantes para repetir a
  3ª posição sem apoio de joelho.
- Não entrei no centro com o exercício 3.2; fiz só o 3.1 e fui para a
  musicalidade antes do previsto.

### O que me surpreendeu
- Quando a contagem foi dada com palma (não com a voz), a aluna que saía no
  tempo 2 passou a sair no tempo 1.
- Duas alunas corrigiram a colega do lado sem conseguir dizer o critério que
  usaram para saber que estava errado.

### Pergunta emergente
- O que a aluna está olhando quando diz que "sentiu" o pé estar alinhado?
- A palma marcando o tempo funciona porque é outro canal, ou porque é mais
  lenta que a voz?

> Próxima aula: entrar pela subida do calcanhar antes do alinhamento dos
> metatarsos (verificar se a ordem muda o travamento do joelho na 3ª posição).
```

## O que evitar

| Evitar | Motivo | Escrever assim |
|:--|:--|:--|
| "a aluna é desatenta" / "a turma é fraca" | adjetivo essencializante: fixa a pessoa | descrever o episódio com data |
| "isto é conhecimento tácito" | classificação (reservada ao PPQ — P-05/P-07) | descrever a cena observada |
| "a aula foi ótima" | juízo sem referência | o que fechou, o que não fechou |
| "como eu suspeitava" | narração retroativa | a pergunta como apareceu, com data |
| "os dados mostram" | material tratado como evidência | "o caderno registra, em 3 aulas, ..." |
| fotos ou vídeos de alunas neste arquivo | exposição de terceiros | anotar apenas que houve registro audiovisual, com a autorização combinada |

## Como versionar

1. **O caderno é fonte**, não saída: é versionado no Git (Regra 17).
2. Commit no padrão do projeto:

   ```bash
   git add cadernos/ciclo-01/caderno-01-duo.md
   git commit -m "docs(caderno): registra a aula 01 do Ciclo 01 no Duo" \
     -m "Registro descritivo da aula de 18/09 (solo: alinhamento dos metatarsos).
Sem classificação: apenas o que aconteceu, o que decidi, o que surpreendeu e as
perguntas emergentes.

Refs: cadernos/ciclo-01/caderno-01-duo.md
Regras: 8 (Proveniência), 12 (Observação pedagógica), 17 (Versionamento)
Auditoria: sim"
   ```

3. **Não** gerar HTML/PDF do caderno: ele é lido em texto, e a ausência de forma
   final é parte da função (o caderno não é o material de entrega).
4. **Não** editar uma entrada antiga para "corrigir" o que foi escrito. Se algo
   foi anotado errado, a correção é uma nova entrada datada — o registro anterior
   permanece. Isso é a P-06 aplicada ao próprio caderno: o passado não é
   reescrito, é acrescido.
5. O caderno **não** entra na declaração de hash do ciclo (`tools/hash-ciclo.sh`
   cobre `.conf` + `.md` do ciclo): ele registra a aula, não o plano. A ligação
   com a cadeia FIPP é documental — o relatório pós-aula cita a entrada datada.

## Próximos passos

```bash
mkdir -p cadernos/ciclo-01
cp cadernos/README.md /dev/null   # (o guia fica aqui; o caderno é criado por você)
$EDITOR cadernos/ciclo-01/caderno-01-duo.md
```

> Os três cadernos do Ciclo 01 ainda **não existem** — eles só podem ser
> escritos por quem dá a aula. Este guia é o que o projeto oferece: uma forma que
> preserva o registro sem transformá-lo em argumento.

