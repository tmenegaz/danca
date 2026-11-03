# Licença de uso do catálogo — Sistema Lastro

**© 2026 Tiago Angelo Menegaz · Breu Produções Ltda. Todos os direitos reservados.**

> **O que este ficheiro é.** A licença que a **escola compra** quando adquire o **catálogo**: o
> vocabulário técnico e a decomposição em música de que saem os três produtos (dicionário,
> syllabus, aula pronta). É a camada 2 da decisão de **02/11/2026** (`ARQUITETURA-GERAL.md` §10).
>
> **O que ele não é.** Não é uma licença de código aberto, não é Creative Commons, e **não concede
> a máquina** — o motor, as ferramentas e a folha vivem em [`../LICENSE.md`](../LICENSE.md), que
> **não** se licencia com os produtos.
>
> **Não está aqui o preço.** O valor, o plano contratado e a forma de pagamento são do **contrato**
> (decisão C8, em aberto), não da licença.

## 1. O que se licencia

O **catálogo** de uma modalidade, em `biblioteca/modalidades/<modalidade>/`: os termos do
vocabulário (`vocabulario.json`), a decomposição em música (`notacao.json`), a progressão
(`progressao.json`) e as tabelas de nomenclatura (`tradicoes.json`, `descricoes.json`).

**Licencia-se o uso, não a propriedade.** O catálogo não é vendido, cedido nem transferido.

## 2. As seis cláusulas

Cada uma existe por uma razão medida neste projeto, e não por fórmula.

1. **Vinculada à fotografia datada.** A licença vale para o catálogo **como ele está na data**
   declarada no contrato (`catalogo@AAAA-MM-DD`) — e não «para o catálogo» em geral. É a mesma
   regra da C5a, do lado do conteúdo: o que a escola contratou tem data, e a data é o que se pode
   conferir depois.

   > **De onde vem a data, enquanto não há contrato (02/11/2026).** A data do **contrato** é um acto
   > de negócio (C8) e ainda não existe. Até existir, o produto cita a **fotografia derivada** — a
   > data do último commit que tocou o catálogo, mais o `commit`, a mesma técnica que tornou o PDF
   > reprodutível (`SOURCE_DATE_EPOCH`). Ela é **verdadeira e conferível por máquina**, e é
   > reproduzível: duas gerações do mesmo catálogo dão a mesma data.
   >
   > **Ela é derivada, e não é o mesmo objecto.** Diz «esta é a versão do catálogo nesta data»; não
   > diz «esta é a versão que esta escola comprou». **No dia em que o contrato existir, a data dele
   > vence** e esta passa a ser só o que o gerador sabe dizer sozinho. Até lá a cláusula 1 vale
   > **pela metade** — e é essa metade que está declarada como pendência no `REGISTRO.md`, não como
   > cumprimento.

2. **Perpétua para a versão contratada.** O que a escola pagou **não lhe é retirado** quando o
   catálogo evolui. Correcções e acrescentos posteriores chegam como **versão nova**, e a escola
   decide se os recebe. É a L9 aplicada ao produto: a trava não pode ser punição ao dado.

3. **Não exclusiva, não transferível, não sublicenciável.** Uma licença **por escola**, para
   aquela escola. Não se cede a outra, nem se oferece como serviço a terceiros.

4. **Uso interno permitido, sem limite de cópias.** Imprimir, projetar, derivar material de aula,
   incorporar no plano do ciclo, anotar, traduzir para uso próprio. O produto só vale se circular
   **dentro** da escola — restringi-lo seria vendê-lo inutilizado.

5. **Redistribuição e revenda proibidas.** Inclui **publicar o dicionário como serviço**, que é a
   forma de revenda que este produto torna fácil. Inclui também republicá-lo, no todo ou em parte,
   como material próprio, gratuito ou pago.

6. **Atribuição preservada.** Cada descrição mantém o seu campo `fonte`. É **proibido** removê-lo,
   esvaziá-lo ou substituí-lo. É esta cláusula que impede o produto de servir para apagar a origem
   do que não é de quem copia — e é ela que torna a §4 abaixo verificável.

## 3. O que **não** entra na edição paga — a condição de conteúdo

**Uma descrição sem `fonte` declarado não entra na edição paga.** Não é formalismo: não se licencia
o que não se declarou como seu, e um catálogo com origem omissa não sustenta a cláusula 6.

**Medido a 02/11/2026:** dos **59 termos com descrição**, **25 têm `fonte` vazio**. Enquanto a
origem dessas 25 não for declarada, elas ficam **fora da edição paga** e **dentro da edição
interna**. As duas saídas são da escola e do projeto, e nenhuma delas é automática:

- **declarar** a origem de cada uma; ou
- **deixá-las fora** da edição paga, e o produto declara quantas ficaram de fora.

O produto gerado **conta** estas lacunas no seu manifesto — é a forma de a condição não depender de
alguém se lembrar dela.

## 4. O que a escola acrescenta é dela

Os termos, as turmas, as descrições e as decomposições que a **escola** cria em
`biblioteca/escolas/<escola>/` **são dela**. Esta licença não os alcança.

Para que o projeto possa **servir de volta** à escola o que ela criou, e **avaliar** uma proposta
de entrada no catálogo, a escola concede ao projeto uma licença:

1. **não exclusiva** e sem contrapartida financeira;
2. para (a) **servir** esse conteúdo à própria escola e (b) **avaliar** a proposta de entrada no
   catálogo;
3. **sem** o direito de o publicar, vender ou incorporar no catálogo **antes** de a escola aceitar
   expressamente essa entrada.

**A entrada no catálogo exige aceitação explícita da escola**, com a atribuição nomeada. **Não é
automática** por o conteúdo ter sido proposto. Se a escola recusar, o conteúdo **continua a
funcionar** para ela e **não** entra no catálogo.

> **Estado desta secção.** `biblioteca/escolas/` **ainda não existe** — é a fase 1 do
> `PLANO-PRODUTOS-DO-MOTOR`, e a separação entre catálogo e adições está por fazer no código. Esta
> secção é a regra que passa a valer **no dia em que existir**. Até lá, o que a escola cria entra no
> ficheiro do catálogo, e essa é a razão pela qual a fase 1 é pré-requisito da venda.

## 5. Duração, cessação e o que sobrevive

- **Vigência.** A licença dura enquanto o contrato durar, e o **direito de uso da versão
  contratada** sobrevive ao fim do contrato (cláusula 2).
- **Cessação.** O incumprimento das cláusulas 3, 5 ou 6 faculta a cessação do direito de receber
  **versões novas**; não apaga o que já foi entregue nem o que já foi impresso.
- **Sobrevive ao fim:** a cláusula 2 (perpétua para a versão contratada), a cláusula 6
  (atribuição) e a §4 (o que é da escola continua a ser dela).

## 6. Sem garantia de conteúdo pedagógico

O catálogo é **matéria-prima**, não currículo certificado. A progressão declarada em
`progressao.json` é uma **referência sugerida**, e o próprio ficheiro o diz: as associações
exemplo não representam progressão oficial certificada por nenhuma escola de ballet. **Quem ensina
decide** o que ensina, e a curadoria é o acto que torna o produto dela.

---

**Versão deste documento:** 1.0 — homologação, 02/11/2026.
**Decisão que o origina:** `ARQUITETURA-GERAL.md` §10 (10.2, 10.3 e 10.4), de 02/11/2026.
**Pendente, e é de negócio:** a referência do contrato, o valor (C8) e a data da fotografia
contratada. Mudar este texto é um **commit próprio**, com o motivo no `REGISTRO.md`.
