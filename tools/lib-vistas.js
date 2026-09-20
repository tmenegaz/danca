/* ============================================================================
 * lib-vistas.js — AS VISTAS do ciclo (os entregáveis derivados), em UMA definição.
 *
 * POR QUE ESTA LIB EXISTE. Os builders das vistas — o caderno, o relatório pós-aula, o
 * acompanhamento por aluna, o guia de observação e a musicalidade — nasceram dentro do
 * `formulario.html` do experimento `captura-json`. Na migração decidida em 20/09/2026 as
 * vistas passam a ser GERADAS, e quem gera é o GERADOR (Node), não só o formulário
 * (browser). Duas cópias dos builders divergiriam na primeira regra nova: é a mesma classe
 * de erro que criou o `lib-fontes.sh` e a `lib-extracao-md.js`. Então eles saem daqui para
 * uma definição só, consumida pelos dois.
 *
 * O QUE ELA É, E O QUE NÃO É:
 *   · recebe DADOS e devolve MARKDOWN — quem imprime é o caller;
 *   · NÃO lê o relógio, NÃO lê o DOM, NÃO guarda estado: dada a mesma entrada, a saída é a
 *     mesma, sempre (rodar duas vezes tem de dar o mesmo texto);
 *   · o carimbo de geração é OPCIONAL: quem passa `prov` ganha a linha "gerado: …"; quem não
 *     passa — o gerador, que precisa de saída determinística — não ganha linha nenhuma. É a
 *     regra do projeto: nada de `data_geracao` aqui dentro.
 *
 * A INTERFACE (um objeto por vista, para os nomes dizerem de onde vem cada coisa):
 *
 *   Vistas.caderno({ meta, dados, aulas, prov })
 *   Vistas.relatorio({ meta, dados, aulas, prov })            // UMA aula: `aulas[0]`
 *   Vistas.acompanhamento({ meta, dados, aluna, aulas, prov })
 *   Vistas.guia({ meta, po, plano, aula, prov })              // as duas ENTRADAS + a aula
 *   Vistas.musicalidade({ meta, po, plano, prov })
 *
 *   `meta` = o ciclo (id, escola, duracao_min); `dados` = o JSON do ciclo;
 *   `po` / `plano` = os JSONs das entradas; `prov` = a proveniência (arquivo, por, em, ajuste).
 *
 * E `Vistas.helpers` expõe as peças puras (a formatação, a junção de linha quebrada, o balanço
 * da entrada) para o caller que já as usava fora dos builders.
 *
 * O CÓDIGO FOI MOVIDO, NÃO REESCRITO: os blocos saíram do `formulario.html` por recorte, e o que
 * mudou foi o essencial — o carimbo virou opcional e a interface virou objeto.
 * ========================================================================== */
'use strict';
// A proveniência é UMA linha, e é a mesma na tela e dentro do arquivo:
// "gerado: <arquivo>, por <quem> às <hora> de <data>". Nada de campos no front-matter.
const linhaGerado = (arquivo, por, em) => `gerado: ${arquivo}, por ${por} às ${em}`;
// ------------------------------------------------------------------ gerar .md
// O arquivo é o espelho do FILTRO, não da página aberta: é o entregável. E todo
// documento sai com proveniência: o que foi gerado, por quem e quando.
function mdCel(v) { return v === undefined || v === null || v === '' ? '—' : String(v); }
// Valor de YAML entre aspas duplas: uma aspa de dentro vira apóstrofo, em vez de quebrar.
const mdY = (v) => `"${String(v).replace(/"/g, "'")}"`;
// O bloco que entra no documento: de onde veio, quando, quem e por quê — e o que mudou.
function mdAjuste(aj) {
  if (!aj) return [];
  const l = ['## Ajuste deste lançamento', '',
    `- **De:** \`${aj.de}\``,
    `- **Quando:** ${aj.em || '—'}`,
    `- **Quem ajustou:** ${aj.por || '—'}`,
    `- **Motivo:** ${aj.motivo || '—'}`, ''];
  // O que mudou vem do PRÓPRIO arquivo (gravado no ato do ajuste). Só quando ele não
  // traz isso — arquivo de antes desta regra — é que se busca o anterior; e, se nem isso,
  // declara-se a lacuna, em vez de inventar uma comparação.
  const itens = aj.gravadas || (aj.comparado
    ? aj.mudancas.map((m) => `${m.caminho}: ${mdCel(m.antes)} → ${mdCel(m.depois)}`)
    : null);
  if (!itens) {
    l.push('*(O lançamento anterior não está acessível — a comparação não foi feita.)*', '');
    return l;
  }
  if (!itens.length) {
    l.push('*(Nenhum campo mudou entre os dois lançamentos.)*', '');
    return l;
  }
  l.push('**O que foi ajustado:**', '');
  itens.slice(0, 40).forEach((t) => l.push(`- ${t}`));
  if (itens.length > 40) l.push(`- … e ${itens.length - 40} outra(s).`);
  l.push('');
  return l;
}
function mdSim(v) { return v === true ? 'sim' : v === false ? 'não' : '—'; }
function mdAcompanhamento(m, dados, chave, aulas, prov) {
  const nome = dados.apelidos[chave] || chave;
  const l = [
    '---',
    'projeto: Formação em Balé Clássico (experimento — dados fictícios)',
    'frente: Acompanhamento',
    `ciclo: ${mdY(m.id)}`,
    `escola: ${m.escola}`,
    `aluna: ${nome}`,
    `title: ${mdY(`Acompanhamento — ${nome}`)}`,
    '---', '',
    `# Acompanhamento — ${nome}`, '',
    ...linhasDeGeracao(prov),
    ...mdAjuste(prov && prov.ajuste),
    '> **Material do professor.** Gerado do JSON do ciclo por um experimento — não é o',
    '> gerador oficial, e os dados são fictícios.', '',
    '## Linha de base', '',
    '[Preencher: linha de base — vem do PO, que não está no JSON (ver §7.1 da arquitetura).]', '',
    '## Linha do tempo', '',
  ];
  for (const k of aulas) {
    const a = dados.aulas[k];
    l.push(`### Aula ${k} — ${dataBr(a.data)}`, '');
    if (a.ausentes.includes(chave)) { l.push('Ausente — não há dado.', ''); continue; }
    const t = a.tecnica[chave] || {}, f = a.funcional[chave] || {};
    l.push(`- **Técnica:** alinhamento ${mdCel(t.alinhamento)} · tempo ${mdCel(t.tempo)} · ` +
           `transferência ${mdCel(t.transferencia)} · braço-perna ${mdCel(t.braco_perna)}`);
    l.push(`- **Funcional:** duração ${mdCel(f.duracao_min)} min · tônus ${mdCel(f.tonus)} · ` +
           `fadiga antes do previsto: ${mdSim(f.fadiga_antes)}`);
    l.push(`- **Estado da aula:** ${a.relatorio.texto}`, '');
    if (a.relatorio.surpresas) l.push(`> Surpreendeu: ${a.relatorio.surpresas}`, '');
  }
  const comDado = aulas.filter((k) => !dados.aulas[k].ausentes.includes(chave));
  const ultima = comDado[comDado.length - 1];
  l.push('## Estado atual', '');
  if (ultima) {
    const a = dados.aulas[ultima], t = a.tecnica[chave] || {}, f = a.funcional[chave] || {};
    l.push(`*(Última observação registrada — fonte: aula ${ultima}, de ${dataBr(a.data)}.)*`, '');
    l.push(`- **Técnica:** alinhamento ${mdCel(t.alinhamento)} · tempo ${mdCel(t.tempo)} · ` +
           `transferência ${mdCel(t.transferencia)} · braço-perna ${mdCel(t.braco_perna)}`);
    l.push(`- **Funcional:** tônus ${mdCel(f.tonus)} · fadiga antes do previsto: ${mdSim(f.fadiga_antes)}`, '');
  } else {
    l.push('Nenhuma aula com dado para esta aluna no filtro.', '');
  }
  l.push('## Diferenças observadas em relação à linha de base', '');
  l.push('*(Descritivo. Não classifica: uma aula não é evolução — é estado.)*', '');
  l.push('[Preencher: a comparação depende da linha de base, que vem do PO.]');
  return l.join('\n');
}
// O caderno de ciclo — `cadernos/ciclo-NN/caderno-NN-<escola>.md`. É o registro CRU:
// uma entrada por aula, datada, sem classificar (governanca-caderno.md). Aqui ele é o
// render dos campos que o professor escreveu na aula — e onde o JSON não tem o campo,
// a lacuna fica DECLARADA, em vez de virar texto inventado.
const dataBr = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || '');
};
const listaNomes = (dados, chaves) => chaves.map((k) => dados.apelidos[k] || k).join(', ');
function mdEntradaCaderno(m, dados, id) {
  const a = dados.aulas[id], cc = a.condicoes_contorno;
  const faltas = listaNomes(dados, a.ausentes);
  const l = [`## ${dataBr(a.data)} · aula ${id}`, '', '### O que aconteceu', ''];
  if (a.relatorio.texto) l.push(`- ${a.relatorio.texto}`);
  l.push(`- ${a.presentes.length} presente(s) (${listaNomes(dados, a.presentes)}). ` +
    (faltas ? `Faltou: ${faltas}.` : 'Nenhuma falta.'));
  l.push(`- Duração executada: ${a.duracao_min} min (planejado: ${m.duracao_min || '—'} min).`);
  l.push('- Estrutura executada: [Preencher: a ordem dos blocos vem do plano da aula, ' +
    'que é uma das três entradas — o JSON não a guarda.]');
  l.push('', '### O que decidi', '');
  l.push(`- ${a.relatorio.ajustes || 'Nada foi ajustado em tempo real.'}`);
  l.push(cc.mudou
    ? `- O que mudou em relação ao plano: ${cc.mudou}`
    : (cc.plano_seguido === 'sim'
      ? '- O que mudou em relação ao plano: nada — o plano foi seguido.'
      : '- O que mudou em relação ao plano: [Preencher: o plano não foi seguido, e a ' +
        'mudança não foi lançada no ato.]'));
  l.push('', '### O que me surpreendeu', '');
  l.push(`- ${a.relatorio.surpresas || '[Nada registrado nesta aula.]'}`);
  l.push('', '### Pergunta emergente', '');
  l.push('- [Preencher: a pergunta que ficou sem resposta — o JSON não tem esse campo.]');
  l.push('');
  return l;
}
function mdCaderno(m, dados, aulas, prov) {
  const l = [
    `# Caderno — Ciclo ${m.id} · ${m.escola}` +
      `${m.duracao_min ? ` · ${m.duracao_min} min por aula` : ''}`, '',
    ...linhasDeGeracao(prov),
    ...mdAjuste(prov && prov.ajuste),
  ];
  for (const k of aulas) l.push(...mdEntradaCaderno(m, dados, k));
  return l.join('\n');
}
// O relatório pós-aula — um por aula, no formato de `relatorios/ciclo-NN/aula-NN-<escola>.md`.
// É o documento que hoje se escreve à mão; aqui ele sai do JSON no MESMO formato (as
// mesmas seções, na mesma ordem, até os títulos). Toda linha do arquivo de produção
// aparece — e onde o JSON não tem o dado, a lacuna fica DECLARADA. É de propósito: a
// lista de lacunas é o que este experimento veio mostrar sobre os campos que faltam.
function mdRelatorio(m, dados, aulas, prov) {
  const id = aulas[0];                       // o filtro garante UMA aula (ver o §3.5)
  const a = dados.aulas[id], cc = a.condicoes_contorno;
  const nome = (k) => dados.apelidos[k] || k;
  const faltas = listaNomes(dados, a.ausentes);
  const plano = cc.mudou ? cc.mudou
    : (cc.plano_seguido === 'sim' ? 'nada — o plano foi seguido' : '—');
  const l = [
    '---',
    'projeto: Formação em Balé Clássico',
    'frente: Relatório',
    `ciclo: ${mdY(m.id)}`,
    `aula: ${mdY(id)}`,
    `escola: ${m.escola}`,
    `title: ${mdY(`Relatório pós-aula ${id} — ${m.escola}`)}`,
    `data: ${mdY(dataBr(a.data))}`,
    '---', '',
    `# Relatório pós-aula ${id} — ${m.escola}`, '',
    ...linhasDeGeracao(prov),
    ...mdAjuste(prov && prov.ajuste),
    '> **Material do professor.** Gerado do JSON do ciclo por um experimento — não é o',
    '> gerador oficial, e os dados são fictícios.', '',
    `**Data:** ${dataBr(a.data)} · **Duração efetiva:** ${a.duracao_min} min · ` +
      '**início e fim:** [Preencher: o JSON guarda a duração, não o horário.]',
    `**Presentes:** ${listaNomes(dados, a.presentes)} ` +
      `(${a.presentes.length}/${a.presentes.length + a.ausentes.length})` +
      (faltas ? ` — ausente: ${faltas}` : ' — nenhuma falta'),
    `**Professor:** ${dados.professor || '—'} · **Ciclo:** ${m.id} · **Escola:** ${m.escola}`, '',
    '**PO do ciclo:** [Preencher: o caminho do PO — o PO é uma das três entradas, e o',
    'JSON não o guarda.]', '',
    '## 1. Execução', '',
    '- **Estrutura executada:** [Preencher: a ordem dos blocos vem do plano da aula.]',
    `- **Duração executada:** **${a.duracao_min} min** (planejado: ${m.duracao_min || '—'} min).`,
    '- **Volume (tempos):** [Preencher: o JSON não guarda volume em tempos.]',
    '- **Abandonado:** [Preencher: o JSON não guarda o que foi abandonado.]',
    `- **Plano seguido:** ${cc.plano_seguido || '—'}.`, '',
    '## 2. Condições de contorno (P-11)', '',
    '| Item | Valor |',
    '|:--|:--|',
    `| Ânimo | ${mdCel(cc.animo)} |`,
    `| Interesse | ${mdCel(cc.interesse)} |`,
    `| Harmonia | ${mdCel(cc.harmonia)} |`,
    `| O que mudou em relação ao plano | ${plano} |`, '',
    '## 3. Observações por dimensão', '',
    '### Técnica', '',
    '| Aluna(o) | Alinhamento | Tempo | Transferência | Braço-perna |',
    '|:--|:--:|:--:|:--:|:--:|',
  ];
  for (const k of a.presentes) {
    const t = a.tecnica[k] || {};
    l.push(`| ${nome(k)} | ${mdCel(t.alinhamento)} | ${mdCel(t.tempo)} | ` +
      `${mdCel(t.transferencia)} | ${mdCel(t.braco_perna)} |`);
  }
  l.push('', '*(As colunas são as do JSON. Na produção elas são as do PO — é o PO que',
    'declara o que se observa em cada ciclo.)*', '');
  l.push('### Funcional (sobrecarga por aluna)', '');
  l.push(`**Duração executada:** ${a.duracao_min} min da aula; por aluna: ` +
    a.presentes.map((k) => `${nome(k)} ${mdCel((a.funcional[k] || {}).duracao_min)} min`)
      .join(' · ') + '.', '');
  l.push('| Aluna(o) | Tônus | Fadiga antes do previsto |', '|:--|:--|:--|');
  for (const k of a.presentes) {
    const f = a.funcional[k] || {};
    l.push(`| ${nome(k)} | ${mdCel(f.tonus)} | ${mdSim(f.fadiga_antes)} |`);
  }
  l.push('', '### Musicalidade', '',
    '[Preencher: a musicalidade é uma dimensão do PO, e o JSON não tem campo para ela.]', '');
  l.push(`### Estado da aula ${id} (Bloco 4 — Linha de base revisitada)`, '',
    '[Preencher: a linha de base vem do PO — sem ela, não há o que revisitar.]', '');
  l.push('### Ocorrências físicas (P-22)', '',
    '[Preencher: o protocolo exige registrar dor, lesão ou restrição que afete a',
    'execução — o JSON não tem esse campo.]', '');
  l.push('## 4. Ruído (proto — não classificar)', '');
  l.push(`- **O que aconteceu diferente do planejado:** ${cc.mudou || 'nada.'}`);
  l.push(`- **O que surpreendeu:** ${a.relatorio.surpresas || '[Nada registrado nesta aula.]'}`);
  l.push('- **O que foi ajustado em tempo real:** ' +
    `${a.relatorio.ajustes || '[Nada registrado nesta aula.]'}`, '');
  l.push('## 5. Materiais brutos', '',
    '[Preencher: o JSON não guarda materiais brutos (foto, vídeo, áudio, comentário).]', '');
  l.push('## 6. Notas de método (P-06, P-07)', '',
    'Este relatório é **descritivo**. Não classifica, não avalia, não conclui. Marca',
    'material bruto — a análise virá depois, quando as condições metodológicas existirem.', '',
    '**Quem observa é quem dá aula** — não há separação de papéis (P-07). O estado do',
    'relatório é o que o professor observou enquanto conduzia.', '');
  l.push('---', '');
  l.push(`**Fonte:** caderno \`professores/${dados.professor || '<professor>'}/cadernos/` +
    `ciclo-${m.id}/caderno-${m.id}-${m.escola}.md\`, entrada de ${dataBr(a.data)}.`);
  return l.join('\n');
}
const lacuna = (o) => `[Preencher: ${o}]`;
/**
 * O BALANÇO DA ENTRADA ✗✓ — o guia e a musicalidade são VISTAS de duas entradas (PO + plano), e o
 * que a fonte não tem sai DECLARADO (`[Preencher: …]`), nunca inventado. Cada bloco do documento
 * entra neste balanço por `de` (veio da entrada) ou por `falta` (virou lacuna), e o balanço
 * SEPARA as duas listas — é o que mede quanto a forma sustenta e quanto falta ao professor.
 * `de` devolve o próprio valor, para ser interpolado no corpo sem repetição; `falta` devolve o
 * texto da lacuna, para ser interpolado no lugar onde o dado faltaria.
 */
function balanco() {
  const veio = [], falta = [];
  return {
    de: (fonte, bloco, valor) => { veio.push({ fonte, bloco, valor: String(valor) }); return valor; },
    falta: (bloco, motivo) => { falta.push({ bloco, motivo }); return lacuna(motivo); },
    reg: () => ({ veio, falta }),
  };
}
// A célula da tabela: um `|` no valor da fonte quebraria a linha — e o valor vem do PO/plano.
const cel = (v) => String(v).replace(/\|/g, '\\|');
/**
 * O BALANÇO RENDERIZADO — a MESMA seção nos dois documentos, porque a pergunta é a mesma. São
 * duas listas SEPARADAS: o que veio da entrada (com a fonte de cada bloco) e o que ficou lacuna.
 * O total é a soma das duas, e é isso que se lê primeiro: `X de N` blocos sustentados.
 */
// O VALOR de um bloco pode ser enorme e trazer token que não quebra (um caminho em `code`, por
// exemplo). Numa célula de TABELA o TeX não tem como refluir: ele passa da margem — medido no guia
// do Ritmos (20/09/2026), onde o caminho do material bruto saía da PÁGINA (xMax 616 numa página de
// 612) e o check-pacote reprovava o pacote. A tabela é a CONTA, e o texto está no corpo — é o que a
// própria nota dela diz. Valor que não cabe entra como referência, não repetido.
const celulaDaConta = (v) => {
  const s = String(v);
  return (s.length > 160 || s.split(/\s+/).some((t) => t.length > 40)) ? '*(no corpo, acima)*' : cel(s);
};
function balancoDaEntrada(reg) {
  const total = reg.veio.length + reg.falta.length;
  const l = ['### Procedência — o que veio da entrada, o que falta', '',
    `**Da entrada (PO + plano) — ${reg.veio.length} de ${total} bloco(s)**`, ''];
  if (reg.veio.length) {
    l.push('| Bloco | Vem de | O que entrou |', '|:--|:--|:--|');
    reg.veio.forEach((e) => l.push(`| ${cel(e.bloco)} | ${e.fonte} | ${celulaDaConta(e.valor)} |`));
  } else {
    l.push('- *(nenhum: a entrada não está ao lado dos dados)*');
  }
  l.push('', `**Lacunas — ${reg.falta.length} de ${total} bloco(s)**`, '');
  if (reg.falta.length) {
    reg.falta.forEach((e) => l.push(`- **${cel(e.bloco)}** — \`${lacuna(e.motivo)}\``));
  } else {
    l.push(`- *(nenhuma: os ${total} blocos vêm da entrada — o que não estiver no corpo é decisão do professor)*`);
  }
  l.push('', '> O texto de cada item está no corpo, acima; aqui é a conta — a entrada sustenta ou não.');
  return l;
}
/* --------------------------------------------------------------------------------------------
 * A LEITURA DOS JSONs GERADOS PELO EXTRATOR (Fase 3)
 *
 * Os `po-01.json` e `plano-01.json` deixaram de ser escritos à mão: eles saem de
 * `tools/validar-po-ciclo.js --json` e `tools/validar-plano-ciclo.js --json` — o contrato
 * compartilhado, provado pelo diff classificado. A estrutura é a que o DOCUMENTO oferece, e é
 * diferente da que os construtores liam:
 *
 *   · `phenomenon` é a PROSA da seção (uma string), e não uma lista de observáveis;
 *   · as listas (`subjects`, `estruturaDeCadaAula`, `distribuicaoDeVolume`) misturam o que a
 *     tabela/o lista produziu com o TEXTO do bloco — e cada LINHA QUEBRADA do .md virou um item
 *     separado (o contrato lê linha a linha);
 *   · `linhaDeBase` é um ARRAY de objetos `{dimensao, trazem, falta, dominam}`;
 *   · `distribuicaoDeVolume` é um ARRAY de objetos `{bloco, proporcaoAlvo60Min, justificativa}`;
 *   · `ciclo.duracaoMinutos` é o TEXTO do documento ("60 minutos (Pré-requisito 4)") — a
 *     conversão para número ficou declaradamente FORA do extrator.
 *
 * Esta camada é de LEITURA/EXIBIÇÃO: re-junta a linha quebrada e aceita as DUAS formas (a da
 * leitura à mão e a do extrator), para o construtor não depender de qual está no arquivo. Ela
 * NÃO inventa valor: o que não está na fonte continua saindo como lacuna.
 * ------------------------------------------------------------------------------------------ */
// um item que começa com minúscula (ou parêntese) é a CONTINUAÇÃO do anterior — é assim que a
// linha quebrada do .md volta a ser uma linha só. A ÚNICA pista que sobra no texto extraído é a
// PONTUAÇÃO: um item que o autor FECHOU (`;`, `.`, `:`) não recebe continuação — então o que vem
// depois, mesmo começando com minúscula, é item NOVO. Sem essa pista, os observáveis do PO (que
// começam com minúscula, porque continuam a frase "definida operacionalmente por:") se colariam ao
// parágrafo anterior. (O limite é declarado: uma quebra de linha logo depois de um `;` não é
// reconhecida — o texto extraído não guarda a indentação que distinguia as duas coisas.)
const FECHA_ITEM = /[;.:]\s*$/;
const juntarQuebras = (v) => {
  const saida = [];
  (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]).forEach((bruto) => {
    const atual = String(bruto).trim();
    if (!atual) return;
    const anterior = saida.length ? saida[saida.length - 1] : null;
    if (anterior !== null && /^[a-záàâãéêíóôõúüç(]/.test(atual) && !FECHA_ITEM.test(anterior)) {
      saida[saida.length - 1] += ` ${atual}`;
    } else {
      saida.push(atual);
    }
  });
  return saida;
};
// os OBJETOS de uma lista que mistura prosa (o que a tabela produziu + o texto do bloco)
const objetosDe = (v) => (Array.isArray(v) ? v : [])
  .filter((x) => x && typeof x === 'object' && !Array.isArray(x));
// as dimensões da linha de base, nas DUAS formas: array de objetos (extrator) ou {dimensoes}
const dimensoesDe = (po) => {
  if (!po || !po.linhaDeBase) return [];
  const itens = Array.isArray(po.linhaDeBase) ? po.linhaDeBase
    : (Array.isArray(po.linhaDeBase.dimensoes) ? po.linhaDeBase.dimensoes : []);
  // A lista vem COMO VEIO: mistura TEXTO (a prosa do PO, por pessoa) e OBJETO (as linhas da tabela
  // de dimensões). O texto passa pelo `juntarQuebras` — o extrator devolve UMA entrada por linha do
  // documento, e a frase quebrada é uma frase só; os objetos passam direto, porque juntá-los com
  // `String()` os destruiria. Até 20/09 tudo isto passava por `objetosDe()`, que DESCARTAVA a prosa
  // em silêncio.
  const saida = [];
  let corrida = [];
  const despeja = () => { if (corrida.length) { saida.push(...juntarQuebras(corrida)); corrida = []; } };
  itens.forEach((it) => {
    if (it && typeof it === 'object' && !Array.isArray(it)) { despeja(); saida.push(it); }
    else corrida.push(it);
  });
  despeja();
  return saida;
};
// Uma linha da linha de base, COMO ELA VEIO (o texto é do professor — decisão de 20/09):
//   · texto (a prosa do PO)  → o próprio texto, num bullet;
//   · objeto (a linha de uma tabela) → o rótulo vem da PRIMEIRA coluna (`dimensao` quando existe,
//     senão o primeiro campo: é assim que um `| Aluno | Traz | Precisa |` se lê) e os demais campos
//     entram com o nome do campo.
const linhaDaBase = (d) => {
  if (d === null || d === undefined) return '';
  if (typeof d !== 'object') return String(d);
  const chaves = Object.keys(d).filter((k) => d[k] !== undefined && d[k] !== null && d[k] !== '');
  if (!chaves.length) return '';
  const rotulo = chaves.includes('dimensao') ? 'dimensao' : chaves[0];
  const campos = chaves.filter((k) => k !== rotulo).map((k) =>
    // O VALOR pode trazer marcação própria (`*en dehors*`): aí ele sai como veio, sem o itálico de
    // fora — envolver itálico em itálico quebra os dois na renderização.
    `${k} ${/\*/.test(String(d[k])) ? d[k] : `*${d[k]}*`}`);
  return `**${d[rotulo]}:**${campos.length ? ` ${campos.join(' · ')}` : ''}`;
};
// Junta os itens de um campo numa linha só, com o separador da casa (` · `) — mas NUNCA dentro de um
// `code` que atravessa linhas: o PO declara o placeholder assim (a crase abre numa linha e fecha
// noutra), e o separador injetado ali CORROMPIA o texto e criava um `\texttt` enorme e inquebrável,
// que saía da página no PDF. Medido: guia do Ritmos, p.18 (20/09/2026) — 616 pt numa página de 612,
// e o check-pacote reprovando o pacote. Dentro do `code`, o separador é um espaço.
const juntarComSeparador = (itens) => {
  let saida = '';
  let dentroDeCode = false;
  itens.forEach((t, i) => {
    if (i) saida += dentroDeCode ? ' ' : ' · ';
    saida += t;
    if (((String(t).match(/`/g) || []).length % 2) === 1) dentroDeCode = !dentroDeCode;
  });
  return saida;
};
// a estrutura da aula: os itens NUMERADOS da lista (sem o número), com as quebras já juntadas
const estruturaDaAula = (plano) => juntarQuebras(plano && plano.estruturaDeCadaAula)
  .filter((s) => /^\d+[.)]\s/.test(s)).map((s) => s.replace(/^\d+[.)]\s*/, ''));
// a distribuição do volume, nas DUAS formas: mapa bloco → proporção, ou lista de objetos
const volumeDosBlocos = (plano) => {
  const d = plano && plano.distribuicaoDeVolume;
  if (!d) return [];
  if (Array.isArray(d)) {
    return objetosDe(d).map((o) => ({ bloco: o.bloco || '', proporcao: o.proporcaoAlvo60Min || '' }));
  }
  return Object.entries(d).map(([bloco, proporcao]) => ({ bloco, proporcao: String(proporcao) }));
};
const volumeDoBloco = (plano, nome) => {
  const achado = volumeDosBlocos(plano).find((x) => new RegExp(nome, 'i').test(x.bloco));
  return achado ? achado.proporcao : null;
};
// a duração da aula: o documento escreve o TEXTO; a leitura à mão tinha o NÚMERO
const duracaoDaAula = (plano) => {
  const v = plano && plano.ciclo ? plano.ciclo.duracaoMinutos : null;
  if (v === undefined || v === null) return null;
  return typeof v === 'number' ? `${v} min` : String(v);
};
/** O GUIA DE OBSERVAÇÃO — por AULA: o que o PO manda observar + o marco desta aula. */
function mdGuia(m, po, plano, aula, data, prov) {
  /**
   * A AULA TEM DOIS GRÃOS NA FONTE ✗✓, e o casamento os normaliza: nos dados e no `ciclos.json` a aula é
   * `'01'` (**string** — é identidade, vira rota e nome de arquivo); no plano ela é `1` (**número** — é
   * ordem). Comparar como texto cru devolvia `[Preencher]` onde havia marco — foi o PRIMEIRO achado do
   * teste da forma, e é o tipo de coisa que só aparece renderizando. `Number('todas')` dá `NaN`, e `NaN`
   * não casa com marco nenhum: o comportamento certo quando o filtro é "todas as aulas".
   */
  const atual = Number(aula);
  const marco = plano ? objetosDe(plano.marcosPorAula).find((x) => Number(x.n) === atual) : null;
  // Cada bloco do guia entra no balanço: por `b.de` (veio do PO/plano) ou por `b.falta` (virou
  // lacuna). É o balanço que, no fim, SEPARA as duas coisas — o que a entrada sustenta e o que falta.
  const b = balanco();
  const dur = plano ? duracaoDaAula(plano) : null;
  const duracao = dur
    ? b.de('plano', 'duração da aula', dur)
    : b.falta('duração da aula', 'duração — vem do plano');
  const l = [
    // O FRONT-MATTER é o que o GERADOR lê para o título da página e o rótulo do menu — o mesmo que
    // o relatório e o acompanhamento já emitiam. Sem ele, a página gerada sai sem título (e o
    // menu, sem rótulo): foi o que apareceu quando o gerador passou a produzi-la (peça 3).
    '---',
    'projeto: Formação em Balé Clássico',
    'frente: Guia de observação',
    `ciclo: "${m.id}"`,
    `aula: "${aula}"`,
    `escola: ${m.escola}`,
    `title: "Guia de observação — Aula ${aula}"`,
    '---', '',
    `## Guia de observação — aula ${aula}`, '',
    `**Ciclo ${m.id} · ${m.escola}** · ${duracao}` +
    // A DATA DA AULA vem do CALENDÁRIO (o `.conf` do ciclo), não de um texto escrito à mão: quem a
    // resolve é quem chama — o gerador, por `tools/calendario.py` (a mesma definição do bloco do
    // calendário), e o formulário, do JSON do ciclo. Sem ela, a lacuna fica DECLARADA aqui, como as
    // demais — a data nunca é inventada. Ela NÃO entra no balanço da entrada: os 7 blocos são do PO
    // + do plano, e a data é do calendário (o formato dd/mm/aaaa é do `dataBr`).
    `${aula ? ` · **Aula ${aula} — ${data
      ? dataBr(data)
      : '[Preencher: data da aula — ver o calendário do ciclo]'}**` : ''}` +
    `${prov && prov.em ? ` · ${prov.em}` : ''}`, '',
    '### O que esta aula trabalha', ''];
  l.push(marco
    ? `- **Marco ${aula}:** ${b.de('plano', `marco da aula ${aula}`, marco.marco)}`
    : `- ${b.falta(`marco da aula ${aula}`, `o marco da aula ${aula} — vem do plano`)}`);
  const estrutura = estruturaDaAula(plano);
  const volume = volumeDosBlocos(plano);
  l.push(estrutura.length
    ? `- **Estrutura da aula:** ${b.de('plano', 'estrutura da aula', estrutura.join(' → '))}`
    : `- ${b.falta('estrutura da aula', 'a estrutura — vem do plano')}`);
  l.push(volume.length
    ? `- **Distribuição do volume:** ${b.de('plano', 'distribuição do volume', volume.map((x) => `${x.bloco} ${x.proporcao}`).join(' · '))}`
    : `- ${b.falta('distribuição do volume', 'a distribuição do volume — vem do plano')}`);
  l.push('', '### O que observar (do PO)', '');
  const fenomenos = juntarQuebras(po && po.phenomenon);
  if (fenomenos.length) {
    fenomenos.forEach((p) => l.push(`- ${p}`));
    b.de('PO', 'o que observar', `${fenomenos.length} item(ns) do PO`);
  } else {
    l.push(`- ${b.falta('o que observar', 'o PO do ciclo não está ao lado dos dados (po-<id>.json)')}`);
  }
  l.push('', '### Linha de base — o que já se sabe', '');
  // ATÉ 20/09 esta linha imprimia `undefined` para a prosa (o PO do Ritmos declara por pessoa, não
  // por dimensão) e NÃO mostrava o `dominam` de cada dimensão — duas perdas de informação, as duas
  // caladas. Agora cada linha sai como veio (ver `linhaDaBase`).
  const base = dimensoesDe(po);
  if (base.length) {
    base.forEach((d) => {
      // A subseção da própria linha de base (ex.: `### Linha de base do grupo`) é conteúdo: sai
      // como subtítulo, e não como um bullet que começa com cerquilha.
      if (typeof d === 'string' && /^#{1,6}\s/.test(d)) {
        l.push('', d.replace(/\s*#+\s*$/, '').replace(/^#{1,6}\s+/, '#### '), '');
      } else {
        l.push(`- ${linhaDaBase(d)}`);
      }
    });
    b.de('PO', 'linha de base', `${base.length} linha(s)`);
  } else {
    l.push(`- ${b.falta('linha de base', 'a linha de base — vem do PO')}`);
  }
  l.push('', '### Quem é observado', '');
  const sujeitos = juntarQuebras(po && po.subjects);
  if (sujeitos.length) {
    l.push(`- ${b.de('PO', 'quem é observado', juntarComSeparador(sujeitos))} (apelidos do PO, P-12)`);
  } else {
    l.push(`- ${b.falta('quem é observado', 'os sujeitos — vêm do PO')}`);
  }
  l.push('', ...balancoDaEntrada(b.reg()));
  return l.join('\n');
}
/**
 * A MUSICALIDADE — por CICLO. Ela junta a **dimensão musical do PO** (o que se observa) com o **bloco do
 * plano** (5–10% do volume) e os **marcos que a citam** — e é o que mostra que a musicalidade não é "um
 * documento": é uma dimensão com vista própria.
 */
function mdMusicalidade(m, po, plano, prov) {
  const dim = dimensoesDe(po).find((d) => /music/i.test(d.dimensao)) || null;
  const citam = plano ? objetosDe(plano.marcosPorAula).filter((x) => /music/i.test(x.marco)) : [];
  const b = balanco();
  const l = [`## Musicalidade — ciclo ${m.id} · ${m.escola}`, ''];
  // o carimbo e OPCIONAL (ver linhasDeGeracao): sem `prov`, a vista sai sem ele
  l.push(...(prov && prov.em
    ? [`**Gerado em ${prov.em}${prov.por ? ` por ${prov.por}` : ''}.**`, '']
    : []));
  l.push('### O que o PO declara da musicalidade', '');
  if (dim) {
    l.push(`- **trazem:** ${dim.trazem}`, `- **falta:** ${dim.falta}`, `- **já dominam:** ${dim.dominam}`);
    b.de('PO', 'dimensão musical do PO', `trazem *${dim.trazem}* · falta *${dim.falta}* · já dominam *${dim.dominam}*`);
  } else {
    l.push(`- ${b.falta('dimensão musical do PO', 'a dimensão musical do PO')}`);
  }
  l.push('', '### O bloco no plano', '');
  const volumeMusical = volumeDoBloco(plano, 'musical');
  if (volumeMusical) {
    b.de('plano', 'bloco no plano (volume)', `${volumeMusical} do volume da aula (Regra 9, etapa 2)`);
    l.push(`- **${volumeMusical}** do volume da aula (Regra 9, etapa 2)`);
  } else {
    l.push(`- ${b.falta('bloco no plano (volume)', 'a distribuição do volume — vem do plano')}`);
  }
  l.push('', '### As aulas que a citam', '');
  if (citam.length) {
    citam.forEach((x) => l.push(`- **Aula ${x.n}:** ${x.marco}`));
    b.de('plano', 'as aulas que a citam', `${citam.length} marco(s): aula(s) ${citam.map((x) => x.n).join(', ')}`);
  } else {
    l.push(`- ${b.falta('as aulas que a citam', 'nenhum marco cita a musicalidade — confira o plano')}`);
  }
  l.push('', '> A musicalidade é **dimensão do PO**, **bloco do plano** e **vista própria**: não é um terceiro dado.', '');
  l.push(...balancoDaEntrada(b.reg()));
  return l.join('\n');
}
// ---------------------------------------------------------------------------- a interface
/**
 * O CARIMBO É OPCIONAL. Esta linha só entra quando o caller deu alguma coisa; sem `prov`, a
 * vista sai sem ela — e o texto é o mesmo, sempre. É o que o gerador vai querer.
 */
function linhasDeGeracao(prov) {
  if (!prov || (!prov.arquivo && !prov.por && !prov.em)) return [];
  return [linhaGerado(prov.arquivo || '—', prov.por || '—', prov.em || '—'), ''];
}

const Vistas = {
  caderno: ({ meta, dados, aulas, prov } = {}) => mdCaderno(meta, dados, aulas, prov),
  relatorio: ({ meta, dados, aulas, prov } = {}) => mdRelatorio(meta, dados, aulas, prov),
  acompanhamento: ({ meta, dados, aluna, aulas, prov } = {}) =>
    mdAcompanhamento(meta, dados, aluna, aulas, prov),
  guia: ({ meta, po, plano, aula, data, prov } = {}) => mdGuia(meta, po, plano, aula, data, prov),
  musicalidade: ({ meta, po, plano, prov } = {}) => mdMusicalidade(meta, po, plano, prov),
  // as peças puras que o formulário já usava fora dos builders — uma definição, sem cópia
  helpers: {
    linhaGerado,
    linhasDeGeracao,
    mdCel,
    mdSim,
    mdY,
    dataBr,
    listaNomes,
    mdAjuste,
    lacuna,
    cel,
    balanco,
    balancoDaEntrada,
    juntarQuebras,
    objetosDe,
    dimensoesDe,
    estruturaDaAula,
    volumeDosBlocos,
    volumeDoBloco,
    duracaoDaAula,
  },
};

// ---------------------------------------------------------------------- os dois ambientes
// Browser: define `Vistas` no global (a tag `<script src>` basta). Node: `module.exports`.
// Não há dependência de DOM aqui — a lib só transforma dados em texto.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Vistas = fabrica();
}(typeof self !== 'undefined' ? self : this, () => Vistas));
