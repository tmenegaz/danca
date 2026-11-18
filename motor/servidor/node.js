'use strict';

/**
 * node.js — a PONTE Node para o servidor agnóstico.
 *
 * Traduz `node:http` (IncomingMessage/ServerResponse) para os Web Standards
 * (Request/Response) e despacha no roteador de rotas.js. As rotas são as MESMAS
 * do Worker: aqui só muda o transporte, o armazenamento (fs) e o serviço de
 * estáticos (o disco).
 *
 * Uso:
 *   node servidor/node.js --porta 8787
 */

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const { criarRotas } = require('./rotas.js');
const { criarNode } = require('../adaptadores/node.js');
const { criarDisparador } = require('./disparar.js');
const { criarEscritorDePO } = require('./escrever-po.js');
const { criarEscritorDePlano } = require('./escrever-plano.js');
const { criarEscritorDeCiclo } = require('./escrever-ciclo.js');
const { derivarPO } = require('../nucleo/derivar-po.js');
const fichaHtml = require('../nucleo/ficha-html.js');

// A raiz do REPOSITÓRIO (a porta vive em `porta/`, irmã de `motor/` e `tools/`).
// `__dirname` é `motor/servidor`: sobe-se DOIS níveis (`servidor` → `motor` → raiz).
const RAIZ = path.resolve(__dirname, '..', '..');
const PORTA_DIR = path.join(RAIZ, 'porta');
const SAIDA_DIR = path.join(PORTA_DIR, 'saida');
const PROMPT = path.join(PORTA_DIR, 'prompts', 'elicitar-ciclo.md');
const IDENTIDADE = path.join(RAIZ, 'tools', 'templates', 'ciclo.css');

const MIME_ESTATICO = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function lerTexto(caminho) {
  return fs.readFileSync(caminho, 'utf8');
}

/** O serviço de estáticos: o disco sob `porta/`, com a trava de `..`. */
async function servirEstatico(caminho) {
  const relativo = caminho === '/' ? 'index.html' : caminho.replace(/^\/+/, '');
  const alvo = path.resolve(PORTA_DIR, relativo);
  if (alvo !== PORTA_DIR && !alvo.startsWith(PORTA_DIR + path.sep)) return null;
  try {
    const stat = await fs.promises.stat(alvo);
    if (!stat.isFile()) return null;
    const tipo = MIME_ESTATICO[path.extname(alvo).toLowerCase()] || 'application/octet-stream';
    const corpo = await fs.promises.readFile(alvo);
    return { status: 200, tipo, corpo, cabecalhos: { 'Cache-Control': 'no-store, max-age=0' } };
  } catch (erro) {
    return null;
  }
}

// O bootstrap Node: lê o conteúdo, o esquema, o PO, o plano, o prompt e a
// identidade do disco, e monta o armazenamento (fs) sob `porta/saida`.
function montar() {
  const armazenamento = criarNode(SAIDA_DIR);
  const conteudo = JSON.parse(lerTexto(path.join(PORTA_DIR, 'conteudo', 'anamnese.json')));
  const esquema = JSON.parse(lerTexto(path.join(PORTA_DIR, 'envelope', 'elicitacao-schema.json')));
  const conteudoPO = JSON.parse(lerTexto(path.join(PORTA_DIR, 'po', 'conteudo', 'po.json')));
  const conteudoPlano = JSON.parse(lerTexto(path.join(PORTA_DIR, 'plano', 'conteudo', 'plano.json')));
  const prompt = lerTexto(PROMPT);
  const identidade = lerTexto(IDENTIDADE);
  // O gatilho da geração: sem `GITHUB_TOKEN` no ambiente, é `null` (a elicitação
  // continua intacta). Com o token, o PO concluído dispara o workflow.
  const disparar = criarDisparador({
    token: process.env.GITHUB_TOKEN || null,
    dono: 'tmenegaz',
    repo: 'danca',
    workflow: 'gerar-ciclo.yml',
  });
  const escreverPO = criarEscritorDePO({
    token: process.env.GITHUB_TOKEN || null,
    dono: 'tmenegaz',
    repo: 'danca',
    ref: 'main',
    derivarPO,
  });
  const escreverPlano = criarEscritorDePlano({
    token: process.env.GITHUB_TOKEN || null,
    dono: 'tmenegaz',
    repo: 'danca',
    ref: 'main',
    // O CADASTRO DA TURMA no servidor local: o mesmo armazenamento que a Produção usa, e a mesma
    // chave do `bastidores.js` (`bastidores/<escola>/turmas`). Sem esta leitura, eliciar um plano
    // de turma em local não compõe o manifesto da variante — e o erro só apareceria na geração.
    lerTurmas: async (escola) => {
      if (!escola) return [];
      try {
        const bruto = await armazenamento.ler('bastidores/' + escola + '/turmas');
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
      } catch (erro) {
        return [];
      }
    },
  });
  const escreverCiclo = criarEscritorDeCiclo({
    token: process.env.GITHUB_TOKEN || null,
    dono: 'tmenegaz',
    repo: 'danca',
    ref: 'main',
  });
  // O servidor de desenvolvimento NÃO é uma escola: sem `ESCOLA_SLUG` no ambiente, a escola
  // do contexto vale como veio (o `?escola=` da URL). Definir a var aqui é o que permite
  // ensaiar em local o comportamento de produção — o mesmo critério do `escolaDe`.
  // A CURADORIA no servidor local — a mesma chave do `bastidores.js`, como o `lerTurmas` acima.
  // É dela que sai o recorte de `sujeitos` por turma: sem esta leitura, a bancada local ofereceria
  // no PO de uma turma as alunas das outras, que é exactamente o defeito de 20/10/2026.
  const lerCuradorias = async (escola) => {
    if (!escola) return [];
    try {
      const bruto = await armazenamento.ler('bastidores/' + escola + '/curadorias');
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  };
  /* O CADASTRO DAS ALUNAS na bancada local — a mesma chave do `bastidores.js`. É dele que sai o
   * `id` que a anamnese passa a declarar no contexto (18/11/2026): sem esta leitura, a bancada
   * comportar-se-ia como uma escola antiga, e o defeito que a correcção fecha não apareceria em
   * casa nenhuma — nem na prova, nem nos olhos de quem ensaia. */
  const lerAlunas = async (escola) => {
    if (!escola) return [];
    try {
      const bruto = await armazenamento.ler('bastidores/' + escola + '/alunas');
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  };
  return criarRotas({ armazenamento, conteudo, esquema, conteudoPO, conteudoPlano, fichaHtml, prompt, identidade, servirEstatico, disparar, escreverPO, escreverPlano, escreverCiclo, fuso: process.env.FUSO, escolaDoWorker: process.env.ESCOLA_SLUG || '', lerCuradorias, lerAlunas });
}

async function pedidoParaRequest(req) {
  const url = 'http://localhost' + req.url;
  const cabecalhos = {};
  for (const [chave, valor] of Object.entries(req.headers)) {
    if (valor !== undefined) cabecalhos[chave] = Array.isArray(valor) ? valor.join(', ') : valor;
  }
  let corpo;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const pedacos = [];
    for await (const pedaco of req) pedacos.push(pedaco);
    corpo = Buffer.concat(pedacos);
  }
  return new Request(url, { method: req.method, headers: cabecalhos, body: corpo });
}

function iniciar(porta) {
  const roteador = montar();
  const servidor = http.createServer(async (req, res) => {
    try {
      const request = await pedidoParaRequest(req);
      const resposta = await roteador.responder(request);
      const texto = await resposta.arrayBuffer();
      res.writeHead(resposta.status, Object.fromEntries(resposta.headers.entries()));
      res.end(Buffer.from(texto));
    } catch (erro) {
      res.writeHead(500, { 'Content-Type': 'application/json;charset=utf-8' });
      res.end(JSON.stringify({ ok: false, erro: erro.message }));
    }
  });
  servidor.listen(porta, () => {
    process.stdout.write('servidor agnóstico (Node) em http://localhost:' + porta + '\n');
  });
  return servidor;
}

module.exports = { montar, iniciar };

if (require.main === module) {
  const porta = Number(process.argv[process.argv.indexOf('--porta') + 1]) || 8787;
  iniciar(porta);
}
