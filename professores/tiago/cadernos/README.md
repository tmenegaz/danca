# Cadernos de Ciclo

Registro descritivo do que aconteceu em cada aula, escrito **enquanto acontece**.
As regras de conteúdo estão em
[`protocolo/governanca-caderno.md`](../protocolo/governanca-caderno.md) — este
arquivo é o guia prático de preenchimento.

## Estrutura de diretórios

```
cadernos/
├── README.md                       este guia
└── ciclo-01/
    ├── caderno-01-duo.md           Duo (Fernando) — sextas, 60 min
    └── caderno-01-ritmos.md        Ritmos e Movimento (Gabi) — ter 60 + sáb 120
```

**Um caderno por ciclo, por escola** (P-09): as turmas não se misturam — nem nos
registros. O nome do arquivo segue o mesmo identificador da variante do ciclo
(`ciclo-01-duo` → `caderno-01-duo.md`), para que a rastreabilidade entre plano e
registro seja imediata.

## Diferença do relatório pós-aula

| | Caderno (`cadernos/`) | Relatório pós-aula |
|:--|:--|:--|
| Tempo | o que aconteceu na aula, na hora | a leitura do ciclo inteiro, no fim |
| Linguagem | descritiva, datada, sem revisão | revistos, com análise e decisão |
| Classifica | **nunca** | **nunca** (classificação é do PPQ) |
| Alimenta | a declaração do PO do ciclo seguinte (P-02) | o plano do próximo ciclo |

## Como preencher

Uma entrada por aula (ou por momento relevante dentro dela), nesta forma:

```markdown
## [dd/mm/aaaa] · [aula 01 — solo, alinhamento dos metatarsos]

### O que aconteceu
- descrição seca do que se viu, na ordem em que aconteceu

### O que decidi
- decisão tomada em aula e o que a motivou naquele momento

### O que me surpreendeu
- o que fugiu do previsto (para melhor ou para pior)

### Pergunta emergente
- a pergunta que ficou aberta, formulada como pergunta
```

Regras de escrita:

- **datas** sempre no cabeçalho da entrada;
- **uma observação por linha**, começando pelo fato (não pela interpretação);
- **citações diretas** entre aspas, marcadas como fala da aluna;
- **espaço para ajuste**: se a decisão da aula mudou o plano da seguinte, isso é
  uma linha, não um parágrafo;
- **sem adjetivo essencializante** sobre pessoas (ver a tabela "O que evitar").

> **Apelidos, não letras.** No caderno de um ciclo, as alunas são referidas pelos
> **apelidos declarados no PO** (P-12) — nunca por letras (A, B, C) nem por descrições
> permanentes ("a aluna mais alta"). O apelido é o mesmo da aula 01 à aula 12 e em
> todos os relatórios. (O exemplo abaixo é **genérico e inventado**: não é de uma turma
> do projeto, por isso não usa os apelidos do Duo.)

## Exemplo preenchido (fictício, para ilustração)

> Este exemplo é **inventado** para mostrar a forma. Não descreve aula real de
> nenhuma turma.

```markdown
# Caderno — Ciclo 01 · Duo (Fernando) · sextas, 60 min

## 18/09/2026 · aula 01 — solo, alinhamento dos metatarsos

### O que aconteceu
- 5 alunas presentes; 1 chegou 8 minutos depois (transporte).
- Exercício 1.1 (sentada, 1ª → 2ª → 3ª → 4ª → 5ª): nas posições 3ª e 4ª, três
  alunas travaram o joelho para "achar" o pé.
- Exercício 1.2 (relevé sentado): a subida aconteceu no tempo 1 em 4 das 5
  primeiras repetições; da 4ª em diante, em 2 repetições o calcanhar saiu antes.
- A aluna que chegou atrasada fez o 1.1 deitada, com apoio.

### O que decidi
- Reduzi o 1.2 de 2 séries para 1 e usei os 3 minutos restantes para repetir a
  3ª posição sem apoio de joelho.
- Não entrei no centro com o exercício 3.2; fiz só o 3.1 e fui para a
  musicalidade antes do previsto.

### O que me surpreendeu
- Quando a contagem foi dada com palma (não com a voz), a aluna que saía no
  tempo 2 passou a sair no tempo 1.
- Duas alunas corrigiram a colega do lado sem conseguir dizer o critério que
  usaram para saber que estava errado.

### Pergunta emergente
- O que a aluna está olhando quando diz que "sentiu" o pé estar alinhado?
- A palma marcando o tempo funciona porque é outro canal, ou porque é mais
  lenta que a voz?

> Próxima aula: entrar pela subida do calcanhar antes do alinhamento dos
> metatarsos (verificar se a ordem muda o travamento do joelho na 3ª posição).
```

## O que evitar

| Evitar | Motivo | Escrever assim |
|:--|:--|:--|
| "a aluna é desatenta" / "a turma é fraca" | adjetivo essencializante: fixa a pessoa | descrever o episódio com data |
| "isto é conhecimento tácito" | classificação (reservada ao PPQ — P-05/P-07) | descrever a cena observada |
| "a aula foi ótima" | juízo sem referência | o que fechou, o que não fechou |
| "como eu suspeitava" | narração retroativa | a pergunta como apareceu, com data |
| "os dados mostram" | material tratado como evidência | "o caderno registra, em 3 aulas, ..." |
| fotos ou vídeos de alunas neste arquivo | exposição de terceiros | anotar apenas que houve registro audiovisual, com a autorização combinada |

## Como versionar

1. **O caderno é fonte**, não saída: é versionado no Git (Regra 17).
2. Commit no padrão do projeto:

   ```bash
   git add cadernos/ciclo-01/caderno-01-duo.md
   git commit -m "docs(caderno): registra a aula 01 do Ciclo 01 no Duo" \
     -m "Registro descritivo da aula de 18/09 (solo: alinhamento dos metatarsos).
Sem classificação: apenas o que aconteceu, o que decidi, o que surpreendeu e as
perguntas emergentes.

Refs: cadernos/ciclo-01/caderno-01-duo.md
Regras: 8 (Proveniência), 12 (Observação pedagógica), 17 (Versionamento)
Auditoria: sim"
   ```

3. O caderno é **publicado no pacote** (HTML + PDF) **e é fonte do hash da âncora**.
   A versão-fonte continua sendo o `.md` — o HTML e o PDF do pacote são gerados a
   partir dele. (Antes de 19/09/2026 ele ficava fora do pacote por decisão de
   método: a ausência de forma final era parte da função. A decisão mudou.)
4. **Não** editar uma entrada antiga para "corrigir" o que foi escrito. Se algo
   foi anotado errado, a correção é uma nova entrada datada — o registro anterior
   permanece. Isso é a P-06 aplicada ao próprio caderno: o passado não é
   reescrito, é acrescido.
5. O caderno **entra na declaração de hash do ciclo** desde 19/09/2026: ele está
   no `DOCS` do manifesto e o `tools/hash-ciclo.sh` o cobre como qualquer outro
   documento. A ligação com a cadeia de proveniência deixou de ser apenas documental — o que
   dá ainda mais peso à regra acima: editar uma entrada antiga muda a âncora do
   ciclo. O passado não se reescreve; acrescenta-se.

## Senha de proteção dos acompanhamentos

O **acompanhamento por aluna** (a vista individual do ciclo, gerada do PO e dos
relatórios) é publicado no site como `acompanhamento-<aluna>.html` — e é o único
material do pacote que fica **criptografado**. Ele não é um caderno: o caderno é o
registro bruto da aula; o acompanhamento é a leitura por aluna, e é esse que sai
do círculo do professor. A seção está aqui porque as duas peças nascem do mesmo
material — quem lê o caderno costuma querer o acompanhamento.

- As senhas **não ficam no repositório**: ele é público.
- Ficam em `tools/.senhas-locais`, que **não é versionado** (está no `.gitignore`).
- O formato está em `tools/.senhas-locais.exemplo` — uma variável por escola
  (`SENHA_DUO`, `SENHA_RITMOS`, `SENHA_DEBORA`). Para criar:

  ```bash
  cp tools/.senhas-locais.exemplo tools/.senhas-locais
  chmod 600 tools/.senhas-locais
  ```

- Se o arquivo não existir, ou a variável da escola estiver vazia, o
  `tools/gerar-acompanhamento.sh` **pede a senha no terminal**. Sem terminal e sem
  senha ele falha — e o `tools/check-pacote.js` **reprova** o pacote. Um
  acompanhamento de aluna não chega ao site em claro.
- **Para trocar a senha:** edite `tools/.senhas-locais` e rode
  `tools/gerar-ciclo.sh <professor> <ciclo> <escola>` outra vez — o gerador
  regrava o HTML e criptografa na sequência. A troca é alteração de
  infraestrutura: exige motivo declarado no commit e entrada no `REGISTRO.md`
  (ver `CONGELAMENTO.md`).
- O `.conf` da escola declara apenas a **intenção**
  (`ACOMPANHAMENTO_CRIPTOGRAFADO="sim"`), nunca a senha.
- O HTML cifrado **não é determinístico**: cada execução usa sal e IV novos, então
  os acompanhamentos mudam de bytes a cada geração — com a mesma senha e o mesmo
  conteúdo. Regenerar o pacote deixa essas páginas "modificadas" no Git: é
  esperado. O que não muda é o que a senha abre.
- Rodar a criptografia **duas vezes sem regerar o HTML** é recusado de propósito.
  A segunda execução não sabe decifrar: cifraria a própria cifra e o arquivo
  deixaria de abrir. Para cifrar de novo, gere o pacote outra vez
  (`tools/gerar-ciclo.sh`) — o HTML nasce em claro e é cifrado na sequência.

> **O que a criptografia protege — e o que não protege.** Ela protege o **site**
> (a página navegável publicada pelo Netlify). Não protege o **PDF consolidado**
> do ciclo, que reúne os mesmos acompanhamentos, nem os **`.md` de origem** em
> `professores/<professor>/ciclos/`. Ambos ficam em claro no repositório, que é
> público — o conteúdo é pseudonimizado pelos apelidos (P-12), mas é o mesmo
> conteúdo. Fechar essa parte é decisão da pesquisadora (ver `REGISTRO.md`,
> 19/09/2026).

## Próximos passos

```bash
mkdir -p cadernos/ciclo-01
cp cadernos/README.md /dev/null   # (o guia fica aqui; o caderno é criado por você)
$EDITOR cadernos/ciclo-01/caderno-01-duo.md
```

> Os três cadernos do Ciclo 01 ainda **não existem** — eles só podem ser
> escritos por quem dá a aula. Este guia é o que o projeto oferece: uma forma que
> preserva o registro sem transformá-lo em argumento.

