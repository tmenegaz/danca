#!/usr/bin/env node
'use strict';

/**
 * provar-o-livro-do-consultor.js — OS R$ 10, E O QUE NÃO SE PAGA (25/11/2026 — F4).
 *
 * «Qualquer outra coisa, R$ 10 já me paga.» E o limite, dito por ela na mesma frase: a taxa é da
 * CONSULTORIA — da visita que deu escola. **Uma visita que expirou sem escola não deve nada**: não
 * houve consultoria, houve um link.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   §A o DEVIDO é DERIVADO e o RECEBIDO é GUARDADO — a mesma forma do contador de aulas. O total
 *      nunca é escrito ao lado dos factos que o produzem; se fosse, seria um segundo número a
 *      divergir do primeiro.
 *   §B a taxa vem do CATÁLOGO, e o guião do consultor diz o mesmo número — duas cópias do mesmo
 *      preço é a família de erro do §20 do CUSTO-DOS-FLUXOS, com uma prova a dizer 3 e o documento 2.
 *   §C o que NÃO se paga: a visita expirada, a reservada, a que ainda está aberta. Só a que deu
 *      escola.
 *   §D o livro é MONÓTONO: um recebimento não se apaga, e o que ele recusa — receber a mais, zero,
 *      negativo — recusa com a frase que diz o saldo.
 *   §E um KV que não responde NÃO é «deve zero». É a diferença entre uma decisão e um acidente, e
 *      num dado de dinheiro é a diferença que mais custa.
 *   §F a rota: o valor em centavos e em reais, e o 404 no endereço público.
 *   §G a célula do painel: o saldo, o botão, e o «não consegui ler» no lugar do zero.
 *
 *   node experimentos/provar-o-livro-do-consultor.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const consultores = require(path.join(RAIZ, 'motor/nucleo/consultores.js'));
const daCasa = require(path.join(RAIZ, 'motor/servidor/consultores-da-casa.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const catalogo = require(path.join(RAIZ, 'biblioteca/comercial/planos.json'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

function kvDeMentira(inicial) {
  const mem = new Map(Object.entries(inicial || {}));
  return {
    mem,
    async get(k) { return mem.has(k) ? mem.get(k) : null; },
    async put(k, v) { mem.set(k, String(v)); },
    async delete(k) { mem.delete(k); },
    async list() { return { keys: [...mem.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

function kvQueFalha() {
  return { async get() { throw new Error('o KV não respondeu'); }, async put() { throw new Error('o KV não respondeu'); } };
}

const CADASTRO = {
  nome: 'Giabu', praca: 'PI', cpf: '123.456.789-01',
  email: 'giabu@exemplo.com', telefone: '(55) 99999-0000',
  equipamento: { carro: true, habilitacao: true, notebook: true },
};

/** Uma bancada com uma consultoria que deu escola. */
async function bancada({ gastar = true } = {}) {
  const kv = kvDeMentira();
  const env = { PADD_KV: kv, SENHA_RAIZ: 'a-senha-da-bancada', HOST_DONO: 'danca.padd.com.br', HOST_PUBLICO: 'lastro.padd.com.br' };
  const criado = await daCasa.criar(env, CADASTRO);
  await daCasa.mudarEstado(env, { id: criado.registo.id, ativo: true }, '2026-11-25T12:00:00.000Z');
  const visita = await daCasa.criarVisita(env, criado.registo.id, { escolaNome: 'Clablun' }, '2026-11-25T12:00:00.000Z');
  if (gastar) {
    await daCasa.gastar(env, criado.registo.id, visita.visita.id, 'clablun', '2026-11-26T01:29:08.000Z');
  }
  return { kv, env, id: criado.registo.id, token: visita.token, visita: visita.visita };
}

(async () => {
  /* ── §A derivado e guardado ─────────────────────────────────────────────────────────────── */

  console.log('\n§A o devido deriva-se das visitas; só o recebido se guarda');

  const taxa = consultores.taxaDaConsultoria();
  provar('a taxa da consultoria vem do catálogo, e não de uma constante',
    taxa === Number(catalogo.consultoria.taxaCentavos), [taxa, catalogo.consultoria.taxaCentavos]);
  provar('…e é dez reais', taxa === 1000, taxa);

  const b = await bancada();
  const livro = await daCasa.livroDoConsultor(b.env, b.id);
  provar('o livro de quem deu uma escola deve uma consultoria', livro.ok && livro.resumo.quantidadeDevida === 1,
    livro.resumo && livro.resumo.quantidadeDevida);
  provar('…e o valor é a taxa', livro.resumo.devidoCentavos === 1000, livro.resumo.devidoCentavos);
  provar('…e nada foi recebido', livro.resumo.recebidoCentavos === 0, livro.resumo.recebidoCentavos);
  provar('…e a linha diz de que escola veio', livro.resumo.linhas.length === 1
    && livro.resumo.linhas[0].escolaSlug === 'clablun', livro.resumo.linhas);
  const chaveDoLivro = consultores.chaveDosRecebimentos(b.id);
  provar('o DEVIDO não fica guardado em sítio nenhum (é derivado)',
    !b.kv.mem.has(chaveDoLivro) || !/devido/i.test(String(b.kv.mem.get(chaveDoLivro))),
    b.kv.mem.get(chaveDoLivro));

  /* ── §B o guião diz o mesmo número ──────────────────────────────────────────────────────── */

  console.log('\n§B o guião do consultor diz o mesmo número que o catálogo');

  const guiao = require('fs').readFileSync(path.join(RAIZ, 'FLUXO-DA-ESCOLA-EM-CONSULTORIA.md'), 'utf8');
  const reais = (taxa / 100).toFixed(2).replace('.', ',');
  provar('o fluxo do consultor nomeia a taxa, com o valor do catálogo',
    guiao.indexOf('R$ ' + reais) !== -1 || guiao.indexOf('R$' + reais) !== -1, reais);
  /* O preço da ESCOLA é outro, e é zero: confundir os dois é o erro mais caro possível aqui. */
  provar('…e a taxa não é o preço da escola (que é zero, por ser demonstração)',
    Number(catalogo.consultoria.preco) === 0, catalogo.consultoria.preco);

  /* ── §C o que NÃO se paga ───────────────────────────────────────────────────────────────── */

  console.log('\n§C o que NÃO se paga: o link que ninguém abriu');

  const aberta = await bancada({ gastar: false });
  const livroAberto = await daCasa.livroDoConsultor(aberta.env, aberta.id);
  provar('uma visita ainda aberta não deve nada', livroAberto.resumo.quantidadeDevida === 0,
    livroAberto.resumo.quantidadeDevida);
  provar('…e o livro diz isso por palavras, sem inventar um valor',
    /nenhuma consultoria com escola ainda/.test(consultores.livroEmTexto(livroAberto.resumo)), null);

  /* A EXPIRADA: passado o prazo sem escola, continua a não haver consultoria. */
  const comExpirada = consultores.resumoDoLivro(
    [{ id: 'v-x', escolaNome: 'Nunca', expiraEm: '2026-12-25T12:00:00.000Z' }], [], taxa,
  );
  provar('uma visita expirada sem escola não deve nada', comExpirada.quantidadeDevida === 0, null);
  /* E uma visita RESERVADA (a criação a decorrer) também não: a escola ainda não nasceu. */
  const comReserva = consultores.resumoDoLivro(
    [{ id: 'v-y', escolaNome: 'A caminho', reservadaEm: '2026-11-26T00:00:00.000Z' }], [], taxa,
  );
  provar('…e uma reservada também não (a escola ainda não existe)', comReserva.quantidadeDevida === 0, null);
  /* O CASO QUE CONTA: `usadaEm` E `escolaSlug`. Uma visita marcada como usada sem escola é um estado
   * inconsistente, e não se cobra por ele — o livro conta o que sabe. */
  const semSlug = consultores.resumoDoLivro(
    [{ id: 'v-z', escolaNome: 'Meio', usadaEm: '2026-11-26T00:00:00.000Z' }], [], taxa,
  );
  provar('marcada como usada mas sem escola registada também não se cobra',
    semSlug.quantidadeDevida === 0, null);

  /* ── §D o livro é monótono, e recusa o que não é recebimento ────────────────────────────── */

  console.log('\n§D o livro é monótono: um recebimento não se apaga, e o que não cabe é recusado');

  const recebido = await daCasa.marcarRecebido(b.env, b.id, 1000, 'Pix', '2026-11-26T10:00:00.000Z');
  provar('marcar recebido grava um elo', recebido.ok === true && Boolean(recebido.elo), recebido.erro);
  provar('…com o valor e a data', recebido.elo.centavos === 1000
    && recebido.elo.em === '2026-11-26T10:00:00.000Z', recebido.elo);
  provar('…e o saldo fica a zero', recebido.resumo.saldoCentavos === 0, recebido.resumo.saldoCentavos);
  provar('…e a nota, quando vem, fica no elo', recebido.elo.nota === 'Pix', recebido.elo.nota);

  const outraVez = await daCasa.marcarRecebido(b.env, b.id, 1000);
  provar('receber outra vez, sem saldo, é RECUSADO', outraVez.ok === false && outraVez.status === 409,
    outraVez.status);
  provar('…e a frase diz quanto está em falta', /em falta/.test(String(outraVez.erro)), outraVez.erro);
  provar('…e o livro não mudou (o elo recusado não foi gravado)',
    (await daCasa.livroDoConsultor(b.env, b.id)).resumo.recebidoCentavos === 1000, null);

  provar('um valor zero é recusado', consultores.receber([], 0).ok === false, null);
  provar('…e um negativo também', consultores.receber([], -500).ok === false, null);
  provar('…e a frase diz o que escrever', /maior do que zero/.test(consultores.receber([], 0).erro), null);

  /* O RECEBIMENTO NÃO SE APAGA: dois elos são dois factos, e o livro soma-os. */
  const dois = consultores.receber(consultores.receber([], 400, '2026-11-26T10:00:00.000Z').lista, 600, '2026-11-26T11:00:00.000Z');
  provar('dois recebimentos somam-se, e nenhum substitui o outro', dois.lista.length === 2, dois.lista.length);
  const soma = consultores.resumoDoLivro(
    [{ id: 'v', escolaNome: 'X', escolaSlug: 'x', usadaEm: '2026-11-26T00:00:00.000Z' }], dois.lista, taxa,
  );
  provar('…e o saldo fecha com os dois', soma.saldoCentavos === 0, soma.saldoCentavos);

  /* O SALDO NEGATIVO MOSTRA-SE, e não se trunca em zero: é a única forma de um engano ser corrigido. */
  const aMais = consultores.resumoDoLivro([], consultores.receber([], 500, '2026-11-26T10:00:00.000Z').lista, taxa);
  provar('um saldo negativo fica negativo, e não é escondido', aMais.saldoCentavos === -500, aMais.saldoCentavos);
  provar('…e o texto di-lo («a mais»)', /a mais/.test(consultores.livroEmTexto(aMais)), consultores.livroEmTexto(aMais));

  /* ── §E um KV mudo não é «deve zero» ───────────────────────────────────────────────────── */

  console.log('\n§E um KV que não responde NÃO é «deve zero»');

  const mudo = await daCasa.livroDoConsultor({ PADD_KV: kvQueFalha() }, b.id);
  provar('com o KV mudo, o livro diz que não conseguiu ler', mudo.ok === false, mudo.ok);
  provar('…e o resumo é null, e não um zero', mudo.resumo === null, mudo.resumo);
  const celulaMuda = painel.paginaDosConsultores({
    consultores: [{ id: 'c-1', nome: 'Giabu', praca: 'PI', cpf: '12345678901', ativo: true, equipamento: {}, historico: [] }],
    livros: { 'c-1': { ok: false, erro: 'o KV não respondeu' } },
  });
  provar('…e a célula do painel diz «não consegui ler», e não R$ 0,00',
    /não consegui ler/.test(celulaMuda) && !/R\$ 0,00<\/strong> em falta/.test(celulaMuda), null);

  /* ── §F a rota ─────────────────────────────────────────────────────────────────────────── */

  console.log('\n§F a rota: centavos e reais, e o 404 no endereço público');

  const handler = raiz.default || raiz;
  const envR = { PADD_KV: kvDeMentira(), SENHA_RAIZ: 'a-senha-da-bancada', HOST_DONO: 'danca.padd.com.br', HOST_PUBLICO: 'lastro.padd.com.br' };
  const credencial = 'Basic ' + Buffer.from('tmenegaz:a-senha-da-bancada').toString('base64');
  const criadoR = await daCasa.criar(envR, CADASTRO);
  await daCasa.mudarEstado(envR, { id: criadoR.registo.id, ativo: true }, '2026-11-25T12:00:00.000Z');
  const visitaR = await daCasa.criarVisita(envR, criadoR.registo.id, { escolaNome: 'Clablun' }, '2026-11-25T12:00:00.000Z');
  await daCasa.gastar(envR, criadoR.registo.id, visitaR.visita.id, 'clablun', '2026-11-26T01:29:08.000Z');

  const pedir = (caminho, corpo, comSenha) => handler.fetch(new Request('https://danca.padd.com.br' + caminho, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, comSenha === false ? {} : { Authorization: credencial }),
    body: JSON.stringify(corpo || {}),
  }), envR);

  const emCentavos = await pedir('/api/consultores/receber', { id: criadoR.registo.id, centavos: 1000 });
  const corpoCentavos = await emCentavos.json();
  provar('a rota aceita o valor em centavos', emCentavos.status === 200 && corpoCentavos.ok === true, corpoCentavos.erro);
  provar('…e devolve o saldo depois do recebimento', corpoCentavos.saldoCentavos === 0, corpoCentavos.saldoCentavos);

  /* O VALOR EM REAIS COM VÍRGULA também é aceite — pedir centavos a quem lê «10,00» no ecrã seria
   * uma armadilha, e o painel manda centavos porque é ele que converte. */
  const emReais = await pedir('/api/consultores/receber', { id: criadoR.registo.id, valor: '10,00' });
  const corpoReais = await emReais.json();
  provar('…e recusa o segundo recebimento, venha ele em reais', emReais.status === 409, emReais.status);
  provar('…com a frase do saldo', /em falta/.test(String(corpoReais.erro)), corpoReais.erro);

  const publico = await handler.fetch(new Request('https://lastro.padd.com.br/api/consultores/receber', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: criadoR.registo.id, centavos: 1000 }),
  }), envR);
  provar('no endereço público, a rota do recebimento responde 404', publico.status === 404, publico.status);

  const semSenha = await pedir('/api/consultores/receber', { id: criadoR.registo.id, centavos: 1000 }, false);
  provar('sem a senha, responde 401', semSenha.status === 401, semSenha.status);

  /* ── §G a célula do painel ─────────────────────────────────────────────────────────────── */

  console.log('\n§G a célula do painel diz o saldo, e o botão só aparece quando há o que receber');

  const comSaldo = painel.paginaDosConsultores({
    consultores: [{ id: 'c-1', nome: 'Giabu', praca: 'PI', cpf: '12345678901', ativo: true, equipamento: {}, historico: [] }],
    livros: { 'c-1': { ok: true, resumo: { taxaCentavos: 1000, quantidadeDevida: 2, devidoCentavos: 2000, recebidoCentavos: 0, saldoCentavos: 2000 } } },
    moeda: 'R$',
  });
  provar('a coluna «O que deve» existe', /O que deve/.test(comSaldo), null);
  provar('…e mostra o saldo em reais', /R\$ 20,00/.test(comSaldo), null);
  provar('…e o botão «Marcar recebido»', /data-receber=/.test(comSaldo), null);
  provar('…e quantas consultorias deram escola', /2 consultorias deram escola/.test(comSaldo), null);

  const semSaldo = painel.paginaDosConsultores({
    consultores: [{ id: 'c-1', nome: 'Giabu', praca: 'PI', cpf: '12345678901', ativo: true, equipamento: {}, historico: [] }],
    livros: { 'c-1': { ok: true, resumo: { taxaCentavos: 1000, quantidadeDevida: 1, devidoCentavos: 1000, recebidoCentavos: 1000, saldoCentavos: 0 } } },
    moeda: 'R$',
  });
  provar('sem saldo, o botão NÃO aparece (não há o que receber)', !/data-receber=/.test(semSaldo), null);
  provar('…e a célula diz que está recebido', /recebido/.test(semSaldo), null);

  /* O SCRIPT DO PAINEL COMPILA — a lição do «class=res alerta»: um erro de sintaxe num `<script>`
   * não faz nada falhar, e o botão fica morto. */
  for (const bloco of (comSaldo.match(/<script>([\s\S]*?)<\/script>/g) || [])) {
    const codigo = bloco.replace(/^<script>/, '').replace(/<\/script>$/, '');
    let ok = true;
    try { new Function(codigo); } catch (erro) { ok = false; }
    provar('cada <script> do painel compila', ok, null);
  }

  console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})();
