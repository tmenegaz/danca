# Professores

Cada professor tem a sua pasta aqui, com os **seus** ciclos, cadernos, relatórios e
material de campo. Nada de um professor fica na pasta de outro.

> **Este documento não declara quem existe.** Ele descreve a **convenção** — o que é a pasta
> de um professor, o que vai dentro dela e como ela nasce —, e vale para qualquer professor,
> de qualquer escola, hoje ou depois. **A lista de professores é o que está nos diretórios**;
> uma tabela escrita à mão aqui envelhece a cada escola criada e a cada expurgo, e passa a
> mentir sem que ninguém perceba. Quem cria as pastas é a página `danca` (a escola nova) e os
> **Bastidores · Produção** (os professores adicionais da escola).

## O que é um "professor" no projeto

Um professor é quem dá aula e **observa a própria prática**. O material de observação é
dele: o PO, o caderno, os relatórios. O projeto dá o método (protocolo, regras,
ferramentas); o professor dá o recorte.

Pela **P-13**, cada professor tem o seu próprio PO — dois professores com a mesma escola
e as mesmas alunas têm POs distintos, porque o recorte observacional é decisão de cada
um. Pela **P-14**, quando a escola tem metodologia comum, o PO do professor pode derivar
de um **PO de departamento** (ver [`../departamentos/README.md`](../departamentos/README.md)).

## O nome da pasta é o slug — e é ele que identifica

O diretório é `professores/<slug>/`, e o slug sai do nome: minúsculas, sem acento, espaços e
símbolos viram hífen (`Ana Maria` → `ana-maria`). O **nome de exibição** — o que se lê nas
telas — nunca vira chave: ele pode ser ajustado depois, e a pasta não se move.

Essa pasta é do **sistema**, não da escola: guarda o pacote, as âncoras de proveniência e o
material de todos os ciclos daquele professor, em todas as escolas em que ele dá aula. Por
isso ela **não pode repetir**. Duas pessoas com o mesmo nome — ou dois nomes que produzem o
mesmo slug — seriam **uma só** no registro: o PO de uma cairia na pasta da outra. É o que o
**sobrenome (ou apelido)** separa: `tiago-menegaz` e `tiago-silva` são dois professores, na
mesma escola ou em escolas diferentes.

## O que cada professor tem

| Pasta | O que é |
|:--|:--|
| `ciclos/` | manifestos, planos, aulas, POs e âncoras de proveniência (`.fipp`) dos ciclos daquele professor |
| `cadernos/` | o caderno descritivo por aula (P-06) |
| `relatorios/` | os relatórios pós-aula, um por aula |
| `campo/` | o material bruto de campo (formulários, respostas, registros) |

Só `ciclos/` chega a existir no repositório na criação do professor — o scaffold também
cria `cadernos/ciclo-NN/`, `relatorios/ciclo-NN/` e `campo/`, mas **o Git não versiona
diretório vazio**, e eles só aparecem aqui quando o material existe. Uma pasta criada «para
depois» seria uma promessa que o repositório não registra.

## O que vive dentro do diretório — e não confunda os dois papéis

O diretório de um professor guarda duas coisas de naturezas diferentes:

- **o arcabouço do ciclo** — `ciclo-XX.conf` e os **schemas** (`ciclo-XX-*-schema.json`), que
  são os contratos que as fontes daquele ciclo satisfazem. O `tools/criar-escola.sh` **copia
  os schemas de um ciclo-modelo** ao criar uma escola nova e **recusa** criar quando eles não
  existem (`erro: ciclo-modelo sem schema`) — é o que já aconteceu neste repositório, e o
  preço foi uma escola que não pôde nascer. Os schemas de quem serve de modelo **não se
  apagam**; o expurgo de uma escola é proibido de tocar neles;
- **o material do professor** — o PO, o plano, as aulas, o pacote, os cadernos, os relatórios.

O ciclo-modelo é o **molde** de que nascem as escolas, e vive num diretório de professor como
qualquer outro. Os modelos disponíveis estão declarados em `tools/criar-escola.sh`
(`MODELO`, selecionável por `--modelo <professor>/<ciclo>`).

## O perfil — o que o professor sabe ensinar, e porque é dele

Cada pasta de professor pode ter um **`perfil.json`**, e é ele que declara **o que aquela pessoa
sabe ensinar** (`modalidades`). Não é um dado da escola: a modalidade nasce da competência de quem
ensina, e a escola só a oferece porque tem quem a saiba ensinar
([`ARQUITETURA-GERAL.md` §2.2](../ARQUITETURA-GERAL.md)).

**O ficheiro nasce com a escola** (`tools/criar-escola.sh`), habilitado na modalidade principal — e
**não se sobrescreve**: um professor que cria a segunda escola conserva o que declarou, porque a
segunda escola não lhe acrescenta nem lhe tira competência. Edita-se em **Bastidores · Produção →
Professores → Habilitações**.

**E o expurgo de uma escola não lhe toca.** Uma escola que fecha leva os dados **dela**; a
competência de quem ensina fica com quem ensina. O mecanismo está em `motor/servidor/repo-escola.js`
(`ehPerfilDoProfessor` e a guarda `semPerfisNaLista`), e a prova em
`experimentos/provar-habilitacao-do-professor.js`.

## Onde a pasta nasce

Criar um professor **nos Bastidores · Produção** registra-o na **escola** — nome, slug e
senha —, no cofre daquela escola. A pasta `professores/<slug>/` **não** nasce aí: ela nasce
no repositório **quando o professor escreve a primeira fonte do ciclo dele** (o PO ou o
plano). Um professor pode ser cadastrado, receber curadoria e entrar na Área do Professor sem
que exista um único arquivo dele no repositório — e isso é o desenho, não uma falha: o
repositório registra o que foi produzido, não quem foi cadastrado.

Quem cria **escola** (a página `danca`) já nasce com a pasta e o pacote-zero, porque o
scaffold roda no `tools/criar-escola.sh`.

## Como adicionar um professor

O caminho normal é a página: **`danca` → «Criar nova escola»** (o professor inicial, dono da
escola) ou **Bastidores · Produção → cadastrar professor** (os adicionais). O slug é derivado
do nome, e o sobrenome separa homônimos.

Para criar a pasta à mão, o mínimo é `ciclos/`:

```bash
mkdir -p professores/<slug>/ciclos
```

Depois:

1. crie o ciclo inicial (`ciclo-01.conf` + `ciclo-01-<escola>.conf`) — ver
   [`../README-ciclos.md`](../README-ciclos.md). **A base é do par (professor, ciclo), não da
   escola**: o mesmo professor com duas escolas tem **uma** `ciclo-01.conf` e **duas** variantes
   (`ciclo-01-<escola>.conf`), e é a variante que diz o contexto, o ritmo e o nome de exibição.
   `tools/criar-escola.sh` reusa a base que já existe e só recusa quando a **variante**, o
   **pacote** ou o **wrangler** daquela escola já existem;
2. declare o PO do professor (`ciclo-01-<escola>-po.md`): o recorte é dele (P-13) — o dado,
   porém, pertence à escola;
3. gere a âncora e o pacote:
   ```bash
   tools/hash-ciclo.sh <slug> 01 <escola>
   tools/gerar-ciclo.sh <slug> 01 <escola>
   ```
   Passe o `<slug>` **sempre**. Sem ele, as ferramentas assumem um default histórico
   (`tools/hash-ciclo.sh`, `tools/gerar-ciclo.sh`) que aponta para o professor dos primeiros
   testes — e a pasta errada.

## O que é compartilhado (fica na raiz)

`biblioteca/` · `apresentacoes/` · `protocolo/` · `tools/` · `PROTOCOLO.md` ·
`REGRAS.md` · `REGISTRO.md` · `README.md` · `README-ciclos.md` · `HANDOFF.md` ·
`departamentos/`

> **Habilitada ou desabilitada é por ESCOLA, não por professor.** O professor continua
> existindo; o que se habilita ou desabilita é cada vínculo professor × escola. O estado
> vive no `.conf` da variante, com **motivo** e **data** quando desabilitada — ver
> [`../README-ciclos.md`](../README-ciclos.md), «Habilitar e desabilitar uma escola».

> **Cada escola tem o seu ciclo.** O conteúdo (objetivo, plano, aulas) é da escola,
> não do número do ciclo: `ciclo-01-<escola-a>-*` e `ciclo-01-<escola-b>-*` são
> ciclos distintos, com planos e aulas distintos. As fontes de uma variante têm
> precedência sobre as sem sufixo — a regra está em `tools/lib-fontes.sh`.
