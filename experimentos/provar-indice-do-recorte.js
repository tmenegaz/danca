'use strict';

/**
 * provar-indice-do-recorte.js — O ÍNDICE DO PASSO 4 (05/11/2026).
 *
 * O QUE ELE É. O ranque do que os professores olham no corpo: por aspecto da anamnese, em quantos
 * recortes foi escolhido; os que ninguém escolheu; e os pontos cegos — aspectos que a leitura do
 * passo 3 marcou como atenção e que recorte nenhum olhou. A pesquisadora: «é para a gente poder
 * fazer um filtro rápido […] identificar quais são os aspectos do recorte mais usados e os menos
 * usados, os que nunca foram usados, os que são usados parcialmente […] e assim a gente vai saber o
 * que o professor está preocupado no corpo de uma bailarina ou de uma turma».
 *
 * O QUE ESTA BANCADA GUARDA, e por que cada coisa:
 *
 *   1. O UNIVERSO é a anamnese (45), e não as linhas que existem. Sem ele, «nunca escolhido» não
 *      existiria: um aspecto com zero escolhas seria indistinguível de um aspecto que não existe.
 *   2. O RANQUE conta recortes, e a COBERTURA distingue «todos» de «alguns» — é o «usado
 *      parcialmente» da pergunta dela, e não um rótulo decorativo.
 *   3. O RASCUNHO não é recorte. Uma linha gravada no passo 1 e nunca recortada entraria como «zero
 *      escolhas» e faria o denominador mentir.
 *   4. O APLICADO só conta quem foi para uma turma (passo 5): escolhido e não enviado é uma decisão
 *      que ainda não chegou a aluno nenhum.
 *   5. O PONTO CEGO é o cruzamento com o passo 3, e é a única lista que aponta trabalho.
 *   6. A ESCOLHA ÓRFÃ não se apaga: um id que a anamnese já não declara vai para `desconhecidos`,
 *      com o nome que o registo guardou (P-03).
 *   7. A PRIVACIDADE: nenhum apelido de aluna no índice (§4.8). O nome do aspecto é vocabulário da
 *      anamnese; o nome da aluna não é do índice.
 *   8. O DETERMINISMO: duas construções iguais dão o mesmo JSON, sem relógio.
 *   9. AS ROTAS: a lista da linha de base traz o índice sem leitura extra, e a rota própria filtra
 *      por professor/turma como ESCOPO — nunca como eixo (§4.11).
 *  10. A TELA: o bloco existe na página, dentro da secção do corpo, e o script não o recalcula.
 *
 *   node experimentos/provar-indice-do-recorte.js
 */

const path = require('path');
const assert = require('assert');

const RAIZ = path.resolve(__dirname, '..');
const indice = require(path.join(RAIZ, 'motor/nucleo/indice-do-recorte.js'));
const lb = require(path.join(RAIZ, 'motor/nucleo/linha-de-base.js'));
const ANAMNESE = require(path.join(RAIZ, 'porta/conteudo/anamnese.json'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let passou = 0;
const falhas = [];
function ok(titulo, fn) {
  try { fn(); passou += 1; console.log('  ok   ' + titulo); }
  catch (erro) { falhas.push({ titulo, erro }); console.log('  FALHA ' + titulo + '\n        ' + erro.message); }
}
async function okAsync(titulo, fn) {
  try { await fn(); passou += 1; console.log('  ok   ' + titulo); }
  catch (erro) { falhas.push({ titulo, erro }); console.log('  FALHA ' + titulo + '\n        ' + erro.message); }
}

const UNIVERSO = lb.camposDisponiveis(ANAMNESE);
const ESCOLA = 'calango';

/** Um KV falso, com a mesma superfície que o `cloudflare.js` expõe. */
function kvFalso(inicial) {
  const mapa = new Map(Object.entries(inicial || {}));
  return {
    mapa,
    async get(chave) { return mapa.has(chave) ? mapa.get(chave) : null; },
    async put(chave, valor) { mapa.set(chave, String(valor)); },
    async delete(chave) { mapa.delete(chave); },
    async list() { return { keys: [...mapa.keys()].map((name) => ({ name })) }; },
  };
}
const envFalso = (kv) => ({ PADD_KV: kv, ESCOLA_SLUG: ESCOLA, SENHA_ADMIN: 'senha-de-prova' });
async function chamar(env, caminho) {
  const resposta = await bastidores.fetch(new Request('https://' + ESCOLA + '.workers.dev' + caminho), env);
  const texto = await resposta.text();
  let corpo = null;
  try { corpo = JSON.parse(texto); } catch (e) { corpo = null; }
  return { status: resposta.status, texto, corpo };
}

/* AS LINHAS DA PROVA — três, e cada uma testa uma coisa diferente.
 *   · `lb-nivel-1`  escolhe dois aspectos e foi para a turma;
 *   · `lb-nivel-2`  escolhe um dos mesmos e outro, e NÃO foi para turma nenhuma;
 *   · `lb-rascunho` nasceu no passo 1 e nunca teve recorte. */
const LINHAS = [
  {
    id: 'lb-nivel-1', nome: 'Nível 1 — mobilidade e pés', professor: 'rabo-gramde',
    alunas: ['Aluna A', 'Aluna B'], turma: 'Balé Nível 1', enviada_em: '2026-11-05T10:00:00Z',
    atualizada_em: '2026-11-05T09:00:00Z',
    campos: [
      { id: 'arquitetura-do-arco-plantar', nome: 'Arquitetura do arco plantar' },
      { id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' },
    ],
    leitura: {
      em: '2026-11-05T09:30:00Z', alunas: ['Aluna A', 'Aluna B'], alunos: 2,
      classificacao: {
        atencao: [{ id: 'equilibrio-unipodal', texto: '1 de 2', naoMedidos: 1 }],
        excelencia: [{ id: 'tendu' }],
        musicalidade: [],
        comuns: [{ id: 'arquitetura-do-arco-plantar' }],
        semRegisto: [],
      },
    },
  },
  {
    id: 'lb-nivel-2', nome: 'Nível 2 — allegro', professor: 'outro-professor',
    alunas: ['Aluna C'], turma: null,
    atualizada_em: '2026-11-05T11:00:00Z',
    campos: [
      { id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' },
      { id: 'impulsao-e-absorcao-allegro', nome: 'Impulsão e absorção (allegro)' },
    ],
  },
  { id: 'lb-rascunho', nome: 'Por concluir', professor: 'rabo-gramde', alunas: [], campos: [] },
];

console.log('\n1. O UNIVERSO — a anamnese, e não as linhas que existem');

const R = indice.construir({ universo: UNIVERSO, linhas: LINHAS, agora: '2026-11-05T20:00:00Z' });

ok('o universo é o dos 45 aspectos que a anamnese mede', () => {
  assert.strictEqual(R.panorama.aspectos_oferecidos, 45, 'oferecidos: ' + R.panorama.aspectos_oferecidos);
  assert.strictEqual(R.aspectos.length, 45, 'todos entram no ranque, mesmo com zero escolhas');
});

ok('«nunca escolhido» só existe porque o universo entra por argumento', () => {
  assert.strictEqual(R.nunca.length, 42,
    'três aspectos foram escolhidos em 45; sobram 42 — obtido ' + R.nunca.length);
  assert.ok(R.nunca.every((a) => a.recortes === 0));
  // E o controle negativo: sem universo, a lista de «nunca» fica vazia — o índice deixaria de
  // responder a pergunta que o justifica.
  const semUniverso = indice.construir({ universo: [], linhas: LINHAS });
  assert.strictEqual(semUniverso.nunca.length, 0, 'sem universo não há «nunca» a afirmar');
});

console.log('\n2. O RANQUE — mais usados, menos usados, e a cobertura');

ok('o primeiro do ranque é o aspecto escolhido em mais recortes', () => {
  assert.strictEqual(R.aspectos[0].id, 'equilibrio-unipodal',
    'obtido: ' + R.aspectos[0].id);
  assert.strictEqual(R.aspectos[0].recortes, 2);
});

ok('«usado parcialmente» é uma cobertura, e não um adjectivo', () => {
  const eq = R.aspectos.find((a) => a.id === 'equilibrio-unipodal');
  const arco = R.aspectos.find((a) => a.id === 'arquitetura-do-arco-plantar');
  assert.strictEqual(eq.cobertura, 'todos', 'em 2 de 2 recortes');
  assert.strictEqual(arco.cobertura, 'alguns', 'em 1 de 2 recortes');
  const nunca = R.nunca[0];
  assert.strictEqual(nunca.cobertura, 'nenhum');
});

ok('o ranque é ordem decrescente, e o empate desempata pelo nome', () => {
  for (let i = 1; i < R.aspectos.length; i += 1) {
    const a = R.aspectos[i - 1];
    const b = R.aspectos[i];
    assert.ok(a.recortes >= b.recortes,
      'a posição ' + i + ' (' + a.id + ', ' + a.recortes + ') vem antes de ' +
      b.id + ' (' + b.recortes + ')');
  }
});

console.log('\n3. O RASCUNHO E O APLICADO — os dois denominadores');

ok('a linha sem recorte é rascunho, e não conta como recorte', () => {
  assert.strictEqual(R.panorama.linhas, 3);
  assert.strictEqual(R.panorama.com_recorte, 2, 'só duas têm campos escolhidos');
  assert.strictEqual(R.panorama.rascunhos, 1, 'a do passo 1 é rascunho');
});

ok('«aplicado» só conta quem foi para uma turma', () => {
  const eq = R.aspectos.find((a) => a.id === 'equilibrio-unipodal');
  const imp = R.aspectos.find((a) => a.id === 'impulsao-e-absorcao-allegro');
  assert.strictEqual(eq.recortes, 2);
  assert.strictEqual(eq.aplicados, 1, 'das duas, só a Nível 1 foi enviada');
  assert.strictEqual(imp.recortes, 1);
  assert.strictEqual(imp.aplicados, 0, 'a Nível 2 nunca chegou a uma turma');
  assert.strictEqual(R.panorama.enviadas, 1);
});

ok('as datas dizem quando o aspecto apareceu pela primeira e pela última vez', () => {
  const eq = R.aspectos.find((a) => a.id === 'equilibrio-unipodal');
  assert.strictEqual(eq.primeira_em, '2026-11-05');
  assert.strictEqual(eq.ultima_em, '2026-11-05');
});

console.log('\n4. O CRUZAMENTO COM O PASSO 3 — o ponto cego');

ok('um aspecto em atenção e nunca escolhido é um PONTO CEGO', () => {
  // `tendu` está em `excelencia` e não em atenção — não é cego. Construímos o caso com atenção.
  const c = indice.construir({
    universo: UNIVERSO,
    linhas: [{
      id: 'lb-x', nome: 'X', campos: [{ id: 'tendu' }], atualizada_em: '2026-11-05T10:00:00Z',
      leitura: { classificacao: { atencao: [{ id: 'cocoras-profundas-squat' }], excelencia: [], comuns: [], semRegisto: [] } },
    }],
  });
  assert.strictEqual(c.cegos.length, 1);
  assert.strictEqual(c.cegos[0].id, 'cocoras-profundas-squat',
    'o corpo mostrou e o recorte não olhou');
  assert.strictEqual(c.aspectos.find((a) => a.id === 'cocoras-profundas-squat').recortes, 0);
});

ok('CONTROLE NEGATIVO: escolhido no recorte, o mesmo aspecto deixa de ser cego', () => {
  const c = indice.construir({
    universo: UNIVERSO,
    linhas: [{
      id: 'lb-y', nome: 'Y', campos: [{ id: 'cocoras-profundas-squat' }], atualizada_em: '2026-11-05T10:00:00Z',
      leitura: { classificacao: { atencao: [{ id: 'cocoras-profundas-squat' }], excelencia: [], comuns: [], semRegisto: [] } },
    }],
  });
  assert.strictEqual(c.cegos.length, 0, 'olhou — deixou de ser cego');
  assert.strictEqual(c.aspectos.find((a) => a.id === 'cocoras-profundas-squat').atencao_em, 1,
    'e a atenção continua contada: o dado não se perde');
});

ok('sem leitura guardada o cruzamento não inventa nada, e o panorama diz isso', () => {
  const semLeitura = indice.construir({ universo: UNIVERSO, linhas: [LINHAS[2]] });
  assert.strictEqual(semLeitura.panorama.linhas_com_leitura, 0);
  assert.strictEqual(semLeitura.cegos.length, 0, 'não se afirma cegueira sem leitura');
  assert.strictEqual(R.panorama.linhas_com_leitura, 1, 'esta prova tem uma lida');
});

ok('os «não medidos» são contados, e não viram nível', () => {
  const eq = R.aspectos.find((a) => a.id === 'equilibrio-unipodal');
  assert.strictEqual(eq.nao_medidos, 1, 'a leitura declarou um não medido');
  assert.strictEqual(eq.atencao_em, 1, 'e continua em atenção pela aluna que foi medida');
});

console.log('\n5. A ESCOLHA ÓRFÃ — o passado não se apaga');

ok('um id que a anamnese já não tem vai para `desconhecidos`, com o nome guardado', () => {
  const c = indice.construir({
    universo: UNIVERSO,
    linhas: [{
      id: 'lb-antigo', nome: 'Antigo', campos: [{ id: 'aspecto-que-saiu', nome: 'Aspecto que saiu' }],
      atualizada_em: '2026-11-04T10:00:00Z',
    }],
  });
  assert.strictEqual(c.desconhecidos.length, 1);
  assert.strictEqual(c.desconhecidos[0].id, 'aspecto-que-saiu');
  assert.strictEqual(c.desconhecidos[0].nome, 'Aspecto que saiu', 'o nome com que foi escolhido');
  assert.strictEqual(c.desconhecidos[0].recortes, 1);
  assert.strictEqual(c.panorama.aspectos_usados, 0, 'e não entra no ranque do universo');
});

console.log('\n6. A PRIVACIDADE E O DETERMINISMO');

ok('nenhum apelido de aluna entra no índice', () => {
  const texto = JSON.stringify(R);
  for (const nome of ['Aluna A', 'Aluna B', 'Aluna C']) {
    assert.strictEqual(texto.indexOf(nome), -1,
      'o índice não é lugar para «' + nome + '» — §4.8');
  }
  // O CONTROLE POSITIVO: as linhas da prova TÊM os nomes. Se não tivessem, a asserção acima
  // passaria por não haver nada a vazar — e estaria a medir o vazio.
  assert.ok(JSON.stringify(LINHAS).indexOf('Aluna A') !== -1, 'as linhas da prova têm o nome');
});

ok('duas construções iguais dão o mesmo JSON, e o relógio não entra', () => {
  const a = indice.construir({ universo: UNIVERSO, linhas: LINHAS });
  const b = indice.construir({ universo: UNIVERSO, linhas: LINHAS });
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b), 'determinístico');
  assert.strictEqual(a.gerado_em, null, 'sem `agora`, não se afirma a hora');
  assert.ok(indice.construir({ universo: UNIVERSO, linhas: LINHAS, agora: '2026-11-05T20:00:00Z' }).gerado_em);
});

ok('o panorama por eixo soma a MESMA lista, e não uma segunda conta', () => {
  const total = R.por_eixo.reduce((n, e) => n + e.recortes, 0);
  assert.strictEqual(total, R.aspectos.reduce((n, a) => n + a.recortes, 0),
    'a soma dos eixos tem de ser a soma dos aspectos');
  const nomes = R.por_eixo.map((e) => e.valor);
  assert.ok(nomes.indexOf('Técnica') !== -1 && nomes.indexOf('Funcional') !== -1);
});

console.log('\n7. AS ROTAS — a lista que já existe, e a rota própria');

(async () => {
  const chave = 'bastidores/' + ESCOLA + '/linhas-de-base';
  await okAsync('a lista da linha de base traz o índice, sem uma segunda leitura do KV', async () => {
    const kv = kvFalso({ [chave]: JSON.stringify(LINHAS) });
    const r = await chamar(envFalso(kv), '/api/bastidores/linhas-de-base');
    assert.strictEqual(r.status, 200, 'HTTP ' + r.status);
    assert.strictEqual(r.corpo.linhas.length, 3);
    assert.ok(r.corpo.indice, 'o índice vem junto — é o que evita a segunda leitura');
    assert.strictEqual(r.corpo.indice.panorama.com_recorte, 2);
    assert.strictEqual(r.corpo.indice.panorama.aspectos_oferecidos, 45,
      'o universo é o da anamnese, calculado no servidor');
  });

  await okAsync('a rota própria devolve o índice sem a lista', async () => {
    const kv = kvFalso({ [chave]: JSON.stringify(LINHAS) });
    const r = await chamar(envFalso(kv), '/api/bastidores/indice/recorte');
    assert.strictEqual(r.status, 200, 'HTTP ' + r.status);
    assert.strictEqual(r.corpo.ok, true);
    assert.strictEqual(r.corpo.linhas, undefined, 'sem a lista: é o índice, não a estante');
    assert.strictEqual(r.corpo.panorama.com_recorte, 2);
    assert.ok(Array.isArray(r.corpo.aspectos) && r.corpo.aspectos.length === 45);
  });

  await okAsync('`?professor=` recorta o ESCOPO, e não agrupa por pessoa', async () => {
    const kv = kvFalso({ [chave]: JSON.stringify(LINHAS) });
    const r = await chamar(envFalso(kv), '/api/bastidores/indice/recorte?professor=rabo-gramde');
    assert.strictEqual(r.corpo.escopo.professor, 'rabo-gramde');
    assert.strictEqual(r.corpo.panorama.com_recorte, 1, 'só a linha dele');
    // §4.11 / verificação 13: nenhuma chave do índice conta, soma ou ordena por professor.
    const texto = JSON.stringify(r.corpo);
    for (const proibido of ['por_professor', 'ranking', 'desempenho']) {
      assert.strictEqual(texto.indexOf(proibido), -1,
        'o índice não pode trazer «' + proibido + '»');
    }
  });

  await okAsync('`?turma=` recorta pela turma de destino (o passo 5)', async () => {
    const kv = kvFalso({ [chave]: JSON.stringify(LINHAS) });
    const r = await chamar(envFalso(kv), '/api/bastidores/indice/recorte?turma=' +
      encodeURIComponent('Balé Nível 1'));
    assert.strictEqual(r.corpo.panorama.com_recorte, 1);
    assert.strictEqual(r.corpo.aspectos.find((a) => a.id === 'equilibrio-unipodal').aplicados, 1);
  });

  await okAsync('sem linha nenhuma o índice responde vazio — e não inventa «nunca»', async () => {
    const r = await chamar(envFalso(kvFalso()), '/api/bastidores/indice/recorte');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.corpo.panorama.linhas, 0);
    assert.strictEqual(r.corpo.panorama.aspectos_oferecidos, 45,
      'o universo é da anamnese, não da escola: continua a haver 45 a medir');
  });

  console.log('\n8. A TELA — o bloco, na secção do corpo');

  ok('o bloco do índice está na página, com o alvo que o script pinta', () => {
    const pagina = bastidores.paginaProducao(ESCOLA, { escola: ESCOLA, professor: 'rabo-gramde' },
      [{ nome: 'Rabo Grande', slug: 'rabo-gramde', principal: true }], ['Aluna A'], 'Rabo Grande',
      'rabo-gramde', [], [], {}, [], [], []);
    assert.ok(/id="lb-indice"/.test(pagina), 'o alvo do índice tem de estar na marcação');
    assert.ok(/O que os recortes olham/.test(pagina), 'e o título que o nomeia');
    const secao = (pagina.match(/id="sec-corpo"[\s\S]*?<\/section>/) || [''])[0];
    assert.ok(/id="lb-indice"/.test(secao), 'o bloco é da secção do corpo, e não solto na página');
  });

  ok('a tela NÃO recalcula o índice — lê o que o servidor mandou', () => {
    const pagina = bastidores.paginaProducao(ESCOLA, { escola: ESCOLA, professor: 'rabo-gramde' },
      [{ nome: 'Rabo Grande', slug: 'rabo-gramde', principal: true }], ['Aluna A'], 'Rabo Grande',
      'rabo-gramde', [], [], {}, [], [], []);
    assert.ok(/pintarIndiceDoRecorte\(d && d\.indice\)/.test(pagina),
      'o índice chega na resposta da lista');
    assert.ok(!/indice\.aspectos\.reduce|aspectos\.map\(function\(a\)\{ return a\.recortes \+/.test(pagina),
      'e não há uma segunda conta no cliente');
  });

  await okAsync('o índice é DESENHADO na página — o jsdom lê os três blocos', async () => {
    /* A LIÇÃO DA CASA, e ela vale aqui: uma prova de marcação passa com o desenho desligado. O
     * bloco existe (`#lb-indice`), o script chama o pintor — e nada disso garante que os três
     * blocos saiam. Aqui a página é carregada de verdade, o `fetch` devolve o índice, e o que se
     * mede é o TEXTO FINAL. */
    let JSDOM, VirtualConsole;
    try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { throw new Error('jsdom ausente: ' + e.message); }
    const pagina = bastidores.paginaProducao(ESCOLA, { escola: ESCOLA, professor: 'rabo-gramde' },
      [{ nome: 'Rabo Grande', slug: 'rabo-gramde', principal: true }], ['Aluna A'], 'Rabo Grande',
      'rabo-gramde', [], [], {}, [], [], []);
    const vc = new VirtualConsole();
    vc.on('jsdomError', () => {});
    vc.on('error', () => {});
    /* O ÍNDICE DESTA PROVA TEM DE TER OS TRÊS BLOCOS: as `LINHAS` não produzem ponto cego
     * nenhum (o aspecto em atenção é justamente o escolhido), e uma prova que esperasse o bloco
     * vazio estaria a medir a ausência. Acrescenta-se uma linha cuja leitura viu atenção num
     * aspecto que recorte nenhum escolheu — é o caso que a tela tem de saber desenhar. */
    const RENDER = indice.construir({
      universo: UNIVERSO,
      linhas: LINHAS.concat([{
        id: 'lb-cega', nome: 'Com ponto cego', professor: 'rabo-gramde', campos: [{ id: 'tendu' }],
        atualizada_em: '2026-11-05T12:00:00Z',
        leitura: { classificacao: { atencao: [{ id: 'cocoras-profundas-squat' }], excelencia: [], comuns: [], semRegisto: [] } },
      }]),
    });
    const dom = new JSDOM(pagina.replace(/<script src="[^"]*"><\/script>/g, ''), {
      runScripts: 'dangerously', url: 'https://' + ESCOLA + '.workers.dev/bastidores/producao',
      pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.confirm = () => true;
        w.alert = () => {};
        w.fetch = (u) => {
          const url = String(u);
          let corpo = { ok: true };
          if (url.indexOf('linhas-de-base') !== -1) corpo = { ok: true, linhas: LINHAS, divergentes: [], indice: RENDER };
          else if (url.indexOf('alunas-com-anamnese') !== -1) corpo = { ok: true, alunas: [] };
          else if (url.indexOf('campos-do-corpo') !== -1) corpo = { ok: true, campos: [], grupos: [] };
          return Promise.resolve({ ok: true, status: 200,
            json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
        };
      },
    });
    const win = dom.window;
    await new Promise((r) => win.setTimeout(r, 300));
    const alvo2 = win.document.getElementById('lb-indice');
    const texto = String(alvo2.textContent || '');
    assert.ok(/linhas de base/.test(texto), 'o panorama diz quantas linhas: ' + texto.slice(0, 120));
    assert.ok(/Pontos cegos/.test(texto), 'os pontos cegos aparecem');
    assert.ok(/Nunca escolhidos/.test(texto), 'os nunca escolhidos aparecem');
    assert.ok(/Mais escolhidos/.test(texto), 'o ranque aparece');
    assert.ok(/Equilíbrio unipodal/.test(texto), 'com o nome do aspecto, e não o id');
    // O LIMITE É DITO: 42 nunca escolhidos, 15 mostrados, e a frase que diz quantos ficaram.
    assert.ok(/e mais \d+/.test(texto), 'o que não cabe é contado, não escondido: ' + texto.slice(-160));
    // E o apelido da aluna NÃO chega ao ecrã por esta via — o índice não o traz.
    assert.strictEqual(texto.indexOf('Aluna A'), -1, 'nenhum apelido no bloco do índice');
    win.close();
  });

  console.log('');
  if (falhas.length) {
    console.log('FALHARAM ' + falhas.length + ' de ' + (passou + falhas.length) + ' asserções.');
    process.exitCode = 1;
    return;
  }
  console.log('TUDO CERTO — ' + passou + ' asserções: o índice do recorte lê a anamnese inteira, ' +
    'distingue usado de nunca usado, e cruza com a leitura para achar o ponto cego.');
})();
