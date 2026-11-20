# nucleo/ — o núcleo agnóstico do PE

A lógica do motor — **validar, derivar, elicitar** — sem infraestrutura. Este diretório é o
que o pedido chama de **núcleo**: não sabe onde corre, não sabe de onde lê, não sabe para onde
escreve. Só sabe **o que faz**.

| Arquivo | O que é |
|:--|:--|
| `validar.js` | o validador mínimo (`validarCom`, `validar`, `tipoDe`, `iguais`, `resolverRef`) — sem `fs`/`path`/`http`/`process` |
| `derivar-plano.js` | o derivador (`derivar`, `enderecar`, `valoresDaForma`, `procurarRamo`) — recebe o conteúdo, devolve o plano |
| `elicitar.js` | o runtime de elicitação (`elicitar`, `nosRespondiveis`, `ramificar`, `derivarEstado`, `completar`) — recebe conteúdo + respostas + esquema, devolve documento/estado/relatório |
| `ia.js` | a conversa de IA (o stub de hoje, o DeepSeek de amanhã): `conversar`/`respostaDaIA` + o freio (`limiteTurnos`) — sem `fs`/`path`/`http`/`process` |
| `ficha.js` | a ficha imprimível (o markdown da anamnese/PO): `renderizar`/`metodosDeOrigem` — sem `fs`/`path`/`http`/`process` |
| `ficha-html.js` | a folha HTML a partir do markdown, para a tela e para a impressão: `paginaDaFicha`/`paginaDaFichaEmBranco`/`paginaDoPlano`/`corpoDaFicha` — sem infraestrutura |
| `cadeia.js` | o **índice das etapas** da cadeia automática (09/11/2026): as quatro etapas na ordem da dependência (vínculos → plano de ensino → plano de observação → pacote), a classificação de cada uma (`feita` · `pendente` · `bloqueada`) a partir do que existe, a porta do fluxo completo e o resumo com a próxima etapa em falta — sem executar nada e sem infraestrutura (a execução é `motor/servidor/cadeia.js`). Os gatilhos são a troca de aluna, a conclusão do elenco, a troca de direção e a **mudança de sala** (09/11/2026) |
| `porta.js` | a lógica da porta (registro, mapa, vínculo, estados, carimbo, gravação, elicitação) — recebe o armazenamento por parâmetro, nunca um `fs` |
| `derivar-po.js` | a ponte envelope → fonte do PO: o envelope elicitado vira o `ciclo-XX-<escola>-po.md` (a fonte que `gerar-ciclo.sh` gera e `hash-ciclo.sh` ancora). **Cada nó respondível do PO tem a SUA seção/chave** (é daqui que saem `planoDeEnsino`, `horizonte`, `dimensoesObservadas`, `itensPorDimensao`, `metodologiaENotacao`, `flutuantes`, `restricoes`, `horizonteDoConjunto`, `compromissoDeReavaliacao`), e é aqui que vive a **fonte única dos rótulos** do contexto (`ROTULOS_DO_CONTEXTO` + `COMPOR_DO_CONTEXTO`, lida também pelo `derivar-plano-ciclo.js`) e a porta dos rótulos do checklist (`rotulosDoChecklist`) — sem `fs`/`path`/`http`/`process` |
| `derivar-plano-ciclo.js` | a ponte envelope → fonte do PLANO (`ciclo-XX-<escola>-plano.md`), irmã do `derivar-po.js`: cada nó respondível tem a SUA seção, e o **`## Contexto` é a fonte única** do que o professor declarou — a ficha do ciclo (`## Objetivo geral` → `ciclo`) é **composta dele** (`tabelaDeIdentificacao`), e não repete a pergunta. É daqui que saem `parametroEmLinhas` (a matriz `{marco, marcados}` do parâmetro de medição, que sem ela chegava ao `aula-01.md` como `[object Object]`), `linhasDaEstrutura`, `marcosEmTexto`, a **sequência de exercícios posta em tabela** (`tabelaDaSequencia`, com as cinco colunas fixas — a coluna que o `tabelaDeLista` tiraria das chaves do primeiro objeto desaparecia do documento quando o exercício ainda não tinha tempos), a régua (`niveisDaRubrica`/`linhasDaRubrica`) e os `BLOCOS_DA_AULA` — sem `fs`/`path`/`http`/`process` |
| `chaves.js` | a regra do prefixo das famílias do KV (`prefixoDaEscola`, `raizDaChave`, `segmento`, `cicloDaChave`) — sem infraestrutura. Era o `cofre.js`, que também guardava a anamnese cifrada no KV; o cofre saiu (20/10/2026) e ficou a regra de chave que o `lancamento.js` usa |
| `objetivos-do-repertorio.js` | a **declaração do objetivo de um exercício novo** (20/11/2026): `estadoDaDeclaracao` diz se há o que perguntar (`sem-plano` · `ja-na-aula` · `fora-do-repertorio` · `nova`), `impactoDaInclusao` compõe o que a janela mostra antes de perguntar (a linha do parâmetro que ganha o termo, os marcos sem pré-seleção, as linhas do item 10 que já o citam) e `aplicarDeclaracoes` escreve o termo em `aula-1-parametro` **e** no `repertorio` do plano — sem o segundo, `parametroEmLinhas` filtra-o de volta e o documento sai como se a declaração nunca tivesse existido. Aplica uma vez e só uma: o que a aula já usa não volta a ser declarado, e é isso que deixa o professor desmarcar no plano sem a Turma lhe repor a marca — sem `fs`/`path`/`http`/`process` |
| `armazenamento.js` | o **contrato de armazenamento** (`ler`/`guardar`/`anexar`/`listar`/`existe`/`apagar`) e a implementação de memória |
| `produtos/comum.js` | o que os três produtos partilham: a **composição catálogo × escola** (`compor`, com a escola a ganhar e a marcar `origem`), a ordem das categorias, a integridade do verbete (o `cobre` e as células contra os tempos), o relógio das pistas e a lacuna — sem `fs`/`path`/`http`/`process` |
| `produtos/dicionario.js` | o produto **dicionário**: o vocabulário do catálogo e a decomposição de cada exercício, com a definição, a origem e o que falta dito (`[Preencher]`), e um verbete que não fecha a sair em `[conferir]` em vez da contagem errada — sem infraestrutura |
| `produtos/syllabus.js` | o produto **syllabus**: um documento por nível (a ordem declarada em `progressao.json`), com a camada pedagógica por unidade (`exige` · `ensina` · `expressa`) **herdada do termo ou sobreposta pela relação** (`camadaDaUnidade`), mais um índice que diz quantos níveis ainda não declararam nada — sem infraestrutura |

## A camada pedagógica: onde vive, e por que em dois lugares

`exige` · `ensina` · `expressa` são **três declarações** (o que a unidade exige do corpo, o que
ensina, o que expressa) — e **não** três eixos de medição (C20). Quem mede o aluno mede nas
dimensões do PO; isto é o programa.

Decisão de **02/11/2026**, e a razão é a mesma pela qual o «método» do verbete não se repete:
**o mesmo passo, em dois níveis, quase sempre exige a mesma coisa do corpo e quase nunca expressa a
mesma coisa.** Repetir a exigência em cada relação faria do dado uma cópia, e a primeira correcção
deixaria as cópias a divergir. Há então dois lugares, e **a relação vence sempre**:

| Onde | Ficheiro | Vale |
|:--|:--|:--|
| **o padrão do exercício** | `vocabulario.json`, no termo | em todos os níveis |
| **a sobreposição do nível** | `progressao.json`, na relação | só naquele nível |

O documento gerado **escreve de onde veio** — `(herdado do termo)` ou `(declarado no nível)` —, e o
manifesto conta `camada_herdada` · `camada_declarada` · `camada_ausente`. A marca não é enfeite:
apresentar como «do nível» o que veio do termo é uma afirmação falsa sobre quem declarou o quê.

**Herdar não é faltar.** Só a ausência nos **dois** lugares vira `[Preencher: …]` e conta como
lacuna (`unidade-sem-camada`, com o nome dos campos que faltam).

## A fronteira

- O núcleo **não importa** `fs`, `path`, `http` nem nada do runtime — a prova
  (`provar-agnosticismo.js`) verifica isso por máquina.
  **Correcção de 02/11/2026:** o `provar-agnosticismo.js` **não existe neste worktree** (o
  `PLANO-PRODUTOS-DO-MOTOR` e a `TRANSFERENCIA-IA` já o diziam, e este README continuava a
  prometê-lo). O que existe, desde esta data, é a **§A do `experimentos/provar-produtos.js`**:
  ela lê os três ficheiros de `produtos/` e reprova se algum requer `fs`/`path`/`http`/`process`
  ou olha o relógio. A fronteira do resto do núcleo continua **sem prova por máquina** — é
  lacuna declarada, não uma verificação que se possa alegar.
- O núcleo **recebe** o que precisa: o `elicitar` exige `opcoes.esquema` (o contrato já
  carregado pelo adaptador) e devolve o documento em memória. Ele **não vai buscar** nada ao
  disco.
- O núcleo **não usa** o armazenamento: quem lê o conteúdo/esquema e persiste o envelope é o
  **adaptador** (`adaptadores/`).

## O que ficou no `motor/`

O diretório `motor/` continua a existir — mas agora é o **adaptador Node**: reexporta o núcleo
e acrescenta o que é de runtime (os caminhos, a leitura do disco, o autoteste e a CLI). Os
mesmos comandos de sempre continuam a funcionar (`node motor/elicitar.js --autoteste` ⇒ 41/41;
`node motor/validar.js --autoteste` ⇒ 22/22; `node motor/derivar-plano.js`).

**E, desde 02/11/2026, `motor/produtos.js`** — o CLI que gera os produtos a partir do catálogo:
`node motor/produtos.js dicionario` e `node motor/produtos.js syllabus` escrevem em
`publicacao/produtos/<modalidade>/` (pasta gerada, no `.gitignore`), com `--out -` para a saída
padrão, `--nivel` para um nível só, `--json` para o manifesto e `--do-repo` para ler o `main` em
vez do disco. O produto **não é fonte**: a fonte é o catálogo, e o documento reconstrói-se dele.
