# experimentos/ — área de teste

O que fica aqui **não entra no hash da âncora**, **não entra no pacote** e **não é
publicado**. É área de teste: se funcionar, sai daqui e entra nos diretórios
oficiais; se não, some.

## Por que isso é seguro por construção

Não depende de disciplina — depende de como o projeto é montado:

| O que | Por que o `experimentos/` não afeta |
|:--|:--|
| **Hash da âncora** | cobre as fontes do ciclo, resolvidas por `tools/lib-fontes.sh` (`index` + `DOCS` + PO + manifestos + relatórios). Nada daqui é fonte |
| **Pacote** | é montado de `DOCS` + acompanhamentos. Nada daqui está nessas listas |
| **Site publicado** | o Netlify serve os pacotes versionados. Nada daqui é publicado |
| **`check-pacote`** | valida o pacote, não a raiz do repositório |

Ou seja: **experimentar aqui não pode quebrar produção.**

## Como testar localmente

```bash
python3 -m http.server 8000 --bind 127.0.0.1     # da RAIZ do repositório
# abra http://127.0.0.1:8000/experimentos/<experimento>/
```

Use `127.0.0.1` (e não `file://`): páginas que usam WebCrypto — como o
PageCrypt dos acompanhamentos — só funcionam em contexto seguro, e `file://`
pode falhar sem dizer por quê.

**E sirva da RAIZ, não com `--directory experimentos`** (medido, 20/09/2026): as páginas dos
experimentos consomem libs que vivem **fora** de `experimentos/` — a `tools/lib-vistas.js`, por
exemplo, entra por `<script src="../../tools/lib-vistas.js">`. Servindo só a pasta `experimentos/`,
a página abre (200) e a **lib dá 404** ✗: o experimento fica sem os builders.

**O sintoma, quando acontece (medido, 20/09/2026):** a página abre e o painel diz *"Detalhe:
Vistas is not defined"*. É a lib que deu 404 — mas o erro vem com a cara de outra coisa, porque o
`ciclos.json` da mesma pasta carrega normalmente. A conferência é abrir
`../../tools/lib-vistas.js` direto no navegador: **404 = o servidor não está na raiz.** Vale para
servidor **antigo** também: um `http.server` no ar desde antes de a lib existir (a 8001 deste
repositório ficou assim) serve a página e não serve a lib — derrube e suba de novo:

```
pkill -f 'http.server 8001'
python3 -m http.server 8001 --bind 127.0.0.1        # da RAIZ do repositório
```

O formulário passou a dizer isso por si (o painel nomeia a lib que faltou, em vez de culpar o
`ciclos.json`), mas o conserto é o servidor, não a página: a mensagem existe para o sintoma
apontar para a causa sem passar por três tentativas.

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

**`captura-json`** — o gerador de vistas sob demanda: lê o JSON do ciclo e deriva o caderno, o
relatório e o acompanhamento; e, desde 20/09/2026, também o **guia de observação** e a
**musicalidade**, que derivam das DUAS entradas — o PO e o plano.

Os JSONs de entrada desse experimento **não são escritos à mão**: eles saem dos extratores
(`tools/validar-po-ciclo.js --json`, `tools/validar-plano-ciclo.js --json`), pelo contrato
compartilhado (`tools/lib-extracao-md.js`, `tools/lib-validacao-md.js`). A leitura à mão que
existia antes ficou guardada como REFERÊNCIA, e é com ela que o `diff-classificado.js` (local)
prova que a estrutura extraída **é o que o documento oferece** — sem diferença sem classe.

**E os builders das vistas saíram do formulário** (peça 2 da migração, 20/09/2026): o caderno, o
relatório, o acompanhamento, o guia e a musicalidade agora vivem em **`tools/lib-vistas.js`** —
uma definição só, consumida por este experimento (`<script src="../../tools/lib-vistas.js">`) **e
pelo gerador** (Node). Aqui não há cópia: o formulário chama `Vistas.guia({…})`, `Vistas.caderno({…})`
e `Vistas.helpers.*`. E a igualdade está provada: com o mesmo `prov`, **o guia do Node é idêntico
ao do formulário**; sem `prov` (o caso do gerador), a única diferença é o carimbo — declarado.

A área foi criada em 19/09/2026, junto com a documentação da
ideia de captura em JSON (`IDEIA-CAPTURA.md` e `ARQUITETURA-CAPTURA.md`), para
que a experimentação tenha onde acontecer sem tocar no que está publicado.