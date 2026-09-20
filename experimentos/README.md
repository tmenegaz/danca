# experimentos/ — área de teste

O que fica aqui **não entra no hash FIPP**, **não entra no pacote** e **não é
publicado**. É área de teste: se funcionar, sai daqui e entra nos diretórios
oficiais; se não, some.

## Por que isso é seguro por construção

Não depende de disciplina — depende de como o projeto é montado:

| O que | Por que o `experimentos/` não afeta |
|:--|:--|
| **Hash FIPP** | cobre as fontes do ciclo, resolvidas por `tools/lib-fontes.sh` (`index` + `DOCS` + PO + manifestos + relatórios). Nada daqui é fonte |
| **Pacote** | é montado de `DOCS` + acompanhamentos. Nada daqui está nessas listas |
| **Site publicado** | o Netlify serve os pacotes versionados. Nada daqui é publicado |
| **`check-pacote`** | valida o pacote, não a raiz do repositório |

Ou seja: **experimentar aqui não pode quebrar produção.**

## Como testar localmente

```bash
python3 -m http.server 8000 --bind 127.0.0.1
# abra http://127.0.0.1:8000/experimentos/<experimento>/
```

Use `127.0.0.1` (e não `file://`): páginas que usam WebCrypto — como o
PageCrypt dos acompanhamentos — só funcionam em contexto seguro, e `file://`
pode falhar sem dizer por quê.

> **Atenção:** `tools/deploy-netlify.sh` **publica em produção** (uma conta por
> escola). Ele **não** é o caminho de preview — não use para experimentos. Para
> ver um experimento no ar, `git push` não serve: nada de `experimentos/` é
> publicado. Se um experimento precisar de site, ele deixa de ser experimento.

## O que é versionado

**Só este README.** O resto de `experimentos/` é ignorado pelo Git (`.gitignore`).

O motiva: experimento é rascunho. Versionar rascunho enche o histórico de
tentativas que ninguém vai ler — e o que vale vira produção, com commit próprio.
Se um experimento precisar ser guardado como está, ele vira um documento
(`IDEIA-*.md`, `ARQUITETURA-*.md`) na raiz, que é onde as ideias são registradas.

## Estrutura sugerida

```
experimentos/
├── README.md                    este arquivo (o único versionado)
└── captura-json/                um diretório por experimento
    ├── formulario.html
    ├── dados-exemplo.json
    └── anotacoes.md
```

## Quando um experimento vira produção

1. **Documento de ciclo** (aula, caderno, relatório…): entra nos diretórios do
   professor, é declarado no `DOCS` do manifesto e passa a ser fonte do hash;
2. **Ferramenta**: entra em `tools/`, com commit próprio e motivo declarado
   (`tools/` está congelado — ver `CONGELAMENTO.md`);
3. **Mudança de infraestrutura**: motivo declarado no commit + entrada no
   `REGISTRO.md`;
4. **Ideia que ainda não é para implementar**: vira `IDEIA-*.md` (o porquê) e,
   se tiver desenho, `ARQUITETURA-*.md` (o como) — e o `HANDOFF.md` passa a
   listá-los sozinho.

## Experimentos em curso

**Nenhum ainda.** A área foi criada em 19/09/2026, junto com a documentação da
ideia de captura em JSON (`IDEIA-CAPTURA.md` e `ARQUITETURA-CAPTURA.md`), para
que a experimentação tenha onde acontecer sem tocar no que está publicado.