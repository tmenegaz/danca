# Handoff — Projeto Ciclo

Gerado em: `2026-09-18T07:43:41-0300`
Commit atual: `1d0a9fd` — fix(tools): integra validador de glossario ao check-pacote e ao pre-commit
Para: sessão nova (retomar o diálogo)

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **11 pétreas** em `PROTOCOLO.md`
- **Ciclos com manifesto:** 3 variante(s)
- **Saídas geradas:** fora do Git (reconstruíveis — P-04)

## Últimos commits

```
1d0a9fd fix(tools): integra validador de glossario ao check-pacote e ao pre-commit
971eb65 feat(tools): cria validador de consistencia do glossario
1e18172 feat(ciclo-01): cria glossario Benesh exaustivo e corrige notacao
c507249 chore(tools): handoff passa a listar o material de campo
10480e0 chore(tools): aceita o escopo campo no commit-msg
b00d611 feat(campo): versiona o formulario de campo de 03/10 (Ritmos e Movimento)
085caba chore(tools): commit do HANDOFF.md gerado (snapshot do estado)
062dc20 chore(ciclo-01): remove o antigo ciclo-01-po.md (PO passou a ser por escola)
01a1fdc feat(ciclo-01): adiciona preview do relatorio pos-aula ao pacote
4f17264 feat(tools): cria gerar-handoff.sh para handoff entre sessoes
9f08ff4 fix(tools): parser do PO por subcampo, buffer do PDF e menu do pacote
e27924f fix(tools): hash por escola e pre-commit por variante
b29e8d0 feat(registro): cria REGISTRO.md com primeira entrada
1396a1a feat(protocolo): acrescenta P-10 (linha de base) e P-11 (condicoes de contorno)
68d7f91 feat(ciclo-01): declara o PO do Duo (validado) e POs placeholder
6779605 chore(ciclo-01): regera as ancoras FIPP com o PO do Duo incluido
1ffc7b9 docs(protocolo): documenta como o PO se materializa no ciclo
3b495b2 feat(tools): integra PO ao hash e ao pre-commit
1b306db feat(schema): cria schema e validador do PO
4605c2e feat(ciclo-01): declara o PO do Ciclo 01
```

## POs — estado atual

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Débora (Marau) | ciclo-01-debora-po.md | Input_PO_Aguardando | 21 |
| Duo | ciclo-01-duo-po.md | Input_PO_Validado | 0 |
| Ritmos e Movimento | ciclo-01-ritmos-po.md | Input_PO_Aguardando | 21 |

## Âncoras FIPP

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| debora | ciclo-01-debora.fipp | `1bd13d27cd1d` | (vazio) | Input_PO_Aguardando |
| duo | ciclo-01-duo.fipp | `ffc242ff3212` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `2bd33f8fcedb` | (vazio) | Input_PO_Aguardando |

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

POs de Ritmos e Débora; primeiro relatório pós-aula; Ciclo 02.
- PO de **debora** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- PO de **ritmos** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- Aulas escritas em detalhe: 1 de 12 (as demais entram depois da aula anterior).
- Material de campo: 1 evento(s) versionado(s) — sem respostas digitadas: 2026-10-03-ritmos.

## Documentos-chave (para leitura)

- `PROTOCOLO.md` — pétreas
- `REGRAS.md` — regras
- `REGISTRO.md` — marcos metodológicos
- `ciclos/ciclo-01-<escola>-po.md` — POs por escola
- `ciclos/ciclo-01-<escola>.fipp` — âncoras FIPP
- `campo/` — instrumentos e respostas de campo (por evento)

## Como retomar

A próxima sessão deve ler, nesta ordem:
1. este arquivo;
2. `PROTOCOLO.md`;
3. `REGISTRO.md`;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.
