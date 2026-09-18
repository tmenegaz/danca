# Handoff — Projeto Ciclo

Gerado em: `2026-09-18T14:02:52-0300`
Commit atual: `d155cd7` — chore(estrutura): versiona os pacotes de ciclo (deploy automatico pelo GitHub)
Para: sessão nova (retomar o diálogo)

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **14 pétreas** em `PROTOCOLO.md`
- **Professores:** tiago (1)
- **Ciclos com manifesto:** 3 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Últimos commits

```
d155cd7 chore(estrutura): versiona os pacotes de ciclo (deploy automatico pelo GitHub)
82e83f6 chore(tools): regenera os pacotes e o HANDOFF
002d965 docs(tools): registra o comando de deploy no README
76d128f feat(tools): cria deploy-netlify.sh (uma conta por escola)
d92eed9 fix(template): navbar deixa de cobrir o conteudo e fica responsiva
31625b3 chore(tools): aceita o escopo template no commit-msg
0ca9d5f docs(registro): corrige a ordem das entradas (cronologica, a mais recente no fim)
4add8f4 docs(registro): registra a decisao de publicar o repositorio no GitHub
ffced49 chore(tools): lista as variantes do ciclo em uma linha no HANDOFF
c1c3f4b chore(tools): regera HANDOFF
547907e docs(estrutura): atualiza documentos da raiz para a estrutura por professor
53692ba feat(biblioteca): guia do professor no pacote de ciclo
51cf250 feat(protocolo): acrescenta P-13 e P-14 (PO por professor, departamento)
28d6d3b refactor(estrutura): move o material do Tiago para professores/tiago e refatora as ferramentas
c88c7d8 chore(tools): regera ancoras e HANDOFF
494f9ac fix(ciclo-01): ajusta redacao do PO do Duo (contagio, nota sobre dor)
16ad569 chore(tools): regera ancoras e HANDOFF
7630610 feat(ciclo-01): cria folha de captura para uso durante a Aula 01
25fe19e chore(tools): regera HANDOFF
157fc44 feat(ciclo-01): preenche a linha de base do PO do Duo (antes da Aula 01)
```

## Por professor

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): debora, duo, ritmos

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Débora (Marau) | ciclo-01-debora-po.md | Input_PO_Aguardando | 21 |
| Duo | ciclo-01-duo-po.md | Input_PO_Validado | 0 |
| Ritmos e Movimento | ciclo-01-ritmos-po.md | Input_PO_Aguardando | 21 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| debora | ciclo-01-debora.fipp | `23b1d1075d87` | (vazio) | Input_PO_Aguardando |
| duo | ciclo-01-duo.fipp | `f99c8ef2879a` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `cb7822207ac0` | (vazio) | Input_PO_Aguardando |

## Pétreas (`PROTOCOLO.md`)

- **P-01 — O ciclo é PO latente.
- **P-02 — O PO declarado de um ciclo vem do ciclo anterior.
- **P-03 — FIPP alinha; Git ramifica.
- **P-04 — Hash SHA-256 sobre fontes, versionado.
- **P-05 — O ciclo produz material, não evidência.
- **P-06 — O caderno de ciclo é descritivo, não analítico.
- **P-07 — Nenhuma classificação tácito/arquivo sem as quatro condições.
- **P-08 — Os campos do ciclo são declarados em schema.
- **P-09 — Um caderno por ciclo, por escola.
- **P-10 — O PO declara a linha de base dos sujeitos.
- **P-11 — O PO declara as condições de contorno da execução.
- **P-12 — Os sujeitos são referidos por apelidos estáveis.
- **P-13 — Cada professor tem o seu próprio PO.
- **P-14 — O PO pode derivar de um PO de departamento.

## Regras (`REGRAS.md`)

- **1. Terminologia RAD**
- **2. Fio condutor**
- **3. Estrutura espacial**
- **4. Condições preliminares**
- **5. Carga e volume**
- **6. Métrica musical**
- **7. Causa e consequência**
- **8. Proveniência objetiva**
- **9. Distribuição de volume**
- **10. Estrutura de ciclos (com calendário)**
- **11. Pensamento sistêmico**
- **12. Observação pedagógica**
- **13. Apanhado histórico**
- **14. Viés de agenciamento**
- **15. Musicalidade**
- **16. Formato de entrega**
- **17. Versionamento com Git**

## Última entrada do REGISTRO

## 18/09/2026 — Pacotes de ciclo passam a ser versionados (deploy automático)

**O que aconteceu.**
O deploy do material passou a ser **automático a partir do GitHub** (Netlify, uma conta por
escola). Como o serviço lê o repositório, o pacote gerado precisa estar nele — e até aqui as
saídas ficavam fora do Git, por `.gitignore`.

**O que foi decidido.**
- Os pacotes (`professores/<p>/ciclos/ciclo-XX-<escola>/`: HTML, PDF e `assets/`) passam a
  ser **versionados** — inclusive os `assets/`, que são o estilo e os mapas sem os quais a
  página não funciona.
- **A P-04 continua valendo integralmente:** o hash FIPP segue cobrindo apenas as fontes
  (`.conf` e `.md`). Versionar a saída não altera âncora nenhuma — conferido com `--check`.
- O `pre-commit` deixa de barrar essas saídas (a regra que recusava arquivos gerados ganhou
  a exceção do pacote de ciclo). O `out/` da apresentação, os `.pptx` e os PNGs de slide
  seguem barrados.
- O que se aceita em troca: cada regeneração de pacote entra no histórico, e o diff passa a
  mostrar HTML e PDF além das fontes. Foi o custo escolhido para ter deploy automático.
- O `tools/deploy-netlify.sh` (deploy por linha de comando) continua disponível, mas com o
  deploy pelo Git ele passa a ser opcional.

**Com o quê.**
`.gitignore`, `tools/hooks/pre-commit`, `README.md`, `README-ciclos.md`,
`tools/gerar-handoff.sh`, `professores/tiago/ciclos/ciclo-01-{duo,ritmos,debora}/`.

**Referências.**
`PROTOCOLO.md` P-04 (hash sobre fontes); `REGRAS.md` 17 (versionamento);
`README-ciclos.md` (formato de entrega).

**O que ainda não está feito.**
Configurar o *publish directory* de cada site no Netlify; primeiro deploy de cada escola;
licença do repositório.

## O que está pendente

POs de Ritmos e Débora; primeiro relatório pós-aula; Ciclo 02.

## 18/09/2026 — Estrutura por professor (P-13, P-14) e migração do material

Primeiro relatório pós-aula do Duo; POs de Ritmos e Débora; Ciclo 02; um segundo
professor (a estrutura está pronta, aguardando o primeiro).

## 18/09/2026 — Publicação do repositório no GitHub (decisão da pesquisadora)

Licença do repositório (a definir); o envio para o GitHub, que acontece fora do
repositório, na máquina da pesquisadora.

## 18/09/2026 — Pacotes de ciclo passam a ser versionados (deploy automático)

Configurar o *publish directory* de cada site no Netlify; primeiro deploy de cada escola;
licença do repositório.
- PO de **tiago · debora** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- PO de **tiago · ritmos** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **tiago · ciclo 01:** aulas escritas em detalhe: 1 de 12 (as demais entram depois da aula anterior).
- Material de campo de **tiago**: 1 evento(s) versionado(s) — sem respostas digitadas: 2026-10-03-ritmos.

## Documentos-chave (para leitura)

- `PROTOCOLO.md` — pétreas
- `REGRAS.md` — regras
- `REGISTRO.md` — marcos metodológicos
- `professores/<nome>/` — um professor por pasta (P-13): ciclos, cadernos, relatórios, campo
- `professores/<nome>/ciclos/ciclo-XX-<escola>-po.md` — POs por escola
- `professores/<nome>/ciclos/ciclo-XX-<escola>.fipp` — âncoras FIPP
- `departamentos/` — PO de departamento, quando a escola tiver metodologia comum (P-14)
- `biblioteca/guia-do-professor.md` — o guia de posição (departamento ou PO próprio)

## Como retomar

A próxima sessão deve ler, nesta ordem:
1. este arquivo;
2. `PROTOCOLO.md`;
3. `REGISTRO.md`;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.
