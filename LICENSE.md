# Licença do Sistema Lastro — a máquina

**© 2026 Tiago Angelo Menegaz · Breu Produções Ltda. Todos os direitos reservados.**

> **Este ficheiro NÃO é uma licença de código aberto.** O repositório é **privado** e nada aqui
> concede direito por posse, por acesso ou por cópia. O que se segue é a formalização da decisão de
> **02/11/2026**, escrita em `ARQUITETURA-GERAL.md` §10 — e é essa decisão que este texto
> transcreve; não acrescenta cláusula nenhuma que ela não tenha.

## 1. O que este ficheiro cobre — e o que não cobre

O repositório guarda **três coisas de donos diferentes**, e uma licença só teria de dar a mesma
resposta às três. As três respostas são opostas. Por isso há **três camadas**, e este ficheiro é a
primeira:

| Camada | Onde vive | Regime | Ficheiro |
|:--|:--|:--|:--|
| **A máquina** | `motor/` · `tools/` · `porta/` · `raiz/` · `.github/` · `workers/` · `indices/` · `escola/` · `modelo/` · `experimentos/` · `prompts/` · `protocolo/` · `departamentos/` | **proprietária — todos os direitos reservados**, e **não licenciada** com os produtos | **este** |
| **O catálogo** | `biblioteca/modalidades/` | **licença comercial de uso, por escola** | [`biblioteca/LICENSE.md`](biblioteca/LICENSE.md) |
| **O que a escola acrescenta** | `biblioteca/escolas/<escola>/` | **é dela**, com uma concessão estreita ao projeto | §4 de [`biblioteca/LICENSE.md`](biblioteca/LICENSE.md) |

**A máquina não se entrega.** É o diferencial: a escola compra o **uso do produto**, e não a
máquina que o produz. Entregar o motor seria entregar o negócio.

## 2. O que a camada da máquina compreende

Código-fonte, testes, provas, geradores, validadores, a folha de estilo,  os modelos e esquemas, os
hooks de versionamento, os workflows de publicação, a documentação técnica e de método, e o
histórico deste repositório.

**É vedado, sem autorização escrita e prévia:**

1. copiar, distribuir, publicar ou tornar acessível a máquina, no todo ou em parte;
2. usá-la para produzir produtos próprios, ou para servir terceiros;
3. sublicenciá-la, transferi-la ou cedê-la a qualquer título;
4. removê-la ou ocultá-la de um pacote que a contenha por engano.

**É permitido** ao destinatário de um produto: usar o produto nos termos da
[`biblioteca/LICENSE.md`](biblioteca/LICENSE.md), e ler este repositório no âmbito do contrato que
o autoriza.

## 3. A lacuna declarada — o que ainda não tem regime

**Este ficheiro não decide o regime de `professores/`, `teste/`, `apresentacoes/` nem de
`po_ref/`.** Esses caminhos guardam, hoje, material de trabalho e de demonstração; e `professores/`
guardará, no futuro, os ciclos que **pertencem a cada escola**.

Por omissão, aplica-se-lhes a camada da máquina — o que é o **default conservador**, e não uma
decisão tomada. **PENDENTE**, e é de negócio: o contrato da primeira escola tem de dizer de quem é
o ciclo dela, e esta lacuna fica escrita em vez de ficar implícita.

## 4. Sem garantia

A máquina é fornecida **como está**, para o uso previsto no contrato. O autor não responde por
adequação a finalidade diversa, nem por dano indirecto. O produto entregue tem a garantia que o
contrato declarar — e só essa.

## 5. Contacto

O contacto para licenciamento, autorização de uso ou dúvida sobre este texto é o que o contrato com
a escola indicar. **Não há canal público**, porque o repositório é privado.

---

**Versão deste documento:** 1.0 — homologação, 02/11/2026.
**Decisão que o origina:** `ARQUITETURA-GERAL.md` §10, de 02/11/2026.
**O que muda com um contrato:** a referência do contrato, o regime de `professores/` (§3) e
qualquer ajuste jurídico que o contrato exija. Mudar este texto é um **commit próprio**, com o
motivo escrito no `REGISTRO.md`.
