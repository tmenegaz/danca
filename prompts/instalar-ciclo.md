# Instalação de Ciclo e PO de outro professor

> **Nota de instalação (18/09/2026).** Este prompt foi instalado no repositório em
> 18/09/2026 (P-19). Houve **uma única adaptação** ao texto original: os nomes dos
> documentos na árvore abaixo levam o **sufixo da escola**
> (`ciclo-01-<escola>-plano.md`), que é a convenção real do repositório — cada
> escola tem o seu ciclo, com conteúdo próprio, e a versão sem sufixo é lida por
> todas (`tools/lib-fontes.sh`). Sem esse sufixo, este prompt reinstalaria o erro
> que fez o pacote da Ritmos sair com o plano da Duo. Nada mais foi alterado.

Quando um professor responde à eliciação (via `prompts/eliciar-ciclo.md`),
o resultado é colado aqui. Este prompt transforma o Markdown entregue em
estrutura instalada no projeto.

## O que o professor entrega

Um único arquivo Markdown com: contexto institucional, objetivo geral,
alunas, primeira aula, e o PO (pergunta, fenômeno, campo, contexto,
sujeitos, linha de base, critérios de inclusão/exclusão, justificativa,
limitações).

## O que instalar

Criar:

```
professores/<nome>/ciclos/
├── ciclo-01.conf
├── ciclo-01-<escola>.conf
├── ciclo-01-<escola>-po.md
├── ciclo-01-<escola>-plano.md
├── ciclo-01-<escola>-aula-01.md
├── ciclo-01-<escola>-referencias.md
├── ciclo-01-<escola>-relatorio-aula-01.md
├── ciclo-01-<escola>-captura-aula-01.md
├── ciclo-01-<escola>-pre-requisitos.md          (se aplicável — ver P-15/P-16)
├── ciclo-01-<escola>-musicalidade.md            (se aplicável)
├── ciclo-01-<escola>-musicalidade-aluna.md      (se aplicável)
├── ciclo-01-<escola>-notacao.md                 (só se o professor declarar notação)
├── ciclo-01-<escola>-glossario-<notacao>.md     (só se o professor declarar notação)
└── ciclo-01-<escola>-apanhado-historico.md
```

## Regras

- **P-15/P-16:** só gerar notação se o professor declarou metodologia com
  notação (ex.: RAD → Benesh). Caso contrário, **não gerar** documentos de
  notação.
- **P-17:** os artefatos replicam os do ciclo piloto (Duo).
- **P-12:** sujeitos entram por apelido estável — se o professor só deu
  nomes próprios, marcar `[Preencher: apelidos estáveis]` e NÃO publicar
  até a decisão.
- **Nada de inferir** — o que não foi declarado vai como `[Preencher]`.
- **Não copiar** o conteúdo de outro ciclo: replica-se a **estrutura**, não o
  texto. Um documento auxiliar que carregue o conteúdo do ciclo de outra escola
  (as contagens das aulas dele, o registro dos exercícios dele) não é replicável:
  ou é derivado do que **este** professor declarou, ou fica `[Preencher]`.

## Harmonização de linguagem (P-21)

Antes de gerar qualquer documento publicado (PO, pré-requisitos, plano,
aulas), aplicar a P-21 nas descrições de sujeitos.

### O que a P-21 faz

- **O fato permanece; o juízo sai.** "A aluna é preguiçosa" → "a aluna tem
  dificuldade de engajamento" (o fato: baixa participação; o juízo: preguiça).
- **Nenhum adjetivo essencializante** sobre pessoas. "É burra" → "tem
  dificuldade de compreensão"; "é fraca" → "força a desenvolver".
- **Descrição de comportamento, não de caráter.** "É desatenta" → "dispersa
  durante exercícios longos".

### Como aplicar

1. **Ler o material bruto do professor** (em `campo/<data>-<escola>/`).
2. **Identificar termos** que atribuem juízo, essência, adjetivo estável.
3. **Reescrever** cada termo, mantendo o fato:
   - Descrever **o que se observa**, não **o que se conclui**.
   - Preferir "dificuldade de X" a "é X" / "não tem X".
   - Preferir "Y a desenvolver" a "Y insuficiente" / "Y fraco".
4. **Produzir uma tabela bruto × harmonizado** — ver abaixo.
5. **Aplicar a versão harmonizada** nos documentos publicados.
6. **Preservar o material bruto** em `campo/`, intocado.

### Tabela bruto × harmonizado (obrigatória)

Para cada ciclo instalado, gerar uma tabela em
`professores/<nome>/ciclos/ciclo-XX-<escola>-harmonizacao.md`:

```markdown
# Harmonização de linguagem — Ciclo XX — <escola>

> Esta tabela é **visível ao professor**. Se ele discordar de alguma
> harmonização, ele reescreve a coluna "Publicado" com as próprias palavras.
> O harmonizador é uma **proposta**, não um filtro.

| Bruto (o que o professor disse) | Publicado (versão harmonizada) | Observação do professor |
|:---|:---|:---|
| "a aluna é burra" | "a aluna tem dificuldade de compreensão" | [deixar em branco para o professor preencher] |
| "execução ruim" | "execução insuficiente" | |
| "meninos travados" | "flexibilidade dos meninos deve ser mais trabalhada" | |
| ... | ... | |

## Como revisar

1. **Se você concorda** com a versão publicada: não faça nada.
2. **Se você discorda parcialmente** (o sentido ficou distorcido): reescreva
   a coluna "Publicado" com as suas palavras. O fato que você quis dizer
   permanece; só o juízo muda de forma.
3. **Se você discorda totalmente** (você quis mesmo dizer "burra"): reescreva
   — mas saiba que a versão publicada é a que vai para o material entregue
   a alunas e famílias. Ninguém aqui vai censurar você; só vai te dar uma
   segunda chance de dizer o que quis dizer sem ofender.
4. **O material bruto em `campo/` não é alterado** — ele é o registro do que
   você disse.

### Se a discordância for mantida

Se depois de reescrever você quiser manter o termo original, ele vai para
o material publicado como você escreveu — mas com uma nota de proveniência
declarando que o professor revisou e manteve a formulação original. O sistema
não impõe harmonização; ele a oferece.
```

### O que acontece quando o professor discorda

A discordância **não edita** a versão anterior: ela gera uma **nova versão do
ciclo**, com a decisão do professor incorporada e **reancorada** (novo hash
FIPP). A versão anterior continua registrada — no histórico do Git (o `.fipp` é
versionado) e no `REGISTRO.md` —, e a tabela é **acrescida** com a linha nova.
Nada é sobrescrito: a proveniência acrescenta, não edita. O material bruto em
`campo/` segue intocado.

> **Para o operador.** O professor manda só a divergência (por exemplo: "concordo
> com tudo, exceto *coordenação motora a aprimorar* — quero *coordenação motora
> ainda incipiente*"). Regenere o ciclo com a troca; não edite os arquivos à mão,
> nem a tabela anterior.

## Procedimento

1. Criar `professores/<nome>/` com a estrutura
2. Preencher `.conf` com objetivo, total de aulas, faixas de volume
   (calibradas pela duração)
3. Preencher `-po.md` com os campos respondidos
4. Preencher `ciclo-01-<escola>-plano.md`, `-aula-01.md`, `-referencias.md`
5. Descobrir os artefatos do Duo (ciclo piloto) e replicar a estrutura
6. Gerar âncora FIPP: `tools/hash-ciclo.sh <nome> 01 <escola>`
7. Gerar pacote: `tools/gerar-ciclo.sh <nome> 01 <escola>`
8. Validar: `tools/check-pacote.js`
9. Registrar em `REGISTRO.md`
10. Registrar material bruto em `campo/`
11. Commitar
