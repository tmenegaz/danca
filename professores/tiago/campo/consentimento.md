---
projeto: Formação em Balé Clássico
frente: Campo
tipo: consentimento
title: "Consentimento — estrutura e lacunas"
subtitle: "Estrutura do consentimento de campo; a redação jurídica é decisão da pesquisadora"
criado_em: "26/09/2026"
estado: "estruturado com lacunas — não fechado"
---

# Consentimento — estrutura e lacunas

> **ESTADO: ESTRUTURADO COM LACUNAS — NÃO FECHADO.** Este arquivo **não contém texto jurídico** e não
> contém nenhuma cláusula redigida. O que ele contém é a **estrutura** do consentimento, o que o
> projeto **de fato** faz com o dado (isso é medido, e está no código — pode ser afirmado), e as
> **lacunas** que dependem de decisão da pesquisadora, todas marcadas `[Preencher: …]`.
>
> Enquanto houver `[Preencher: …]` aqui, **não existe termo aplicável ao campo.** Isto é uma lacuna
> **declarada**, não um consentimento existente.

## Por que este arquivo existe

O material de campo registra dados de **menores de idade**. O instrumento pede faixa etária, e a
primeira faixa é `☐ 3–6` — até `☐ 14–17` (`2026-10-03-ritmos/formulario.md:16`).

A **P-12** resolve o **repositório**: sujeito entra por apelido estável, o mesmo ao longo do ciclo,
sem consulta a mapa externo; nunca nome completo, contato ou dado de saúde em claro. Ela **não**
resolve o **consentimento de responsável** — é outra coisa, e não existia.

Medido em 26/09/2026: **nenhum** termo de consentimento, TCLE ou assentimento existia em nenhum `.md`
deste repositório. Este arquivo é a estrutura que faltava, com as lacunas explícitas.

## Por que na raiz de `campo/`

O padrão que o `README.md` deste diretório fixa (linhas 9–19) é **`AAAA-MM-DD-<escola>/` — um
diretório por evento de campo** —, contendo `formulario.md` (o instrumento **como foi aplicado**),
`respostas.md` (as respostas, digitadas, sem nome nem contato) e anexos. Pela regra 1 do mesmo
`README.md`, o diretório de um evento não é reescrito.

O consentimento não é resposta nem instrumento-aplicado: é a **condição prévia** de qualquer evento, e
a estrutura dele é a mesma em todos — mudam só os campos que a pesquisadora preenche. Logo, **raiz de
`campo/`**, ao lado do `README.md` que o descreve.

Não em `biblioteca/`: o que mora lá é o **guia compartilhado do professor**, um guia. Consentimento é
material **de campo**, aplicado por evento e por professor.

## O que o projeto faz com o dado — medido, e por isso afirmável

Isto não é decisão jurídica: é o comportamento do projeto hoje, lido no código e nas regras. É o que
sustenta qualquer redação que a pesquisadora venha a escrever.

| Camada | O que acontece |
|:--|:--|
| **Apelido** | o sujeito entra e permanece por **apelido estável**, o mesmo ao longo do ciclo, sem consulta a mapa externo. Nunca nome completo, contato ou dado de saúde em claro (P-12) |
| **Nome e contato** | o bloco de interesse do instrumento (seção 9, opcional) pede nome e contato; esses dados ficam **fora do Git**, em arquivo local. Na transcrição entra a resposta, sem identificação (`README.md` deste diretório, regra 2) |
| **No repositório** | o repositório é **privado** (GitHub) — protege PO, relatórios, cadernos e `.md`. É ação **manual** da pesquisadora; até ela existir, valem as camadas abaixo (`CONGELAMENTO.md`, política de segurança dos dados sensíveis) |
| **No pacote publicado** | o PDF do ciclo sai **sem** os acompanhamentos; os acompanhamentos HTML vão **cifrados** e pedem senha; os `.md` de acompanhamento ficam **fora do Git** (mesma política) |
| **JSON de lançamentos** | o `-dados.json` publicado no pacote é cifrado **por inteiro** (`{_cifrado, lancamentos, _nota}`), com a mesma senha e o mesmo esquema dos acompanhamentos; a senha vem por variável de ambiente, não por argumento (`tools/cifrar-dados.js`) |
| **Quem acessa** | só o professor, com senha (`ARQUITETURA-CAPTURA.md` §5) |

> **Lacuna medida.** `ARQUITETURA-CAPTURA.md` §5 registra: "Fora do Git? Decisão pendente — ver seção
> 7". A decisão continua pendente. O que a tabela acima afirma é o que o código **faz hoje** — não o
> que foi decidido.

## As lacunas — decisão da pesquisadora

Cada item é decisão jurídica. Nenhum foi redigido aqui no lugar dela.

### Partes e assinatura

- **A quem o termo se dirige e quem assina** — `[Preencher: o responsável legal pela aluna menor; a
  própria aluna quando maior; as duas vias, se for o caso]`
- **A partir de que idade a própria aluna assina sozinha** — `[Preencher: idade do consentimento
  autônomo e o que se aplica na faixa entre essa idade e a maioridade]`
- **Assentimento da própria aluna** — `[Preencher: se existe, além do consentimento do responsável, e
  a partir de que idade]`

### Base legal e finalidade

- **Base legal** — `[Preencher: enquadramento aplicável ao tratamento de dados de menores. A LGPD
  dedica o art. 14 a dados de crianças e adolescentes; conferir o texto e o enquadramento com quem
  orienta a pesquisa — este arquivo não o interpreta]`
- **Finalidade declarada** — `[Preencher: a redação da finalidade. O que se pode afirmar é o que o
  projeto faz — registra o cotidiano da aula para a memória do professor; a formulação é da
  pesquisadora]`

### Guarda e ciclo de vida

- **Por quanto tempo o dado fica** — `[Preencher: prazo de retenção]`
- **O que acontece com o dado ao fim do prazo** — `[Preencher: eliminação, anonimização ou guarda]`
- **Como se pede a exclusão** — `[Preencher: canal, forma do pedido e prazo de resposta]`
- **Quem é o responsável pelo tratamento** — `[Preencher: controlador e contato — e onde essa
  informação fica, sabendo que não é neste repositório, pela própria regra 2]`

### Aplicação

- **Se a recusa impede a participação** — `[Preencher: decide-se se o campo pode ser aplicado sem o
  termo]`
- **Onde ficam as vias assinadas e como cada via se liga ao apelido sem criar mapa externo em claro** —
  `[Preencher]`
- **Se as vias assinadas são versionadas por evento** (`AAAA-MM-DD-<escola>/`) **ou ficam fora do Git,
  como o nome e o contato** — `[Preencher]`

## O que este arquivo não é

- **Não é um termo de consentimento.** Não há cláusula redigida; há estrutura e lacunas.
- **Não é texto legal** e não substitui orientação jurídica. Nada aqui foi redigido como cláusula, de
  propósito: a redação é decisão da pesquisadora.
- **Não fecha a lacuna.** Ele a **declara**, para que a próxima sessão não assuma que o consentimento
  existe.

Ver [`README.md`](README.md) — a descrição do material de campo, das regras e dos instrumentos.
