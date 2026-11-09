'use strict';

/**
 * transferencia.js — A ALUNA QUE MUDA DE ELENCO (08/11/2026).
 *
 * O DEFEITO QUE ESTE MÓDULO FECHA, medido na leitura do §3.3 da arquitetura (08/11/2026). Mudar uma
 * aluna de elenco não era um acto: era **dois**, e o professor tinha de os fazer na ordem certa sem
 * nada o avisar. Reabria o elenco A, desmarcava a aluna e concluía (versão nova, sem ela); reabria o
 * elenco B, marcava-a e concluía (versão nova, com ela). Se a segunda metade não acontecesse — um
 * clique perdido, a página recarregada, o telemóvel a dormir — a aluna **desaparecia de todos os
 * elencos** e nada o dizia. E a proveniência ficava com duas mudanças sem relação visível: não havia
 * onde ler «ela mudou de A para B em tal dia».
 *
 * A REGRA, e são três partes:
 *
 *   1. **É UM ACTO, e são duas versões.** Cada elenco é *append-only* (`linhas-de-base-repo.js`), e
 *      por isso o acto não se escreve numa linha: escreve-se em duas, uma por elenco, e cada uma diz
 *      o que aconteceu (`transferida` na origem, `recebida` no destino). A história de cada elenco
 *      continua a ser lida sozinha, sem precisar do outro ficheiro.
 *   2. **A LEITURA CAI, A PROVENIÊNCIA FICA.** `leitura` descreve os corpos que estavam juntos e
 *      deixa de ser verdade nos dois lados — nos dois ela é descartada. `lida` é proveniência (que
 *      anamneses foram abertas) e sobrevive, como no resto do ficheiro.
 *   3. **O DESTINO ESCREVE PRIMEIRO.** Quem chama grava o destino e só depois a origem (a ordem está
 *      no comentário da rota). Se a segunda escrita falhar, ela está nos **dois** elencos — nunca em
 *      nenhum; o estado é visível e corrigível, e é o único dos dois que não perde uma aluna.
 *
 * O QUE ESTE MÓDULO **NÃO** FAZ: não lê o repositório, não escreve, não chama a rede. Recebe as duas
 * linhas vigentes e devolve as duas versões novas — ou os motivos de recusa. É a mesma fronteira de
 * `linha-de-base.js`: a regra é pura, e quem grava é o servidor.
 */

/** As marcas que pertencem a UMA versão — e não ao conteúdo — e que a versão nova não herda. */
const MARCAS_DA_VERSAO = ['chave', 'carimbo', 'anterior', 'gravada_em', 'apagada_em', 'rascunho'];

/**
 * A linha sem as marcas da versão anterior.
 *
 * `concluir` (`linhas-de-base-repo.js`) repõe `carimbo` e `anterior` a partir do momento em que
 * grava; herdar os antigos faria a cadeia apontar para si mesma, e o `chave` antigo era o caminho do
 * ficheiro anterior — duas verdades sobre a mesma versão.
 */
function semMarcasDaVersao(linha) {
  const nova = Object.assign({}, linha);
  for (const marca of MARCAS_DA_VERSAO) delete nova[marca];
  return nova;
}

/** Os apelidos de uma linha, em texto, sem repetidos — a mesma normalização da origem. */
function alunasDe(linha) {
  const lista = linha && Array.isArray(linha.alunas) ? linha.alunas : [];
  const saida = [];
  for (const a of lista) {
    const nome = String(a == null ? '' : a).trim();
    if (nome && saida.indexOf(nome) === -1) saida.push(nome);
  }
  return saida;
}

/**
 * MOVE UMA ALUNA DE UM ELENCO PARA OUTRO — e devolve as DUAS versões, ou os motivos da recusa.
 *
 * `origem` e `destino` são as linhas VIGENTES (o que `repo.vigentes()` devolve). Devolve:
 *
 *   `{ ok: true, origem, destino }`  — as duas versões prontas para `concluir`;
 *   `{ ok: false, erros: [...] }`    — e nada foi tocado.
 *
 * As recusas são ditas pela ordem em que o professor as pode resolver — o elenco, a aluna, a
 * presença — porque uma mensagem que manda ao sítio errado custa uma segunda tentativa.
 */
function moverAluna({ origem, destino, aluna, quando, motivo } = {}) {
  const erros = [];
  const apelido = String(aluna == null ? '' : aluna).trim();
  const em = String(quando == null ? '' : quando).trim();
  const razao = String(motivo == null ? '' : motivo).trim();

  if (!apelido) erros.push('informe a aluna que muda de elenco');
  const idOrigem = String((origem && origem.id) || '').trim();
  const idDestino = String((destino && destino.id) || '').trim();
  if (!idOrigem) erros.push('informe o elenco de origem');
  if (!idDestino) erros.push('informe o elenco de destino');
  if (idOrigem && idDestino && idOrigem === idDestino) {
    erros.push('a origem e o destino são o mesmo elenco — escolha outro');
  }
  if (origem && origem.apagada_em) erros.push('o elenco de origem foi apagado');
  if (destino && destino.apagada_em) erros.push('o elenco de destino foi apagado');

  /* SÓ ELENCOS CONCLUÍDOS SE MOVEM. Um rascunho ainda não tem recorte, e não é para onde uma aluna
   * «vai»: é um trabalho a meio. Mover para lá daria uma versão que o plano de ensino não lê. */
  const concluida = (l) => Array.isArray(l && l.campos) && l.campos.length > 0;
  if (origem && !concluida(origem)) erros.push('o elenco de origem ainda é um rascunho (falta o recorte)');
  if (destino && !concluida(destino)) erros.push('o elenco de destino ainda é um rascunho (falta o recorte)');

  if (erros.length) return { ok: false, erros };

  const daOrigem = alunasDe(origem);
  const doDestino = alunasDe(destino);
  if (daOrigem.indexOf(apelido) === -1) {
    return { ok: false, erros: ['a aluna «' + apelido + '» não está no elenco «' + idOrigem + '»'] };
  }
  if (doDestino.indexOf(apelido) !== -1) {
    return { ok: false, erros: ['a aluna «' + apelido + '» já está no elenco «' + idDestino + '»'] };
  }
  if (!em) return { ok: false, erros: ['informe o instante do acto'] };

  const novaOrigem = semMarcasDaVersao(origem);
  novaOrigem.alunas = daOrigem.filter((a) => a !== apelido);
  novaOrigem.atualizada_em = em;
  delete novaOrigem.leitura;
  novaOrigem.transferida = { aluna: apelido, para: idDestino, em, motivo: razao || null };

  const novoDestino = semMarcasDaVersao(destino);
  novoDestino.alunas = doDestino.concat([apelido]);
  novoDestino.atualizada_em = em;
  delete novoDestino.leitura;
  novoDestino.recebida = { aluna: apelido, de: idOrigem, em, motivo: razao || null };

  return { ok: true, erros: [], origem: novaOrigem, destino: novoDestino };
}

/**
 * O RASCUNHO ACOMPANHA O ACTO — a correção de 09/11/2026.
 *
 * O DEFEITO QUE ISTO FECHA, medido na produção: a transferência escrevia as duas versões no
 * repositório e **deixava o rascunho do KV como estava**. O rascunho é o que a Produção mostra
 * enquanto o professor está a editar (`linhasDeBase` põe-no por cima do acto), e por isso a
 * listagem continuava a dizer «tami — 2 alunas» com a aluna já no destino: a contagem mentia nos
 * DOIS elencos. Pior: o «Concluir elenco» seguinte gravava o rascunho velho como acto novo, e a
 * transferência era **desfeita** sem ninguém lhe tocar.
 *
 * A REGRA É A DO MENOR GESTO: o que se move é a ALUNA, e só ela. O rascunho pode ter trabalho a
 * meio que ninguém pediu para deitar fora (um recorte diferente, uma aluna acrescentada à mão), e
 * por isso não se substitui a lista dele pela do acto — retira-se a aluna da origem e põe-se no
 * destino, **na lista que o rascunho já tem**. O resto fica como o professor o deixou.
 *
 * A `leitura` cai quando o conjunto muda, pela mesma razão do acto: ela descreve os corpos juntos,
 * e um número sobre outros corpos é pior do que nenhum.
 *
 * Devolve `null` quando não há nada a fazer — o rascunho não é destes elencos, ou a aluna já não
 * está na origem (ou já está no destino). Quem chama não precisa de distinguir os casos: `null` é
 * «deixa-o como está».
 */
function ajustarRascunho(rascunho, { de, para, aluna } = {}) {
  const id = String((rascunho && rascunho.id) || '').trim();
  const apelido = String(aluna == null ? '' : aluna).trim();
  const idOrigem = String(de == null ? '' : de).trim();
  const idDestino = String(para == null ? '' : para).trim();
  if (!id || !apelido) return null;
  if (id !== idOrigem && id !== idDestino) return null;

  const antes = alunasDe(rascunho);
  let depois = antes;
  if (id === idOrigem) depois = antes.filter((a) => a !== apelido);
  if (id === idDestino && depois.indexOf(apelido) === -1) depois = depois.concat([apelido]);
  if (depois.length === antes.length && depois.every((a, i) => a === antes[i])) return null;

  const novo = Object.assign({}, rascunho);
  novo.alunas = depois;
  delete novo.leitura;
  return novo;
}

module.exports = { moverAluna, ajustarRascunho };
