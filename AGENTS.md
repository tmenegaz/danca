# Orientações para agentes

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
- Depois de alterar fontes, regenere a âncora FIPP com `tools/hash-ciclo.sh <professor> <ciclo> <escola>` e confirme o resultado quando necessário com `--check`.
- Para validações isoladas, use `node tools/validar-schema-ciclo.js`, `node tools/validar-po-ciclo.js`, `node tools/validar-plano-ciclo.js` e `node tools/validar-captura-ciclo.js` conforme o artefato alterado.
- IDs de títulos devem ser normalizados por `tools/normalizar-ids.py`; links entre páginas HTML devem apontar para a pasta plana gerada e para âncoras ASCII estáveis.
- Acompanhamentos com dados sensíveis devem permanecer cifrados no pacote publicado e fora do Git em Markdown. Não versione `tools/.netlify-tokens` nem `tools/.senhas-locais`.

## Apresentações

- A fonte de verdade dos mapas e o fluxo de exportação estão em [apresentacoes/apresentacao-01-rizoma/README.md](apresentacoes/apresentacao-01-rizoma/README.md).
- Após alterações no deck, use `node tools/check-overflow.js`, `node tools/check-mapa.js` e, quando aplicável, `node tools/medir-rotulos.js`.
- Não versione PDFs, PPTX, PNGs ou a pasta `out/` das apresentações.

## Infraestrutura e versionamento

- A infraestrutura listada em [CONGELAMENTO.md](CONGELAMENTO.md) só muda com motivo declarado, entrada em `REGISTRO.md` e commit próprio.
- Instale os hooks locais com `tools/instalar-hooks.sh`. Mensagens de commit seguem `tipo(escopo): descrição` e exigem os rodapés `Refs:`, `Regras:` e `Auditoria:`.
- Prefira alterações pequenas e valide o fluxo afetado antes de concluir. O ambiente documentado usa `pdflatex`; não troque o engine sem verificar as dependências locais.
