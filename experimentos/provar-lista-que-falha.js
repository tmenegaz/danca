'use strict';

/*
 * provar-lista-que-falha.js — quando a enumeração falha, a tela diz o motivo.
 *
 * O que aconteceu (19/10/2026). As quatro listas da porta (`/api/anamneses`,
 * `/api/planos`, `/api/anamnese-estados`, `/api/plano-estados`) começam por ENUMERAR as
 * chaves do armazenamento — `listar`, que no KV é `kv.list`. O `kv.list` tem cota diária
 * própria no plano gratuito do Cloudflare, e ao estourá-la ele LANÇA. A excepção subia até
 * ao runtime, e o Worker devolvia a página do Cloudflare: «error code: 1101». Quem estava a
 * usar a ferramenta lia isso como defeito do Sistema Lastro, quando o defeito era de cota.
 *
 * O contrato do armazenamento está certo e não se toca: «falha de infraestrutura LANÇA — o
 * adaptador não esconde a falha atrás de um `null`». O conserto é na CAMADA que responde:
 * a rota transforma o lançamento em 503 com o motivo no corpo.
 *
 * E o engano que este teste existe para impedir: responder 200 com `estados: {}`. Uma lista
 * vazia por falha de leitura é indistinguível de «não há nada gravado» — e foi essa a
 * leitura errada que o professor já fez uma vez («as fichas foram perdidas»).
 *
 * Roda o SERVIDOR de verdade (`motor/servidor/rotas.js`), sem rede e sem disco.
 *
 *   node experimentos/provar-lista-que-falha.js
 */

const fs = require('fs');
const path = require('path');

const { criarRotas } = require('../motor/servidor/rotas.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');

const RAIZ = path.join(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

/** A mensagem que o `kv.list` dá quando a cota diária acabou — a real, medida. */
const COTA = 'your account has reached the free usage limit for this operation for today';

function bancada(listaQuebrada) {
  const memoria = criarMemoria();
  const armazenamento = listaQuebrada
    ? Object.assign({}, memoria, {
      async listar() { throw new Error(COTA); },
    })
    : memoria;
  const rotas = criarRotas({
    armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    fuso: 'America/Sao_Paulo',
  });
  return { armazenamento, rotas };
}

async function pedir(rotas, caminho) {
  const resposta = await rotas.responder(new Request('http://local' + caminho));
  const texto = await resposta.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch { dados = texto; }
  return { status: resposta.status, dados };
}

const LISTAS = ['/api/anamneses', '/api/planos', '/api/anamnese-estados', '/api/plano-estados'];

async function main() {
  console.log('\n1. Com o armazenamento a responder, as quatro listas respondem 200');
  {
    const { rotas } = bancada(false);
    for (const caminho of LISTAS) {
      const r = await pedir(rotas, caminho);
      checar(caminho + ' → 200', r.status === 200, r.status);
      checar(caminho + ' → ok:true', r.dados && r.dados.ok === true, r.dados);
    }
  }

  console.log('\n2. Com a enumeração a lançar (a cota do `kv.list`), a resposta é 503 com o motivo');
  {
    const { rotas } = bancada(true);
    for (const caminho of LISTAS) {
      let r;
      try {
        r = await pedir(rotas, caminho);
      } catch (erro) {
        checar(caminho + ' NÃO lança (era o que virava o 1101 do Cloudflare)', false, erro.message);
        continue;
      }
      checar(caminho + ' NÃO lança (era o que virava o 1101 do Cloudflare)', true);
      checar(caminho + ' → 503, não 500', r.status === 503, r.status);
      checar(caminho + ' → ok:false', r.dados && r.dados.ok === false, r.dados);
      checar(caminho + ' → diz «não foi possível ler a lista agora»',
        !!(r.dados && /n[ãa]o foi poss[íi]vel ler a lista agora/.test(r.dados.erro)), r.dados && r.dados.erro);
      checar(caminho + ' → carrega o motivo original («free usage limit»)',
        !!(r.dados && r.dados.erro.indexOf('free usage limit') !== -1), r.dados && r.dados.erro);
      checar(caminho + ' → marca `motivo: armazenamento`',
        !!(r.dados && r.dados.motivo === 'armazenamento'), r.dados && r.dados.motivo);
    }
  }

  console.log('\n3. O engano que não pode voltar: 200 com lista vazia');
  {
    const { rotas } = bancada(true);
    for (const caminho of LISTAS) {
      const r = await pedir(rotas, caminho);
      const vazioCom200 = r.status === 200 && r.dados && r.dados.ok === true;
      checar(caminho + ' → não é 200 disfarçado de «não há nada gravado»', !vazioCom200,
        { status: r.status, dados: r.dados });
    }
  }

  console.log('\n4. A tela lê o motivo do corpo, e não só o código');
  {
    const html = fs.readFileSync(path.join(PORTA, 'index.html'), 'utf8');
    checar('`carregarEstados` lê o corpo da resposta', /const dados = await resposta\.json\(\)\.catch\(\(\) => null\)/.test(html));
    checar('`ok:false` conta como falha de leitura', /dados\.ok === false/.test(html));
    checar('o motivo do servidor é o que a tela mostra', /ESTADOS_ERRO = \(dados && dados\.erro\)/.test(html));
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
