# REGISTRO — Marcos metodológicos do Projeto Ciclo

Registro descritivo (P-06) dos marcos que constituem o Projeto Ciclo como
objeto metodológico. Não é caderno pedagógico; é log do sistema.

## 18/09/2026 — Estrutura por professor (P-13, P-14) e migração do material

**O que aconteceu.**
O projeto deixou de assumir um único professor. O material de observação do Tiago foi
movido para `professores/tiago/` (ciclos, cadernos, relatórios, campo) e as ferramentas
passaram a receber o professor como argumento. O que é metodológico e compartilhado
ficou na raiz: `biblioteca/`, `apresentacoes/`, `protocolo/`, `tools/` e os documentos do
projeto (`PROTOCOLO.md`, `REGRAS.md`, `REGISTRO.md`, READMEs, `HANDOFF.md`).

**O que foi decidido.**
- P-13: o PO é do **professor**, não do projeto. Dois professores com a mesma escola e as
  mesmas alunas têm POs distintos — o recorte observacional é decisão de cada um.
- P-14: o PO pode derivar de um **PO de departamento**, onde a escola tiver metodologia
  comum (`parentHash` = hash do PO de departamento); sem isso, o PO é raiz.
- Hoje **nenhuma** escola do projeto tem PO de departamento — inclusive o Duo, que vai
  adotar RAD sem estrutura departamental. `departamentos/` fica pronto, aguardando.
- O **guia do professor** entra no pacote de todo ciclo (`biblioteca/guia-do-professor.md`):
  explica em que posição o professor está e o que não muda em nenhuma das duas formas.
- Ferramentas: `tools/gerar-ciclo.sh <professor> <ciclo> <variante>`; sem o professor,
  assume `tiago` — os comandos antigos continuam valendo.
- As âncoras FIPP passam a declarar `professor:`; a cadeia segue intacta (o Ciclo 01 é
  raiz, `parentHash` vazio).

**Com o quê.**
`professores/`, `departamentos/README.md`, `biblioteca/guia-do-professor.md`,
`PROTOCOLO.md`, `tools/gerar-ciclo.sh`, `tools/hash-ciclo.sh`, `tools/gerar-handoff.sh`,
`tools/check-pacote.js`, `tools/check-glossario.js`, `tools/hooks/pre-commit`,
`tools/hooks/commit-msg`, `.gitignore`.

**Referências.**
RAD (2015; 2025); `REGRAS.md` (17 regras); `PROTOCOLO.md` (P-10, P-11, P-13, P-14);
`biblioteca/README.md` (as duas listas de referência).

**O que ainda não está feito.**
Primeiro relatório pós-aula do Duo; POs de Ritmos e Débora; Ciclo 02; um segundo
professor (a estrutura está pronta, aguardando o primeiro).

## 18/09/2026 — PO do Ciclo 01 — Duo validado

**O que aconteceu.**
O primeiro PO do projeto foi declarado e validado. Cobre o Ciclo 01 do Duo:
quatro alunas, 11 anos, 12 aulas de fundamentos, professor Tiago Menegaz.
Estado: `Input_PO_Validado`.

**O que foi decidido.**
- PO é por escola (não por ciclo-base). Ritmos e Débora terão POs próprios.
- Linha de base declarada como campo próprio (P-10).
- Condições de contorno da execução declaradas (P-11).
- Registro específico das alunas é opcional, não obrigatório.
- Aulas de outros professores do Duo entram no recorte (processo contínuo).

**Com o quê.**
`PROTOCOLO.md`, `ciclos/ciclo-01-duo-po.md`, `tools/hash-ciclo.sh`,
`tools/validar-po-ciclo.js`.

**Referências.**
Taylor (2003); Polanyi (1966); Clippinger (2024); RAD (2015); Wulff;
Mirzabekiantz (2000); Parker (1990); Homans (2010); Paper FIPP
(operacionalização dos protocolos).

**O que ainda não está feito.**
POs de Ritmos e Débora; primeiro relatório pós-aula; Ciclo 02.
