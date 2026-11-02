# As 17 regras do projeto (e os 5 pré-requisitos) — Formação em Balé Clássico

Documento de referência versionado com o código. Cada aula, ciclo ou apresentação
gerado pelo projeto deve poder ser auditado contra estas regras, e cada commit
declara quais delas aplicou (rodapé `Regras:`).

> As 17 regras deste documento dizem **como dar aula com rigor**. As regras
> pétreas que dizem **como a aula se torna objeto de investigação sem que a
> investigação contamine a aula** estão em [`PROTOCOLO.md`](PROTOCOLO.md).

## Pré-requisitos obrigatórios (o que o professor informa antes de qualquer geração)

| # | Pré-requisito | Observação |
|:--|:--|:--|
| 1 | **Objetivo geral** do ciclo | verificável ao final, com parâmetro |
| 2 | **Objetivo específico** da aula | o marco parcial daquela aula |
| 3 | **Parâmetro de medição** | o que o professor observa para dizer "alcançado" |
| 4 | **Duração da aula**, em minutos | calibra o volume total. **Sem ela, não se gera aula** |
| 5 | **Contexto institucional** | escola/espaço, frequência semanal, dias de aula **com o horário de início de cada aula** e duração por dia. **Sem isso, não se gera o ciclo** |

> Os pré-requisitos 4 e 5 estão implementados em código em `tools/gerar-ciclo.sh`:
> o gerador **recusa** construir o material quando falta a duração ou o contexto
> institucional, e recusa também quando o volume declarado não cabe na faixa da
> duração de cada dia (Regra 9).

## As 17 regras

| # | Regra | O que garante |
|:--|:--|:--|
| 1 | **Terminologia RAD** | Vocabulário e progressão padronizados (Grade 1 como base) |
| 2 | **Fio condutor** | Exercícios encadeados por causalidade, não por estética |
| 3 | **Estrutura espacial** | Solo → barra → centro, nesta ordem |
| 4 | **Condições preliminares** | Pré-requisitos de força e flexibilidade declarados e contados **à parte** do volume da aula |
| 5 | **Carga e volume** | Volume quantificado e progressivo, com unidade explícita |
| 6 | **Métrica musical** | Compasso, contagem e fases em cada exercício |
| 7 | **Causa e consequência** | Mecanismo, causa anatômica e consequência funcional |
| 8 | **Proveniência objetiva** | Toda afirmação tem origem declarada; o que não tem fonte fica marcado `[conferir]` |
| 9 | **Distribuição de volume** | Duas etapas: teto pela duração, depois distribuição por bloco (solo 30–40%, barra 20–30%, centro 30–40%, musicalidade 5–10%) |
| 10 | **Estrutura de ciclos (com calendário)** | Camada 1: objetivo geral + marcos por aula + rubrica. Camada 2: escola, frequência, duração por dia, volume semanal e **datas reais** (formativa e somativa) |
| 11 | **Pensamento sistêmico** | Nenhum movimento isolado: cada exercício nomeia o que habilita adiante |
| 12 | **Observação pedagógica** | Arte ≠ ginástica; uma correção por execução; nada de dor como mérito |
| 13 | **Apanhado histórico** | Conexão ao repertório do balé clássico, com o passo do dia |
| 14 | **Viés de agenciamento** | Potência de agir, não fenomenologia: o corpo percebe, decide e responde |
| 15 | **Musicalidade** | Bloco próprio em cada aula + arquivo paralelo do ciclo |
| 16 | **Formato de entrega** | PDF único consolidado + pacote HTML interligado, com índice, links, bookmarks e rodapé (ver `README-ciclos.md`) |
| 17 | **Versionamento com Git** | Todo conteúdo versionado, com commit auditável (ver abaixo) |

> **O contexto institucional e a frequência entram como Pré-requisito 5** (acima), não como regra: são dados de entrada obrigatórios, e a Regra 10 os transforma em calendário real. Uma entrega por escola.

## Notas de substituição (o que a regra manda cumprir hoje)

> **Motivo declarado.** Este ficheiro está congelado (`CONGELAMENTO.md`): uma alteração aqui exige
> corpo no commit a explicar o porquê, entrada no `REGISTRO.md` e commit próprio. É o que se fez em
> 02/11/2026. Nenhuma regra é apagada nem renumerada — o que se acrescenta é o que ela **manda
> cumprir agora**, quando o que ela pedia deixou de ser o melhor que se sabe fazer.

### Regra 15 — Musicalidade (substituída em 02/11/2026)

**O que ela pedia.** «Bloco próprio em cada aula + arquivo paralelo do ciclo.» Doze palavras,
escritas antes de o verbete existir.

**Porque mudou.** Medido: **nenhum arquivo paralelo de musicalidade existe no repositório**, e essa
metade nunca se implementou. E o «bloco próprio» partia de uma premissa que não se sustenta: a
musicalidade **não é um bloco onde se põem exercícios** — é uma forma de olhar todos eles. Um
exercício não «está na musicalidade»; tem tempos, compasso e uma grade de contagens.

**O que manda cumprir hoje.** A musicalidade vive no **dado**, num sítio só, e o documento deriva
dele:

1. o **verbete** de cada exercício declara a grade de contagens por música (`<tempos>|<compasso>` →
   cada célula com a contagem, a categoria e os sinais);
2. a **sequência do plano** declara os tempos e o compasso de cada linha;
3. a **§4 de cada aula** consolida os dois — uma linha por exercício, **uma vez só**, agrupada por
   compasso, com a contagem e o que cai nela.

O **pulso** é a contagem, o **acento** é o tempo do compasso em que ela cai, a **frase** é o
exercício inteiro sobre a música. A conferência de que a grade **fecha** nos tempos declarados é
feita na **gravação do verbete**, com a correção apontada nos passos 2 (a música) e 3 (para onde).

**Porque é melhor do que a regra.** A regra pedia um **arquivo** por ciclo; o que existe é **dado**.
Um arquivo paralelo seria mais uma verdade a manter sincronizada — exactamente o que este projeto
elimina em cada decisão. Ver `REGISTRO.md`, entrada de 02/11/2026 («A Regra 15 foi substituída, e
por mais do que ela pedia»).

## Convenção de nome — nomear pelo conceito

**Nome de arquivo, de pasta e de ferramenta diz o que a coisa É — nunca o título que ela exibe.**

O título de uma página, de um relatório ou de uma seção é texto de apresentação: pode ser
comercial, pode ser de marketing, pode mudar sem que o conteúdo mude de natureza. Se ele vira
nome de arquivo, o nome envelhece junto com a campanha — e o próximo a ler o repositório
procura por um conteúdo que já não se chama assim.

O critério é o mesmo que nomeia a pasta `tools/`: ela não se chama «chave de fenda» nem
«validar strings», porque **ferramentas** é a função que todas ali compartilham. A pasta
aglutina pelo conceito, não pelo primeiro item que apareceu.

| Nomeie pelo conceito | Não nomeie pelo título |
|:--|:--|
| `apresentacao.md` — é a apresentação do sistema | `sistema-lastro.md` — é o que a página exibe hoje |
| `check-apresentacao.js` — valida a apresentação | `check-sistema-lastro.js` — idem |
| `guia-do-professor.md` — é o guia de quem ensina | `bem-vindo-ao-ciclo.md` |

**Onde isso morde na prática:**

- **Arquivo e pasta:** um título revisado não renomeia arquivo nenhum. Se o nome do arquivo
  só faz sentido porque é o que está escrito na tela, ele já está errado.
- **Ferramenta:** o script se chama pelo que faz (`check-pacote`, `gerar-raiz`,
  `hash-ciclo`), não pelo conteúdo que processa naquele dia.
- **Escopo de commit:** o escopo é a área tocada (`tools`, `estrutura`, `biblioteca`), não o
  título do material.
- **Identificador:** nome de campo, chave de cofre e id de âncora seguem o conceito estável —
  renomear o rótulo de exibição não move a chave (P-17).

**A troca de nome é um elo, não um apagamento.** Quando um nome sai, a mudança é registada no
`REGISTRO.md` com a data e o motivo — o histórico não se reescreve para parecer que sempre foi
assim. O texto publicado com o nome antigo continua legível: o que muda é o que se escreve a
partir de agora.

## Regra 17 em prática

| Item | Convenção |
|:--|:--|
| **Tipos de commit** | `feat` · `fix` · `docs` · `refactor` · `style` · `chore` · `audit` |
| **Escopos** | `ciclo-XX` · `aula-XX` · `apresentacao-XX` · `apresentacao-01-rizoma` · `caderno` · `caderno-XX` · `relatorio` · `relatorio-XX` · `notacao` · `pre-requisitos` · `musicalidade` · `apanhado` · `biblioteca` · `po` · `campo` · `schema` · `registro` · `protocolo` · `metodo` · `ideia` · `experimentos` · `entrega` · `estrutura` · `template` · `tools` · `regras` · `prompts` — a lista é a do hook (`tools/hooks/commit-msg`); escopo fora dela **recusa o commit** |
| **Formato** | `tipo(escopo): descrição curta` + corpo + rodapé |
| **Rodapé obrigatório** | `Refs:` (o que foi tocado) · `Regras:` (quais regras aplicou) · `Auditoria:` (sim/não) |
| **Branches** | `main` = conteúdo auditado · `ciclo-XX` / `apresentacao-XX` = trabalho · `hotfix/...` = urgência |
| **Hooks** | `tools/hooks/pre-commit` (valida o pacote) e `tools/hooks/commit-msg` (valida a mensagem); instalar com `tools/instalar-hooks.sh` |
| **Saídas** | **não** versionadas (`.gitignore`): são reconstruíveis das fontes |

### Comandos úteis de rastreabilidade

```bash
git log --follow ciclos/ciclo-01-aula-01.md     # histórico de um arquivo
git blame  ciclos/ciclo-01-aula-01.md           # quem escreveu cada linha
git log --grep="audit"                          # commits de auditoria
git log --grep="Clippinger"                     # commits que citam uma referência
git log --oneline -- ciclos/ciclo-01/           # histórico de um ciclo
```

> **Premissa 7 — o commit é proveniência.** Cada commit é um nó que registra quem,
> o quê, quando, por quê e com base em qual referência — o **mesmo princípio** de
> encadeamento por hash usado no projeto de mestrado (noutro diretório). Aqui o
> encadeamento vive na âncora de proveniência (`tools/hash-ciclo.sh` → `.fipp`), que é
> uma **aproximação** do FIPP daquele projeto, não a sua implementação.
