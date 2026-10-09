# nucleo/ — o núcleo agnóstico do PE

A lógica do motor — **validar, derivar, elicitar** — sem infraestrutura. Este diretório é o
que o pedido chama de **núcleo**: não sabe onde corre, não sabe de onde lê, não sabe para onde
escreve. Só sabe **o que faz**.

| Arquivo | O que é |
|:--|:--|
| `validar.js` | o validador mínimo (`validarCom`, `validar`, `tipoDe`, `iguais`, `resolverRef`) — sem `fs`/`path`/`http`/`process` |
| `derivar-plano.js` | o derivador (`derivar`, `enderecar`, `valoresDaForma`, `procurarRamo`) — recebe o conteúdo, devolve o plano |
| `elicitar.js` | o runtime de elicitação (`elicitar`, `nosRespondiveis`, `ramificar`, `derivarEstado`, `completar`) — recebe conteúdo + respostas + esquema, devolve documento/estado/relatório |
| `ia.js` | a conversa de IA (o stub de hoje, o DeepSeek de amanhã): `conversar`/`respostaDaIA` + o freio (`limiteTurnos`) — sem `fs`/`path`/`http`/`process` |
| `ficha.js` | a ficha imprimível (o markdown da anamnese/PO): `renderizar`/`metodosDeOrigem` — sem `fs`/`path`/`http`/`process` |
| `ficha-html.js` | a ficha vista no navegador (a folha HTML, a partir do markdown): `paginaDaFicha`/`paginaDaFichaEmBranco`/`corpoDaFicha` — sem infraestrutura |
| `porta.js` | a lógica da porta (registro, mapa, vínculo, estados, carimbo, gravação, elicitação) — recebe o armazenamento por parâmetro, nunca um `fs` |
| `derivar-po.js` | a ponte envelope → fonte do PO: o envelope elicitado vira o `ciclo-XX-<escola>-po.md` (a fonte que `gerar-ciclo.sh` gera e `hash-ciclo.sh` ancora) — sem `fs`/`path`/`http`/`process` |
| `armazenamento.js` | o **contrato de armazenamento** (`ler`/`guardar`/`anexar`/`listar`/`existe`/`apagar`) e a implementação de memória |

## A fronteira

- O núcleo **não importa** `fs`, `path`, `http` nem nada do runtime — a prova
  (`provar-agnosticismo.js`) verifica isso por máquina.
- O núcleo **recebe** o que precisa: o `elicitar` exige `opcoes.esquema` (o contrato já
  carregado pelo adaptador) e devolve o documento em memória. Ele **não vai buscar** nada ao
  disco.
- O núcleo **não usa** o armazenamento: quem lê o conteúdo/esquema e persiste o envelope é o
  **adaptador** (`adaptadores/`).

## O que ficou no `motor/`

O diretório `motor/` continua a existir — mas agora é o **adaptador Node**: reexporta o núcleo
e acrescenta o que é de runtime (os caminhos, a leitura do disco, o autoteste e a CLI). Os
mesmos comandos de sempre continuam a funcionar (`node motor/elicitar.js --autoteste` ⇒ 41/41;
`node motor/validar.js --autoteste` ⇒ 22/22; `node motor/derivar-plano.js`).
