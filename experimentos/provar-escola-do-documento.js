'use strict';

/*
 * provar-escola-do-documento.js — o nome da escola no JSON é o do WORKER.
 *
 * Por que existe (18/10/2026). O dono do produto levantou a pergunta certa: «nos
 * arquivos de chave-valor eu preciso ter qual é a escola; não posso inferir isso do
 * diretório, porque o mesmo professor dá aula em mais de uma escola — e a proveniência
 * vai cruzar resultados da escola A com os da escola B». Ele está certo, e a
 * investigação achou três coisas, todas na mesma raiz:
 *
 *   1. o documento (`envelope/<id>.json`) levava `contexto.escola` do CLIENTE;
 *   2. o COFRE monta a chave com `contexto.escola` — uma escola forjada escrevia dentro
 *      do prefixo de OUTRA escola, no KV compartilhado;
 *   3. a fonte do PO e a do plano viram CAMINHO no repositório a partir de
 *      `contexto.escola` — `ciclo-01-<escola>-po.md` no pacote de outra escola.
 *
 * O `ESCOLA_SLUG` do Worker já era a autoridade em `escolaDe()`, mas ele não era aplicado
 * ao `contexto` que as rotas recebem. A correção é esta: nas rotas de escrita (e nas de
 * leitura do cofre), a escola do contexto É a do Worker. O campo continua existindo no
 * JSON — é ele que o cruzamento de dados vai ler —, e passa a ser o verdadeiro.
 *
 * O que ele NÃO faz: não confere professor nem ciclo (esses são escolha do professor, e
 * continuam vindo do cliente); não muda a senha; não toca no cofre já gravado.
 *
 * CONTROLE NEGATIVO. `--controle-negativo` extrai o `motor/` de `HEAD` para um diretório
 * temporário (via `git archive`) e roda as MESMAS provas contra o servidor de antes. Sem
 * isso, uma prova que passasse nos dois estados não provaria nada.
 *
 *   node experimentos/provar-escola-do-documento.js
 *   node experimentos/provar-escola-do-documento.js --controle-negativo
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

const ESCOLA_DO_WORKER = 'valse';
const ESCOLA_FORJADA = 'outra-escola';
const CONTEXTO_VALIDO = { professor: 'tiago-menegaz', ciclo: '01', aluna: 'Ana' };

const BASE = {
  idade: '21/11/2017',
  'categoria-etaria': 'Infantil',
  'formato-anatomico-dos-joelhos': 'Normal/alinhado',
};

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  ok    ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/**
 * Extrai o `motor/` de um commit para um diretório temporário. O `tar` preserva a
 * árvore, então os `require('../nucleo/…')` de dentro do `rotas.js` antigo continuam
 * resolvendo — é o código de verdade, não uma cópia editada à mão.
 */
function motorDoCommit(ref) {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-' + ref.replace(/[^a-z0-9]/gi, '') + '-'));
  execSync('git archive ' + ref + ' motor | tar -x -C ' + destino, { cwd: RAIZ, stdio: 'pipe' });
  return path.join(destino, 'motor');
}

function bancada({ motor, escolaDoWorker, lancamento }) {
  const { criarRotas } = require(path.join(motor, 'servidor/rotas.js'));
  const { criarMemoria } = require(path.join(motor, 'nucleo/armazenamento.js'));
  const armazenamento = criarMemoria();
  const rotas = criarRotas({
    armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    escolaDoWorker,
    lancamentoSeguro: lancamento,
  });
  return { armazenamento, rotas };
}

async function pedir(rotas, metodo, caminho, corpo) {
  const pedido = new Request('http://local' + caminho, {
    method: metodo,
    headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const resposta = await rotas.responder(pedido);
  const texto = await resposta.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch { dados = texto; }
  return { status: resposta.status, dados };
}

async function provar(motor, etiqueta) {
  console.log('\n' + etiqueta);
  const forjado = { ...CONTEXTO_VALIDO, escola: ESCOLA_FORJADA };

  // ---------------------------------------------------------------- 1) o envelope
  {
    const { armazenamento, rotas } = bancada({ motor, escolaDoWorker: ESCOLA_DO_WORKER });
    const r = await pedir(rotas, 'POST', '/api/elicitar', {
      fonte: 'anamnese', simular: false, respostas: BASE, contexto: forjado,
    });
    const doc = r.dados && r.dados.documento;
    checar('o documento gravado declara a escola do WORKER',
      Boolean(doc) && doc.contexto && doc.contexto.escola === ESCOLA_DO_WORKER,
      doc && doc.contexto && doc.contexto.escola);
    // E o que está NO DISCO (a memória) é o mesmo: o documento não é corrigido só na resposta.
    const chave = 'envelope/' + (doc && doc.id) + '.json';
    const cru = await armazenamento.ler(chave);
    let noDisco = null;
    try { noDisco = JSON.parse(cru); } catch { noDisco = null; }
    checar('e é isso que está GRAVADO — não só o que a resposta diz',
      Boolean(noDisco) && noDisco.contexto.escola === ESCOLA_DO_WORKER,
      noDisco && noDisco.contexto && noDisco.contexto.escola);
    checar('o nome da escola continua NO JSON (não foi removido)',
      Boolean(noDisco) && Object.prototype.hasOwnProperty.call(noDisco.contexto, 'escola'));
  }

  // ---------------------------------------------------------------- 2) o cofre
  let carimboDoCofre = null;
  {
    const { armazenamento, rotas } = bancada({ motor, escolaDoWorker: ESCOLA_DO_WORKER });
    const r = await pedir(rotas, 'POST', '/api/anamnese', {
      contexto: { ...forjado, carimbo: 'anamnese-20261018-0900' },
      // O involucro que o `Cifra.cifrarSync` produz (o cofre só confere estes dois campos —
      // o resto é opaco para ele, e é assim que deve ser: a chave não está no servidor).
      _cifrado: { algoritmo: 'AES-GCM', iteracoes: 250000, endereco: 'conteudo/anamnese.json', texto: 'AAAA' },
    });
    carimboDoCofre = 'anamnese-20261018-0900';
    const chave = (r.dados && r.dados.chave) || '';
    checar('o cofre grava sob o prefixo da escola do WORKER',
      chave.indexOf(ESCOLA_DO_WORKER + '/') === 0, chave);
    checar('e NÃO sob o prefixo da escola da requisição',
      chave.indexOf(ESCOLA_FORJADA) === -1, chave);
    // A leitura segue a mesma regra: quem pede «outra-escola» recebe a família da valse.
    const lista = await pedir(rotas, 'GET',
      '/api/anamnese?escola=' + ESCOLA_FORJADA + '&professor=tiago-menegaz&ciclo=01');
    checar('listar com a escola forjada lista a família da escola do Worker',
      Boolean(lista.dados && Array.isArray(lista.dados.anamneses)) &&
      lista.dados.anamneses.indexOf(carimboDoCofre) !== -1,
      lista.dados && lista.dados.anamneses);
    const um = await pedir(rotas, 'GET',
      '/api/anamnese/' + carimboDoCofre + '?escola=' + ESCOLA_FORJADA + '&professor=tiago-menegaz&ciclo=01');
    checar('ler um carimbo com a escola forjada acha o registro da escola do Worker',
      um.status === 200, um.status);
    void armazenamento;
  }

  // ---------------------------------------------------------------- 3) o lançamento
  {
    const aceita = { autorizar: async () => true, cifrar: null };
    const { armazenamento, rotas } = bancada({ motor, escolaDoWorker: ESCOLA_DO_WORKER, lancamento: aceita });
    const dados = { escola: ESCOLA_FORJADA, professor: 'tiago-menegaz', aulas: [] };
    const indice = { ciclos: [{ id: '01', escola: ESCOLA_FORJADA }] };
    const r = await pedir(rotas, 'POST', '/api/receber', {
      senha: 'aceita-pela-bancada',
      ciclo: '01',
      arquivos: [
        { nome: 'ciclo-01-x-dados-2026-10-18T0900.json', texto: JSON.stringify(dados) },
        { nome: 'ciclos.json', texto: JSON.stringify(indice) },
      ],
    });
    checar('o lançamento responde com a escola do WORKER',
      Boolean(r.dados) && r.dados.ok === true && r.dados.escola === ESCOLA_DO_WORKER,
      r.dados && (r.dados.erro || r.dados.escola));
    const chaves = await armazenamento.listar('');
    checar('e grava sob o prefixo da escola do WORKER, não o do payload',
      chaves.length > 0 && chaves.every((k) => k.indexOf(ESCOLA_DO_WORKER + '/') === 0),
      chaves);
    // A porta fechada por padrão continua valendo: sem `autorizar`, recusa.
    const { rotas: semSenha } = bancada({ motor, escolaDoWorker: ESCOLA_DO_WORKER });
    const recusa = await pedir(semSenha, 'POST', '/api/receber', { senha: 'x', arquivos: [] });
    checar('sem conferência de senha injetada, o lançamento RECUSA',
      Boolean(recusa.dados) && recusa.dados.ok === false && /senha/.test(String(recusa.dados.erro)),
      recusa.dados && recusa.dados.erro);
  }
}

(async () => {
  const negativo = process.argv.includes('--controle-negativo');
  let motor = path.join(RAIZ, 'motor');
  let etiqueta = 'O SERVIDOR DE AGORA';
  if (negativo) {
    motor = motorDoCommit('HEAD');
    etiqueta = 'CONTROLE NEGATIVO — o motor de HEAD (antes da correção)';
  }

  await provar(motor, etiqueta);

  console.log('\n' + (negativo ? 'controle negativo: ' : '') +
    'provar-escola-do-documento: ' + (n - falhas) + ' de ' + n + ' passaram');
  process.exit(falhas ? 1 : 0);
})();
