# Material de campo

Instrumentos de coleta **e** as respostas obtidas em campo. Tudo aqui é
**material bruto** (P-05): registro do que foi dito e respondido — não é evidência,
não é classificação e não tem análise (P-06).

## Estrutura

```
campo/
└── AAAA-MM-DD-<escola>/       um diretório por evento de campo
    ├── formulario.md          o instrumento aplicado, como foi aplicado
    ├── respostas.md           as respostas, digitadas (sem nome nem contato)
    └── (anexos, se houver)
```

O nome do diretório é a **data real do evento** mais a escola, no mesmo padrão do
calendário dos ciclos — assim o material de campo se liga ao ciclo correspondente
sem precisar de índice.

| Evento | Data | Escola | Instrumento |
|:--|:--|:--|:--|
| Formulário de prática e recepção | **03/10/2026** (sábado — dia de aula da Ritmos) | Ritmos e Movimento (Gabi) | [`2026-10-03-ritmos/formulario.md`](2026-10-03-ritmos/formulario.md) |

## Regras

1. **O instrumento é versionado como foi aplicado.** Se o formulário mudar para o
   próximo evento, cria-se um novo diretório — o anterior permanece intacto
   (mesma lógica do caderno: o passado não é reescrito, é acrescido).
2. **Nome e contato não entram no repositório.** O bloco de interesse (seção 9,
   opcional) pede nome e contato: esses dados ficam **fora** do Git, em arquivo
   local. Em `respostas.md` entra a resposta, sem identificação.
3. **As respostas são transcritas, não interpretadas.** Se algo precisar de
   leitura, a leitura vai para outro lugar — e só quando as condições da P-07
   existirem.
4. **A seção opcional é opcional de verdade:** formulário sem a seção 9 é
   formulário completo. Não se cobra, não se insiste.

## Relação com o protocolo

| Peça | Papel |
|:--|:--|
| **PE** (Protocolo de Elicitação) | o formulário é o **instrumento**: pergunta o que já existe na prática de quem responde |
| **P-05** | o que volta é material bruto — vira evidência só no PPQ, sob as condições da P-07 |
| **P-06** | transcrição descritiva: sem juízo, sem adjetivo essencializante sobre quem respondeu |
| **Pré-requisito 5** | cada evento de campo é de **uma** escola — não há mistura entre turmas |

Ver também [`PROTOCOLO.md`](../PROTOCOLO.md) e [`REGISTRO.md`](../REGISTRO.md).
