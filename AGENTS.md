# Orientações para agentes

## O que é este projeto (leia antes de qualquer coisa)

**Projeto Ciclo** — a **memória da aula dada**. Cada aula é **planejada** antes de ser dada: o
plano (`aula-NN.md`, que entra na âncora de proveniência) fixa objetivo, marcos e volume, e é ele
que dá a **linha de base**. O que a memória registra é o processo de ensino-aprendizagem que de
fato se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda.

- **Planejar e registrar são coisas distintas — e as duas acontecem.** A aula é planejada
  (`aula-NN.md`), dada, e então lançada. O plano é **intenção**: editável enquanto a aula está
  `planejada`. Depois que a aula acontece, o registro passa a **fato** — só se acrescenta ajuste,
  nunca se reescreve a intenção (`ARQUITETURA-AULA.md`). O estado é **derivado** do cronograma, do
  prazo e do registro: não existe campo "aula dada". O formulário de lançamento **consome o
  plano** como entrada: sem ele não há marco da aula nem "o que mudou em relação ao plano".

- **NÃO é o projeto de mestrado.** O mestrado está em **outro diretório**, e é de lá que
  vem o PO (Protocolo de Observação) e o FIPP. Este repositório **aplica** um PO; não o
  define, e **não implementa o FIPP**.
- **Aqui o FIPP não está implementado**, nem perto do que a arquitetura dele desenha. O que
  existe é uma **âncora de proveniência encadeada** (`tools/hash-ciclo.sh` → `.fipp`), que
  compartilha o princípio do FIPP — o passado se incorpora, não se reescreve — mas é uma
  **aproximação**, não o framework.
- **Este projeto é PROTÓTIPO — ele não é agnóstico.** Está sendo **testado no universo da
  dança**. A partir dele será criado o projeto que **deve ser agnóstico** (o projeto-alvo,
  ainda não existente), que deverá transitar em todos os universos: oficina de balé, oficina
  de matemática, improvisação em dança contemporânea, disciplina de mestrado. Não descreva
  este repositório como "agnóstico" — ele é o protótipo que provará o modelo.
- **Nenhum ciclo é igual a outro, nenhuma aula é igual a outra** — nem com o mesmo professor.
  O protótipo existe para provar que o modelo se sustenta nessa variação.
- **O projeto não avalia.** Ele registra o **cotidiano do professor em sala de aula**. A
  avaliação é fronteira de outro módulo, ainda não desenhado.
- **Os artefatos são evidência com cadeia de custódia** — não julgamento. O que gera valor
  é o rastro: o que foi respondido, quando, por quem, e por que mudou. A proveniência
  **acrescenta, não edita**: um ajuste é um elo novo, nunca uma sobrescrita.
- **A integração ainda não existe.** Com o projeto das secretarias (Projeto Cultura), nem a
  fronteira de entrada nem a de saída foram desenhadas. O módulo de avaliação — que
  derivaria da cadeia de custódia em vez de aproximar questões do plano — é ideia, não
  implementação.

> **Armadilha de leitura.** Três documentos dizem "mestrado" (`README.md`, `PROTOCOLO.md`,
> `REGRAS.md`) e um fala em "proveniência Peirceana" (`PROTOCOLO.md`). Esses trechos são
> **verdadeiros** — referem-se ao outro diretório e ao nome do framework — mas induzem à
> leitura errada de que **este** repo é o projeto de mestrado ou que o FIPP roda aqui.
> Não é o caso, nas duas hipóteses.

## Antes de editar

- Leia [README.md](README.md) para a visão geral e [REGRAS.md](REGRAS.md) para as regras pedagógicas e de versionamento.
- Para ciclos, consulte [README-ciclos.md](README-ciclos.md); para decisões de método e captura, consulte [METODO.md](METODO.md), [PROTOCOLO.md](PROTOCOLO.md) e [ARQUITETURA-CAPTURA.md](ARQUITETURA-CAPTURA.md).
- Verifique [HANDOFF.md](HANDOFF.md), [REGISTRO.md](REGISTRO.md) e [CONGELAMENTO.md](CONGELAMENTO.md) antes de alterar infraestrutura ou assumir que uma decisão está em aberto.
- Para gerar/validar ciclos, auditar contra as regras ou editar o deck, use os agentes de `.github/agents/` (`ciclo-entrega`, `ciclo-auditor`, `deck-rizoma`); eles dividem o trabalho por fronteira de escrita e nenhum deles edita fontes.
- Preserve alterações existentes no worktree. Não faça commits, branches ou resets sem solicitação explícita.

## Estrutura e fontes de verdade

- `professores/` contém ciclos, cadernos, relatórios e campo; `biblioteca/` contém referências compartilhadas; `apresentacoes/` contém a frente Marp; `experimentos/` é demonstrativo e não entra em pacotes, hashes ou publicação.
- Em ciclos, edite Markdown e manifestos em `professores/<professor>/ciclos/`. HTML, PDF, CSS e assets do pacote são saídas geradas; não edite essas saídas manualmente.
- Cada escola é uma variante independente. Resolva fontes pelo padrão existente em `tools/lib-fontes.sh`: a fonte com sufixo da escola prevalece sobre a compartilhada. Nunca copie o conteúdo de uma escola para outra.
- O guia compartilhado do professor fica em `biblioteca/guia-do-professor.md`; não crie cópias por professor.
- Mantenha lacunas explícitas como `[Preencher: ...]` ou `[conferir]`; nunca invente dados pedagógicos, datas, fontes ou observações.
- Use apelidos estáveis para alunas. Não introduza nomes completos, contatos, dados de saúde ou acompanhamentos em claro.

## Fluxo de ciclos

- Gere uma entrega com `tools/gerar-ciclo.sh <professor> <ciclo> <escola>`; a duração da aula e o contexto institucional são obrigatórios.
- Valide um pacote com `node tools/check-pacote.js professores/<professor>/ciclos/ciclo-XX-<escola>`.
- Após alterar fontes, regenere a âncora de proveniência com `tools/hash-ciclo.sh <professor> <ciclo> <escola>` e confirme com `--check`. A âncora sai em `<professor>/ciclos/ciclo-XX-<escola>.fipp` e é **versionada** — é a âncora da cadeia, não saída.
- Para validações isoladas, use `node tools/validar-schema-ciclo.js`, `node tools/validar-po-ciclo.js`, `node tools/validar-plano-ciclo.js` e `node tools/validar-captura-ciclo.js` conforme o artefato alterado.
- IDs de títulos devem ser normalizados por `tools/normalizar-ids.py`; links entre páginas HTML devem apontar para a pasta plana gerada e para âncoras ASCII estáveis.
- Acompanhamentos com dados sensíveis devem permanecer cifrados no pacote publicado e fora do Git em Markdown. Não versione `tools/.senhas-locais` nem qualquer credencial de deploy (Cloudflare ou outra).

## Apresentações

- A fonte de verdade dos mapas e o fluxo de exportação estão em [apresentacoes/apresentacao-01-rizoma/README.md](apresentacoes/apresentacao-01-rizoma/README.md).
- Após alterações no deck, use `node tools/check-overflow.js`, `node tools/check-mapa.js` e, quando aplicável, `node tools/medir-rotulos.js`.
- Não versione PDFs, PPTX, PNGs ou a pasta `out/` das apresentações.

## Infraestrutura e versionamento

- A infraestrutura listada em [CONGELAMENTO.md](CONGELAMENTO.md) só muda com motivo declarado, entrada em `REGISTRO.md` e commit próprio.
- Instale os hooks locais com `tools/instalar-hooks.sh`. Mensagens de commit seguem `tipo(escopo): descrição` e exigem os rodapés `Refs:`, `Regras:` e `Auditoria:`.
- Prefira alterações pequenas e valide o fluxo afetado antes de concluir. O ambiente documentado usa `pdflatex`; não troque o engine sem verificar as dependências locais.
