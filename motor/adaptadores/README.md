# adaptadores/ — a infraestrutura, plugável

Cada adaptador **só implementa** o contrato de `../nucleo/armazenamento.js`
(`ler`/`guardar`/`anexar`/`listar`/`existe`/`apagar`). Nenhum acrescenta lógica; nenhum sabe o que é um PO ou
uma anamnese.

| Arquivo | Backend | `ler` | `guardar`/`listar`/`existe` |
|:--|:--|:--|:--|
| `node.js` | `node:fs` | disco (fs) | disco (fs) |
| `cloudflare.js` | `env.ASSETS` + `env.PADD_KV` | ASSETS (estático) e KV (envelope) | KV |

A divisão do adaptador Cloudflare espelha o `workers/receber.js`: o ASSETS serve o que não
muda (o conteúdo `po.json`/`anamnese.json`/esquema), o KV guarda o que a elicitação produz (os
envelopes). O adaptador Node usa um único `fs` para as duas coisas — é a diferença que o
contrato absorve.

## Como se escolhe no arranque

Por **injeção**, não por variável de ambiente: quem monta o ambiente (a ponte
`servidor/node.js` ou `servidor/cloudflare.js`) cria o adaptador e o passa ao roteador. O
núcleo nunca vê qual adaptador está em uso.
