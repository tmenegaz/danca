'use strict';

/**
 * lib-extracao-md.js — O CONTRATO DE EXTRAÇÃO DE MARKDOWN. Definição ÚNICA (P-08).
 *
 * Nasceu de uma divergência real: o gerador e o hasher resolviam as fontes cada um do seu
 * jeito, e o pacote da Ritmos saiu com o plano da Duo — foi isso que criou o lib-fontes.sh.
 * Aqui é a mesma classe de risco: o PO e o PLANO são documentos do mesmo tipo (Markdown com
 * `## Seção`, `### Subcampo`, listas e tabelas) e leem-se pelo MESMO contrato. Duas cópias
 * divergiriam na primeira regra nova.
 *
 * O CONTRATO — o que cada forma da fonte vira:
 *
 *   · cabeçalho YAML  → objeto `meta` (chaves cruas; parse manual, sem dependências);
 *   · `## Seção`      → campo do schema (título em português → propriedade, pelo MAPA que o
 *                       documento declara — as chaves do mapa são o título em minúsculas);
 *   · `### Subcampo`  → subcampo de um objeto. O título é UM token, já em camelCase: um
 *                       `### Título Com Espaços` é subseção de PROSA, não subcampo — e por
 *                       isso não casa (o PO usa os dois tipos, e a diferença é essa);
 *   · `- item`        → elemento de array; `- [ ]` / `- [x]` → booleano;
 *   · linha de tabela → a REGRA DE TABELA (logo abaixo);
 *   · texto corrido   → valor de um campo string (e, em campo array, um item).
 *
 * A CITAÇÃO (`> …`) NÃO É CONTEÚDO: ela não entra em valor nenhum — é comentário do documento
 * (a nota de método, o aviso ao leitor). Consequência que já custou uma geração: uma seção cujo
 * ÚNICO conteúdo é citação não produz campo algum, e o validador acusa `campo ausente` sem dizer
 * por quê. O contrato REGISTRA essas seções em `secoesSoCitacao`, e cada validador as converte em
 * aviso nomeado (`avisosDeSecaoSoCitacao`) — a causa dita, no lugar do sintoma mudo.
 *
 * O TIPO VEM DO SCHEMA: em campo string, listas e tabelas fazem parte do TEXTO ("o texto da
 * seção"); em campo array, cada item é um elemento — e uma tabela é o array de OBJETOS.
 *
 * A DECLARAÇÃO DO DOCUMENTO (terceiro argumento) — o que o contrato não pode adivinhar:
 *
 *   · `secoes`  — título da seção em minúsculas → campo do schema;
 *   · `colunas` — chave DERIVADA → chave do alvo. A derivada vem do cabeçalho da tabela
 *                 (`Objetivo específico (marco parcial)` → `objetivoEspecificoMarcoParcial`)
 *                 ou do rótulo do par (`Duração` → `duracao`), e o mapa a renomeia para o
 *                 nome do alvo (`marco`, `duracaoAulas`). Sem par no mapa, fica a derivada;
 *   · `pares`   — os blocos cuja tabela é ITEM/VALOR (`| Item | Valor |`): ela vira um
 *                 OBJETO (o rótulo da linha é a chave), e não um array de objetos. O VALOR do
 *                 mapa é o CAMPO QUE RECEBE o objeto — `{ objetivoGeral: 'ciclo' }` diz que a
 *                 tabela daquele bloco alimenta `ciclo`. Um bloco pode ter prosa (num campo) e
 *                 tabela (noutro): é o caso do plano, onde a identificação do ciclo está sob
 *                 "Objetivo geral". `true` = o próprio campo do bloco.
 *
 * A renomeação é DECLARAÇÃO, não leitura: o contrato não interpreta o texto do documento —
 * só aceita o nome que o documento declara.
 *
 * CONTRATO DO PROVISÓRIO: `[Preencher…]` é aceito como valor provisório de qualquer campo
 * string — o campo existe, a decisão da pesquisadora ainda não. Campo AUSENTE é erro. Quem
 * aplica isso é o VALIDADOR de cada documento, não este módulo: aqui só se EXTRAI.
 */
const normalizar = (s) => s.trim().toLowerCase();

function lerYamlCabecalho(linhas) {
  const meta = {};
  if (linhas[0] && linhas[0].trim() === '---') {
    for (let i = 1; i < linhas.length; i++) {
      if (linhas[i].trim() === '---') break;
      const m = linhas[i].match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      meta[m[1]] = v;
    }
  }
  return meta;
}

// ----------------------------------------------------- a REGRA DE TABELA (2026-09-20)
/**
 * A regra que faltava ao contrato: uma tabela cujo bloco tem campo ARRAY no schema vira um
 * ARRAY DE OBJETOS — uma linha de dados por objeto, o cabeçalho como chaves.
 *
 * Sem ela, cada linha virava UMA string (`célula · célula`), e os blocos que o guia de
 * observação consome — marcos por aula, rubrica, distribuição do volume, linha de base —
 * saíam inutilizáveis: era por isso que a `linhaDeBase` do experimento teve de ser
 * estruturada à mão.
 *
 * Cuidados declarados (todos com motivo):
 *   · a linha de separação (`:---`, `:---:`, `---`) é IGNORADA — inclusive fora da regra,
 *     porque ela vazava para o texto dos campos string (o teste antigo removia `:`, `-` e
 *     espaço e depois casava `^-+$`, o que nunca casa: `:-- · :--` entrava no valor);
 *   · `\|` dentro da célula é escape: não divide a célula, e volta a `|` no valor;
 *   · cabeçalho em **negrito** vira chave sem os asteriscos;
 *   · a chave é um IDENTIFICADOR — acento fora, não-alfanumérico vira fronteira, camelCase
 *     (`Dimensão` → `dimensao`, `Em desenvolvimento` → `emDesenvolvimento`);
 *   · a ênfase sai também do VALOR: o JSON não carrega marcação de markdown;
 *   · a célula vazia mantém a POSIÇÃO (não desloca coluna) — o filtro de células vazias
 *     do caminho antigo alinhava mal as linhas com buraco no meio;
 *   · só a PRIMEIRA tabela do bloco ARRAY entra no campo: uma segunda tabela no mesmo bloco
 *     gera AVISO e fica de fora — o contrato não escolhe qual das duas é o campo, o documento
 *     precisa dar a cada tabela o seu bloco. **A exceção é o bloco ITEM/VALOR**, onde as
 *     tabelas se SOMAM no mesmo objeto (é assim que o `## Contexto` do plano declara os seus
 *     dois grupos sem deixar de ser um campo só).
 */
const celulasDaLinha = (linha) => {
  const partes = [];
  let atual = '';
  for (let i = 0; i < linha.length; i++) {
    if (linha[i] === '\\' && linha[i + 1] === '|') { atual += '\u0001'; i++; continue; }
    if (linha[i] === '|') { partes.push(atual); atual = ''; continue; }
    atual += linha[i];
  }
  partes.push(atual);
  if (partes.length && partes[0].trim() === '') partes.shift();
  if (partes.length && partes[partes.length - 1].trim() === '') partes.pop();
  return partes.map((c) => c.trim());
};

const semEnfase = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
const textoDaCelula = (s) => semEnfase(s).replace(/\u0001/g, '|').trim();
const chaveDaColuna = (s) => {
  const palavras = textoDaCelula(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ');
  if (!palavras[0]) return '';
  return palavras[0].toLowerCase() + palavras.slice(1)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
};
const ehSeparador = (celulas) =>
  celulas.length > 0 && celulas.every((c) => /^:?-+:?$/.test(c));

/**
 * Extrai os campos observacionais do Markdown, respeitando o TIPO que o schema espera para
 * cada bloco: em campo string, itens de lista e tabelas fazem parte do TEXTO (o spec diz "o
 * texto da seção"); em campo array, cada item é um elemento — e uma TABELA é o array de
 * objetos (a regra de 2026-09-20, acima).
 *
 * @param {string[]} linhas       as linhas do documento
 * @param {object}   schema       o schema (draft-07) do documento: é ele que diz o TIPO de cada
 *                                campo — e é por isso que ele entra aqui, e não como decoração
 * @param {object}   declaracao   o que o contrato não pode adivinhar (ver o cabeçalho):
 *                                `{ secoes, colunas, pares }`. É DO DOCUMENTO — o PO e o plano
 *                                têm as suas, e elas chegam por argumento.
 * @returns {{campos: object, avisos: string[], secoesSoCitacao: Array<{titulo:string,
 *   campo:string|null, subcampo:string|null}>}}  `secoesSoCitacao` são as seções cujo ÚNICO
 *   conteúdo foi citação — o validador as transforma em aviso nomeado por
 *   `avisosDeSecaoSoCitacao()`.
 */
function extrair(linhas, schema, declaracao) {
  const { secoes = {}, colunas = {}, pares = {} } = declaracao || {};
  const campos = {};
  const texto = {};
  const avisos = [];
  let secao = null;
  let subcampo = null;

  const tipo = (campo) => (schema.properties[campo] || {}).type;
  const tipoSub = (campo, sub) =>
    (((schema.properties[campo] || {}).properties || {})[sub] || {}).type;
  const ehArray = (campo, sub) => (sub ? tipoSub(campo, sub) : tipo(campo)) === 'array';

  // A SEÇÃO QUE SÓ TEM CITAÇÃO — o defeito que custou uma geração inteira (23/09/2026).
  // O contrato descarta as linhas `>` de propósito (blockquote é comentário do documento,
  // não conteúdo — é o que faz o `<!-- CALENDARIO -->` e as notas de método não virarem
  // TEXTO do campo). Mas quando uma seção tem SÓ citação, o campo nunca é criado: ele sai
  // como `campo ausente`, e a mensagem não diz que a causa é a citação — quem escreveu o
  // documento vê "faltou o campo" e vai procurar no lugar errado.
  // O que se registra aqui: a seção (pelo título, e o tipo do campo) que teve citação e
  // NENHUM conteúdo real. Vale para campo de topo e para subcampo (`###`).
  const secoesSoCitacao = [];
  let tituloDaSecao = null;      // o título cru, para a mensagem ; `secao` é o campo
  let secaoTeveConteudo = false;
  let secaoTeveCitacao = false;
  let subcampoDaSecao = null;

  // A SEÇÃO QUE O MAPA NÃO CONHECE — o defeito irmão do de cima, e mais caro: o `## Título`
  // que não está no mapa não gera campo nenhum (o extrator não abre seção nenhuma), e o
  // conteúdo saía do documento sem que nada o dissesse. Foi assim que a `## Distribuição do
  // volume pelos blocos` do plano ficou três ciclos fora do `plano-XX.json` — o mapa esperava
  // «… (regra 9, etapa 2)», um sufixo que documento nenhum escreve —, e que o `## Contexto`
  // do plano (doze fatos declarados) nunca chegou à máquina. Só ENTRA aqui a seção que TINHA
  // conteúdo: uma seção vazia não perdeu dado nenhum, e uma seção só com citação já sai no
  // aviso próprio (sem conteúdo, não há o que dizer duas vezes).
  //
  // Até 16/10/2026 este aviso NUNCA DISPARAVA: o `continue` da seção sem mapa vinha antes do
  // `secaoTeveConteudo = true`, a lista abaixo ficava sempre vazia, e o extrator dizia «ok» a
  // um documento que tinha perdido trechos. O conserto é o bloco `if (!secao)` do laço, mais
  // abaixo — o comentário dele conta a história inteira.
  const secoesNaoMapeadas = [];
  let tituloNaoMapeado = null;

  const fecharSecao = () => {
    if (tituloDaSecao && secaoTeveCitacao && !secaoTeveConteudo) {
      secoesSoCitacao.push({ titulo: tituloDaSecao, campo: secao, subcampo: subcampoDaSecao });
    }
    if (tituloNaoMapeado && secaoTeveConteudo && !secoesNaoMapeadas.includes(tituloNaoMapeado)) {
      secoesNaoMapeadas.push(tituloNaoMapeado);
    }
  };

  // A DECLARAÇÃO RENOMEIA: a chave derivada do documento (cabeçalho de coluna, ou rótulo do
  // par) vira a chave do alvo. Sem par no mapa, fica a derivada.
  const chaveDoAlvo = (derivada) => colunas[derivada] || derivada;

  // O bloco tem tabela estruturada? Quando o campo dele é ARRAY (tabela → array de objetos) ou
  // quando o bloco é declarado ITEM/VALOR (tabela → objeto). Fora disso a tabela é texto.
  const blocoTemTabelaEstruturada = () =>
    !!secao && (ehArray(secao, subcampo) || (!subcampo && !!pares[secao]));

  // a tabela do bloco em construção — o buffer que a regra de tabela usa
  let tabela = null;
  const blocosComTabela = new Set();

  const despejarTabela = () => {
    if (!tabela) return;
    const t = tabela;
    tabela = null;
    if (!t.cabecalho.some(Boolean)) return;          // tabela sem cabeçalho: não há chave
    const chave = t.subcampo ? `${t.secao}.${t.subcampo}` : t.secao;
    // ITEM/VALOR → OBJETO, E AS TABELAS SOMAM (28/10/2026). Um bloco declarado item/valor
    // pode trazer mais de uma tabela, e cada uma acrescenta pares ao MESMO objeto: foi o
    // que permitiu partir o `## Contexto` do plano em «Escola e espaço» e «Professor,
    // turma e método» sem partir o campo. Antes daqui, a segunda tabela caía no aviso
    // abaixo e as linhas dela ficavam de fora — o `contexto` chegava ao validador pela
    // metade, e o documento parecia válido.
    if (!t.subcampo && pares[t.secao]) {
      const destino = pares[t.secao] === true ? t.secao : pares[t.secao];
      if (!campos[destino] || typeof campos[destino] !== 'object' || Array.isArray(campos[destino])) {
        campos[destino] = {};
      }
      t.linhas.forEach((linha) => {
        const k = chaveDoAlvo(chaveDaColuna(linha[0] || ''));
        if (k) campos[destino][k] = textoDaCelula(linha[1] || '');
      });
      return;
    }
    if (blocosComTabela.has(chave)) {
      avisos.push(`bloco '${chave}': as ${t.linhas.length} linha(s) de uma SEGUNDA tabela`
        + ' ficaram de fora — o contrato lê uma tabela por bloco (dê à tabela o seu bloco)');
      return;
    }
    blocosComTabela.add(chave);
    const objetos = t.linhas.map((linha) => {
      const o = {};
      t.cabecalho.forEach((k, i) => { if (k) o[k] = textoDaCelula(linha[i] || ''); });
      return o;
    });
    if (t.subcampo) {
      if (!campos[t.secao] || typeof campos[t.secao] !== 'object') campos[t.secao] = {};
      campos[t.secao][t.subcampo] = (campos[t.secao][t.subcampo] || []).concat(objetos);
    } else {
      if (!Array.isArray(campos[t.secao])) campos[t.secao] = [];
      objetos.forEach((o) => campos[t.secao].push(o));
    }
  };

  for (const linha of linhas) {
    const limpa = linha.trim();

    // --- a tabela do bloco (regra de 2026-09-20): quando o bloco tem tabela estruturada (campo
    // ARRAY, ou bloco declarado item/valor), a tabela É o campo — as linhas ficam em buffer e
    // saem como objetos (ou como um objeto, no item/valor) quando a tabela ou o bloco termina.
    // Fora disso, a linha de tabela segue o caminho antigo (texto).
    if (limpa.startsWith('|') && !tabela && blocoTemTabelaEstruturada()) {
      const celulas = celulasDaLinha(limpa);
      if (!ehSeparador(celulas)) {
        tabela = { secao, subcampo, cabecalho: celulas.map((c) => chaveDoAlvo(chaveDaColuna(c))), linhas: [] };
        // A TABELA ESTRUTURADA É CONTEÚDO DO CAMPO (20/10/2026). As linhas dela entram no buffer
        // e saem como objetos no `despejarTabela()`; nenhuma delas passa pelo `secaoTeveConteudo`
        // lá em baixo. Sem esta linha, uma seção cuja tabela é o campo — e que ainda tem uma nota
        // em citação, como a distribuição do volume — era contada como «só tem citação», e o
        // validador dizia «o campo `distribuicaoDeVolume` não é criado» com o campo criado e
        // preenchido no JSON. Um diagnóstico falso custa mais do que nenhum: manda procurar o
        // problema errado.
        secaoTeveConteudo = true;
        continue;
      }
    }
    if (tabela && limpa.startsWith('|')) {
      const celulas = celulasDaLinha(limpa);
      if (!ehSeparador(celulas)) tabela.linhas.push(celulas);
      continue;
    }
    if (tabela) despejarTabela();        // o bloco terminou: a tabela fecha

    const h2 = limpa.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      fecharSecao();
      secao = secoes[normalizar(h2[1])] || null;
      subcampo = null;
      tituloDaSecao = h2[1];
      tituloNaoMapeado = secao ? null : h2[1];
      subcampoDaSecao = null;
      secaoTeveConteudo = false;
      secaoTeveCitacao = false;
      if (secao && !(secao in campos)) campos[secao] = undefined;
      continue;
    }

    const h3 = limpa.match(/^###\s+(\S+)\s*$/);
    if (h3) { subcampo = h3[1]; subcampoDaSecao = h3[1]; continue; }

    // A SEÇÃO FORA DO MAPA TAMBÉM TEM CONTEÚDO — E É ISSO QUE O AVISO DO FIM PRECISA SABER
    // (16/10/2026). Este `continue` vinha ANTES das guardas de vazio e de citação, de modo que
    // numa seção sem mapa nenhuma linha chegava ao `secaoTeveConteudo = true` (que está lá
    // abaixo): a lista `secoesNaoMapeadas` ficava SEMPRE vazia, e o `avisosDeSecaoNaoMapeada` —
    // escrito no commit 28e6fde justamente para dizer «o conteúdo desta seção NÃO chega a campo
    // nenhum» — nasceu MORTO: nunca disparou, nem uma vez. Foi por isso que a distribuição do
    // volume (14/10/2026) e a sequência de exercícios (16/10/2026) caíram as duas em silêncio,
    // e quem as achou foi quem olhou o documento — o `validar-aula-ciclo.js` chega a DOCUMENTAR
    // este modo de falha («um título fora do mapa NÃO gera aviso nenhum», «zero campos e zero
    // avisos — um falso ok») como se o aviso existisse.
    //
    // A CITAÇÃO não conta: ela é comentário e não vira valor de campo em seção nenhuma — uma
    // seção só de citação não perdeu dado, e o `secaoTeveCitacao` fica de fora deste ramo para
    // o aviso `secoesSoCitacao` continuar a ser só do que TEM destino (ele carrega o campo).
    if (!secao) {
      if (limpa !== '' && limpa !== '---' && !limpa.startsWith('<!--') && !limpa.startsWith('>')) {
        secaoTeveConteudo = true;
      }
      continue;
    }

    // comentários e vazios não entram em nenhum valor. O COMENTÁRIO HTML entra aqui porque
    // ele é marcação, não conteúdo: o `<!-- CALENDARIO -->` do plano é o marcador que o
    // gerador substitui, e sem esta linha ele virava o TEXTO da seção (e a lacuna declarada
    // do calendário nunca apareceria).
    if (limpa === '' || limpa === '---' || limpa.startsWith('<!--')) continue;
    // A CITAÇÃO é comentário do documento — não vira texto do campo (é o que impede a nota
    // de método de entrar no valor). Mas ela é CONTADA: uma seção cujo único conteúdo é
    // citação não gera campo nenhum, e o aviso nomeado do fim diz exatamente isso. Sem este
    // registro, a causa (`> nota`) ficava invisível e o sintoma era `campo ausente`.
    if (limpa.startsWith('>')) { secaoTeveCitacao = true; continue; }
    // o que resta é conteúdo do campo: item, linha de tabela (fora da regra) ou texto
    secaoTeveConteudo = true;

    // onde este trecho entra: no subcampo (se houver) ou na seção
    const acumular = (trecho) => {
      if (subcampo) {
        if (tipoSub(secao, subcampo) === 'boolean') return;
        if (!campos[secao] || typeof campos[secao] !== 'object') campos[secao] = {};
        const chave = `${secao}.${subcampo}`;
        texto[chave] = ((texto[chave] || '') + ' ' + trecho).trim();
        campos[secao][subcampo] = texto[chave];
      } else if (tipo(secao) === 'string') {
        texto[secao] = ((texto[secao] || '') + ' ' + trecho).trim();
        campos[secao] = texto[secao];
      }
    };
    const paraArray = (trecho) => {
      if (subcampo) return;                       // array dentro de subcampo não existe neste schema
      if (tipo(secao) !== 'array') return;
      if (!Array.isArray(campos[secao])) campos[secao] = [];
      campos[secao].push(trecho);
    };

    // `- [ ]` / `- [x]` → booleano (checklist)
    const checkbox = limpa.match(/^-\s*\[( |x|X)\]\s*(.*)$/);
    if (checkbox) {
      if (!campos[secao] || typeof campos[secao] !== 'object') campos[secao] = {};
      const chave = subcampo || 'item';
      campos[secao][chave] = /x/i.test(checkbox[1]);
      continue;
    }

    const item = limpa.match(/^[-*]\s+(.+)$/);
    if (item) {
      if (subcampo) acumular(item[1]); else { paraArray(item[1]); acumular(item[1]); }
      continue;
    }

    // linha de tabela (bloco cujo campo é string: a tabela faz parte do TEXTO)
    if (limpa.startsWith('|')) {
      // a linha de separação (`:---`) NÃO é conteúdo — ver a regra de tabela, acima
      if (ehSeparador(celulasDaLinha(limpa))) continue;
      const celulas = limpa.replace(/^\|/, '').replace(/\|$/, '')
        .split('|').map((c) => c.trim()).filter(Boolean).join(' · ');
      if (!celulas) continue;
      if (subcampo) acumular(celulas); else { paraArray(celulas); acumular(celulas); }
      continue;
    }

    // texto corrido
    if (subcampo) {
      acumular(limpa);
    } else {
      paraArray(limpa);
      acumular(limpa);
    }
  }
  despejarTabela();          // a última tabela do documento
  fecharSecao();             // e a última seção
  return { campos, avisos, secoesSoCitacao, secoesNaoMapeadas };
}

function tipoDe(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

/**
 * O AVISO NOMEADO para cada seção cujo único conteúdo é citação — ver `secoesSoCitacao`, acima.
 *
 * Existe para trocar um sintoma mudo por uma causa dita. Sem ele, a seção só com `> nota`
 * produzia `campo ausente: proveniencia` no validador: a mensagem está correta e é inútil — quem
 * escreveu o documento vai procurar o campo que "faltou" em vez da citação que o engoliu.
 *
 * A localização sai do TÍTULO (`## Registro de proveniência`), achado nas linhas do documento
 * pelo texto do cabeçalho: é o endereço que quem edita o `.md` usa.
 *
 * @param {Array<{titulo:string, campo:string|null, subcampo:string|null}>} secoes
 * @param {string[]} linhas  as mesmas linhas passadas a `extrair`, para localizar o título
 * @returns {string[]} um aviso por seção
 */
function avisosDeSecaoSoCitacao(secoes, linhas) {
  return (secoes || []).map((s) => {
    const i = (linhas || []).findIndex((l) => l.trim() === `## ${s.titulo}`);
    const onde = i >= 0 ? ` (linha ${i + 1})` : '';
    const alvo = s.subcampo ? `'${s.campo}.${s.subcampo}'` : `'${s.campo}'`;
    const destino = s.campo
      ? `o campo ${alvo} não é criado`
      : 'a seção não corresponde a campo nenhum do schema (o título não está no mapa das seções)';
    return `seção '## ${s.titulo}'${onde}: só tem citação ('> …') — ${destino}.`
      + ' O blockquote é comentário e não vira conteúdo: escreva o texto fora dele.';
  });
}

/**
 * O AVISO NOMEADO para cada seção cujo título não está no mapa das seções — ver
 * `secoesNaoMapeadas`, acima.
 *
 * Existe pelo mesmo motivo do irmão de citação, com o ônus invertido: ali o conteúdo era
 * citação e o campo não nascia; aqui o conteúdo é bom e o documento não tem onde guardá-lo.
 * O sintoma dos dois é o MESMO — um campo ausente — e a causa é oposta. Sem este aviso, a
 * falha é invisível: o validador imprime `ok`, o pacote sai sem o campo e ninguém sabe que o
 * mapa e o documento divergiram num caractere. É o que aconteceu com a distribuição do
 * volume do plano (o mapa esperava um sufixo «(regra 9, etapa 2)» que documento nenhum
 * escreve) e com o `## Contexto` — doze fatos declarados e nenhum extraído.
 *
 * A localização sai do TÍTULO, achado nas linhas do documento: é o endereço que quem edita
 * o `.md` usa.
 *
 * @param {string[]} titulos  os títulos (sem o `##`) que o mapa não conhece e que TINHAM conteúdo
 * @param {string[]} linhas   as mesmas linhas passadas a `extrair`, para localizar o título
 * @returns {string[]} um aviso por título
 */
function avisosDeSecaoNaoMapeada(titulos, linhas) {
  return (titulos || []).map((titulo) => {
    const i = (linhas || []).findIndex((l) => l.trim() === `## ${titulo}`);
    const onde = i >= 0 ? ` (linha ${i + 1})` : '';
    return `seção '## ${titulo}'${onde}: o título não está no mapa das seções —`
      + ' o conteúdo NÃO chega a campo nenhum do documento derivado.'
      + ' Dê-lhe destino (o título no `MAPA_SECOES` do validador e a propriedade no schema)'
      + ' ou tire o `##` do que é prosa de leitura.';
  });
}

module.exports = {
  // o contrato
  extrair,
  // as partes do contrato que o validador de cada documento confere (e que o teste exercita)
  celulasDaLinha, semEnfase, textoDaCelula, chaveDaColuna, ehSeparador,
  lerYamlCabecalho, normalizar, tipoDe,
  // o aviso nomeado da seção só com citação (comum ao PO e ao plano — definição única)
  avisosDeSecaoSoCitacao,
  // e o da seção que o mapa das seções não conhece (o conteúdo que sairia calado)
  avisosDeSecaoNaoMapeada,
};
