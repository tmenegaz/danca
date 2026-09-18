# Handoff — Projeto Ciclo

Gerado em: `2026-09-18T00:20:39-0300`
Commit atual: `1ffc7b9` — docs(protocolo): documenta como o PO se materializa no ciclo
Para: sessão nova (retomar o diálogo)

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **11 pétreas** em `PROTOCOLO.md`
- **Ciclos com manifesto:** 3 variante(s)
- **Saídas geradas:** fora do Git (reconstruíveis — P-04)

## Últimos commits

```
1ffc7b9 docs(protocolo): documenta como o PO se materializa no ciclo
3b495b2 feat(tools): integra PO ao hash e ao pre-commit
1b306db feat(schema): cria schema e validador do PO
4605c2e feat(ciclo-01): declara o PO do Ciclo 01
c7268e7 chore(ciclo-01): regera as âncoras FIPP com o PO incluído
a29e22a docs(regras): referencia PROTOCOLO.md
fffcc6a fix(tools): hook valida hash do ciclo no pre-commit
83cd073 feat(tools): ancora ciclo 01 na cadeia FIPP (três variantes)
b79a8d3 feat(tools): cria hash-ciclo.sh com parentHash encadeado
8429df3 feat(schema): declara schema do ciclo 01 e validador
82f22c8 docs(caderno): cria governança e guia do caderno de ciclo
b0cbadb feat(protocolo): cria documento de regras pétreas
0f51702 docs(regras): alinha o documento a consolidacao (17 regras + 5 pre-requisitos)
4078496 fix(tools): hook valida cada ciclo uma vez, nao uma vez por documento
9d6e356 feat(ciclo-01): preenche as referencias e detalha a variante de 120 minutos
db957ee feat(ciclo-01): gera as tres variantes por escola (Duo, Ritmos e Movimento, Debora)
d11f981 fix(tools): valida o rodape do PDF em passada unica e explica a falha
00b43a8 fix(tools): hook pre-commit reconhece fonte compartilhada como nao-variante
12e5a54 feat(regras): incorpora o Pre-requisito 5 e o calendario real da Regra 10
2c7138e fix(tools): atualiza o caminho do deck na mensagem de erro do validador
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
| debora | ciclo-01-debora.fipp | `2cad96c58bd6` | (vazio) | Input_PO_Aguardando |
| duo | ciclo-01-duo.fipp | `1009222a6b2e` | (vazio) | Input_PO_Validado |
| ritmos | ciclo-01-ritmos.fipp | `6e4c9228f0f9` | (vazio) | Input_PO_Aguardando |

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

## Documentos-chave (para leitura)

- `PROTOCOLO.md` — pétreas
- `REGRAS.md` — regras
- `REGISTRO.md` — marcos metodológicos
- `ciclos/ciclo-01-<escola>-po.md` — POs por escola
- `ciclos/ciclo-01-<escola>.fipp` — âncoras FIPP

## Como retomar

A próxima sessão deve ler, nesta ordem:
1. este arquivo;
2. `PROTOCOLO.md`;
3. `REGISTRO.md`;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.
