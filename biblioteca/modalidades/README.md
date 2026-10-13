# Modalidades — a base canónica do vocabulário e da progressão

> **Natureza:** conteúdo compartilhado, versionado — como o `guia-do-professor`.
> Todas as escolas leem; nenhuma duplica. A escola **declara** no `ESCOLA.conf` (planeado no
> `IDEIA-PAINEL-ESCOLA.md` §10) **o que usa e como organiza** — não cadastra o que já está aqui.

## Estrutura

```
biblioteca/modalidades/
  README.md                ← este arquivo
  bale-classico/
    vocabulario.json       ← passos, posições, direções, saltos, ligações, giros
    progressao.json        ← turmas (Balé Nível 1..8 + Vocacional) + a relação turma↔termo
    tradicoes.json         ← RAD · francesa · Vaganova — as diferenças de nomenclatura
  danca-moderna/
    README.md              ← esqueleto (a base ainda não está preenchida)
```

## Regra de conteúdo (P-16 — declarado, nunca deduzido)

- **Não se inventa equivalência entre escolas.** A tabela de diferenças (`tradicoes.json`) é
  orientação inicial, **não** tabela normativa; cada afirmação registra a sua fonte, e o que não
  tem confirmação fica `estado: "aguardando validação"`.
- **Passo ≠ posição ≠ direção ≠ exercício ≠ família.** O campo `categoria` distingue — não se
  classifica tudo como «passo».
- **O termo canónico** preserva a grafia (acentos, francesa); o `id` é o slug (P-17 — o nome de
  exibição nunca vira chave).

## O que ainda não está feito

- A base `danca-moderna/` (Graham, Limón, Horton, Humphrey–Weidman) **não foi preenchida** — a
  pesquisadora fornecerá o conteúdo validado; o esqueleto fica como `[Preencher]`.
- O `ESCOLA.conf` ainda não existe: até lá, o KV (`catalogo-seed.js` + rotas) é **andaime
  temporário** que alimenta o cadastro. Quando o `ESCOLA.conf` nascer, a escola passa a
  **escolher** daqui — e o botão «Carregar catálogo inicial» desaparece.
