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
 *   `{ ok: true, origem, destino, zerada }`  — as versões prontas para `concluir`;
 *   `{ ok: false, erros: [...] }`            — e nada foi tocado.
 *
 * As recusas são ditas pela ordem em que o professor as pode resolver — o elenco, a aluna, a
 * presença — porque uma mensagem que manda ao sítio errado custa uma segunda tentativa.
 *
 * ==========================================================================================
 * O ELENCO QUE FICARIA SEM NINGUÉM (12/11/2026) — «não faz sentido um elenco com zero pessoas»
 * ==========================================================================================
 *
 * O DEFEITO, medido na operação: ela compôs a AME, pôs a AME na Turma, e depois transferiu as
 * alunas todas para a TAMI. A AME ficou com ZERO alunas **e continuou a ser a Turma**. Um elenco
 * que é o corpo de uma turma e não tem corpo nenhum não é um elenco vazio — é uma contradição: a
 * turma existe para dar aula a alguém.
 *
 * E o outro lado, na letra dela: «Se a gente obriga que para criar um elenco exista pelo menos uma
 * pessoa, como é que na transferência a gente permite que tenha um elenco com zero pessoas? Não faz
 * sentido.»
 *
 * A REGRA TEM DUAS METADES, e a diferença é o VÍNCULO — e só ele:
 *
 *   · **O elenco está numa turma** → a transferência que o esvaziaria é RECUSADA. Esvaziá-lo é
 *     deixar uma turma sem corpo, e não há gesto nenhum que conserte isso por trás: quem decide
 *     desvincular a turma é o professor, na Turma. A recusa diz qual turma é e onde se resolve.
 *   · **O elenco é livre** → a transferência PASSA, e o elenco passa a **`zerada: true`**. Quem
 *     chama grava a lápide em vez de uma versão vazia (ver a rota): um elenco sem ninguém é o
 *     mesmo que um elenco excluído — «a gente vai excluir o elenco quando chegar a esse caso».
 *     A proveniência é a do apagar, e não a de uma versão que nunca existiu como facto.
 *
 * A ETIQUETA «NÃO ESCALADO» CHEGOU A SER PROPOSTA E FOI DESCARTADA POR ELA: não se deixa um elenco
 * zerado à espera de ser escalado. Ou tem gente, ou não existe.
 *
 * `turmasDaOrigem` é a lista dos NOMES das turmas que hoje escolhem este elenco (a rota lê-a das
 * curadorias vigentes). O núcleo não lê o repositório — recebe-a, como recebe as linhas.
 */
function moverAluna({ origem, destino, aluna, quando, motivo, turmasDaOrigem } = {}) {
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

  /* A ÚLTIMA ALUNA DE UM ELENCO QUE É A TURMA NÃO SAI (12/11/2026). Ver o cabeçalho: um elenco com
   * zero alunas não é um elenco vazio, é uma turma sem corpo — e a turma não se desvincula por
   * tabela. A recusa nomeia a turma e o gesto que a resolve. */
  const zerada = daOrigem.length === 1;
  const turmas = (Array.isArray(turmasDaOrigem) ? turmasDaOrigem : [])
    .map((t) => String(t == null ? '' : t).trim()).filter(Boolean);
  if (zerada && turmas.length) {
    /* `recusa: 'turma'` não é decoração: é o que deixa a rota responder 409 (conflito com o que
     * existe) em vez de 400 (pedido mal formado). O pedido está bem formado — o estado é que não
     * permite. A distinção muda o que a tela faz com a resposta. */
    return {
      ok: false, recusa: 'turma',
      erros: [motivoDoElencoQueFicariaVazio(
        { nome: String(origem.nome || idOrigem), turmas })],
    };
  }

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

  /* `zerada` viaja com a decisão porque é ela que muda o que quem chama GRAVA: uma versão vazia,
   * ou a lápide do apagar. Sem o sinal, o servidor teria de repetir a conta — e duas contas da
   * mesma regra divergem ao primeiro caso novo. */
  return { ok: true, erros: [], origem: novaOrigem, destino: novoDestino, zerada };
}

/**
 * AS DUAS FRASES — e as duas são MODELO com marcas, não texto fechado (12/11/2026).
 *
 * Porque um modelo: a mesma frase tem de aparecer em DOIS sítios — na resposta do servidor e no
 * `confirm` do cliente, antes do pedido partir. Escrita duas vezes, a segunda envelhece; escrita
 * só no servidor, o cliente teria de perguntar depois de já ter começado, e a pergunta certa é
 * antes do gesto. O modelo viaja com `%ELENCO%` e `%TURMAS%`, e cada lado o preenche com o que já
 * tem à mão: o servidor com a linha, o cliente com a lista que recebeu.
 *
 * `%TURMAS%` já vem com os «» e a concordância feitos — «a Turma «Piano»» / «as Turmas «A», «B»» —
 * porque a concordância é a parte que se erra ao reescrever a frase à mão.
 */
const MODELO_RECUSA_TURMA = 'esta é a última aluna de «%ELENCO%», e o elenco é %TURMAS%: sem ela o '
  + 'elenco ficaria sem ninguém, e a turma sem corpo. Um elenco que está numa turma não pode ficar '
  + 'vazio — desvincule a turma (escolha outro elenco para ela) e repita.';

const MODELO_AVISO_EXCLUSAO = 'esta é a última aluna de «%ELENCO%». Com a transferência o elenco '
  + 'fica sem ninguém, e um elenco sem ninguém é o mesmo que um elenco excluído: ele será EXCLUÍDO '
  + '(o registo do que existiu fica na proveniência). Confirme para continuar, ou cancele e tome '
  + 'outra providência.';

/** Troca as marcas pelos valores. Ausente vira o que não mente: o nome vazio é o id, e a lista vazia
 *  é a frase sem turmas nomeadas — mas essa nunca acontece, porque só se chama com turmas. */
function preencherModelo(modelo, { nome, turmas } = {}) {
  const lista = (Array.isArray(turmas) ? turmas : [])
    .map((t) => String(t == null ? '' : t).trim()).filter(Boolean);
  const onde = lista.length === 1
    ? 'a Turma «' + lista[0] + '»'
    : 'as Turmas «' + lista.join('», «') + '»';
  return String(modelo).split('%ELENCO%').join(String(nome || ''))
    .split('%TURMAS%').join(onde);
}

/** A frase da recusa — diz QUAL turma, porque «não pode» sem o nome obriga a procurar. */
function motivoDoElencoQueFicariaVazio({ nome, turmas } = {}) {
  return preencherModelo(MODELO_RECUSA_TURMA, { nome, turmas });
}

/** O aviso da exclusão — não é recusa: é o preço do gesto, dito antes. */
function avisoDoElencoQueSeraExcluido({ nome } = {}) {
  return preencherModelo(MODELO_AVISO_EXCLUSAO, { nome });
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

/**
 * A ALUNA QUE SAI DA ESCOLA SAI DO ELENCO (18/11/2026).
 *
 * O PEDIDO, na letra dela: «se eu quero tirar, o aluno resolveu sair da escola, ele não quer trocar
 * de elenco, ele saiu da escola. Então eu vou lá no aluno e vou excluir aquele aluno. Aí esse
 * processo de exclusão do aluno tem que tirar o aluno do elenco. E aí quando eu clicar em derivar
 * esse elenco ou editar esse elenco, na etapa de alunos, que é o step dois, ele não pode mais
 * aparecer, apesar da proveniência da anamnese dele existir.»
 *
 * A TRANSFERÊNCIA TINHA DESTINO; ESTA SAÍDA NÃO TEM. É por isso que ela não é `moverAluna` com um
 * destino vazio: a transferência move um corpo para outro recorte, e esta operação remove um corpo
 * do recorte porque a pessoa deixou de estar na escola. O elenco não fica «sem ela por enquanto» —
 * fica sem ela, e a versão anterior (com ela dentro) continua a ser a verdade do dia em que foi
 * gravada.
 *
 * O QUE **NÃO** SE RECUSA AQUI, e a diferença é deliberada: se ela for a última aluna de um elenco
 * que uma Turma lê, `moverAluna` recusa (a aluna ficaria fora de todos os elencos, e a turma sem
 * corpo). Aqui não se recusa — a pessoa saiu da escola, e o sistema não pode impedir um facto. O
 * elenco fica com zero e a listagem já tem o selo que o diz («sem alunas: a turma ficou sem
 * corpo»). Recusar seria transformar um facto da vida numa prisão administrativa.
 *
 * `zerada` viaja com a decisão porque é ela que a resposta usa para AVISAR: quem apaga a aluna tem
 * de saber que a Turma ficou sem corpo, e não descobri-lo depois.
 */
function sairDoElenco(linha, { aluna, quando, motivo, por } = {}) {
  const apelido = String(aluna == null ? '' : aluna).trim();
  const em = String(quando == null ? '' : quando).trim();
  if (!apelido) return { ok: false, erros: ['informe a aluna que sai'] };
  if (!em) return { ok: false, erros: ['informe o instante do acto'] };
  const antes = alunasDe(linha);
  /* AUSENTE NÃO É ERRO. Quem apaga a aluna percorre N elencos, e a maioria não a tem. `ausente` é
   * o sinal para quem chama a passar ao seguinte sem escrever versão nenhuma — e é também o que
   * torna o acto idempotente: repetir depois de uma falha a meio não cria versões vazias. */
  if (antes.indexOf(apelido) === -1) {
    return { ok: false, ausente: true, erros: ['a aluna «' + apelido + '» não está neste elenco'] };
  }
  const nova = semMarcasDaVersao(linha);
  nova.alunas = antes.filter((a) => a !== apelido);
  nova.atualizada_em = em;
  /* A LEITURA CAI, PELA MESMA RAZÃO DA TRANSFERÊNCIA: ela descreve os corpos que estavam juntos, e
   * a partir daqui não é verdade. `lida` é proveniência (que anamneses foram abertas) e fica. */
  delete nova.leitura;
  /* O FACTO, ESCRITO NO ELENCO. `transferida` diz para onde foi; `saiu` diz que deixou de estar —
   * e é o que faz a versão contar a história sem abrir o cadastro da escola. */
  nova.saiu = {
    aluna: apelido, em,
    motivo: String(motivo == null ? '' : motivo).trim() || null,
    por: String(por == null ? '' : por).trim() || null,
  };
  return { ok: true, erros: [], linha: nova, zerada: nova.alunas.length === 0 };
}

module.exports = {
  moverAluna, ajustarRascunho, sairDoElenco,
  motivoDoElencoQueFicariaVazio, avisoDoElencoQueSeraExcluido,
  MODELO_RECUSA_TURMA, MODELO_AVISO_EXCLUSAO,
};
