#!/usr/bin/env node
'use strict';

/*
 * provar-token-da-escola.js — o token do painel é DA ESCOLA, e a senha nova fecha as sessões
 * velhas (16/11/2026).
 *
 * O QUE ELA RELATOU, e é o que esta prova fixa:
 *
 *   «carregou com a senha antiga. Eu usei na recriação a senha para a escola `1234` e para
 *   professor `280500`. As senhas antigas são respectivamente `123` e `2805`.»
 *
 * MEDIDO NO AR, e o servidor estava certo: com as senhas novas `1234`/`280500` a escola abre, e
 * `123`/`2805` são recusadas. O que continuava a abrir era outra coisa — a SESSÃO. O token da
 * direção era assinado com `SENHA_ADMIN + '\0' + SENHA_PROFESSOR`, os dois secrets do **Worker**:
 *
 *   · num Worker por escola isso é «a senha da escola»;
 *   · num SHARD há **um `env` para N escolas**, e a chave passou a ser a mesma para todas. Um
 *     token emitido para a `calango` abria a `duo`;
 *   · e um token emitido ANTES do expurgo continuava a valer depois da recriação, porque a senha
 *     nova não entrava na conta. Uma sessão de 12 horas sobrevive a uma escola que foi apagada e
 *     voltou.
 *
 * A CORREÇÃO É UMA, e é a mesma do resto da casa: a chave sai do **KV da escola** (slug + par
 * hash/sal da direção + chave derivada), com o `env` como reserva. Mudar a senha roda a chave; o
 * corpo do token passa a dizer de que escola é.
 *
 *   A. A CHAVE. Mudar a senha da escola muda a chave; mudar a escola muda a chave; uma escola sem
 *      registo continua a assinar com os segredos do Worker (sem migração).
 *   B. O TOKEN. O emitido antes da troca de senha deixa de valer; o emitido depois vale.
 *   C. AS DUAS ESCOLHAS ERRADAS DO SHARD. O token da `calango` não abre a `duo` nem quando as
 *      duas têm o mesmo par de secrets — a chave já os separa, e o corpo confirma-o.
 *   D. O PRAZO. Um token de 12 horas continua a expirar às 12 horas.
 *
 *   node experimentos/provar-token-da-escola.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const senha = require(path.join(RAIZ, 'motor/nucleo/senha.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/** O `env` de um pedido a uma escola do shard, DEPOIS da sobreposição do KV
 *  (`comIdentidadeDaEscola` em `producao.js`) — que é o que as rotas recebem. */
function envDaEscola({ escola, registo, admin = 'do-worker', prof = 'do-worker', cripto = null }) {
  const env = {
    ESCOLA_SLUG: escola,
    SENHA_ADMIN: admin,
    SENHA_PROFESSOR: prof,
    SENHA_CRIPTO: cripto || ('cripto-' + escola),
  };
  if (registo && registo.hash) {
    env.SENHA_DIRECAO_HASH = registo.hash;
    env.SENHA_DIRECAO_SAL = registo.sal || '';
  }
  return env;
}

(async () => {
  console.log('\nA. A chave do token é a da ESCOLA, e roda com a senha');
  {
    const antes = await senha.registoDeSenha('123');
    const depois = await senha.registoDeSenha('1234');
    const calango = await senha.registoDeSenha('1234');

    const e1 = envDaEscola({ escola: 'duo', registo: antes });
    const e2 = envDaEscola({ escola: 'duo', registo: depois });
    const e3 = envDaEscola({ escola: 'calango', registo: calango });
    /* A MESMA senha (`1234`) nas duas escolas: o que as separa não é o valor, é a identidade. */
    const e4 = envDaEscola({ escola: 'duo', registo: calango });

    conferir('mudar a senha da escola MUDA a chave do token',
      bastidores.chaveDoToken(e1) !== bastidores.chaveDoToken(e2), null);
    conferir('…e mudar de escola também', bastidores.chaveDoToken(e2) !== bastidores.chaveDoToken(e3), null);
    conferir('…mesmo quando as duas têm a MESMA senha (salt diferente, escola diferente)',
      bastidores.chaveDoToken(e2) !== bastidores.chaveDoToken(e4), null);
    /* A ESCOLA SEM REGISTO — o Worker de antes, com um `env` por escola. Tem de continuar a
     * assinar, e com o par de secrets dele: é o caminho de quem não migrou. */
    const semRegisto = envDaEscola({ escola: 'antiga', registo: null, admin: 'a', prof: 'b' });
    conferir('uma escola sem registo no KV continua a ter chave (o `env` é reserva)',
      bastidores.chaveDoToken(semRegisto).indexOf('antiga') === 0
        && bastidores.chaveDoToken(semRegisto).indexOf('\u0000a') !== -1,
      bastidores.chaveDoToken(semRegisto).replace(/\u0000/g, '|'));
  }

  console.log('\nB. O token emitido antes da troca de senha deixa de valer');
  {
    const antes = await senha.registoDeSenha('123');
    const depois = await senha.registoDeSenha('1234');
    const velho = envDaEscola({ escola: 'duo', registo: antes });
    const novo = envDaEscola({ escola: 'duo', registo: depois });

    const tokenDoTempoAntigo = await bastidores.tokenDaDirecao(velho);
    conferir('o token vale na escola em que foi emitido',
      (await bastidores.tokenDaDirecaoValido(velho, tokenDoTempoAntigo)) === true, null);
    /* ESTA É A ASSERÇÃO QUE REPROVA NO CÓDIGO DE ANTES. Com a chave do Worker, o token atravessava
     * a troca de senha — e era isso que ela via como «carregou com a senha antiga». */
    conferir('…e NÃO vale depois de a senha da escola mudar',
      (await bastidores.tokenDaDirecaoValido(novo, tokenDoTempoAntigo)) === false, null);
    const tokenNovo = await bastidores.tokenDaDirecao(novo);
    conferir('…e o token emitido com a senha nova vale', 
      (await bastidores.tokenDaDirecaoValido(novo, tokenNovo)) === true, null);
    conferir('…e o antigo não volta a valer pelo token novo',
      (await bastidores.tokenDaDirecaoValido(velho, tokenNovo)) === false, null);
  }

  console.log('\nC. No shard, o token de uma escola não abre outra');
  {
    /* O CASO PIOR: as duas escolas com o MESMO registo (o mesmo hash e o mesmo sal) e o mesmo par
     * de secrets — que é o que um shard tem. Só o SLUG e a chave derivada as separam. */
    const registo = await senha.registoDeSenha('280500');
    const calango = envDaEscola({ escola: 'calango', registo });
    const duo = envDaEscola({ escola: 'duo', registo });

    const doCalango = await bastidores.tokenDaDirecao(calango);
    conferir('o token da «calango» não abre a «duo» (mesmo com o mesmo par de secrets)',
      (await bastidores.tokenDaDirecaoValido(duo, doCalango)) === false, null);
    conferir('…e o da «duo» não abre a «calango»',
      (await bastidores.tokenDaDirecaoValido(calango, await bastidores.tokenDaDirecao(duo))) === false, null);

    /* O CORPO DIZ DE QUE ESCOLA É — é o que permite recusar por comparação, e auditar um token
     * que apareça num log. */
    const corpo = JSON.parse(Buffer.from(doCalango.split('.')[0], 'base64url').toString('utf8'));
    conferir('…e o corpo do token diz a escola a que pertence', corpo.escola === 'calango', corpo);
    conferir('…e leva o prazo', Number(corpo.exp) > Date.now(), corpo.exp);

    /* UM TOKEN DE ANTES DO CORPO (sem `escola`) continua a valer na escola certa — a sessão de
     * quem está a trabalhar não se fecha por causa de uma arrumação —, mas não abre outra, porque
     * a chave já não é a mesma. É o que torna a mudança segura de publicar. */
    const semEscolaNoCorpo = Buffer.from(JSON.stringify({ exp: Date.now() + 3600_000 })).toString('base64url');
    const assinatura = await bastidores.tokenDaDirecao({ ESCOLA_SLUG: 'calango', SENHA_ADMIN: 'do-worker', SENHA_PROFESSOR: 'do-worker', SENHA_CRIPTO: 'cripto-calango' });
    conferir('um token emitido antes desta mudança não é aceite noutra escola',
      (await bastidores.tokenDaDirecaoValido(duo, semEscolaNoCorpo + '.' + assinatura.split('.')[1])) === false,
      null);
  }

  console.log('\nD. O prazo continua a ser o prazo');
  {
    const registo = await senha.registoDeSenha('1234');
    const env = envDaEscola({ escola: 'duo', registo });
    const token = await bastidores.tokenDaDirecao(env);
    const corpo = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
    const horas = (corpo.exp - Date.now()) / 3600_000;
    conferir('o token vale 12 horas', horas > 11.9 && horas < 12.1, horas);

    /* ASSINATURA MEXIDA — o mínimo: trocar um caractere tem de invalidar. */
    const mexido = token.slice(0, -1) + (token.slice(-1) === 'A' ? 'B' : 'A');
    conferir('um token com a assinatura mexida não vale',
      (await bastidores.tokenDaDirecaoValido(env, mexido)) === false, null);
    conferir('…e lixo não vale', (await bastidores.tokenDaDirecaoValido(env, 'nada')) === false, null);
    conferir('…nem vazio', (await bastidores.tokenDaDirecaoValido(env, '')) === false, null);
  }

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
