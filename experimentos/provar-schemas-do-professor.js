'use strict';

/*
 * provar-schemas-do-professor.js — um professor que não criou a escola não fica sem validação.
 *
 * O DEFEITO MEDIDO (22/10/2026). Os cinco schemas do ciclo são por par (professor, ciclo) e
 * nascem em `tools/criar-escola.sh`, copiados do molde `modelo/ciclos/` para a pasta de quem
 * **cria** a escola. Uma turma pode estar na curadoria de OUTRO professor: o plano dele é
 * elicitado, os documentos derivam, a variante compõe-se — e a pasta dele nunca teve schema.
 *
 * Medido num clone da pasta de um professor novo, com o `.conf` e o PO escritos:
 *
 *   · `tools/hash-ciclo.sh` avisa «o PO existe, mas o po-schema.json não — PO não validado»
 *     e **ancora assim mesmo**;
 *   · e, sem o schema do ciclo, o `if [ -f "$SCHEMA" ]` não entra: o validador do manifesto
 *     **nunca é chamado** — 0 invocações, medido com `bash -x`. Sem aviso nenhum.
 *
 * O ciclo fechava a âncora com validação mais fraca, em silêncio. Para quem testa o motor é o
 * pior modo de falha: o teste passa, e passou por não ter sido verificado.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   A. `garantirSchemasDoCiclo` cria os cinco, do molde, no destino certo — e **só o que falta**
 *      (um schema já existente não é reescrito: é do professor);
 *   B. nas ferramentas REAIS: antes, o validador do manifesto não corre e o PO não é validado;
 *      depois, os dois correm. O «antes» é o controlo negativo, e é o mesmo disco;
 *   C. o molde ausente é DITO (não se inventa schema), e a falha não lança — o plano é o que o
 *      professor pediu, e provisionar schema é apoio.
 *
 * O repositório é virtual (um `fetch` de mentira sobre um `Map`), então nada aqui depende de
 * escola viva e a prova sobrevive ao expurgo da próxima.
 *
 *   node experimentos/provar-schemas-do-professor.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const { garantirSchemasDoCiclo, SUFIXOS } = require('../motor/servidor/schemas-do-ciclo.js');

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) console.log('  \u2713 ' + rotulo);
  else {
    falhas += 1;
    console.log('  \u2717 ' + rotulo);
    if (detalhe) console.log('      ' + String(detalhe).split('\n').join('\n      '));
  }
}

const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');

/** Um Contents API de mentira: um `Map` de caminho → texto, com o 404 como estado. */
function repoVirtual(inicial) {
  const arquivos = new Map(Object.entries(inicial || {}));
  const escritas = [];
  const leituras = [];
  const f = async (url, opcoes) => {
    const caminho = decodeURIComponent(url.split('/contents/')[1] || '');
    if (!opcoes || opcoes.method === 'GET' || !opcoes.method) {
      leituras.push(caminho);
      if (!arquivos.has(caminho)) return { status: 404, json: async () => ({}) };
      return { status: 200, json: async () => ({ sha: 'x', content: b64(arquivos.get(caminho)) }) };
    }
    const corpo = JSON.parse(opcoes.body);
    arquivos.set(caminho, Buffer.from(corpo.content, 'base64').toString('utf8'));
    escritas.push(caminho);
    return { status: 201, json: async () => ({}) };
  };
  return { arquivos, escritas, leituras, f };
}

// O MOLDE REAL do repositório — a prova lê os schemas de verdade, não texto inventado.
//
// DESDE 01/11/2026 O MOLDE NÃO ESTÁ NO REPOSITÓRIO VIRTUAL, e isso é o que se prova: o
// provisionador já não vai buscá-lo por HTTP, porque o conteúdo vem empacotado em
// `motor/nucleo/schemas.js`. O `Map` abaixo guarda-o só para CONFERIR o resultado — o que se
// escreveu bate com o que o molde diz —, e nunca é oferecido ao `fetch` de mentira.
const MOLDE = {};
for (const s of SUFIXOS) {
  MOLDE['modelo/ciclos/ciclo-01-' + s + '.json'] = fs.readFileSync(
    path.join(RAIZ, 'modelo', 'ciclos', 'ciclo-01-' + s + '.json'), 'utf8');
}

/** O mesmo que `MOLDE`, mas como objeto: a comparação é de CONTEÚDO, não de bytes. */
const CONTEUDO = Object.fromEntries(Object.entries(MOLDE).map(([c, t]) => [c, JSON.parse(t)]));

// O PO mínimo que o schema aceita — as treze seções obrigatórias, com a lacuna declarada.
const PO_MINIMO = [
  '---', 'title: "PO de prova"', '---', '',
  '# Plano de Observação — prova', '',
  '## Pergunta', '', '[Preencher: a pergunta que orienta a observação]', '',
  '## Fenômeno', '', '- [Preencher: o fenômeno observado]', '',
  '## Campo empírico', '', '[Preencher: onde a observação acontece]', '',
  '## Contexto', '', '[Preencher: o contexto institucional]', '',
  '## Sujeitos', '', '- [Preencher: quem é observado]', '',
  '## Norma estabelecida', '', '[Preencher: a norma que o plano adota]', '',
  '## Linha de base', '',
  '| Dimensão | O que as alunas trazem | O que falta | O que já dominam |',
  '|:--|:--|:--|:--|',
  '| [Preencher] | [Preencher] | [Preencher] | [Preencher] |', '',
  '## Critérios de inclusão', '', '- [Preencher: critério]', '',
  '## Critérios de exclusão', '', '- [Preencher: critério]', '',
  '## Justificativa', '',
  '### referenceToProblem', '', '[Preencher: a relação com o problema]', '',
  '### explanationOfCut', '', '[Preencher: por que este recorte]', '',
  '### whatIsLeftOut', '', '[Preencher: o que fica de fora]', '',
  '### theoreticalBasis', '', '[Preencher: a base teórica]', '',
  '## Condições de contorno da execução', '', '[Preencher: as condições]', '',
  '## Limitações', '', '- [Preencher: limitação]', '',
  '## Checklist de validação', '',
  '### phenomenonOperationallyDefined', '', '- [x] Fenómeno definido de forma observável', '',
  '### scopeBoundariesClear', '', '- [ ] Fronteiras do escopo claras', '',
  '### normClearlyEstablished', '', '- [ ] Norma claramente estabelecida', '',
  '### criteriaMutuallyExclusive', '', '- [ ] Critérios mutuamente exclusivos', '',
  '### justificationGrounded', '', '- [ ] Justificativa fundamentada', '',
  '### cutFeasible', '', '- [ ] Âmbito viável', '',
].join('\n');

async function prova() {
  // ═══ A. os cinco, do molde, e só o que falta ══════════════════════════════
  console.log('\nA. Os cinco schemas, do molde, só o que falta');
  {
    const vazio = repoVirtual(MOLDE);
    const r = await garantirSchemasDoCiclo({
      token: 'x', dono: 'dono', repo: 'repo', ref: 'main',
      professor: 'professora-nova', ciclo: '01', fetchImpl: vazio.f,
    });

    checar('cria os cinco', r.criados.length === 5 && r.ok === true,
      JSON.stringify(r));
    checar('no destino com o ciclo de verdade (ciclo-01-*)',
      r.criados.every((c) => c.startsWith('professores/professora-nova/ciclos/ciclo-01-')),
      JSON.stringify(r.criados));
    checar('o conteúdo é o do molde (o schema que se escreve diz o mesmo)',
      SUFIXOS.every((s) => {
        const escrito = vazio.arquivos.get('professores/professora-nova/ciclos/ciclo-01-' + s + '.json');
        return escrito !== undefined &&
          JSON.stringify(JSON.parse(escrito)) === JSON.stringify(CONTEUDO['modelo/ciclos/ciclo-01-' + s + '.json']);
      }));
    checar('nem um schema foi escrito onde já havia (o molde não é tocado)',
      vazio.escritas.every((c) => c.startsWith('professores/')), JSON.stringify(vazio.escritas));

    // ─── A UNIFICAÇÃO (01/11/2026): uma leitura só ───────────────────────────
    //
    // O que se mede é a AUSÊNCIA de um segundo caminho: antes, cada schema custava um `GET` a
    // `modelo/ciclos/…`, com o caminho montado à mão. Se um dia alguém voltar a buscá-lo à rede,
    // esta asserção cai — e cai por uma razão que é a do defeito de 26/10 (duas maneiras de ler o
    // mesmo molde), não por gosto.
    checar('não há UM `GET` ao molde: o conteúdo vem empacotado, não da rede',
      ![...vazio.leituras].some((c) => c.indexOf('modelo/') === 0),
      JSON.stringify([...vazio.leituras]));
    checar('…e o único molde em disco que a prova lê é o do repositório (a fixture não o injeta)',
      Object.keys(MOLDE).length === SUFIXOS.length && CONTEUDO['modelo/ciclos/ciclo-01-schema.json'].required.length > 0);

    // O ciclo 02: o molde é sempre o 01 (o conteúdo não leva o número do ciclo).
    const v02 = repoVirtual(MOLDE);
    const r02 = await garantirSchemasDoCiclo({
      token: 'x', dono: 'dono', repo: 'repo', professor: 'p', ciclo: '02', fetchImpl: v02.f,
    });
    checar('num ciclo 02, o destino é ciclo-02-* e o molde continua o 01',
      r02.criados.length === 5 && r02.criados.every((c) => c.includes('ciclo-02-')),
      JSON.stringify(r02.criados));
    checar('…e o ciclo 02 também não vai buscar molde nenhum',
      !r02.erros.length && ![...v02.leituras].some((c) => c.indexOf('modelo/') === 0), JSON.stringify([...v02.leituras]));

    // A segunda chamada não reescreve — e um schema já existente MANDA (é do professor).
    const comUm = Object.assign({}, MOLDE);
    comUm['professores/p/ciclos/ciclo-01-po-schema.json'] = '{"doProfessor":true}';
    const v = repoVirtual(comUm);
    const r2 = await garantirSchemasDoCiclo({
      token: 'x', dono: 'dono', repo: 'repo', professor: 'p', ciclo: '01', fetchImpl: v.f,
    });
    checar('um schema que já existe NÃO é reescrito (é do professor)',
      r2.criados.length === 4 && r2.pulados.length === 1
      && v.arquivos.get('professores/p/ciclos/ciclo-01-po-schema.json') === '{"doProfessor":true}',
      JSON.stringify({ criados: r2.criados.length, pulados: r2.pulados }));

    const vTerceiro = repoVirtual(Object.assign({}, MOLDE,
      Object.fromEntries(SUFIXOS.map((s) => ['professores/p/ciclos/ciclo-01-' + s + '.json', '{}']))));
    const r3 = await garantirSchemasDoCiclo({
      token: 'x', dono: 'dono', repo: 'repo', professor: 'p', ciclo: '01', fetchImpl: vTerceiro.f,
    });
    checar('a segunda chamada é um no-op completo', r3.criados.length === 0 && r3.pulados.length === 5,
      JSON.stringify(r3));
  }

  // ═══ B. nas ferramentas reais, antes e depois ═════════════════════════════
  //
  // Uma pasta sintética em `professores/.prova-schema/`, com `.conf` e PO e SEM schema. O
  // «antes» é o controlo negativo: é o mesmo disco, e é o estado em que o segundo professor
  // fica hoje. Apagada no `finally`.
  console.log('\nB. As ferramentas reais: antes e depois');
  const PROF = '.prova-schema';
  const DIR = path.join(RAIZ, 'professores', PROF, 'ciclos');
  try {
    fs.mkdirSync(DIR, { recursive: true });
    // AS FONTES SÃO SINTÉTICAS, e é de propósito (22/10/2026). A primeira versão copiava o
    // `.conf` e o PO de uma escola viva — e morreu no expurgo dessa escola no mesmo dia, pela
    // terceira vez nesta semana. O que esta prova mede é o EFEITO DO SCHEMA, não a qualidade de
    // um PO: o mínimo pode ser escrito aqui, e o mínimo que o schema aceita está escrito abaixo.
    fs.writeFileSync(path.join(DIR, 'ciclo-01-prova-schema.conf'),
      ['CICLO="01"', 'VARIANTE="prova-schema"', 'ESCOLA="Prova"', 'RESPONSAVEL="P"',
       'PROFESSOR="P"', 'ESCOLA_HABILITADA="sim"', 'FREQUENCIA="2x/semana"', 'DIAS="2@19:00"',
       'DURACAO_POR_DIA="60 min por encontro"', 'DURACOES="60"', 'DATA_INICIO="02/11/2026"',
       'TOTAL_AULAS="8"', 'VOLUME_MIN="80"', 'VOLUME_MAX="100"', 'NOME="Ciclo 01 — Prova"',
       'OBJETIVO_GERAL="[Preencher: objetivo geral]"', 'DOCS="plano"'].join('\n') + '\n');
    fs.writeFileSync(path.join(DIR, 'ciclo-01-prova-schema-plano.md'),
      '---\ntitle: "Plano de prova"\n---\n\n# Plano de prova\n\nUm parágrafo.\n');
    // O PO mínimo que `validar-po-ciclo.js` ACEITA: as treze seções obrigatórias do schema, com
    // `[Preencher]` (aceito como provisório) e as seis folhas do checklist como `###`.
    fs.writeFileSync(path.join(DIR, 'ciclo-01-prova-schema-po.md'), PO_MINIMO);

    const LOG_PO = '/tmp/hash-po-01.log';
    const rodar = (extra) => {
      fs.rmSync(LOG_PO, { force: true });
      return spawnSync('bash', ['tools/hash-ciclo.sh', PROF, '01', 'prova-schema'].concat(extra || []),
        { cwd: RAIZ, encoding: 'utf8' });
    };

    // ANTES — sem schema nenhum.
    const antes = rodar();
    const saida = (antes.stdout || '') + (antes.stderr || '');
    checar('ANTES: sem o schema do ciclo, o validador do manifesto NUNCA corre',
      !/satisfaz|faltam \d+ campo/.test(saida) && antes.status === 0, saida);
    checar('ANTES: e o PO é dado por «não validado» — mas a âncora fecha na mesma',
      /po-schema\.json não — PO não validado/.test(saida) && antes.status === 0, saida);

    // DEPOIS — os schemas, pelo mesmo código que a ponte usa (o molde lido do disco).
    for (const s of SUFIXOS) {
      fs.copyFileSync(path.join(RAIZ, 'modelo', 'ciclos', 'ciclo-01-' + s + '.json'),
        path.join(DIR, 'ciclo-01-' + s + '.json'));
    }
    fs.rmSync(path.join(DIR, 'ciclo-01-prova-schema.fipp'), { force: true });
    const depois = rodar();
    const saida2 = (depois.stdout || '') + (depois.stderr || '');
    checar('DEPOIS: o validador do manifesto corre e aprova',
      /satisfaz ciclo-01-schema\.json/.test(saida2), saida2);
    checar('DEPOIS: o aviso «PO não validado» desaparece', !/PO não validado/.test(saida2), saida2);
    checar('DEPOIS: o PO foi de facto validado (o log do validador diz que satisfaz)',
      fs.existsSync(LOG_PO) && /satisfaz/.test(fs.readFileSync(LOG_PO, 'utf8')),
      fs.existsSync(LOG_PO) ? fs.readFileSync(LOG_PO, 'utf8') : 'o validador do PO não correu');
    checar('DEPOIS: a âncora continua a fechar', depois.status === 0, saida2);

    // A prova decisiva de que a validação está VIVA: um PO que não satisfaz o schema agora
    // REPROVA a ancoragem. Sem o schema, o mesmo PO passava em silêncio.
    const po = path.join(DIR, 'ciclo-01-prova-schema-po.md');
    const bom = fs.readFileSync(po, 'utf8');
    fs.writeFileSync(po, '---\ntitle: "PO truncado"\n---\n\n# PO\n\nSem os campos que o schema exige.\n');
    const comPoRuim = rodar();
    fs.writeFileSync(po, bom);
    checar('DEPOIS: um PO fora do schema REPROVA a ancoragem (a validação está viva)',
      comPoRuim.status !== 0 && /não satisfaz .*po-schema/.test((comPoRuim.stdout || '') + (comPoRuim.stderr || '')),
      (comPoRuim.stdout || '') + (comPoRuim.stderr || ''));
  } finally {
    fs.rmSync(path.join(RAIZ, 'professores', PROF), { recursive: true, force: true });
  }

  // ═══ B2. a LIGAÇÃO: quem escreve a fonte provisiona os schemas ═══════════
  //
  // A parte A prova a função; esta prova o fio. Sem ela, a função podia estar certa e ninguém
  // a chamar — que é exactamente o modo de falha que esta prova existe para matar (e o motivo
  // por que o `hash-ciclo.sh` antigo passava: a verificação existia, e não era invocada).
  console.log('\nB2. A ligação: os escritores provisionam antes de gravar');
  {
    const { criarEscritorDePO } = require('../motor/servidor/escrever-po.js');
    const v = repoVirtual(MOLDE);
    const escritor = criarEscritorDePO({
      token: 'x', dono: 'dono', repo: 'repo', ref: 'main',
      derivarPO: () => ({ markdown: '---\ntitle: "PO"\n---\n\n# PO\n' }),
      fetchImpl: v.f,
    });
    const r = await escritor({ contexto: { professor: 'professora-nova', ciclo: '01', escola: 'e', turma: 't' } }, 'msg');
    checar('o escritor do PO cria os cinco schemas na pasta da professora',
      r.schemas && r.schemas.criados.length === 5
      && v.arquivos.has('professores/professora-nova/ciclos/ciclo-01-schema.json'),
      JSON.stringify(r.schemas));
    checar('e escreve o PO no caminho dele, depois dos schemas',
      v.arquivos.has('professores/professora-nova/ciclos/ciclo-01-e-t-po.md'),
      JSON.stringify(v.escritas));
    checar('a fonte foi escrita DEPOIS dos schemas (a ordem importa para o gerador)',
      v.escritas.length === 6 && v.escritas[5].endsWith('-po.md'), JSON.stringify(v.escritas));
  }

  // ═══ C. o repositório vazio não deixa o ciclo sem schema ═════════════════
  //
  // ESTE CASO MUDOU DE PERGUNTA A 01/11/2026, e a mudança é o resultado. Antes, um repositório
  // sem o molde deixava o ciclo SEM validação — `ok:false` e cinco erros —, porque o conteúdo era
  // buscado à rede a cada provisionamento. Agora o molde vem empacotado no Worker: um repositório
  // vazio não o afeta, e o ciclo nasce com os cinco schemas na mesma. A falha «o molde não
  // existe» passou a ser de BUILD (o `require` de `motor/nucleo/schemas.js` não resolve), e uma
  // falha de build não chega a correr.
  //
  // O que continua a ser de runtime, e por isso continua a ser provado: a escrita pode falhar (o
  // PUT, no caso D), e a autorização pode faltar (sem token).
  console.log('\nC. Um repositório vazio não deixa o ciclo sem schema');
  {
    const semMolde = repoVirtual({});
    const r = await garantirSchemasDoCiclo({
      token: 'x', dono: 'dono', repo: 'repo', professor: 'p', ciclo: '01', fetchImpl: semMolde.f,
    });
    checar('sem o molde no repositório, os cinco são escritos na mesma (o conteúdo vem do módulo)',
      r.ok === true && r.criados.length === 5, JSON.stringify(r));
    checar('…e o conteúdo escrito é o do molde do repositório, que a prova lê do disco',
      SUFIXOS.every((s) => {
        const escrito = semMolde.arquivos.get('professores/p/ciclos/ciclo-01-' + s + '.json');
        return escrito && JSON.stringify(JSON.parse(escrito)) ===
          JSON.stringify(CONTEUDO['modelo/ciclos/ciclo-01-' + s + '.json']);
      }));

    const semToken = await garantirSchemasDoCiclo({ token: '', dono: 'd', repo: 'r', professor: 'p', ciclo: '01', fetchImpl: semMolde.f });
    checar('sem token, diz que não conferiu (não finge que conferiu)',
      semToken.ok === false && /não foram conferidos/.test(semToken.erros[0]), JSON.stringify(semToken));

    const falhaRede = await garantirSchemasDoCiclo({
      token: 'x', dono: 'd', repo: 'r', professor: 'p', ciclo: '01',
      fetchImpl: async () => ({ status: 500, json: async () => ({}) }),
    });
    checar('um 500 no meio vira erro relatado, e a função NÃO lança',
      falhaRede.ok === false && falhaRede.erros.length > 0, JSON.stringify(falhaRede));
  }
}

prova().then(() => {
  console.log('\n' + (falhas ? falhas + ' de ' + n + ' asserções FALHARAM' : n + ' asserções, todas passaram'));
  process.exit(falhas ? 1 : 0);
});
