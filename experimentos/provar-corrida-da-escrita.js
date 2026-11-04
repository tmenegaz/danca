'use strict';

/*
 * provar-corrida-da-escrita.js — duas gravações ao mesmo tempo não perdem um documento.
 *
 * O QUE SE MEDIU ANTES DA CORREÇÃO (04/11/2026). O id de um envelope é um carimbo de minuto
 * (`plano-20261104-1810`), e `identificar` o escolhe perguntando ao armazenamento se o nome já
 * existe. Entre essa pergunta e a gravação há uma janela: dois pedidos que perguntem antes de
 * qualquer escrita recebem o MESMO nome, e o segundo gravava por cima do primeiro. Medido com
 * dois `identificar` e duas gravações: sobrava o segundo documento, a estante mostrava um
 * registo só, e os DOIS pedidos respondiam «gravado». Um ajuste evaporava sem erro nenhum.
 *
 * O QUE ESTA PROVA FIXA.
 *
 *   A. A corrida do carimbo — dois pedidos, o mesmo minuto, ninguém perde.
 *   B. O índice — o resumo do nome que a corrida deu a outro descreve o ARQUIVO, não a
 *      tentativa que perdeu (o `.indice.json` é projeção; quem manda é o envelope).
 *   C. A edição em sítio continua a reescrever o MESMO nome (o «Guardar» de uma correção não
 *      pode inventar um `-2` a cada gravação — foi o que a primeira versão da correção fez, e
 *      o `provar-carimbo-da-edicao` apanhou).
 *   D. O elo novo (o ajuste) também cede o nome, se outro pedido chegou primeiro.
 *   E. O expurgo repete a corrida que perdeu — a árvore e a referência são refeitas, e a
 *      segunda tentativa publica.
 *
 * Roda o núcleo de verdade (`motor/nucleo/porta.js`) sobre a memória do núcleo, com o relógio
 * injetado, e o expurgo sobre um GitHub falso que recusa a primeira referência. Sem rede.
 *
 *   node experimentos/provar-corrida-da-escrita.js
 */

const path = require('path');

const porta = require('../motor/nucleo/porta.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');
const repo = require('../motor/servidor/repo-escola.js');

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  ✓ ' + rotulo);
  } else {
    falhas += 1;
    console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

const CARIMBO = '2026-11-04T18:10';
const relatorioDe = (id) => ({
  id,
  estado: 'Input_PO_Aguardando',
  contagem: { respondidos: 1, obrigatorios: 1 },
  elos: [],
  paradas: [],
  idsDesconhecidos: [],
  validacao: { resultado: 'ok', contrato: 'x' },
  errosDoDocumento: [],
  avisos: [],
});

/** Um documento com marca, para se saber QUAL sobreviveu. */
const documento = (marca) => ({ id: 'a-preencher', envelope: 'plano', marca });

async function main() {
  // =========================================================== A
  console.log('\nA. Dois pedidos, o mesmo minuto: os dois documentos ficam');
  {
    const armazenamento = criarMemoria();
    // OS DOIS IDENTIFICAM ANTES DE QUALQUER ESCRITA — é o que acontece entre dois isolates.
    const um = await porta.identificar(armazenamento, 'plano', () => CARIMBO);
    const outro = await porta.identificar(armazenamento, 'plano', () => CARIMBO);
    checar('os dois pedidos recebem o MESMO nome (a janela existe de verdade)', um.id === outro.id, {
      um: um.id,
      outro: outro.id,
    });

    const r1 = await porta.gravarEnvelope(
      armazenamento,
      Object.assign(documento('AJUSTE A'), { id: um.id }),
      relatorioDe(um.id),
      { substituir: false },
    );
    const r2 = await porta.gravarEnvelope(
      armazenamento,
      Object.assign(documento('AJUSTE B'), { id: outro.id }),
      relatorioDe(outro.id),
      { substituir: false },
    );

    checar('as duas gravações dizem que gravaram', r1.ok && r2.ok, { r1: r1.ok, r2: r2.ok });
    checar('a segunda NÃO ficou com o nome da primeira', r2.id !== r1.id, { r1: r1.id, r2: r2.id });
    const nomes = (await armazenamento.listar('envelope/')).filter((k) => k.endsWith('.json') && k.indexOf('.indice') === -1);
    checar('há DOIS documentos no acervo (nenhum evaporou)', nomes.length === 2, nomes);

    const a = await armazenamento.ler('envelope/' + r1.id + '.json');
    const b = await armazenamento.ler('envelope/' + r2.id + '.json');
    checar('o Ajuste A está inteiro no seu arquivo', Boolean(a) && JSON.parse(a).marca === 'AJUSTE A', a && JSON.parse(a).marca);
    checar('o Ajuste B está inteiro no seu arquivo', Boolean(b) && JSON.parse(b).marca === 'AJUSTE B', b && JSON.parse(b).marca);
    checar('o id do ENVELOPE é o nome do arquivo — os dois não divergem',
      Boolean(a) && JSON.parse(a).id === r1.id && Boolean(b) && JSON.parse(b).id === r2.id,
      { arquivoA: r1.id, dentroA: a && JSON.parse(a).id, arquivoB: r2.id, dentroB: b && JSON.parse(b).id });

    // O CAMINHO ANTIGO, AINDA EXPRESSÁVEL — e é o que prova que a correção corrige algo. Com
    // `substituir: true` (a gravação cega, que era a única) a mesma corrida perde um documento.
    const cego = criarMemoria();
    const c1 = await porta.identificar(cego, 'plano', () => CARIMBO);
    const c2 = await porta.identificar(cego, 'plano', () => CARIMBO);
    await porta.gravarEnvelope(cego, Object.assign(documento('AJUSTE A'), { id: c1.id }), relatorioDe(c1.id), { substituir: true });
    await porta.gravarEnvelope(cego, Object.assign(documento('AJUSTE B'), { id: c2.id }), relatorioDe(c2.id), { substituir: true });
    const cegos = (await cego.listar('envelope/')).filter((k) => k.indexOf('.indice') === -1);
    checar('e a gravação CEGA (o `substituir: true`, que era o único caminho) perde um — é o defeito medido',
      cegos.length === 1, cegos);
  }

  // =========================================================== B
  console.log('\nB. O índice: o resumo do nome cedido descreve o ARQUIVO, não a tentativa');
  {
    const armazenamento = criarMemoria();
    const um = await porta.identificar(armazenamento, 'plano', () => CARIMBO);
    const outro = await porta.identificar(armazenamento, 'plano', () => CARIMBO);
    const r1 = await porta.gravarEnvelope(
      armazenamento, Object.assign(documento('AJUSTE A'), { id: um.id }), relatorioDe(um.id), { substituir: false },
    );
    await porta.gravarEnvelope(
      armazenamento, Object.assign(documento('AJUSTE B'), { id: outro.id }), relatorioDe(outro.id), { substituir: false },
    );
    const indice = JSON.parse(await armazenamento.ler('envelope/.indice.json'));
    const resumoDoPrimeiro = indice.resumos[r1.id + '.json'];
    checar('o índice tem os DOIS nomes', indice.nomes.length === 2, indice.nomes);
    checar('o resumo do nome cedido existe', Boolean(resumoDoPrimeiro), resumoDoPrimeiro);
    // O arquivo do primeiro nome guarda o documento do A: o resumo tem de o descrever.
    const arquivo = JSON.parse(await armazenamento.ler('envelope/' + r1.id + '.json'));
    checar('e ele descreve o documento que está no arquivo (não o que perdeu a corrida)',
      Boolean(resumoDoPrimeiro) && resumoDoPrimeiro.id === arquivo.id,
      { resumo: resumoDoPrimeiro && resumoDoPrimeiro.id, arquivo: arquivo.id });
  }

  // =========================================================== C
  console.log('\nC. A edição em sítio reescreve o MESMO nome (o «Guardar» de uma correção)');
  {
    const armazenamento = criarMemoria();
    const um = await porta.identificar(armazenamento, 'anamnese', () => CARIMBO);
    const r1 = await porta.gravarEnvelope(
      armazenamento, Object.assign(documento('ANTES'), { id: um.id }), relatorioDe(um.id), { substituir: false },
    );
    const r2 = await porta.gravarEnvelope(
      armazenamento, Object.assign(documento('DEPOIS'), { id: um.id }), relatorioDe(um.id), { substituir: true },
    );
    checar('o nome é o mesmo (a correção não inventa um `-2`)', r1.id === r2.id && r2.id === um.id, { r1: r1.id, r2: r2.id });
    const nomes = (await armazenamento.listar('envelope/')).filter((k) => k.indexOf('.indice') === -1);
    checar('e a estante continua com UM registo', nomes.length === 1, nomes);
    const arquivo = JSON.parse(await armazenamento.ler('envelope/' + um.id + '.json'));
    checar('o conteúdo é o da correção', arquivo.marca === 'DEPOIS', arquivo.marca);
  }

  // =========================================================== D
  console.log('\nD. O elo novo (o ajuste) também cede o nome');
  {
    const armazenamento = criarMemoria();
    const base = await porta.identificar(armazenamento, 'plano', () => CARIMBO);
    await porta.gravarEnvelope(
      armazenamento, Object.assign(documento('BASE'), { id: base.id }), relatorioDe(base.id), { substituir: false },
    );
    // O ajuste identifica agora — e outro pedido identifica no mesmo minuto.
    const ajuste1 = await porta.identificar(armazenamento, 'plano', () => CARIMBO);
    const ajuste2 = await porta.identificar(armazenamento, 'plano', () => CARIMBO);
    checar('os dois ajustes do mesmo minuto recebem o mesmo nome', ajuste1.id === ajuste2.id, { a: ajuste1.id, b: ajuste2.id });
    const g1 = await porta.gravarEnvelope(
      armazenamento, Object.assign(documento('ELO 1'), { id: ajuste1.id }), relatorioDe(ajuste1.id), { substituir: false },
    );
    const g2 = await porta.gravarEnvelope(
      armazenamento, Object.assign(documento('ELO 2'), { id: ajuste2.id }), relatorioDe(ajuste2.id), { substituir: false },
    );
    checar('os dois elos ficam', g1.ok && g2.ok && g1.id !== g2.id, { g1: g1.id, g2: g2.id });
    const nomes = (await armazenamento.listar('envelope/')).filter((k) => k.indexOf('.indice') === -1);
    checar('a cadeia tem três registos (a base e os dois elos)', nomes.length === 3, nomes);
  }

  // =========================================================== F
  console.log('\nE. O adaptador do repositório: «já existe» é o 422 do GitHub, e só ele');
  {
    const acervo = require('../motor/servidor/acervo-envelopes.js');
    /**
     * O GitHub mínimo que esta secção precisa, e o que ele modela é a ÚNICA coisa que foi
     * medida contra o real (04/11/2026): criar sem `sha` → 201; criar sem `sha` sobre um
     * caminho que já existe → **422 `"sha" wasn't supplied.`**.
     */
    const githubFalso = () => {
      const arquivos = new Map();
      const estado = { puts: [], respostaForcada: null };
      const json = (corpo, status) => new Response(JSON.stringify(corpo), {
        status: status || 200, headers: { 'content-type': 'application/json' },
      });
      estado.fetch = async (url, opcoes) => {
        const u = new URL(url);
        const metodo = (opcoes && opcoes.method) || 'GET';
        const m = /\/contents\/(.+)$/.exec(u.pathname);
        if (!m) return json({}, 404);
        const caminho = decodeURIComponent(m[1]);
        if (metodo === 'GET') {
          if (!arquivos.has(caminho)) return new Response('not found', { status: 404 });
          return json({ sha: 'sha-' + caminho, content: Buffer.from(arquivos.get(caminho), 'utf8').toString('base64') });
        }
        if (metodo === 'PUT') {
          const corpo = JSON.parse(opcoes.body);
          estado.puts.push({ caminho, tinhaSha: Boolean(corpo.sha) });
          if (estado.respostaForcada) {
            const r = estado.respostaForcada;
            estado.respostaForcada = null;
            return json({ message: r.mensagem }, r.status);
          }
          if (arquivos.has(caminho) && !corpo.sha) {
            return json({ message: 'Invalid request.\n\n"sha" wasn\'t supplied.' }, 422);
          }
          arquivos.set(caminho, Buffer.from(corpo.content, 'base64').toString('utf8'));
          return json({ commit: { sha: 'commit-' + estado.puts.length } }, 201);
        }
        return json({}, 405);
      };
      estado.arquivos = arquivos;
      return estado;
    };
    const acervoDe = (gh) => acervo.criarAcervoDeEnvelopes({
      token: 't', dono: 'tmenegaz', repo: 'danca', ref: 'main', escola: 'calango',
      senhaCripto: 'senha-de-teste', fetchImpl: gh.fetch,
    });

    const gh = githubFalso();
    const a = acervoDe(gh);
    const primeiro = await a.criar('envelope/plano-20261104-1810.json', '{"x":1}\n');
    checar('a criação manda a escrita SEM `sha` (é o que pede a existência ao GitHub)',
      gh.puts.length === 1 && gh.puts[0].tinhaSha === false, gh.puts[0]);
    checar('e o arquivo novo entra', primeiro.criado === true && primeiro.status !== 422, primeiro);

    const segundo = await a.criar('envelope/plano-20261104-1810.json', '{"x":2}\n');
    checar('a segunda criação no MESMO caminho devolve «já existe»', segundo.jaExiste === true && segundo.criado === false, segundo);
    checar('e NÃO sobrescreveu o arquivo', JSON.parse(gh.arquivos.get('escola/calango/envelopes/plano-20261104-1810.json')).x === 1);

    // UM 422 QUE NÃO FALA DO `sha` NÃO É «JÁ EXISTE» — senão o chamador pediria sufixos sem fim.
    const outro = githubFalso();
    const b = acervoDe(outro);
    outro.respostaForcada = { status: 422, mensagem: 'Invalid request. Path is invalid.' };
    const invalido = await b.criar('envelope/plano-20261104-1811.json', '{}\n');
    checar('um 422 por outro motivo é ERRO, não «já existe»', invalido.jaExiste !== true && Boolean(invalido.erro), invalido);

    // A CORRIDA DO ÍNDICE (409) REPETE — e não é «já existe».
    const terceiro = githubFalso();
    const c = acervoDe(terceiro);
    terceiro.respostaForcada = { status: 409, mensagem: 'sha does not match' };
    const comCorrida = await c.criar('envelope/plano-20261104-1812.json', '{"y":1}\n');
    checar('um 409 de corrida repete e a criação entra', comCorrida.criado === true, comCorrida);
    checar('e foram DUAS tentativas (a recusada e a que entrou)', terceiro.puts.length === 2, terceiro.puts.length);
  }

  console.log('\nF. O expurgo repete a corrida perdida — e a segunda tentativa publica');
  {
    // Um GitHub falso que recusa a PRIMEIRA atualização de referência com 422 «not a fast
    // forward» (é o que o real faz quando outro escritor avançou o `main` no meio) e aceita a
    // segunda. As demais chamadas respondem o suficiente para o caminho andar.
    let recusas = 1;
    let pathes = 0;
    const falso = async (url, init) => {
      const metodo = (init && init.method) || 'GET';
      const responde = (status, corpo) => ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => corpo,
      });
      if (url.indexOf('/git/ref/heads/') !== -1) {
        return responde(200, { object: { sha: 'commit-base' } });
      }
      if (url.indexOf('/git/commits/') !== -1 && metodo === 'GET') {
        return responde(200, { sha: 'commit-base', tree: { sha: 'arvore-base' } });
      }
      if (url.indexOf('/git/trees/') !== -1) {
        return responde(200, { tree: [] });
      }
      if (url.indexOf('/contents/') !== -1 && metodo === 'GET') {
        return responde(404, { message: 'Not Found' });
      }
      if (url.indexOf('/git/trees') !== -1 && metodo === 'POST') {
        return responde(201, { sha: 'arvore-nova' });
      }
      if (url.indexOf('/git/commits') !== -1 && metodo === 'POST') {
        return responde(201, { sha: 'commit-novo' });
      }
      if (url.indexOf('/git/refs/heads/') !== -1 && metodo === 'PATCH') {
        pathes += 1;
        if (recusas > 0) {
          recusas -= 1;
          return responde(422, { message: 'Update is not a fast forward' });
        }
        return responde(200, { object: { sha: 'commit-novo' } });
      }
      return responde(200, {});
    };

    const r = await repo.apagarEscolaDoRepo({
      token: 'x', dono: 'd', repo: 'r', ref: 'main', slug: 'zzz-prova', confirmacao: 'zzz-prova',
      motivo: 'prova', quando: '2026-11-04', fetchImpl: falso,
    });
    checar('o expurgo NÃO desistiu na primeira recusa', pathes >= 2, { pathes });
    checar('e ele diz que entrou', r.ok === true, r && (r.erro || r.motivo));
    checar('declarando quantas tentativas gastou', typeof r.intentos === 'number' && r.intentos >= 2, r && r.intentos);
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: dois pedidos no mesmo minuto gravam os DOIS documentos ' +
    '(a escrita condicional cede o nome e o índice descreve o arquivo, não a tentativa), a edição em sítio ' +
    'continua a reescrever o mesmo nome, e o expurgo refaz a corrida que perdeu.');
}

main().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
