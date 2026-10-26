#!/usr/bin/env node
'use strict';

/**
 * provar-porta-sem-contexto.js — a rota nua da porta não serve a porta: manda à lista.
 *
 * O DEFEITO (26/10/2026, lido na tela pela pesquisadora). «No anamnese, plano de ensino e plano de
 * observação, mesmo que só por um breve momento, eu consigo acessar a rota sem passar pela área do
 * professor… Aí em seguida eu sou direcionado para a área do professor anamnese… mas não pode
 * existir esse caminho.»
 *
 * O que acontecia: `/anamnese/`, `/plano-ensino/` e `/plano-observacao/` são a PORTA de
 * elicitação, e a porta exige o contexto do ato (professor, ciclo e, na anamnese, a aluna). Sem
 * ele, o JavaScript dela chama `voltarParaALista()` no arranque — ou seja, a página era SERVIDA
 * para logo se descartar. O que a pessoa via era a pálida de um formulário que nunca ia abrir.
 *
 * O QUE MUDOU. O endereço sem contexto nenhum não é a porta: o servidor responde `302` para a
 * LISTA daquela fonte (`/area-do-professor/<fonte>/`), antes de qualquer byte de formulário. A
 * prova mede os DOIS LADOS — porque o risco de uma correção destas é fechar a porta que funciona:
 *
 *   1. SEM CONTEXTO — as três rotas (com e sem a barra final) respondem `302`, e o `Location` é a
 *      lista da própria fonte. Nenhum HTML de formulário viaja: o corpo é vazio;
 *   2. AINDA SEM CONTEXTO, mas com parâmetros que não semeiam o ato (`?fonte=plano`, `?abrir=1`) —
 *      também `302`. É o caso dos links antigos do índice da escola, e dos favoritos;
 *   3. COM CONTEXTO — `?professor=…&ciclo=…&aluna=…&abrir=1` continua a servir a porta (`200`), e
 *      é isso que impede que a correção mate o ato. O mesmo para `?editar=` e `?ajustar=`, que
 *      levam o carimbo em vez do contexto (o envelope é que o traz);
 *   4. OS `api/` E `assets/` DA PORTA continuam a passar. Eles não são a rota do formulário, e um
 *      `ficha` sem `?professor=` é uma chamada legítima da página já aberta;
 *   5. O FREIO DA ÁREA DO PROFESSOR não muda: sem professor cadastrado, a rota responde a página
 *      que diz como resolver — e não um `302` que esconde o motivo.
 *
 * COMO É MEDIDA. A ponte de produção de VERDADE (`motor/servidor/producao.js`), em processo, com
 * um ASSETS e um KV de mentira. Nada disto toca no ar nem gasta a cota do Cloudflare.
 *
 *   node experimentos/provar-porta-sem-contexto.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');

/* CONTROLE NEGATIVO — `--controle-negativo` extrai o motor de `REF_NEGATIVO` (padrão `HEAD`) com
   `git archive` e corre as MESMAS provas. Com o código de antes, as três rotas nuas respondem
   `200` e servem o formulário: se elas passassem, esta prova não estaria a provar nada.
   Vão as pastas que os `require` do motor pedem: `tools/` (a barra e a cifra), `biblioteca/` (o
   catálogo), `teste/` (os fixtures, exigidos no topo do módulo) e `porta/` (o `markdown.js`, que
   o `ficha-html` importa por caminho relativo). */
const negativo = process.argv.includes('--controle-negativo');
let motor = path.join(raiz, 'motor');
if (negativo) {
  const ref = process.env.REF_NEGATIVO || 'HEAD';
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-porta-'));
  execSync('git archive ' + ref + ' motor biblioteca tools teste porta | tar -x -C ' + destino,
    { cwd: raiz, stdio: 'pipe' });
  motor = path.join(destino, 'motor');
  console.log('CONTROLE NEGATIVO — o motor de ' + ref + ' (antes do 302)\n');
}
const producao = require(path.join(motor, 'servidor/producao.js'));

const ESCOLA = 'prova-escola';
const HOST = 'https://' + ESCOLA + '.tmenegaz77.workers.dev';

/** O HTML da porta, mínimo: a prova mede o ROTEAMENTO, não o formulário. */
const PAGINA_DA_PORTA = '<!DOCTYPE html><html><head><title>Porta</title></head>'
  + '<body><section id="conducao"></section><p>ENVELOPE-DA-PORTA</p></body></html>';

/**
 * O ASSETS da escola. Ele serve o subdiretório da porta (`plano-observacao/`, o único de onde a
 * ponte lê) e um punhado de páginas do pacote. O que não existe devolve `404` — como no Worker.
 */
function assets() {
  const arquivos = {
    '/plano-observacao/': PAGINA_DA_PORTA,
    '/plano-observacao/index.html': PAGINA_DA_PORTA,
    '/plano-observacao/assets/porta.js': '// porta\n',
    '/index.html': '<!DOCTYPE html><html><body>INDICE</body></html>',
    '/nivel-1/plano.html': '<!DOCTYPE html><html><body>CICLO</body></html>',
  };
  /* O CONTEÚDO E O ESQUEMA DA PORTA VÊM DO DISCO, e não de um fixture (26/10/2026). A ponte
     não devolve a página: ela MONTA a porta, e a montagem exige `conteudo/anamnese.json`,
     `envelope/elicitacao-schema.json` e o resto. Um `500 «conteúdo ou esquema ausentes»` foi o
     primeiro resultado desta prova, e a lição é a de sempre: um ASSETS de mentira que não tem o
     que o produto lê mede um produto que não existe. O que se serve é `porta/`, que é de onde o
     `gerar-ciclo` copia estes mesmos ficheiros para dentro do pacote. */
  const DA_PORTA = ['conteudo/anamnese.json', 'envelope/elicitacao-schema.json',
    'po/conteudo/po.json', 'plano/conteudo/plano.json', 'prompts/elicitar-ciclo.md'];
  return {
    async fetch(pedido) {
      const url = new URL(typeof pedido === 'string' ? pedido
        : pedido instanceof URL ? pedido.href : pedido.url);
      const caminho = decodeURIComponent(url.pathname);
      const corpo = arquivos[caminho];
      if (corpo !== undefined) {
        const tipo = /\.js$/.test(caminho) ? 'text/javascript' : 'text/html; charset=utf-8';
        return new Response(corpo, { status: 200, headers: { 'Content-Type': tipo } });
      }
      const daPorta = DA_PORTA.find((f) => caminho === '/plano-observacao/' + f);
      if (daPorta) {
        return new Response(fs.readFileSync(path.join(raiz, 'porta', daPorta), 'utf8'),
          { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      }
      if (caminho === '/assets/style.css') {
        return new Response(fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8'),
          { status: 200, headers: { 'Content-Type': 'text/css; charset=utf-8' } });
      }
      return new Response('', { status: 404 });
    },
  };
}

/** Um KV de mentira — a ponte pede a aparência da escola, e as listas leem o acervo. */
function kv() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list(op) {
      const pref = (op && op.prefix) || '';
      return { keys: [...dados.keys()].filter((k) => k.startsWith(pref)).map((name) => ({ name })),
        list_complete: true };
    },
  };
}

/** O ambiente de uma escola COM professor cadastrado (o caso normal). */
const ambiente = () => ({
  ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Professora da Prova',
  PADD_KV: kv(), ASSETS: assets(),
});

const pedir = async (caminho, env) => producao.fetch(new Request(HOST + caminho), env || ambiente());

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

(async () => {
  // ---------------------------------------------------------------- 1) a rota nua
  console.log('\n1. a rota nua da porta não serve a porta: 302 para a lista da fonte');
  const FONTES = [
    { porta: '/anamnese', lista: '/area-do-professor/anamnese/' },
    { porta: '/plano-ensino', lista: '/area-do-professor/plano-de-ensino/' },
    { porta: '/plano-observacao', lista: '/area-do-professor/plano-de-observacao/' },
  ];
  for (const f of FONTES) {
    for (const caminho of [f.porta, f.porta + '/', f.porta + '/index.html']) {
      const r = await pedir(caminho);
      const corpo = await r.text();
      provar(caminho + ' → 302', r.status === 302, r.status);
      provar(caminho + ' → ' + f.lista, r.headers.get('Location') === f.lista,
        r.headers.get('Location'));
      provar(caminho + ' não devolve o formulário', corpo === '', corpo.slice(0, 60));
    }
  }

  // ---------------------------------------------------------------- 2) parâmetros que não são contexto
  console.log('\n2. parâmetros que não semeiam o ato também vão à lista (os links antigos)');
  for (const caminho of ['/anamnese/?abrir=1', '/plano-ensino/?fonte=plano',
    '/plano-observacao/?fonte=po', '/anamnese/?utm_source=email']) {
    const r = await pedir(caminho);
    provar(caminho + ' → 302', r.status === 302, r.status);
  }

  // ---------------------------------------------------------------- 3) com contexto, a porta abre
  console.log('\n3. com contexto do ato, a porta CONTINUA a abrir (o ato não foi fechado)');
  const COM_CONTEXTO = [
    '/anamnese/?professor=prova&ciclo=01&aluna=Vava&abrir=1',
    '/plano-ensino/?professor=prova&ciclo=01&fonte=plano&abrir=1',
    '/plano-observacao/?professor=prova&ciclo=01&fonte=po&plano=abc&abrir=1',
    // O «Editar» leva o CARIMBO, e não o contexto: quem o traz é o envelope.
    '/plano-ensino/?editar=carimbo-123&fonte=plano',
    '/plano-ensino/?ajustar=carimbo-123&fonte=plano',
  ];
  for (const caminho of COM_CONTEXTO) {
    const r = await pedir(caminho);
    const html = await r.text();
    provar(caminho + ' → 200', r.status === 200, r.status);
    provar(caminho + ' serve a porta', html.indexOf('ENVELOPE-DA-PORTA') !== -1, html.slice(0, 60));
  }

  // ---------------------------------------------------------------- 4) api e assets continuam
  console.log('\n4. os `api/` e `assets/` da porta continuam a passar (não são o formulário)');
  for (const caminho of ['/anamnese/assets/porta.js']) {
    const r = await pedir(caminho);
    provar(caminho + ' não é redirecionado', r.status !== 302, r.status);
  }

  // ---------------------------------------------------------------- 5) o freio não mudou
  console.log('\n5. sem professor cadastrado, a resposta continua a ser a que diz como resolver');
  {
    const semProfessor = { ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PADD_KV: kv(), ASSETS: assets() };
    const r = await pedir('/anamnese/', semProfessor);
    const html = await r.text();
    provar('/anamnese/ (escola sem professor) não é 302', r.status !== 302, r.status);
    provar('…e a página diz o que falta e onde se resolve',
      html.indexOf('Área do Professor desabilitada') !== -1
        && html.indexOf('/bastidores/producao') !== -1, html.slice(0, 80));
  }

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), '
    + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
