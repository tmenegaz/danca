# REGISTRO — índice dos marcos metodológicos

Registro descritivo (P-06) dos marcos que constituem o Projeto Ciclo como objeto metodológico.
Não é caderno pedagógico; é log do sistema.

> **Este ficheiro é o ÍNDICE. As entradas vivem nos arquivos anuais.**
> A partir de 24/11/2026 o registo é **partido por ano** — até lá eram 4,3 MB e 60 173 linhas num
> ficheiro só, e a maior parte do peso não era lida por ninguém em nenhuma sessão. O que se ganha
> é o clone, o `diff` e o `tail`; o que **não** se ganha é a possibilidade de reescrever o passado,
> que continua a não existir (P-03).

### Onde escrever uma entrada nova

**No arquivo do ANO da entrada**, no fim. Hoje é o [REGISTRO-2026.md](REGISTRO-2026.md).

A regra não mudou, só mudou a casa: **cronológica crescente, a mais recente no fim; acrescenta-se,
nunca se reordena nem se apaga**. `tools/gerar-handoff.sh` lê os arquivos anuais por ordem de nome
e extrai a **última** entrada do conjunto — inserir no topo publica o marco errado no `HANDOFF.md`.

Quando o ano virar, o arquivo novo nasce vazio e entra na tabela abaixo. **Nenhum arquivo anual
se edita por outro motivo que não seja acrescentar ao fim**; uma correção de redação é uma nota
datada **dentro da própria entrada** (ver `.github/instructions/registro-md.instructions.md`).

### Os arquivos anuais

| arquivo | entradas | período | peso |
|:--|--:|:--|--:|
| [REGISTRO-2026.md](REGISTRO-2026.md) | **868** | 18/09/2026 → 27/11/2026 | 4,6 MB |

### Por que a partição, e o que ela custa

**Medido a 24/11/2026:** o ficheiro crescia **7,5× em oito semanas** (573 KB a 01/10 → 4,3 MB a
24/11), e **243 commits** o tocaram numa só semana. Num ficheiro assim, cada `grep` custa 4 MB e
cada leitura de sessão paga o peso inteiro para usar as últimas cinco entradas — que é a única
parte que uma sessão nova precisa.

**O que a partição NÃO resolve, e fica declarado:** o histórico do Git continua a ter o ficheiro
grande em cada versão em que ele apareceu. A partição alivia o **presente** (clone, `diff`,
ferramentas), não o passado. Reencolher o passado exigiria reescrever história — e este
repositório não reescreve história.

**O que continua a valer sem alteração:** a ordem cronológica, o formato das cinco secções, a nota
de correção datada, o motivo declarado para os congelados, e a proibição de apagar entrada. Tudo
isso está em `.github/instructions/registro-md.instructions.md` e passou a aplicar-se ao padrão
`REGISTRO*.md`.
