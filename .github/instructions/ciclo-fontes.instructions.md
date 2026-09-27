---
description: "Convenções das fontes de ciclo e de material de observação: sufixo da escola, um arquivo por artefato, apelidos estáveis, lacunas explícitas e saídas geradas."
applyTo: "professores/**/ciclos/*.md,professores/**/ciclos/*.conf,professores/**/relatorios/**/*.md,professores/**/cadernos/**/*.md"
---
# Fontes de ciclo e material de observação

Este é o **Projeto Ciclo** — a memória da aula dada. Cada aula é **planejada** antes de ser dada: o plano (`aula-NN.md`, fonte da âncora de proveniência) fixa objetivo, marcos e volume, e é ele que dá a **linha de base**. O que a memória registra é o processo de ensino-aprendizagem que de fato se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda; o plano é **intenção** (editável enquanto a aula está `planejada`), o registro é **fato** (depois que a aula acontece, só se acrescenta ajuste — o estado é **derivado** do cronograma, do prazo e do registro, e **não existe campo "aula dada"**). Ele é **protótipo**, testado no **universo da dança**: **não é agnóstico** — o projeto agnóstico será criado a partir dele, para transitar em outros universos (oficina de matemática, improvisação, disciplina de mestrado). Ele **não avalia** — registra o cotidiano do professor. E **não implementa o FIPP**: a âncora de proveniência encadeada (`hash-ciclo.sh` → `.fipp`) é uma **aproximação** do Framework de Infraestrutura de Proveniência Peirceana, que pertence ao projeto de mestrado, em outro diretório.

Estes arquivos são **fontes**: o professor os edita e os geradores os consomem. As saídas (HTML, PDF, CSS, assets, `README.md` do pacote) vivem na pasta `ciclo-XX-<escola>/` e **não se editam à mão** — são reconstruíveis por `tools/gerar-ciclo.sh`.

## Cada escola é uma variante independente

- A fonte com **sufixo da escola** prevalece sobre a compartilhada (`tools/lib-fontes.sh`). Uma escola nunca lê o conteúdo de outra.
- Ao criar ou editar, use o sufixo: `ciclo-XX-<escola>-plano.md`, `-po.md`, `-aula-NN.md`, `-musicalidade.md`, `-apanhado-historico.md`, `-pre-requisitos.md`, `-harmonizacao.md`, `-dados.json`, `-captura-aula-NN.md`, `-referencias.md`. O manifesto base é `ciclo-XX.conf`; a variante é `ciclo-XX-<escola>.conf`.
- Nunca copie o conteúdo de uma escola para outra. A estrutura do piloto se replica (P-17); o texto, não. Já houve pacote da Ritmos saindo com o plano da Duo — é o defeito mais caro do repositório.

## Dados de pessoas

- **P-12:** sujeitos entram por **apelido estável**, o mesmo ao longo do ciclo, sem consulta a mapa externo. Nunca nome completo, contato ou dado de saúde em claro.
- **P-06:** o caderno é **descritivo**. Descreve o que aconteceu; não classifica, não avalia, não conclui.
- **P-21:** em documento publicado, a linguagem é harmonizada — o fato permanece, o juízo sai. A versão bruta vive em `campo/` e **não é alterada**.
- **P-22:** restrição física é declarada no PO, registrada no caderno e no relatório quando significativa, e comunicada quando impede o trabalho. O professor **não avalia** o que a aluna não pode executar.

## Lacunas e proveniência

- Lacuna é **explícita**: `[Preencher: …]` para o que o professor ainda não declarou, `[conferir]` para o que depende de conferência de edição ou ano. Nunca invente data, fonte, volume ou observação.
- Toda afirmação tem origem declarada (Regra 8). Sem fonte, é `[conferir]`.
- Os campos `duracao:`, `volume-total:` e o bloco de volume por seção são verificados em código: fora da faixa, a geração é interrompida (Pré-requisito 4, Regra 9). O teto vem da duração, as frases fecham em tempos inteiros e a preparação **não** consome o volume ativo (Regra 4).

## Listas e tabelas têm forma contratual

A folha de captura imprime itens como colunas e o formulário os lê como campos:

- **lista** de alunas, restrições ou itens → **uma linha por item**, nunca prosa;
- **marcos** → tabela `| Aula | Objetivo específico (marco parcial) |`, uma linha por aula.

Escrito como frase, o item vira trabalho manual depois.

## IDs e links

Os ids de título são normalizados por `tools/normalizar-ids.py` — não os escreva à mão nem edite ids em saída gerada. Links entre páginas apontam para a **pasta plana** gerada e para âncoras ASCII estáveis: `[notação](notacao.html#exemplo-didatico-um-tendu)`.

## Antes de gerar

Depois de alterar qualquer fonte: `tools/gerar-ciclo.sh <professor> <ciclo> <escola>`, depois `node tools/check-pacote.js professores/<professor>/ciclos/ciclo-XX-<escola>` e, por fim, reancore com `tools/hash-ciclo.sh <professor> <ciclo> <escola>` (confirme com `--check`). O `.fipp` cobre só as fontes — nunca HTML, PDF, PPTX ou PNG.
