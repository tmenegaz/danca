#!/usr/bin/env node
'use strict';

/**
 * ligar-pagina-publica.js — o endereço `lastro.padd.com.br` (25/11/2026).
 *
 * O QUE ELE FAZ, e só isto: o registo DNS e a ROTA que apontam `lastro.padd.com.br` ao Worker da
 * raiz (`danca`). Nada de código, nada de conteúdo — a página já é servida pelo mesmo Worker, e o
 * que falta é o endereço chegar até ele.
 *
 * PORQUE UMA FERRAMENTA E NÃO UM COMANDO À MÃO. É o mesmo passo que se faz a cada escola nova
 * (`dominio-da-escola.js` → `garantirRegistoDns` + `garantirRota`), e ele falha de duas maneiras
 * que se confundem: o DNS entra e a rota não (o endereço resolve e responde 1016), ou a rota já
 * aponta a outro script. Uma ferramenta idempotente diz QUAL das duas coisas aconteceu, e pode
 * ser corrida outra vez sem estragar nada.
 *
 * ELA NÃO INVENTA UM SEGUNDO CAMINHO: usa as duas funções do `dominio-da-escola.js`, que é o dono
 * da regra. Duas composições do mesmo pedido divergem no dia em que a primeira mudar.
 *
 *   uso:  node tools/ligar-pagina-publica.js [--host lastro.padd.com.br] [--script danca] [--zona padd.com.br]
 *
 *   — o token vem de `CLOUDFLARE_API_TOKEN` (o `.env` da casa), e sem ele a ferramenta RECUSA
 *     em vez de tentar.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const dominio = require('../motor/servidor/dominio-da-escola.js');

function argumento(nome, def) {
  const i = process.argv.indexOf('--' + nome);
  if (i !== -1 && process.argv[i + 1]) return String(process.argv[i + 1]).trim();
  return def;
}

/** O token do `.env` da casa — o mesmo que o `wrangler` lê para publicar. */
function tokenDoAmbiente() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN.trim();
  const arq = path.join(RAIZ, '.env');
  if (!fs.existsSync(arq)) return '';
  const m = /^\s*CLOUDFLARE_API_TOKEN\s*=\s*['"]?([^'"\r\n]+)['"]?\s*$/m.exec(fs.readFileSync(arq, 'utf8'));
  return m ? m[1].trim() : '';
}

async function main() {
  const host = argumento('host', 'lastro.padd.com.br');
  const script = argumento('script', 'danca');
  const zona = argumento('zona', 'padd.com.br');
  const token = tokenDoAmbiente();
  if (!token) {
    console.error('erro: sem CLOUDFLARE_API_TOKEN — ponha-o no `.env` desta casa.');
    process.exit(2);
  }

  /* O NOME DE ESCALA DO DNS É O PRIMEIRO RÓTULO. `garantirRegistoDns` trabalha com um nome de
   * subdomínio (é assim que ele compõe `<nome>.<zona>`); o endereço público é `lastro`, e é isso
   * que se lhe passa — não o FQDN, que viraria `lastro.padd.com.br.padd.com.br`. */
  const rotulo = host.endsWith('.' + zona) ? host.slice(0, -(zona.length + 1)) : host;
  if (!rotulo || rotulo.indexOf('.') !== -1) {
    console.error('erro: «' + host + '» não é um subdomínio directo de «' + zona + '».');
    process.exit(2);
  }

  console.log('a ligar ' + host + ' → script «' + script + '»');

  let dns;
  try {
    dns = await dominio.garantirRegistoDns({ token, escola: rotulo, zona });
  } catch (erro) {
    dns = { ok: false, estado: 'falhou', erro: (erro && erro.message) || String(erro) };
  }
  console.log('  DNS   ' + (dns.ok ? 'ok' : 'FALHOU') + ' — ' + (dns.estado || '?')
    + (dns.erro ? ' · ' + dns.erro : ''));

  /* A ROTA SÓ SE TENTA COM O REGISTO FEITO. Criá-la apontada a um host que não resolve daria um
   * endereço que responde 1016 — e o sintoma («origin DNS error») esconde a causa (falta o
   * registo). É a mesma ordem do `ligarDominio`, e pela mesma razão. */
  let rota = null;
  if (dns.ok) {
    try {
      rota = await dominio.garantirRota({ token, escola: rotulo, script, zona });
    } catch (erro) {
      rota = { ok: false, estado: 'falhou', erro: (erro && erro.message) || String(erro) };
    }
    console.log('  rota  ' + (rota.ok ? 'ok' : 'FALHOU') + ' — ' + (rota.estado || '?')
      + (rota.padrao ? ' · ' + rota.padrao : '')
      + (rota.erro ? ' · ' + rota.erro : ''));
  } else {
    console.log('  rota  não tentada — sem o registo DNS ela daria um endereço que não resolve');
  }

  const ok = Boolean(dns.ok && rota && rota.ok);
  if (ok) {
    console.log('\npronto: https://' + host + '/  (o conteúdo sai do Worker «' + script + '»)');
    console.log('a página pública NÃO pede senha; o painel continua em https://' + 'danca.padd.com.br/');
  } else {
    console.log('\nnão ficou pronto. O que falta:');
    if (!dns.ok) console.log('  · o registo DNS — ' + (dns.erro || dns.estado));
    if (dns.ok && rota && !rota.ok) console.log('  · a rota — ' + (rota.erro || rota.estado));
  }
  process.exit(ok ? 0 : 1);
}

main().catch((erro) => {
  console.error('explodiu: ' + ((erro && erro.message) || String(erro)));
  process.exit(1);
});
