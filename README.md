# Formação em Balé Clássico — visão geral

Repositório único com as **duas frentes** do projeto: as **aulas** (ciclos de
aprendizagem) e a **apresentação** (deck do rizoma). Tudo gerado por scripts,
validado automaticamente e versionado com proveniência.

## Sobre os dados deste repositório

O material de observação refere as alunas **por apelidos estáveis** (P-12), nunca por nome
completo, e não inclui dados de contato, de saúde ou de avaliação fora do recorte
declarado no PO. É material de **pesquisa em andamento** (mestrado): descreve o que
aconteceu em aula, não classifica pessoas (P-06).

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
│   └── tiago/
│       ├── ciclos/
│       │   ├── ciclo-01.conf             manifesto base (objetivo, aulas, faixas)
│       │   ├── ciclo-01-<escola>.conf    contexto institucional: duo · ritmos · debora
│       │   ├── ciclo-01-*.md             fontes: plano, aula-01, notação, musicalidade…
│       │   └── ciclo-01-<escola>/        pacote entregue: HTML + PDF (versionado — o
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
| Gerar a entrega de um ciclo para uma escola | `tools/gerar-ciclo.sh 01 duo` (ou `ritmos`, `debora`) |
| Validar um pacote de ciclo | `node tools/check-pacote.js professores/tiago/ciclos/ciclo-01-duo` |
| Fazer deploy de um ciclo no Netlify | `tools/deploy-netlify.sh tiago 01 duo` |
| Recalcular só o calendário de uma escola | `python3 tools/calendario.py --escola Duo --frequencia '1x/semana' --dias 5 --inicio 17/09/2026 --total 12 --duracao-curta 60 --volume-curto 90` |
| Exportar o deck (PDF/PPTX/HTML/PNG) | ver `apresentacoes/apresentacao-01-rizoma/README.md` |
| Validar o deck (nenhum slide estoura) | `node tools/check-overflow.js` |
| Validar os mapas do rizoma | `node tools/check-mapa.js` · `node tools/medir-rotulos.js` |
| Instalar os hooks de versionamento | `tools/instalar-hooks.sh` |

## Como o trabalho flui

```
1. fontes em Markdown            →  professores/*/ciclos/*.md  ·  apresentacoes/**/*.md
2. gerar                          →  tools/gerar-ciclo.sh tiago 01 duo
3. validar                        →  check-pacote.js · check-overflow.js · check-mapa.js
4. auditar contra as regras       →  REGRAS.md  (commit audit(escopo): ...)
5. commitar com proveniência      →  tipo(escopo): resumo + Refs/Regras/Auditoria
6. mergear em main depois da auditoria
```

## Deploy no Netlify — uma conta por escola

Cada escola (**Duo**, **Ritmos e Movimento**, **Débora**) tem a sua **própria conta** no
Netlify, com o seu token e o seu site. Os tokens e os site IDs ficam em
`tools/.netlify-tokens` — **não versionado** (o `.gitignore` cobre), criado como template
na primeira execução do script:

```bash
tools/deploy-netlify.sh tiago 01 duo      # primeira vez: cria o template e sai
# preencha NETLIFY_TOKEN_DUO e NETLIFY_SITE_DUO no arquivo
tools/deploy-netlify.sh tiago 01 duo      # agora deploya
```

O token vai para o `netlify-cli` como `NETLIFY_AUTH_TOKEN` **só naquela execução**, então
não é preciso `netlify login` nem trocar de conta à mão entre escolas. Para gerar o token:
`app.netlify.com/user/applications#personal-access-tokens`; o site ID aparece em
`netlify sites:list` ou no painel do site.

> `tools/.netlify-tokens` é lido como shell. Trate como credencial: não versione, não
> copie de terceiros, não deixe em pasta compartilhada.

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
git log --follow professores/tiago/ciclos/ciclo-01-aula-01.md   # histórico de um arquivo
git log --grep="audit"                        # auditorias
git log --oneline -- professores/tiago/ciclos/ciclo-01-duo/    # histórico de um ciclo
```
