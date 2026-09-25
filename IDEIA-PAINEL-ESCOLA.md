# Painel da escola e a página pública da cadeia de custódia

> **Resumo (para o HANDOFF):** painel de gestão para a direção da escola (aulas dadas,
> horas trabalhadas, valor-hora, cadeia de custódia, retenção) e a página pública da cadeia
> para pais e alunos. Não implementado.

> **Documento de intenção.** Escrito em 23/09/2026, a partir da conversa que definiu as
> regras da aula (`ARQUITETURA-AULA.md`). **Nada disto está implementado**, e o desenho da
> tela ainda não foi feito — este documento registra **a ideia e o que ela já tem pronto**
> do lado do sistema. Duas decisões foram tomadas depois: o recorte da página pública (§6)
> e a retenção (§7).

## 1. Por que ele pertence a esta arquitetura

O painel **não cria dado nenhum**. Ele **relê** o que o lançamento do professor já produz,
com outro recorte e outra permissão:

| O que o painel mostra | De onde já vem |
|:--|:--|
| aulas dadas, por data e duração | `aulas` do JSON de dados + o calendário |
| quem esteve presente | `presentes` / `ausentes` por aula |
| o que mudou em cada ajuste | `ajuste_de`, `motivo`, `ajustes` (o diff) |
| a cadeia de custódia | os `.fipp` (por ciclo, e propostos por aula) |
| horas trabalhadas × valor-hora | a soma das durações + um valor que **falta definir** (§5) |

É por isso que ele é a outra face do mesmo desenho: **o lançamento só é confiável porque a
escola é dona do dado**, e o painel só funciona porque o professor lançou. Os dois se
sustentam um ao outro.

## 2. O que já está pronto do lado do sistema

Verificado no repositório:

- **A senha já é por escola.** `tools/lib-senhas.sh` deriva `SENHA_<ESCOLA>` — `SENHA_DUO`,
  `SENHA_RITMOS`, `SENHA_DEBORA`, `SENHA_DIAGHILEV`. O painel usa **a mesma solução de login
  e senha** do formulário de lançamento; não precisa inventar autenticação.
- **O dado é por professor, e a busca é por professor.** A estrutura é
  `professores/<professor>/` e **vai continuar assim** (decisão de 23/09/2026). Isso é
  coerente com a escola: é assim que ela procura — *"quero saber as aulas da professora
  Rita"*, *"as aulas de balé da professora Ana"* —, e não por turma, como nas escolas
  regulares. Não raro o professor **é** o dono da escola.
- **O modelo de dados tem o que o painel precisa.** O JSON de dados já traz, por ciclo, o
  professor e a escola; e, por aula, a data, a duração, a presença e as marcas por aluna.

## 3. O que ele faz (esboço)

- **Acompanhamento da gestão:** as aulas dadas, por professor, turma, modalidade ou
  disciplina — os filtros são livres, porque a **organização** é por professor e o
  **recorte** é de quem olha.
- **Horas trabalhadas:** a soma das durações executadas (o dado já está em
  `duracao_min` por aula).
- **Valor-hora:** o cálculo do que a escola deve ao professor. Depende de um valor que
  **ainda não tem onde morar** (§5).
- **Cadeia de custódia:** o que mudou e o que não mudou — a verificação das mudanças vive
  aqui, com o mesmo peso do acompanhamento.
- **Como o professor conduz:** a tabela bruto × harmonizado (§4) mostra a linguagem com que
  ele fala dos alunos — e **não** é censura: é o registro de como ele interage.
- **Relatórios sob demanda:** a escola gera o que quiser, para si mesma. É o mesmo princípio
  dos três entregáveis do formulário — nada é gerado automaticamente; gera quem precisa.

## 4. A correção de linguagem (o que o painel exibe)

O mecanismo **já existe** e está descrito na **P-21**. Exemplo do que ele faz:

| O professor digita | O sistema oferece |
|:--|:--|
| "essa aluna é muito ruim fazendo demi-plié" | o **fato** permanece, o **juízo** sai: "demi-plié a desenvolver" |

E o que acontece com a versão bruta: **ela não é apagada**. O material bruto
(`campo/`) preserva a linguagem original, o documento publicado usa a harmonizada, e a
tabela bruto × harmonizado (`ciclo-XX-<escola>-harmonizacao.md`, que já existe nos três
ciclos) fica **visível ao professor** — ele revisa e pode reescrever com as próprias
palavras.

> **A harmonização é proposta, não imposição.** O sistema não censura: ele oferece uma
> segunda chance de dizer o que se quis dizer — e preserva a primeira. No painel, as duas
> aparecem, porque é isso que a escola quer ver.

## 5. O que ainda não está decidido

- **A estrutura da tela.** Não foi desenhada. Quantas telas, quais filtros na barra, o que
  fica no painel e o que fica na página pública.
- **O valor-hora.** O painel calcula horas × valor — mas **onde o valor mora** (no `.conf`
  da escola? num cadastro à parte?), **quem o declara**, e se ele pode **mudar no meio do
  ciclo** (e o que acontece com as aulas já dadas) não foi decidido.
- **Onde mora o campo da retenção.** A *decisão* está tomada (§7): **selar, não apagar**, e
  a duração é política de cada escola. Falta **onde** o número é declarado (o `.conf` da
  escola? o painel? os dois?) e como a mudança dele é ancorada.
- **O nível de detalhe da página pública.** Está decidido que ela mostra **que** houve
  mudança, e **não** o conteúdo (§6). Se ela mostra também **a data** e **qual aula**, não.
- **A página de consulta do material** (§8) — declarada como possibilidade, **não decidida**;
  e colide em parte com o recorte da cadeia (§6).
- **A relação com o outro projeto.** `README.md` registra que a integração com o projeto
  das secretarias (Projeto Cultura) **não foi desenhada** — nem a fronteira de entrada nem
  a de saída. O painel da escola pode ser onde essa fronteira vive; não é uma decisão
  tomada.

## 6. A página pública da cadeia de custódia

A **prestação de contas virada para fora**: pais e alunos consultam o que mudou na cadeia.
É a contraparte pública do painel: onde a direção vê tudo, o público vê o rastro.

**O recorte está decidido (23/09/2026): a página mostra apenas a existência de diferenças**
— *"aqui mudou"* —, e **nunca o conteúdo** do diff. O material é sensível (dados de
menores); a existência da mudança é informação pública, o conteúdo não é.

- **Quem vê o conteúdo precisa solicitar.** O sistema **não prevê nem decide** esse acesso:
  é acordo interno entre as instituições, que se entendem entre si, com os pais e com os
  alunos. Se há ou não acordo de direito de imagem, **não é da conta do sistema**.
- **O que sustenta o recorte é a âncora** (`ARQUITETURA-AULA.md` §5.2): um hash com
  metadados e **nenhum conteúdo**. É ela que permite dizer *"este documento tem diferenças"*
  sem expor **o que** mudou — e que faz a prestação de contas sobreviver ao selamento (§7).
- **A linguagem é harmonizada (P-21)** por definição, como no resto do publicado.

## 7. A retenção — selar, não apagar

**Decidido (23/09/2026).** Ao fim da retenção, o conteúdo é **selado**, não apagado. Isso
fecha a tensão com a regra central do projeto — *"apagar é proibido, senão não há
proveniência"*: apagar quebraria a cadeia; **selar a preserva**.

- **A duração é política de cada escola.** O painel entrega o **campo**; a escola entrega o
  **valor**. Exemplos declarados: **5 anos** (o tempo em que uma quantidade média de crianças
  permanece na escola), cem, *"pra sempre, enquanto os servidores existirem"*, ou **o prazo
  que a lei exigir**, quando a escola presta serviço público.
- **A retenção sobrevive ao contrato.** *"Quando encerra o contrato, o professor também
  continua lá por cinco anos"* — o material **não segue o vínculo**; ele é da escola.
- **O que sobrevive é a âncora.** Só ela permite que a prestação de contas dure *"para
  sempre"*: é hash com metadados e nenhum conteúdo.
- **Selar não é apagar nem liberar.** O conteúdo sai da **custódia corrente** e passa a uma
  **política de acesso ao passado** — porque o material é **memória do processo e do
  conhecimento**, de como se chegou aos resultados.

## 8. A página de consulta do material (possibilidade declarada)

Além da cadeia, foi declarada a possibilidade de uma página de **consulta do material
produzido na escola** — a memória do processo — e, na área de administração e *"de uma forma
mais rebuscada"*, o uso desses planos para **negociar planos de aula com professores de
outras escolas**. **Não está decidida**, e **colide em parte** com o recorte da cadeia
(§6): como o material tem dados de menores, o que se abre é **política da escola**, não
decisão do sistema. Registrada para não se perder.

## Referências

- `ARQUITETURA-AULA.md` — o desenho da aula (§5.2, §7 e §9 remetem para cá)
- `CONGELAMENTO.md` — a política de segurança dos dados sensíveis
- `PROTOCOLO.md` — P-21 (harmonização), P-12 (apelidos estáveis)
- `tools/lib-senhas.sh` — a senha por escola
- `IDEIA-CAPTURA.md` — o conceito do formulário