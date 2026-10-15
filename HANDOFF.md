# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-10-15T08:08:06-0300`
Commit atual: `36a627d` — chore(entrega): o artefacto da injecção da navegação no pacote maria
Para: sessão nova (retomar o diálogo)

## O que é este projeto

**Nome comercial:** o produto é o **Sistema Lastro** — e este repositório é o **Projeto
Ciclo**, o protótipo a partir do qual ele se constrói. Os dois nomes convivem, e a
convivência é declarada (não é renomeação): **Lastro** é a marca curta; **Sistema Lastro**
é o sistema como um todo; **Plataforma Lastro** destaca a solução tecnológica; e
`Lastro — Sistema de Memória e Observabilidade Pedagógica em Dança` é a **proposta** de
denominação descritiva (proposta, não subtítulo confirmado). O conceito central não muda:
o Lastro **registra e organiza evidências para apoiar a reflexão pedagógica; não substitui
o professor nem toma decisões sobre o aluno.** O mapa de evolução do produto está em
`PLANEJAMENTO-LASTRO.md`.

**A memória da aula dada** — cada aula é **planejada** antes de ser dada: o plano
(`aula-NN.md`, fonte da âncora) fixa objetivo, marcos e volume, e é ele que dá a
**linha de base**. O que se registra é o processo de ensino-aprendizagem que de fato
se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda.

- **Planejar e registrar são coisas distintas — e as duas acontecem.** O plano é
  **intenção** (editável enquanto a aula está `planejada`); depois que a aula acontece,
  o registro passa a **fato** e só se acrescenta ajuste (`ARQUITETURA-AULA.md`). O
  estado é **derivado** do cronograma, do prazo e do registro — não existe campo
  "aula dada". O formulário de lançamento **consome o plano** como
  entrada: sem ele não há marco da aula nem "o que mudou em relação ao plano".

- **Não é o projeto de mestrado** (outro diretório, de onde vêm o PO e o FIPP).
- **Não implementa o FIPP**: o `.fipp` daqui é uma **âncora de proveniência
  encadeada** (`tools/hash-ciclo.sh`), aproximação do framework — não ele.
- **PROTÓTIPO, testado no universo da dança** — este projeto **não é agnóstico**; o
  projeto agnóstico será criado a partir dele. Nenhum ciclo é igual a outro, nenhuma
  aula é igual a outra — nem com o mesmo professor.
- **Não avalia** — registra o cotidiano do professor; a avaliação é fronteira de
  outro módulo, ainda não desenhado.
- **Proveniência acrescenta, não edita**: um ajuste é um elo novo, nunca sobrescrita.
- **A integração ainda não existe** — com o projeto das secretarias não foram
  desenhadas nem a fronteira de entrada nem a de saída.

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **22 pétreas** em `PROTOCOLO.md`
- **Professores:** leticia
tiago (2)
- **Ciclos com manifesto:** 2 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor, fechando na **conclusão** — o campo **«Resultado da avaliação»** (apta/não apta + nível, sem turma/horário/frequência) — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-GERAL.md`** — Arquitetura geral — por que sistema de arquivos, e não um backend com banco
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Bastidores é o ambiente da direção da escola: um grupo de menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência própria da escola. Não implementado.
- **`PLANEJAMENTO-LASTRO.md`** — o mapa de evolução do **Sistema Lastro** (o nome comercial do produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os relacionamentos, os índices, o versionamento e o comercial — e **dez frentes** com objetivo, lacunas, dependências, entregas, critérios verificáveis, riscos e prioridade. Nada foi implementado: este documento é o mapa, não a obra.

## Últimos commits

```
36a627d chore(entrega): o artefacto da injecção da navegação no pacote maria
5b407cd docs(registro): a grelha não chegava à porta — as duas listas brancas do caminho
7829b9c chore(entrega): absorver o volteio do gerador (cifra e instante), sem re-rodar o hook
19c9533 fix(campo): o `tabela` e o `derivado` chegam à porta — duas listas brancas engoliam-nos
e5e4723 docs(estrutura): FRENTES.md — a rubrica decidida e alinhada; HANDOFF em dia
41a5e54 docs(registro): a rubrica alinha-se à decisão — e os níveis errados vinham do experimento
ea561e2 chore(entrega): absorver o volteio do gerador (cifra e instante), sem re-rodar o hook
3012d0e fix(campo): a rubrica passa a declarar a lista decidida — satisfatório · razoável · em desenvolvimento · não se aplica
08f42a0 docs(registro): correção — nem todos os derivados se reescrevem, e o deploy é manual
388e73c chore(entrega): absorver o volteio do gerador (cifra e instante), sem re-rodar o hook
60662dd docs(estrutura): FRENTES.md — B7 fechado e B5 resolvido (o bloqueio era fantasma); HANDOFF em dia
f732000 docs(registro): a grelha das tabelas fecha o B7 e remede o B5 — o bloqueio era fantasma
ed21f97 chore(entrega): regenerar o pacote maria — o pre-commit rodou o gerador
b1076d5 feat(campo): a grelha das tabelas — a rubrica em clicável, turmas plural e checklist pré-preenchido (B7), e a derivação do volume (B5)
643edc4 docs(registro): a Produção quebrou pelo `env` fora de escopo — correção do Error 1101
1a2b9c7 fix(estrutura): a Produção não quebra mais — o slug do dono entra como parâmetro, não via env
b25fda9 docs(estrutura): FRENTES.md — B2 fechado (consumo da curadoria) e panorama das frentes em dia
2b29e9f docs(registro): o consumo da curadoria trava plano/PO e filtra as alunas (B2b)
4b01050 feat(estrutura): a tela consome a curadoria — plano/PO travam sem curadoria e a anamnese filtra as alunas
87308c8 docs(estrutura): FRENTES.md — L5 ligado (metodologia/notação → PO)
```

## Por professor

### leticia — 1 ciclo(s)

**Ciclo 01** — variante(s): barra

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| barra | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| barra | ciclo-01-barra.fipp | `70f3f0635164` | (vazio) | — |

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): maria

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| maria | ciclo-01-maria-po.md | Input_PO_Aguardando | 1 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| maria | ciclo-01-maria.fipp | `03fb63d2af3a` | (vazio) | Input_PO_Aguardando |

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
- **P-15 — A notação segue a metodologia declarada.
- **P-16 — Metodologia e notação são declaradas na Elicitação.
- **P-17 — Todo ciclo produz os mesmos tipos de artefato do ciclo piloto.
- **P-18 — A metodologia pode ser imposta pela escola.
- **P-19 — Os prompts do projeto vivem no repositório.
- **P-20 — Problemas semelhantes recebem soluções semelhantes.
- **P-21 — Documentos publicados usam linguagem harmonizada.
- **P-22 — As condições materiais de execução são declaradas, registradas e comunicadas.

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

## 15/10/2026 — O Sistema Lastro: o nome comercial, e o mapa de evolução do produto

**O que motivou.** Duas descrições de frente de produto foram entregues — a **integridade dos
dados, indexação semântica e proveniência documental** e as **consultas pedagógicas, cruzamento
de dados e organização comercial dos planos** — com o pedido explícito: **examinar** o repositório
e o comportamento atual, **não implementar**, e produzir um **mapa de frentes** com escopo e
critérios de conclusão verificáveis. E documentar o **nome comercial** do projeto no handoff.

**O que foi medido** (leitura do repositório e **do KV em produção**, este somente leitura;
**nenhum arquivo de produto foi alterado**):

- **111 nós respondíveis** nos três formulários — anamnese 53 (49 obrigatórios), plano **25** (14),
  PO **33** (19). 101 deles são campo de texto; o resto são tabela (2), matriz `porMarco` (2),
  medida (1), data (1), periodicidade (1), registro (1), escala (1) e lista (1).
- **As cinco famílias de chave do KV**, lidas: `envelope/<id>.json` (namespaçada pelo adaptador),
  `<escola>/<professor>/<ciclo>/anamnese/<carimbo>` (o cofre), `<escola>/<professor>/<ciclo>-<carimbo>/`
  (**o lançamento**), `bastidores/<escola>/*` (a Produção) e `ia-registro/registro.jsonl`.
- **O lançamento é gravado e não tem leitor.** `motor/nucleo/lancamento.js:81-95` grava em
  `<escola>/<professor>/<ciclo>-<carimbo>/`; não há **nenhuma** rota que o leia (a única família sem
  `listar`). E o texto do próprio projecto (`ARQUITETURA-GERAL.md` §7) diz que o KV é rascunho e que
  «assim que esses dados viram conteúdo de verdade, eles voltam a ser arquivo» — o que **não tem
  caminho** hoje. É o dado central do produto (a aula dada) fora do alcance da máquina.
- **Os identificadores, um por um.** Estáveis: escola, ciclo, turma (`bale-nivel-1`), termo
  (`plie`) e a relação turma↔termo (chaveada por id — o bom exemplo do repositório). **Instáveis**:
  a aluna é **o apelido e nada mais** (`alunas: ["Vavá"]`); o professor não tem slug persistido (o
  `slugificar(p.nome)` o deriva do nome de exibição na leitura, `bastidores.js:964-970`); a curadoria
  aponta a turma **pelo nome** (`turmas: ["Balé Nível 1"]`); e a aula liga-se ao marco do plano
  **pelo texto** (`ciclos.json → aulas[].marco`). Renomear quebra vínculo em silêncio.
- **O precedente que resolve metade do problema existe numa só camada.**
  `ciclo-XX-captura-schema.json` → `_declaracao.porVariante.<v>.blocos.<t>.colunas.<rótulo>`
  declara o par **rótulo ↔ chave ↔ tipo** de cada coluna da folha de lançamento, com a razão escrita
  («a folha é a fonte dos RÓTULOS; esta declaração é a autoridade sobre as CHAVES e os TIPOS»,
  chaves «curtas e estáveis»). Para os 111 nós dos formulários, a chave do documento derivado é
  **derivada do rótulo visível** (`chaveDaColuna`, `tools/lib-extracao-md.js`).
- **Proveniência com buraco declarado:** `ancora: null` em todos os envelopes lidos e em
  `ciclos.json → aulas[].ancora` (o campo existe e **não tem produtor** — o próprio `_nota` o diz);
  `conteudo.digest: null` (não se sabe contra que versão do conteúdo se respondeu). O que funciona:
  a âncora por ciclo **e por aula**, o **elo do ajuste** (`ajuste_de`/`ajustado_em`/`motivo`,
  `rotas.js:182-215`, com a recusa de apagar o vinculado), o envelope versionado (`1.2.0`) e a
  proveniência **por campo** (`{valor, origem, respondente, nota}`).
- **Duas políticas de escrita convivem:** `escrever-po.js` e `escrever-plano.js` **sobrescrevem**
  (com `sha`; o histórico fica no Git) e `escrever-ciclo.js` **nunca** sobrescreve.
- **Consultas: nada além de leitura de chave e listagem por prefixo**, com filtro em memória —
  `vinculos()`/`vinculosDePlano()` (`porta.js:371-414`) varrem **todos** os envelopes de PO *«não se
  grava nada»*. Não há cruzamento, filtro, agregação, busca textual nem exportação.
- **Comercial: não existe.** Nenhum plano, preço, assinatura, cobrança, cota ou limite por plano em
  `motor/`, `tools/`, `porta/`, `workers/`. A única pegada é `pagante: true` no andaime de expurgo
  (`raiz/escolas-habilitadas.json`, lido por `motor/servidor/raiz.js:73`). O medidor de uso
  (`ia-registro/registro.jsonl`) é **anexado e nunca lido**, com `tokens_in/out = 0` (stub).
- **Duas medições que contradizem documentos** (registadas, **não** decididas): o KV da Maria
  (`wrangler.maria.jsonc:32`) é um namespace **separado** do partilhado que o adaptador afirma
  (`motor/adaptadores/cloudflare.js:28-47`) e que o `criar-escola.sh:434-437` grava para toda escola
  nova — e nele os 3 envelopes de 12/10 estão **sem** o prefixo da escola; e `FRENTES.md:294`
  (frente B5) afirma que «a KV não tem um único envelope», quando há 3 na Maria e 1 anamnese no
  cofre.

**O que foi entregue.** `PLANEJAMENTO-LASTRO.md` — o mapa de evolução do produto: o nome comercial,
o inventário medido (§2), **nove contradições registadas para decisão** (C1–C9) e **nove frentes**
(L1 dicionário de campos · L2 identidade estável das entidades · L3 lançamento e envelope deixam de
ser rascunho · L4 mapa de relações e índice · L5 imutabilidade e versionamento do plano publicado ·
L6 catálogo de consultas determinísticas · L7 fronteira da IA e medição de uso · L8 composição
comercial e fonte única dos valores · L9 cotas, habilitação e limites por plano), cada uma com
objetivo, situação atual, lacunas, dependências, entregas, **critérios verificáveis**, riscos e
prioridade — mais a sequência sugerida (L1/L2 → L5 → L3 → L4 → L6 → L7 → L8 → L9) e as sete regras
de desenho que valem para todas (a IA **não** faz o que é determinístico — critério verificável, não
recomendação; a ausência de registro é uma **ausência**, nunca «não domina»; o produto não avalia).

**O nome comercial — e a decisão de como ele entra.** O produto é o **Sistema Lastro**; este
repositório é o **Projeto Ciclo**, o protótipo a partir do qual ele se constrói. Decisão da
pesquisadora (15/10/2026): **declarar ao lado** — não renomear. Os quatro níveis ficam escritos
(**Lastro** · **Sistema Lastro** · **Plataforma Lastro** · `Lastro — Sistema de Memória e
Observabilidade Pedagógica em Dança`, este último **proposta** de denominação descritiva, **não**
subtítulo confirmado), com o conceito central preservado: o Lastro registra e organiza evidências
para apoiar a reflexão pedagógica; **não substitui o professor nem toma decisões sobre o aluno**.

**Motivo declarado — o congelado.** `tools/` é congelado (`CONGELAMENTO.md`) e **um** arquivo muda:
`tools/gerar-handoff.sh`, em duas coisas — (a) a emissão do nome comercial no topo de
`## O que é este projeto` (e no título), porque o `HANDOFF.md` é o **primeiro** artefato que uma
sessão nova lê, e o nome do produto não podia continuar ausente dele; (b) a lista dos documentos de
intenção passa a incluir o padrão `PLANEJAMENTO-*.md`, para o mapa de evolução aparecer na seção
«Ideias documentadas» como os `IDEIA-*`/`ARQUITETURA-*` aparecem — uma linha de `ls`, sem lógica
nova. O que **não muda**: a fórmula de hash e a cobertura da âncora, o conteúdo dos documentos
listados, as pétreas, as regras e os validadores. **Nada a reancorar**: `hash-ciclo.sh --check`
fica íntegro nas duas escolas (leticia `70f3f06…`, tiago `03fb63d…`) — nenhuma fonte de ciclo foi
tocada, e este trabalho **não alterou uma linha de código de produto**.

**Um falso positivo da varredura de deriva — corrigido no caminho.** A varredura do skill
(`varrer-deriva.sh`) acusava o documento novo **inteiro**, porque o padrão `agnóstic` casa
**dentro** de «Di**agnóstic**o» — e este documento, que é um diagnóstico, diz «Diagnóstico» a cada
parágrafo. Um aviso que soa em todo lugar é ruído, e ruído é o que faz a deriva de verdade passar
despercebida: as duas ocorrências passaram a `\bagnóstic|\bagnostico` (fronteira de palavra — o
`Di` deixa de casar). Verificado: o falso positivo sai (0 linhas do documento novo) e a varredura
**continua** encontrando todos os achados legítimos (`METODO.md:5`, `ARQUITETURA-GERAL.md:8`,
`ARQUITETURA-PE.md:106`…, cada um com a sua ressalva de escopo).

**Com o quê.** `PLANEJAMENTO-LASTRO.md` (novo) · `tools/gerar-handoff.sh` (congelado: motivo
declarado) · `HANDOFF.md` (regenerado) · `AGENTS.md`, `README.md` e `FRENTES.md` (livres) ·
`.github/skills/identidade-do-projeto/references/bloco-identidade.md` (a camada do produto, com a
nota de que «Lastro» **não** é deriva — a deriva seria tratar o protótipo como produto acabado ou
trocar os nomes como se houvesse renomeação) · `.github/skills/identidade-do-projeto/references/
pontos-de-entrada.md` (o documento novo entra na lista, com a sua nota de escopo) ·
`.github/skills/identidade-do-projeto/scripts/varrer-deriva.sh` (a fronteira de palavra).

**Referências.** `CONGELAMENTO.md` · `ARQUITETURA-GERAL.md` (§4 proveniência × estado, §7 a parte
honesta do runtime) · `ARQUITETURA-AULA.md` (o ciclo de vida e a âncora por aula) ·
`porta/envelope/elicitacao-schema.json` (o recipiente, `1.2.0`) · `po_ref/rastreabilidade.md`
(as regras R1–R10 e as interfaces de consulta de proveniência — **do FIPP, que não é implementado
aqui**) · `tools/lib-fontes.sh` → `fontes_do_ciclo` (o que a âncora cobre) · a listagem e a leitura
do KV em produção (namespaces `2ee331c7…` e `f1d475e1…`).

**Revisão do mesmo dia (15/10/2026, segundo elo) — contra os textos autoritativos.** Os dois
textos chegaram como **arquivo** e foram conferidos: **byte a byte idênticos** (MD5 igual) ao
conteúdo que já servira de base. Aí cada requisito foi **reconferido um a um** contra o mapa — e a
conferência encontrou **quatro lacunas**, todas fechadas:

1. **§2.10 — as quatro categorias.** Os **dois** textos exigem, no seu último parágrafo, «separar
   claramente o que já existe, o que existe parcialmente, o que não existe e o que ainda precisa
   de ser decidido» (texto 1 §9) e «o que depende de decisão comercial ou arquitetural» (texto 2
   §10). O mapa tinha as lacunas **por frente** e não tinha a classificação do estado **numa
   leitura só**. Entrou a tabela com as quatro categorias.
2. **§2.11 — as seis operações do «Gerar PO».** O texto 1 §2 pede literalmente que se identifique
   «quais operações já acontecem, quais são executadas parcialmente e quais ainda não existem», e
   enumera seis. Entrou a tabela: **duas acontecem por inteiro** (publicação do PO; derivação dos
   documentos), **uma por regeneração** (menus), **duas parcialmente** (folha de lançamento;
   vínculos — e só dois elos) e **uma não existe** (estruturas de consulta). E a leitura honesta:
   o «Gerar PO» produz **documento**, não **relação** — a relação continua a ser recalculada por
   varredura a cada leitura (`porta.js:371-414`).
3. **§7 — as oito perguntas do catálogo, uma a uma.** O texto 2 §4 pede que se verifique «se os
   dados necessários estão efectivamente disponíveis» e o §10 pede o «mapa das perguntas que já
   podem ser respondidas». Entrou o quadro: **nenhuma** das oito é respondível hoje; **três** são
   de **[CRUZAMENTO]** (T01, T03, P01 — viáveis depois de L2+L3+L4); **quatro** exigem
   **[VOCABULÁRIO]** (T02, T04, T05, P02); **uma** (P03) exige além disso **dados curriculares que
   não existem** (os objetivos do próximo nível e a versão da referência).
4. **§8 — a matriz de cobertura**, requisito por requisito dos dois textos, com o lugar onde cada
   um é respondido; e a lista declarada do que **ainda não tem resposta** (4 itens).

**E o achado que a conferência produziu — C10, com a frente L10.** Quatro conceitos com que o
texto 2 **formula** as perguntas não existem no modelo de dados: medido nos três conteúdos,
`componente` = **0**, `combina` = **0**, `interven` = **0**, `resposta observada` = **0**
ocorrências; e `modalidade` aparece **duas vezes em prosa** («tempo de exposição à modalidade»)
e **nunca como campo** — a modalidade vive hoje só na **curadoria** do KV. O mais próximo que
existe é `itens-por-dimensao` (PO) para «componente» e `aula-1-sequencia`/`estrutura-de-cada-aula`
(plano) para a ideia de sequência — **mas o «contexto» (isolado × combinação) não é modelado como
relação**, é prosa dentro de um item. A consequência é de **escopo**: quatro das oito perguntas
não são «implementar um filtro», pedem **vocabulário novo no domínio** — e decidir esse vocabulário
é decisão de **conteúdo (P-16)**, não de infraestrutura. **Não foi decidido** se ele se acrescenta
antes ou depois do catálogo; foi registado (**C10**) e proposto como frente **L10** (P1, antes de
L6). Entrou também o **quadro-resumo das dez frentes** (prioridade × destranca × depende de) e a
trilha curta: L1+L2 → L3 → L4 → **T01 ou P01**, as duas únicas perguntas viáveis sem decisão de
conteúdo.

**O que ainda não está feito.** (a) **Nenhuma das dez frentes foi iniciada** — por pedido: este
elo é diagnóstico e plano. (b) As dez contradições (C1–C10) **esperam decisão** — em especial C3
(o Git basta como versão de domínio?), que é a que decide o tamanho de L5, e C1 (o lançamento vira
fonte versionada ou passa a ser lido do KV?), que decide L3 inteira. (c) Os **valores comerciais**
do §9 continuam **apenas no texto** que originou o mapa — não foram copiados para o repositório,
porque não há onde pô-los sem a frente L8. (d) O subtítulo descritivo segue como **proposta**.
(e) `FRENTES.md` **não** foi corrigido nas duas medições que envelheceram (as contagens de nós do
laudo L4 — 26/35 contra 25/33 medidos — e a frase de B5 sobre os envelopes): ficam registadas no
mapa e nesta entrada, para o próximo elo decidir se a correção datada vale.

**Terceiro elo (mesmo dia) — a decisão C3 e o que ela destranca.** Veio a decisão que faltava, pelas
palavras do dono do produto: «**o PO/plano publicado passa a ter versão explícita que o lançamento
referencia**». Ela **fecha a alínea (b) do elo anterior** no que toca a C3 — as outras nove
contradições continuam a esperar — e resolve-a pelo lado que **aumenta** o escopo, não pelo que o
diminui: o **Git não basta** como versão de domínio, e a versão passa a ser **artefacto do
sistema**, endereçável por quem lê o dado, e não um detalhe de quem versiona o repositório.

**O que se mediu antes de escrever, e como.** As três medidas que delimitam a implementação foram
feitas em **cópia de bancada** (`/tmp`, `tar` sem `node_modules`/`.git`/`.wrangler`), **descartada
no fim**; o repositório **não** foi tocado — a única operação sobre o ciclo real foi `--check`, que
é leitura. Resultado:

1. **A deteção já existe; falta a preservação.** Editar o `ciclo-01-maria-po.md` na bancada muda o
   `hash_conteudo` (`c1448825342a…` → `4f5d04223be8…`) e o `tools/hash-ciclo.sh … --check` **acusa**
   — «os fontes do ciclo mudaram desde a última ancoragem». Mas o `.fipp` é **reescrito no lugar**:
   reancorar troca `hash_conteudo` e `ancorado_em` e **não deixa rasto do valor anterior**, e o
   `.fipp` não tem **nenhum** campo de versão ou elo (`parentHash` encadeia **o ciclo anterior** na
   mesma variante — `hash-ciclo.sh:195-210` —, não o estado anterior do mesmo documento). O estado
   anterior do PO publicado existe, hoje, **só no histórico do Git**. Conclusão: a mudança não é
   silenciosa para o **repositório**; é silenciosa para o **produto**.
2. **O padrão da casa para introduzir uma versão já existe — só não foi aplicado ao plano.**
   `VERSAO_DO_ENVELOPE = '1.2.0'` (`motor/nucleo/elicitar.js:86`), com o motivo da subida escrito
   (1.1.0 → 1.2.0, pelo elo do ajuste). O que o envelope versiona é o **formato do envelope**, não
   o **plano de que ele fala**.
3. **O lançamento já é imutável e já tem identidade própria.** `lancamento.js:88-92` grava
   **verbatim** e **recusa** carimbo já existente — o carimbo (`2026-10-05T1453`) **é** um id
   imutável de lançamento. O que falta nele não é imutabilidade: é **uma linha** — a referência à
   versão do plano observado.

Dois achados de desenho que a medição acrescentou: o **único** elo do plano que existe
(`plano-aula-NN.json` → `plano-aula-NN-anterior.json`, `gerar-ciclo.sh:254-257`, com o `cp` **antes**
do `mv`) está num artefacto **derivado** e — diz a nota de correção de 28/09/2026 — **sem
consumidor**: a decisão **dá-lhe o consumidor que faltava**, mas no lugar certo (a **fonte** e o
**lançamento**), e não no derivado. E a cobertura da âncora é **lista declarada**, não curinga
(`DOCS` do `.conf` expandido por `docs_derivado` + um **único** `ARQUIVO_PO`): uma versão guardada em
**arquivo separado** não entra na âncora sozinha, o que pesa na escolha de S1.

**O que ficou registado em aberto — as quatro sub-decisões de desenho (S1–S4).** A decisão diz que
**há** versão e que o lançamento **a referencia**; não diz **como**. Em vez de escolher em silêncio,
o mapa registou-as: **S1** onde mora o ordinal (front-matter do `.md` — entra no `hash_conteudo` e
fica **inforjável**; arquivo por versão — esbarra na cobertura declarada; campo do `.fipp` — fica
fora da fórmula, como `po_state`); **S2** onde mora o elo para a versão anterior (a disciplina do
`cp`, um campo do `.fipp`, ou o commit do Git — e, nesse caso, qual fica declarado); **S3** a
granularidade (a versão do plano **do ciclo**, a do **plano da aula**, ou ambas — o PO/plano é por
ciclo, o lançamento é por aula); **S4** a **retroatividade** — os PO/plano **já publicados** (Maria)
não têm versão, e declará-los v1 é uma **decisão**, não uma inferência.

**O que mudou no mapa.** §2.7 ganhou o medido (a âncora deteta sem preservar; o elo derivado e sem
consumidor; o lançamento já imutável; a cobertura declarada). §2.10 tirou C3 da coluna «precisa de
decisão». §3 manteve o parágrafo original de C3 **intacto** — a proveniência acrescenta, não edita —
e recebeu o elo datado com a decisão, os três factos e S1–S4. §4 reescreveu **L5**, que deixa de ser
«imutabilidade e versionamento» em espera e passa a **«versão explícita do plano publicado, que o
lançamento referencia»**, com entregas e critérios verificáveis próprios (a versão anterior
**recuperável sem `git`**; subir a versão **não** reescreve lançamento já gravado). §5 passou a
camada 1 a «a versão e a ponte», com a ordem L5 → L3 justificada. §8 e §9 acompanharam. E a
referência solta a «C3» que havia em L1 (que ali significava **versão da definição do campo**, coisa
**distinta**) foi desfeita para a lacuna (4) da própria frente, que é o que ela realmente era.

**Motivo declarado.** **Nenhum** arquivo congelado foi tocado neste elo: o mapa nasceu nesta sessão
(`PLANEJAMENTO-LASTRO.md`, livre), e `REGISTRO.md`, `FRENTES.md` e o `HANDOFF.md` (regenerado pelo
gerador) são livres ou gerados. Não há, por isso, motivo declarado a registar — e **nada** foi
implementado em código de produto: a decisão ficou **decidida, medida e desenhada**, não executada.

**Quarto elo (mesmo dia) — o desenho da versão: S1–S4 propostas e aprovadas.** A decisão do elo
anterior dizia **o quê** («versão explícita que o lançamento referencia»); faltava **como**. O que se
segue foi **medido, proposto e aprovado** — e **nada** foi implementado.

**O que a medição mostrou, e que mudou o tom da proposta: o encaixe já existe, falta ligá-lo.**

1. **As fontes publicadas já têm frente YAML.** `ciclo-01-maria-po.md` e `-plano.md` começam por
   `--- projeto: … frente: … ---`. Uma chave `versao: N` não é mecanismo novo — é uma chave nova
   numa estrutura viva.
2. **O leitor dessa frente existe e está em uso.** `lerYamlCabecalho`
   (`tools/lib-extracao-md.js:56`) é chamado pelos **quatro** validadores (plano, PO, aula,
   captura) — não é código morto.
3. **O `plano-NN.json` que o formulário lê é a saída `--json` desse mesmo validador**
   (`tools/gerar-ciclo.sh:215-216` → `validar-plano-ciclo.js --json`, que chama `lerYamlCabecalho`
   na linha 149). O artefacto do formulário passa **exatamente** pelo código que já lê a frente:
   expor a versão ali é **uma linha**, não encanamento novo.
4. **O formulário de lançamento já busca `po-XX.json` e `plano-XX.json`** no pacote, por convenção
   de nome (`tools/templates/lancamento.html:283-300`) — logo o lançamento **pode declarar a versão
   que observou** sem rota nova.
5. **Os derivados já emitem frente** (`motor/nucleo/derivar-plano-ciclo.js:524`: `frente`, `ciclo`,
   `escola`, `professor`, `title`): uma frente que nomeia versão segue a convenção da casa.

**A proposta (escrita em §L5 do mapa), e o que a sustenta.** **S1** — o ordinal mora na **frente
YAML** da fonte: a frente inteira é hasheada (o `hash_conteudo` é calculado sobre o **arquivo**,
`hash-ciclo.sh:191-193`), logo a versão fica **dentro da âncora e inforjável** — mudar o conteúdo
sem subir a versão **também** muda o hash, e a edição não declarada fica **detetável**. **S2** — o
elo é o **par no `.fipp`** (`versao_anterior` + `hash_conteudo_anterior`, com a disciplina do `cp`
**antes** do `mv` de `gerar-ciclo.sh:254`) **mais o lançamento como testemunho** de domínio: dá o
**consumidor que `plano-aula-NN-anterior` nunca teve**, e a passagem de v1 para v2 fica
testemunhada pelo **dado** — «o ajuste não se declara, ele se vê» (P-03/P-04). **S3** — a referência
é às **fontes**, por documento (**PO** e **plano** separados, porque mudam independentemente), e o
derivado **não** ganha ordinal próprio: seria uma **segunda autoridade** para o mesmo facto.
**S4** — **não retroagir**: ausência de `versao` significa «legado», declarado; o **escritor**
carimba ao salvar, porque é ele — o caminho que **sobrescreve** — que sabe que está a produzir
versão nova. E a regra que decorre de S1–S2: **a versão sobe quando o conteúdo muda** (igual →
mesma versão, sem elo), e a distinção «correção antes de publicar» × «mudança depois de observado»
**resolve-se pelo lançamento**, não pelo versionamento.

**Dois caminhos rejeitados, com medida.** Versão em **arquivo separado** (`po-v2.md`): a cobertura
da âncora é **lista declarada** com um **único** `ARQUIVO_PO` (`lib-fontes.sh` → `fontes_do_ciclo`,
com `DOCS` expandido por `docs_derivado`), logo o irmão **não** seria testemunhado; e apontar
`ARQUIVO_PO` para o novo tornaria a versão **antiga permanentemente não verificável** — o
`hash_conteudo` dela nunca mais poderia ser recalculado, que é o **oposto** do objetivo. E o ordinal
no `.fipp` como **autoridade**: o `.fipp` é **regenerado** e os seus campos ficam **fora** da
fórmula (por desenho, `hash-ciclo.sh:32-34`) — aceito apenas como **espelho**, para quem lê a cadeia
à mão.

**A aprovação, e o que ela NÃO fechou.** O dono do produto aprovou **S1–S4 como propostos** — a
aprovação é do **desenho**, não da implementação. Três questões **de produto** ficaram fora do
escopo da proposta e continuam abertas, agora com nome: **S5** o **formato** do ordinal (número
sequencial × data + sequência); **S6** **quando** reancorar (na hora da subida × no fecho do ciclo);
**S7** **como** o formulário mostra a versão ao professor — e **se** mostra. Nenhuma das três
bloqueia o começo da implementação, mas as três mudam o que se escreve, e por isso **não** foram
decididas por omissão.

**O que mudou no mapa.** §3 C3 mantém o enunciado de S1–S4 como **elo** (é o que se perguntou) com a
nota de que foram propostas e aprovadas no mesmo dia; §L5 ganhou a **proposta** (agora marcada como
tal) e o **fecho aprovado** — a proposta **não** foi reescrita. §2.10, §4, §5 e §8 acompanharam
C3 → **C3 + S1–S4**, deixando em aberto apenas **S5–S7**.

**Motivo declarado.** **Nenhum** arquivo congelado foi tocado neste elo. Os arquivos alterados são o
mapa (`PLANEJAMENTO-LASTRO.md`, nascido nesta sessão), o `REGISTRO.md`, o `FRENTES.md` e o
`HANDOFF.md` (regenerado pelo gerador) — livres ou gerados. E **nenhuma linha de código de produto
foi escrita** em nenhum dos quatro elos de hoje: a versão está **decidida, medida, proposta e
aprovada** — não executada.

**Quinto elo (mesmo dia) — as três questões de produto: S5–S7 decididas, o desenho de L5 fechado.**
A aprovação do elo anterior fechou o **desenho técnico** (S1–S4) e deixou de fora, declaradamente,
**três questões de produto**. Foram decididas em seguida — e com isto **o desenho de L5 está
completo**: a decisão (C3), o desenho (S1–S4) e as três de produto (S5–S7). **Nada foi
implementado.**

**S5 — número sequencial inteiro** (`versao: 2`). O argumento não é gosto: é a **regra 6** do §6 do
mapa — *determinismo: rodar duas vezes produz o mesmo arquivo*. Uma **data** dentro da versão faz o
artefacto **depender do relógio** e deixar de ser reconstruível. E o «quando» **já existe em três
lugares**: o `ancorado_em` do `.fipp`, o **carimbo** do lançamento (`lancamento.js`) e o Git — pôr a
data na versão **duplicaria** o que já existe, e informação duplicada diverge. A função da versão é
**ordenar e endereçar**, não datar. Nota técnica registada: o leitor da frente devolve **strings**
(`tools/lib-extracao-md.js:67`), logo o número precisa de coerção — o formato data precisaria de um
parser.

**S6 — reancorar na hora**, a cada publicação. **A medida sustenta a decisão:** qualquer edição numa
fonte coberta **já** faz o `hash-ciclo.sh --check` falhar hoje (provado na bancada, elo anterior).
Adiar a reancoragem para o fecho do ciclo **institucionalizaria um estado que a ferramenta reporta
como erro** — a janela de divergência passaria a ser o normal, e o `--check` deixaria de servir como
cadeia de custódia. E a versão e o `hash_conteudo` têm de **andar juntos**, senão podem
contradizer-se; o elo de **S2** só é inequívoco **no instante em que a versão sobe**. Custo da
decisão: **nenhum** — a exigência já existe hoje.

**S7 — mostrar discreto e somente-leitura.** O argumento é de produto, e é o mais importante dos
três: **o professor não pode escolher a versão**. A referência é **observada e registada**, não
**selecionada** — se fosse selecionável, a **evidência seria falsificável**, e o produto perderia
exactamente o que esta decisão veio proteger. Em troca, ele **deve** ver contra que versão lançou: é
isso que faz uma alteração posterior **não parecer** que observou o que não estava previsto. O
**alerta** (a versão mudou desde o último lançamento) fica para quando **L3** der leitor ao
lançamento — sem leitor, não há com o que comparar.

**O que mudou no mapa.** §L5 recebeu o **fecho datado** de S5–S7 (o enunciado das três perguntas fica
**intacto** — é o que se perguntou). §2.10, §4, §5, §8 e §9 acompanharam: as três saíram de «precisa
de decisão» e o desenho de L5 passou a **completo**. A frente **L5 fica pronta a implementar** — o
que falta é a **obra**, não a decisão.

**Motivo declarado.** **Nenhum** arquivo congelado foi tocado neste elo. Alterados: o mapa
(`PLANEJAMENTO-LASTRO.md`, nascido nesta sessão), o `REGISTRO.md`, o `FRENTES.md` e o `HANDOFF.md`
(regenerado pelo gerador). E, como nos quatro elos anteriores, **nenhuma linha de código de produto
foi escrita**.

## O que está pendente

## 13/10/2026 — A grelha não chegava à porta: duas listas brancas engoliam o `tabela` (correcção)

Este elo precisa de **novo deploy** para chegar à produção — o
bundle do Worker e o `env.ASSETS` são fotografados no deploy. Não há teste que cubra o caminho
conteúdo → `descritores()` → `mapa()` → tela: o campo faltoso só se vê abrindo a página. Fica como
suspeita declarada para a próxima vez que um campo do conteúdo «não fizer nada».

---

## 14/10/2026 — A régua da turma mede o critério no LANÇAMENTO (frente B9)

(a) A folha de captura ainda traz os seus **critérios fixos** (13 de
técnica e 5 de musicalidade, na Maria) — o critério **por aula**, derivado dos marcos e da sequência
do plano, é o passo seguinte, e é ele que fecha o «o critério de cada aula se declara no lançamento»;
(b) o **marco** chega ao lançamento só como leitura (o nome do marco da aula), e a sequência, os
blocos e o parâmetro de medição do plano ainda **não descem** para a folha; (c) existe **folha por
aula só na Aula 01** (`captura-aula-01.json`): da Aula 02 em diante o formulário usa a folha do
ciclo; (d) na **Barra** o pacote não tem lançamento (`DOCS=""`), então a régua produzida pela
Produção não tem, hoje, onde aparecer — o ciclo da Maria (simulado) é o que exercita o caminho;
(e) a régua da Maria vem da **fonte escrita à mão** (`ciclo-01-maria-plano.md`), e não do envelope:
o caminho envelope → fonte (a derivação) está provado em teste, mas não há ciclo real que o tenha
percorrido ponta a ponta com a régua.

---

## 14/10/2026 — O PO completo chega inteiro aos derivados (frente B10)

(a) As chaves novas só aparecem num PO **gerado de novo**: as
fontes já escritas (`ciclo-01-maria-po.md`) não as têm, e não há envelope no repositório para as
re-derivar — o caminho fica provado em teste, não em dado real. (b) `norma` continua saindo como
lacuna declarada mesmo com a metodologia preenchida: é a decisão de 25/09/2026 (a norma que o
cabeçalho pede é a METODOLOGIA, um conceito distinto do padrão de referência) — revisitável, mas
não se muda sem a pesquisadora. (c) `projeto: 'Formação em Balé Clássico'` está escrito à mão em

## 14/10/2026 — O plano completo chega inteiro aos derivados (frente B11)

(a) Como em B10, as chaves novas só aparecem num plano **gerado de
novo**: as fontes já escritas à mão (`ciclo-01-maria-plano.md`) não têm as seções `## Músicas e
vídeos` e `## Repertório`, e a ficha delas continua com as lacunas que o AUTOR escreveu — o
`contexto` agora carrega os valores reais, e é a vista que os lê; re-derivar do envelope não é
possível porque não há envelope no repositório. (b) A tabela do volume das fontes antigas tem
linhas de UMA célula (`| **15% no solo** |`), com proporção e justificativa vazias: a chave chega,
o valor não existe no documento — não se inventa. (c) No PO, `contexto-outro` e `campo-outro` continuam sem chave
própria: eles viajam dentro das linhas compostas do campo empírico e do contexto, como o próprio
conteúdo do PO declara — não é perda, é a forma declarada. (d) `projeto: 'Formação em Balé
Clássico'` segue escrito à mão e lido por ninguém — a frente B10 o declarou com a contagem de oito
derivadores; medida agora, são **onze** sítios em `motor/` e `tools/`. Fica declarado, não
alterado: mudá-lo mexeria em todas as fontes.

## 15/10/2026 — O Sistema Lastro: o nome comercial, e o mapa de evolução do produto

(a) **Nenhuma das dez frentes foi iniciada** — por pedido: este
elo é diagnóstico e plano. (b) As dez contradições (C1–C10) **esperam decisão** — em especial C3
(o Git basta como versão de domínio?), que é a que decide o tamanho de L5, e C1 (o lançamento vira
fonte versionada ou passa a ser lido do KV?), que decide L3 inteira. (c) Os **valores comerciais**
do §9 continuam **apenas no texto** que originou o mapa — não foram copiados para o repositório,
porque não há onde pô-los sem a frente L8. (d) O subtítulo descritivo segue como **proposta**.
(e) `FRENTES.md` **não** foi corrigido nas duas medições que envelheceram (as contagens de nós do
laudo L4 — 26/35 contra 25/33 medidos — e a frase de B5 sobre os envelopes): ficam registadas no
mapa e nesta entrada, para o próximo elo decidir se a correção datada vale.

## Pendências anteriores (índice)

- **18/09/2026** — PO do Ciclo 01 — Duo validado → `REGISTRO.md` L9
- **18/09/2026** — Estrutura por professor (P-13, P-14) e migração do… → `REGISTRO.md` L35
- **18/09/2026** — Publicação do repositório no GitHub (decisão da… → `REGISTRO.md` L72
- **18/09/2026** — Pacotes de ciclo passam a ser versionados (deploy… → `REGISTRO.md` L101
- **18/09/2026** — Ciclo próprio por escola: a Ritmos deixa de ser cópia da… → `REGISTRO.md` L134
- **18/09/2026** — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19 → `REGISTRO.md` L190
- **18/09/2026** — PO do Ritmos validado + P-22 → `REGISTRO.md` L253
- **18/09/2026** — Publicação, primeira reancoragem da Duo e o caderno da… → `REGISTRO.md` L302
- **19/09/2026** — Congelamento da infraestrutura → `REGISTRO.md` L347
- **19/09/2026** — Criptografia dos acompanhamentos (exceção… → `REGISTRO.md` L396
- **19/09/2026** — Política de segurança dos dados sensíveis → `REGISTRO.md` L470
- **19/09/2026** — Caderno publicado e incluído no hash → `REGISTRO.md` L504
- **19/09/2026** — Método, README-ciclos e campos de duração → `REGISTRO.md` L541
- **19/09/2026** — README-ciclos: escopos e criação de ciclo → `REGISTRO.md` L583
- **19/09/2026** — Correções cosméticas → `REGISTRO.md` L604
- **19/09/2026** — Varredura de marcas de indecisão → `REGISTRO.md` L636
- **19/09/2026** — METODO no pacote e reorganização do menu → `REGISTRO.md` L680
- **20/09/2026** — O guia de observação passa a se chamar o que ele é → `REGISTRO.md` L737
- **20/09/2026** — O contrato de extração passa a ler tabela → `REGISTRO.md` L779
- **20/09/2026** — O índice da página sai do topo e vai para a direita, preso → `REGISTRO.md` L836
- **20/09/2026** — O contrato de extração vira lib (definição única) → `REGISTRO.md` L879
- **20/09/2026** — O contrato ganha as duas declarações (mapa de colunas e… → `REGISTRO.md` L921
- **20/09/2026** — O extrator do plano (o irmão), e o diff classificado → `REGISTRO.md` L965
- **20/09/2026** — O laço de validação vira lib (a segunda definição… → `REGISTRO.md` L1028
- **20/09/2026** — O pre-commit passa a validar o PLANO (schema + tipos) → `REGISTRO.md` L1070
- **20/09/2026** — O experimento passa a consumir o extrator (o ciclo fecha) → `REGISTRO.md` L1116
- **20/09/2026** — O fenômeno do PO é uma LISTA (o schema declarava string) → `REGISTRO.md` L1156
- **20/09/2026** — O escopo `experimentos` entra na lista do commit-msg → `REGISTRO.md` L1197
- **20/09/2026** — A tabela de escopos do REGRAS.md passa a listar os 27 do… → `REGISTRO.md` L1233
- **20/09/2026** — Peça 1: o JSON de dados do Duo entra como fonte → `REGISTRO.md` L1264
- **20/09/2026** — Peça 2: os builders das vistas saem para uma lib → `REGISTRO.md` L1309
- **20/09/2026** — O gerador passa a GERAR a vista (peça 3 da migração) → `REGISTRO.md` L1359
- **20/09/2026** — O guia gerado passa a emitir a data da aula → `REGISTRO.md` L1413
- **20/09/2026** — A linha de base renderiza o texto como veio (nada de… → `REGISTRO.md` L1460
- **20/09/2026** — O guia do Ritmos passa a ser gerado (peça 5) — e o… → `REGISTRO.md` L1503
- **20/09/2026** — O `pre-push` passa a existir — e a conferência do… → `REGISTRO.md` L1564
- **20/09/2026** — O gerador grava os JSONs do formulário no pacote (Fase 2.1) → `REGISTRO.md` L1605
- **20/09/2026** — O JSON de dados vai para o pacote cifrado (Fase 2.2) → `REGISTRO.md` L1686
- **20/09/2026** — O formulário de lançamento vai para produção (Área do… → `REGISTRO.md` L1743
- **20/09/2026** — A folha de captura vira config legível por máquina… → `REGISTRO.md` L1979
- **22/09/2026** — Agentes de workspace: geração, auditoria e apresentação → `REGISTRO.md` L2292
- **23/09/2026** — A identidade do projeto entra na documentação (e a… → `REGISTRO.md` L2344
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO.md` L2425
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO.md` L2506
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO.md` L2597
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO.md` L2665
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o… → `REGISTRO.md` L2740
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que… → `REGISTRO.md` L2851
- **25/09/2026** — A identidade visual passa a existir como contrato, e a… → `REGISTRO.md` L3051
- **25/09/2026** — A hora da aula entra no `DIAS`, e o calendário passa a ter… → `REGISTRO.md` L3182
- **26/09/2026** — O `DOCS` deixa de ser lista à mão: as famílias por aula… → `REGISTRO.md` L3356
- **26/09/2026** — A P-13 deixa de sugerir que o dado é privado do professor:… → `REGISTRO.md` L3477
- **26/09/2026** — O prazo do §3 dizia "menor entre" — e dois números do… → `REGISTRO.md` L3630
- **26/09/2026** — O config da captura deixa de ser um por ciclo: um… → `REGISTRO.md` L3779
- **26/09/2026** — O `check-identidade.js` entra no `pre-commit`: a identidade… → `REGISTRO.md` L3979
- **26/09/2026** — O campo ganha a forma canônica da linha de base, a… → `REGISTRO.md` L4213
- **26/09/2026** — A data da aula deixa de ser adivinhada: o `ciclos.json`… → `REGISTRO.md` L4406
- **26/09/2026** — O JSON de dados ganha validador: o `-dados.json` deixa de… → `REGISTRO.md` L4673
- **26/09/2026** — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo`… → `REGISTRO.md` L4875
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por… → `REGISTRO.md` L5156
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO.md` L5316
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO.md` L5470
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas… → `REGISTRO.md` L5659
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única… → `REGISTRO.md` L5861
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO.md` L5974 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO.md` L6166
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO.md` L6324
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO.md` L6488
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação… → `REGISTRO.md` L6623
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO.md` L6743
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO.md` L6859
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO.md` L7197
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só… → `REGISTRO.md` L7298
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO.md` L7424 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO.md` L7545 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO.md` L7670 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO.md` L7818
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO.md` L7945
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO.md` L8015 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO.md` L8093
- **30/09/2026** — O segundo papel do agente: o servidor local **não… → `REGISTRO.md` L8182
- **01/10/2026** — A grafia de "Elicitação" se propaga, e a pendência do… → `REGISTRO.md` L8269
- **01/10/2026** — A view gerada e a regra de leitura cresciam com o arquivo:… → `REGISTRO.md` L8410
- **02/10/2026** — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev… → `REGISTRO.md` L8531
- **02/10/2026** — A escola passa a poder ser desabilitada, com motivo e data → `REGISTRO.md` L8645
- **07/10/2026** — O cofre dos lançamentos sai do Netlify e entra no… → `REGISTRO.md` L8762
- **07/10/2026** — O Netlify antigo é destruído, o mapa anda para o slide 83… → `REGISTRO.md` L8914
- **07/10/2026** — O prompt de elicitação herda oito decisões do… → `REGISTRO.md` L9042
- **09/10/2026** — A criação de escola vira um comando: o CLI de… → `REGISTRO.md` L9282
- **09/10/2026** — A porta passa a elicitar o PLANO, e o ciclo do zero passa a… → `REGISTRO.md` L9334
- **10/10/2026** — O menu separa a Anamnese do Plano de Observação, e a… → `REGISTRO.md` L9387
- **11/10/2026** — «Nós, Por Exemplo» vira a página de entrada; o… → `REGISTRO.md` L9440
- **11/10/2026** — Atalhos da porta na página de entrada e aprofundamento do… → `REGISTRO.md` L9509
- **11/10/2026** — URLs próprias para a Anamnese e o Plano de Observação → `REGISTRO.md` L9563
- **11/10/2026** — As sete mudanças de comportamento e a proveniência… → `REGISTRO.md` L9605
- **11/10/2026** — Ordem alfabética nos menus e rótulo da harmonização → `REGISTRO.md` L9681
- **12/10/2026** — O «Nós, Por Exemplo» passa a ter fonte única e a raiz… → `REGISTRO.md` L9730
- **12/10/2026** — O plano de ensino vira rota própria e o PO passa a puxar… → `REGISTRO.md` L9787
- **12/10/2026** — O plano de ensino ganha estante, edição em sítio e… → `REGISTRO.md` L9846
- **12/10/2026** — A arquitetura geral ganha documento próprio (arquivo, não… → `REGISTRO.md` L9889
- **12/10/2026** — O botão «Criar nova escola» alinha o menu da Área do… → `REGISTRO.md` L9923
- **12/10/2026** — O CLI «criar-escola» alinha o menu zero ao plano de ensino → `REGISTRO.md` L9955
- **12/10/2026** — A página de entrada ganha o «Plano de ensino» → `REGISTRO.md` L9993
- **12/10/2026** — A raiz nunca é desabilitada pelo freio de escola → `REGISTRO.md` L10047
- **12/10/2026** — O rodapé do ciclo zero lista os três itens da Área do… → `REGISTRO.md` L10085
- **12/10/2026** — A folha de captura ganha rótulo curto e transposição → `REGISTRO.md` L10122
- **12/10/2026** — A senha de criptografia da Maria nasce mockada e chega ao CI → `REGISTRO.md` L10168
- **12/10/2026** — O PO referencia o plano por id e para de duplicar o… → `REGISTRO.md` L10202
- **12/10/2026** — O Diaghilev sai por expurgo DIRETO, e a trava de identidade… → `REGISTRO.md` L10251
- **12/10/2026** — O hook de expurgo nasce e passa o teste no Diaghilev II → `REGISTRO.md` L10339
- **12/10/2026** — O criar-escola.sh passa a gerar o índice da escola (fecha… → `REGISTRO.md` L10404
- **12/10/2026** — O expurgo ganha a reconciliação worker×slug e o hook… → `REGISTRO.md` L10453
- **12/10/2026** — A senha de criptografia deixa de ser manual: nasce REAL no… → `REGISTRO.md` L10508
- **12/10/2026** — A senha de criptografia nasce no Cloudflare (caminho a): o… → `REGISTRO.md` L10561
- **12/10/2026** — A página «Criar nova escola» passa a subir o motor… → `REGISTRO.md` L10629
- **12/10/2026** — O formulário vira mínimo e o Bastidores vira grupo… → `REGISTRO.md` L10692
- **13/10/2026** — A contaminação entre escolas (o envelope sem escola) é… → `REGISTRO.md` L10756
- **13/10/2026** — O hook deixa o ciclo-zero (scaffold de escola) passar → `REGISTRO.md` L10839
- **13/10/2026** — A Produção exclui aluna e professor (o gabinete se… → `REGISTRO.md` L10870
- **13/10/2026** — O professor é o dono, a Produção pede senha e o… → `REGISTRO.md` L10894
- **13/10/2026** — Bloco 2: o nó 50 não semeia, e «não foi medido» entra… → `REGISTRO.md` L10934
- **13/10/2026** — «Não foi medido» chega aos basilares e às cinco… → `REGISTRO.md` L10964
- **13/10/2026** — A categoria etária é re-derivada da idade; a memória é… → `REGISTRO.md` L10999
- **13/10/2026** — A senha é por professor, e a categoria etária re-deriva… → `REGISTRO.md` L11027
- **13/10/2026** — Cadastro de turmas e vocabulário técnico do balé (com… → `REGISTRO.md` L11066
- **13/10/2026** — Norma revisada: o Bastidores cria e declara (caso a caso);… → `REGISTRO.md` L11114
- **13/10/2026** — A base canónica do catálogo migra para… → `REGISTRO.md` L11152
- **13/10/2026** — A curadoria nasce: a escola atribui a cada professor o que… → `REGISTRO.md` L11185
- **13/10/2026** — Metodologia e notação chegam ao PO (ligar L5 — Bloco… → `REGISTRO.md` L11218
- **13/10/2026** — A tela consome a curadoria: plano/PO travam sem curadoria e… → `REGISTRO.md` L11245
- **13/10/2026** — Bastidores quebrou: a página da Produção referia `env`… → `REGISTRO.md` L11283
- **13/10/2026** — A grelha das tabelas: a rubrica, as turmas em plural, o… → `REGISTRO.md` L11306
- **13/10/2026** — A rubrica: o conteúdo alinha-se à decisão (Bloco 10,… → `REGISTRO.md` L11410
- **leticia · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).
- PO de **tiago · maria** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **tiago · ciclo 01:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).
- Material de campo de **tiago**: 0 evento(s) versionado(s).

## Documentos-chave (para leitura)

- `PROTOCOLO.md` — pétreas
- `REGRAS.md` — regras
- `REGISTRO.md` — marcos metodológicos
- `professores/<nome>/` — um professor por pasta (P-13): ciclos, cadernos, relatórios, campo
- `professores/<nome>/ciclos/ciclo-XX-<escola>-po.md` — POs por escola
- `professores/<nome>/ciclos/ciclo-XX-<escola>.fipp` — âncoras de proveniência
- `departamentos/` — PO de departamento, quando a escola tiver metodologia comum (P-14)
- `biblioteca/guia-do-professor.md` — o guia de posição (departamento ou PO próprio)

## Como retomar

A próxima sessão deve ler, nesta ordem:
1. este arquivo;
2. `PROTOCOLO.md`;
3. as últimas 5 entradas de `REGISTRO.md` — não o arquivo inteiro;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.

Acima: a última entrada do `REGISTRO.md` por inteiro, as pendências recentes e o
índice das anteriores. Consultar o índice antes de abrir o `REGISTRO.md` para
pendência antiga.
