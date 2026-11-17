---
description: A trava do repositório — o que um agente nunca faz, mesmo quando o pedido é explícito.
applyTo: "**"
---

# Proibições absolutas

Estas regras não têm excepção, não têm «mas o contexto era outro», e não se suspendem por
autorização verbal. Foram escritas a 17/11/2026 pela proprietária do sistema, e a primeira nasceu
de um medo declarado.

## 1. Nunca apagar um repositório. Nunca. Nem quando for pedido.

> «Você nunca pode deletar um repositório, mesmo que eu peça. Não pode. Se for solicitado, você tem
> que dizer como isso é feito manualmente. Nunca pode deletar nenhum repositório. […] eu tenho medo
> disso por causa do expurgo.»
> — a proprietária, 17/11/2026

Vale para **qualquer** repositório, em **qualquer** conta: `danca`, as escolas, os antigos, os de
teste. Vale para agentes, para workflows e para scripts.

**Se o pedido vier**, a resposta é a mesma, e tem três partes:

1. **Não faço.**
2. **Digo o que aconteceria**, para que a decisão seja informada — apagar remove código, histórico,
   issues, e as cópias que ninguém fez deixam de existir; o GitHub guarda 90 dias de restauro.
3. **Explico como se faz à mão:** GitHub → `Settings` → fundo → **Danger Zone** → *Delete this
   repository* → escrever `dono/repo` → confirmar.

**Porque a regra existe, e não é zelo abstracto.** O token do Worker tem `administration=write`,
que a alternância de visibilidade do painel exige. Com essa permissão, um
`DELETE /repos/{dono}/{repo}` **passa a autenticação** — a sonda de 17/11/2026 respondeu **404** a
um nome inexistente, com `documentation_url` a apontar `#delete-a-repository`, e não 403. O poder
existe. Uma promessa não é uma trava.

**Duas coisas que NÃO são apagar o repositório, e que se fazem normalmente:**

| operação | o quê | quem |
|:--|:--|:--|
| `DELETE /repos/{dono}/{repo}/contents/{caminho}` | apaga **um ficheiro**. É o que o expurgo faz | o motor, com prova |
| `PATCH /repos/{dono}/{repo}` com `private` | muda a **visibilidade** (§L9e do `PLANEJAMENTO-LASTRO.md`) | o painel, atrás de confirmação |
| apagar **chaves de KV** de uma escola | esvazia o dado de uma escola, por prefixo | o expurgo, com a trava do prefixo |

**O que guarda o código:** `tools/check-sem-destruicao.js` corre no `pre-commit` e reprova
qualquer `DELETE`, `PUT` ou `POST` ao endereço do repositório inteiro, e exige que uma chamada ao
GitHub com o método vindo de fora esteja declarada. A prova é
`experimentos/provar-trava-de-repositorio.js` — um guarda que nunca se viu recusar não é um guarda.

## 2. Nunca inventar dados pedagógicos

Datas, fontes, observações, nomes de obras, números de turma: se não está na fonte, fica
`[Preencher: …]` ou `[conferir]`. Uma lacuna declarada é informação; um valor inventado é corrupção
da evidência, e a evidência é o produto.

## 3. Nunca pôr dados pessoais em claro

Apelidos estáveis para as alunas. Sem nomes completos, contactos, dados de saúde ou
acompanhamentos em claro — nem em Markdown versionado, nem em fixture, nem em comentário. Os
acompanhamentos vivem cifrados no pacote e fora do Git em Markdown.

**E um CPF em fixture é dado pessoal.** Se for preciso um número para uma prova, usa-se um
sintético que não pertença a ninguém (e que passe o dígito verificador, senão a prova não mede o que
diz medir).

## 4. Nunca guardar segredos no que é versionado

`.dev.vars`, `tools/.senhas-locais`, `tools/.escolas-teste` e `.env` estão no `.gitignore` e não se
versionam. O `pre-push` confere-o a cada envio. Um segredo que entra num commit fica no histórico
para sempre, em cada clone — e o histórico deste repositório é público por rotação (§L9e).

## 5. Nunca dizer «está feito» sem medir

Um número apresentado como medido e que é estimado é uma mentira por omissão — e é a família de
erro que este projecto persegue em cada correcção. Mede-se no sítio onde o defeito aparece: um
navegador para geometria, a API para cotas, a fatura para dinheiro.
