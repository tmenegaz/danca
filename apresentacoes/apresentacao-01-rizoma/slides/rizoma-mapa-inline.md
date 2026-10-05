<!-- FLUXO DO MAPA DO RIZOMA (este arquivo não é mais um bloco para colar no deck;
     o slide 83 vive no deck e é gerado — não edite o SVG dentro do Markdown à mão).

     FONTE DA VERDADE DO MAPA DO SLIDE
       rizoma-slide.svg  →  fontes grandes, para projeção (é o que aparece no PDF/PPTX)
       depois de editar:  node tools/sincronizar-slide.js
       (injeta o SVG no deck entre os marcadores MAPA:INICIO / MAPA:FIM)

     FONTE DA VERDADE DO MAPA COMPLETO
       rizoma-corrigido.svg  →  todos os nós (26 caixas + você + legenda) e 33 arestas
       depois de editar:  node tools/gerar-animacao.js   (regera rizoma-animado.html)

     VALIDAR SEMPRE
       node tools/check-mapa.js rizoma-corrigido.svg
       node tools/check-mapa.js rizoma-slide.svg
       node tools/medir-rotulos.js rizoma-corrigido.svg rizoma-slide.svg
       node tools/check-overflow.js

     ARMADILHA DO SVG INLINE (custou uma rodada inteira de depuração)
       o CommonMark encerra o bloco HTML na primeira linha em branco: se as linhas
       do SVG quebrarem, o mapa aparece como CÓDIGO-FONTE no slide. Por isso o
       sincronizador remove as linhas em branco e o deck exporta com --html.

     LINHAGEM (estado atual)
       Weaver 1717 → Noverre 1760 → Didelot (influência) → Petipa (escola russa)
         → Ivanov (Quebra-Nozes, 1892; formação sólida a partir de Petipa)
         → Maria Olenewa (Rio, 1927) → Veltchek (1939) → Yellê Bittencourt
                                     → Marcia Haydée (formada no Rio; Stuttgart Ballet)
         Olenewa → Ady Addor (solista do ABT em 1957)
         Olenewa →(tracejada, tradição russa) Escola Mun. de Bailados (SP, 1940)
           → Maria Pia → Balé da Cidade SP (1968) → Poulin (1974-77), Yellê, Ady
       Petipa → Fokine / Ballets Russes (1909)
         → Balanchine (NYCB, 1948)
         → Marquês de Cuevas (Paris, 1940-60; herdeiro direto dos Ballets Russes)
              → Hugo Delavalle (BTG · Passo Fundo)
         → Nureyev (pontilhada: interpretação) e Baryshnikov (pontilhada, ABT)
         Ivanov → Fokine (tracejada: inspirou a geração seguinte)
       Petipa →(tracejada, Academia Bolshoi) Osipova
       Mary Wigman → Yanka Rudzka (Bahia, 1952) → Rolf Gelewski (Bahia, 1960)
       → convergem em Tiago Menegaz (2026)

     TRÊS TRAÇOS: sólida = formação (corpo a corpo) · tracejada = influência
     institucional · pontilhada = interpretação (a obra, não o criador).
-->

