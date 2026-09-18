# Handoff — Projeto Ciclo

Gerado em: `2026-09-18T13:28:02-0300`
Commit atual: `c1c3f4b` — chore(tools): regera HANDOFF
Para: sessão nova (retomar o diálogo)

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **14 pétreas** em `PROTOCOLO.md`
- **Professores:** tiago (1)
- **Ciclos com manifesto:** 3 variante(s)
- **Saídas geradas:** fora do Git (reconstruíveis — P-04)

## Últimos commits

```
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
adf5f6e chore(tools): regera HANDOFF
4fbe29f docs(protocolo): governanca do caderno com referencia por apelido
d602e53 feat(ciclo-01): declara os apelidos no PO do Duo (Ceci, Ana, Mel, Sofi)
0868fbc feat(protocolo): acrescenta P-12 (apelidos estaveis dos sujeitos)
9dac53a chore(tools): regera HANDOFF
a5efb8b docs(biblioteca): documenta as duas listas de referencia (trabalho x publicada)
b7b2d9a fix(tools): hook valida o PO de cada variante, nao so o da ultima
dac289c chore(tools): regera o HANDOFF apos a gravacao na pagina publicada
10b9910 docs(ciclo-01): registra a gravacao de referencia do Peasant Pas de Deux
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

## 18/09/2026 — PO do Ciclo 01 — Duo validado

**O que aconteceu.**
O primeiro PO do projeto foi declarado e validado. Cobre o Ciclo 01 do Duo:
quatro alunas, 11 anos, 12 aulas de fundamentos, professor Tiago Menegaz.
Estado: `Input_PO_Validado`.

**O que foi decidido.**
- PO é por escola (não por ciclo-base). Ritmos e Débora terão POs próprios.
- Linha de base declarada como campo próprio (P-10).
- Condições de contorno da execução declaradas (P-11).
- Registro específico das alunas é opcional, não obrigatório.
- Aulas de outros professores do Duo entram no recorte (processo contínuo).

**Com o quê.**
`PROTOCOLO.md`, `ciclos/ciclo-01-duo-po.md`, `tools/hash-ciclo.sh`,
`tools/validar-po-ciclo.js`.

**Referências.**
Taylor (2003); Polanyi (1966); Clippinger (2024); RAD (2015); Wulff;
Mirzabekiantz (2000); Parker (1990); Homans (2010); Paper FIPP
(operacionalização dos protocolos).

**O que ainda não está feito.**
POs de Ritmos e Débora; primeiro relatório pós-aula; Ciclo 02.

## O que está pendente

Primeiro relatório pós-aula do Duo; POs de Ritmos e Débora; Ciclo 02; um segundo
professor (a estrutura está pronta, aguardando o primeiro).

## 18/09/2026 — PO do Ciclo 01 — Duo validado

POs de Ritmos e Débora; primeiro relatório pós-aula; Ciclo 02.
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
