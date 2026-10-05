# Projeto Ciclo — visão geral

> **O que este projeto é e por quê → [`METODO.md`](METODO.md)**
>
> **Ideias futuras → [`IDEIA-CAPTURA.md`](IDEIA-CAPTURA.md) ·
> [`ARQUITETURA-CAPTURA.md`](ARQUITETURA-CAPTURA.md)**

**Projeto Ciclo** é a **memória da aula dada**. Cada aula é **planejada** antes de ser dada: o
plano (`aula-NN.md`, que entra na âncora de proveniência) fixa objetivo, marcos e volume, e é ele
que dá a **linha de base**. O que a memória registra é o processo de ensino-aprendizagem que de
fato se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda. Repositório
único com as **duas frentes**: as **aulas** (ciclos de aprendizagem) e a **apresentação**
(deck do rizoma). Tudo gerado por scripts, validado automaticamente e versionado com
proveniência.

## O que este repositório não é

- **Não é o projeto de mestrado.** O mestrado está em **outro diretório**; é de lá que vêm
  o PO (Protocolo de Observação) e o FIPP. Este repositório **aplica** um PO — e o usa como
  experimentação — mas **não implementa o FIPP**.
- **A âncora de proveniência aqui é uma aproximação.** `tools/hash-ciclo.sh` produz uma
  âncora encadeada (`.fipp`) que compartilha o princípio do FIPP — o passado se incorpora,
  não se reescreve —, mas está **longe** do que a arquitetura do FIPP desenha.
- **Este projeto é PROTÓTIPO — ele não é agnóstico.** Está sendo **testado no universo da
  dança**. A partir dele será criado o projeto que **deve ser agnóstico** (o projeto-alvo,
  ainda não existente), para transitar em todos os universos: oficina de balé, oficina de
  matemática, improvisação em dança contemporânea, disciplina de mestrado.
- **O projeto não avalia.** Registra o cotidiano do professor em sala de aula; a avaliação
  é fronteira de outro módulo, ainda não desenhado.

## Sobre os dados deste repositório

O material de observação refere as alunas **por apelidos estáveis** (P-12), nunca por nome
completo, e não inclui dados de contato, de saúde ou de avaliação fora do recorte
declarado no PO. Descreve o que aconteceu em aula e **não classifica pessoas** (P-06).

```
.
├── REGRAS.md                     as 17 regras do projeto (versionadas)
├── README.md                     este arquivo: visão geral e atalhos
├── README-ciclos.md              documentação da entrega de ciclos (Regra 16)
├── apresentacoes/
│   └── apresentacao-01-rizoma/   deck "O Repertório Vivo" (72 slides) + mapas
│       ├── apresentacao-ballet.md      fonte Marp
│       ├── rizoma-slide.svg            mapa do slide 68 (fonte da verdade)
│       ├── rizoma-corrigido.svg        mapa completo (26 caixas, 33 arestas)
│       ├── rizoma-animado.html         mapa animado (gerado)
│       ├── README.md                   documentação detalhada do deck
│       └── out/                        PDF, PPTX, HTML, PNGs (não versionado)
├── professores/                  um professor por pasta (P-13)
│   ├── README.md                 o que é um professor, o que tem, como adicionar
│   └── fokini/
│       ├── ciclos/
│       │   ├── ciclo-01.conf             manifesto base (objetivo, aulas, faixas)
│       │   ├── ciclo-01-diaghilev.conf   contexto institucional + conteúdo da escola
│       │   │                             (cada escola tem o seu ciclo: diaghilev)
│       │   ├── ciclo-01-*.md             fontes: plano, aula-01, notação, musicalidade…
│       │   └── ciclo-01-diaghilev/       pacote entregue: HTML + PDF (versionado — o
│       │                                 deploy automático publica daqui)
│       ├── cadernos/             caderno descritivo por aula (P-06)
│       ├── relatorios/           relatórios pós-aula, um por aula
│       └── campo/                material bruto de campo
├── departamentos/                PO de departamento, quando a escola tiver metodologia
│                                 comum (P-14) — hoje nenhuma tem
├── biblioteca/                   referências compartilhadas por todos os professores
└── tools/                        geradores, validadores e hooks
```

## Atalhos

| Quero… | Comando |
|:--|:--|
| Gerar a entrega de um ciclo para uma escola | `tools/gerar-ciclo.sh fokini 01 diaghilev` |
| Validar um pacote de ciclo | `node tools/check-pacote.js professores/fokini/ciclos/ciclo-01-diaghilev` |
| Fazer deploy de um ciclo no Cloudflare | `npx wrangler deploy` |
| Recalcular só o calendário de uma escola | `python3 tools/calendario.py --escola Diaghilev --frequencia '2x/semana' --dias '2@19:00,4@19:00' --inicio 06/10/2026 --total 5 --duracao-curta 60 --volume-curto 90` |
| Exportar o deck (PDF/PPTX/HTML/PNG) | ver `apresentacoes/apresentacao-01-rizoma/README.md` |
| Validar o deck (nenhum slide estoura) | `node tools/check-overflow.js` |
| Validar os mapas do rizoma | `node tools/check-mapa.js` · `node tools/medir-rotulos.js` |
| Instalar os hooks de versionamento | `tools/instalar-hooks.sh` |

## Como o trabalho flui

```
1. fontes em Markdown            →  professores/*/ciclos/*.md  ·  apresentacoes/**/*.md
2. gerar                          →  tools/gerar-ciclo.sh fokini 01 diaghilev
3. validar                        →  check-pacote.js · check-overflow.js · check-mapa.js
4. auditar contra as regras       →  REGRAS.md  (commit audit(escopo): ...)
5. commitar com proveniência      →  tipo(escopo): resumo + Refs/Regras/Auditoria
6. mergear em main depois da auditoria
```

## Deploy no Cloudflare — um Worker por escola

Cada escola (**Diaghilev**, hoje a única) é um **Worker próprio**, ligado a este repositório
pelo painel do Cloudflare. O deploy é **automático no push**: não há script de deploy, e o
caminho manual é o `wrangler`.

O `wrangler.jsonc` na raiz do repositório declara **um** Worker — a escola ativa:

| O que o Worker serve | Como |
|:--|:--|
| o pacote do ciclo (HTML, PDF, `assets/`) | **assets estáticos**, apontando para `professores/fokini/ciclos/ciclo-01-diaghilev` |
| o POST do lançamento | a rota `/api/receber`, atendida pelo script `workers/receber.js` |
| a gravação | `env.PADD_KV`, o namespace KV `ciclos-escolas` |

O Cloudflare serve **primeiro o asset estático**; só o que não casa com um arquivo chega ao
script. Por isso a rota `/api/receber` funciona e o resto do pacote é servido direto, sem
custo de Worker — a mesma origem atende a página e a API, e o formulário chama um caminho
**relativo** (sem CORS e sem URL de Worker no código).

```bash
npx wrangler deploy              # deploy manual (o normal é o push)
npx wrangler dev                 # roda local, com KV local em .wrangler/state
npx wrangler deploy --dry-run    # confere o pacote e os bindings sem publicar
```

Para uma **escola nova**: copie o `wrangler.jsonc` mudando `name` e `assets.directory` (e, se
for o caso, o binding do KV), e crie o projeto no painel ligado a este repositório. A
**rota pública mora no painel**, não no `wrangler.jsonc` — é ela que dá a cada escola um
endereço sem que uma saiba dos dados das outras.

> **Credenciais.** Nada de credencial do Cloudflare fica versionado nem em arquivo local
> deste repositório: o vínculo com o GitHub é do painel, e o `wrangler login` mora no perfil
> da máquina. Para uma variável de ambiente em dev, o lugar é um `.dev.vars` (coberto pelo
> `.gitignore`).

> **O KV é o cofre, o pacote é a vitrine.** O que o formulário envia — e o Worker grava — é o
> JSON do ciclo **em claro**: quem cifra é a geração do pacote seguinte
> (`tools/gerar-ciclo.sh`). O KV **não** é servido por GET; leia pelo painel ou com
> `npx wrangler kv key get --binding PADD_KV <chave>`.

## Regras do projeto

As 17 regras (terminologia RAD, fio condutor, causa e consequência, proveniência,
distribuição de volume calibrada pela duração, entrega em PDF + HTML, versionamento)
estão em **[`REGRAS.md`](REGRAS.md)**. Elas não são sugestões: os geradores e
validadores as aplicam — por exemplo, **sem a duração da aula o gerador recusa
construir o material**, e o volume fora da faixa da duração interrompe a geração.

## Versionamento (Regra 17)

- **Fontes versionadas; saídas não** (`.gitignore`): PDF, HTML, PPTX e PNG são
  reconstruíveis a partir dos Markdown + scripts.
- **Commits** no padrão `tipo(escopo): resumo` com rodapé obrigatório
  `Refs:` · `Regras:` · `Auditoria:` — validado pelo hook `commit-msg`.
- **Branches**: `main` só recebe conteúdo auditado; `ciclo-XX` e `apresentacao-XX`
  são linhas de trabalho.
- **Hooks**: instalados por `tools/instalar-hooks.sh` (o `.git/hooks` não é
  versionado, então a fonte fica em `tools/hooks/`).

```bash
git log --follow professores/fokini/ciclos/ciclo-01-diaghilev-aula-01.md   # histórico de um arquivo
git log --grep="audit"                        # auditorias
git log --oneline -- professores/fokini/ciclos/ciclo-01-diaghilev/         # histórico de um ciclo
```
