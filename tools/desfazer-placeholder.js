#!/usr/bin/env node
'use strict';

/*
 * desfazer-placeholder.js — o rollback do Worker «zero» quando o scaffold falha.
 *
 *   uso: node tools/desfazer-placeholder.js --escola <slug> [--nome <nome de exibição>]
 *
 * Precisa de `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no ambiente.
 *
 * PORQUE EXISTE. O «Criar nova escola» da página `danca` cria o Worker «zero» no Cloudflare
 * (Worker + subdomínio + segredos) e SÓ DEPOIS dispara o `criar-escola.yml`, que monta o
 * scaffold e sobe o motor completo por cima. Entre um e outro, a escola existe no Cloudflare
 * e não existe em lugar nenhum: sem pasta em `escola/`, sem `wrangler.<escola>.jsonc`, sem
 * nada no Git. Se o workflow falha, nada desfazia o Worker — e ele ficava no ar a responder
 * 200 no subdomínio de uma escola que nunca nasceu, com a página a dizer «recarregue em
 * instantes». Foi a `valsa` de 17/10/2026: criada às 09:36:04Z, o workflow morto às 09:36:09Z,
 * e 592 bytes de mentira no ar até alguém reparar.
 *
 * O QUE ESTE SCRIPT APAGA — E O QUE NUNCA APAGA. Ele lê o código que está no ar e apaga
 * apenas se ainda for o placeholder DESTA escola (`ehPlaceholder`, em
 * `motor/servidor/provisionar-escola.js`). Uma escola a sério nunca é tocada, mesmo quando o
 * passo que falhou foi o commit — nesse caso o motor já subiu e a escola está no ar a
 * funcionar: o que falta é o scaffold no repositório, e apagar o Worker seria destruir o que
 * está bom para corrigir o que está em falta.
 *
 * Na dúvida não se apaga. Um órfão de 592 bytes vê-se e apaga-se à mão; uma escola apagada
 * por engano não se recupera.
 *
 * SAÍDA: 0 quando o estado é conhecido e relatado (removido, não existia, ou recusado por não
 * ser placeholder); 1 só quando não foi possível saber. Um passo de rollback não pode
 * transformar a falha original noutra falha — mas também não pode fingir que limpou.
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const { desfazerPlaceholder, lerCodigoDoWorker } = require(path.join(RAIZ, 'motor/servidor/provisionar-escola.js'));

function lerArgs(argv) {
  const pega = (nome) => {
    const i = argv.indexOf(nome);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
  };
  return { escola: pega('--escola'), nome: pega('--nome') };
}

const MENSAGENS = {
  'nao-existe': 'não existe Worker com este nome — nada a desfazer',
  'nao-e-placeholder': 'o Worker no ar NÃO é o placeholder: é uma escola a sério — não se apaga',
  'nao-confirmado': 'não consegui ler o código do Worker — na dúvida não se apaga',
  'removido': 'o Worker «zero» foi removido',
  'remocao-recusada': 'a API recusou a remoção — o Worker pode continuar no ar',
  'sem-escola': 'sem --escola',
  'sem-token': 'CLOUDFLARE_API_TOKEN ausente',
};

async function main() {
  const { escola, nome } = lerArgs(process.argv.slice(2));
  if (!escola) {
    console.error('uso: node tools/desfazer-placeholder.js --escola <slug> [--nome <nome>]');
    process.exit(2);
  }
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) {
    console.error('erro: faltam CLOUDFLARE_API_TOKEN e/ou CLOUDFLARE_ACCOUNT_ID no ambiente');
    process.exit(2);
  }

  console.log('desfazer: escola=' + escola + (nome ? ' · nome=' + nome : ''));
  const r = await desfazerPlaceholder({ token, accountId, escola, nome });
  console.log('motivo: ' + r.motivo + ' — ' + (MENSAGENS[r.motivo] || 'estado inesperado'));
  if (r.erro) console.log('erro: ' + r.erro);
  if (r.resultado) {
    console.log('  subdomínio: ' + (r.resultado.subdominio && r.resultado.subdominio.status));
    console.log('  script:     ' + (r.resultado.script && r.resultado.script.status));
  }

  // «Não confirmado» é o único estado que impede saber o que ficou no ar: sai 1 para que o
  // painel do Actions mostre o passo a vermelho, em vez de um verde que mente.
  if (r.motivo === 'nao-confirmado' || r.motivo === 'remocao-recusada') {
    // Confirma o que sobrou, para o relatório dizer a verdade sobre o estado final.
    const depois = await lerCodigoDoWorker({ token, accountId, escola });
    console.log('depois: ' + (depois.existe ? 'o Worker CONTINUA no ar (HTTP ' + depois.status + ')' : 'não existe — limpo'));
    if (depois.existe) process.exit(1);
  }
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('erro inesperado: ' + ((err && err.message) || String(err)));
    process.exit(1);
  });
}

module.exports = { lerArgs, MENSAGENS };
