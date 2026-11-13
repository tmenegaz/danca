#!/usr/bin/env node
'use strict';

/*
 * provar-dominio-ao-vivo.js — o registo DNS e a rota funcionam de verdade, num nome descartável.
 *
 * POR QUE ESTA PROVA EXISTE, SE JÁ HÁ `provar-dominio-da-escola`. A outra mede o que o módulo
 * DECIDE, com um Cloudflare de mentira: cria, recusa, apaga, na ordem certa. Esta mede o que a
 * Cloudflare FAZ com o que ele decide — e há uma coisa que nenhuma prova de mentira pode dizer:
 * **um registo `A` para `192.0.2.1`, proxyado, serve mesmo como origem de uma rota?** A
 * documentação diz que a rota intercepta antes de a origem ser consultada, e o registo manual da
 * `calango` sugere que sim; mas «sugere» não é «está medido», e é o único elo que fica entre a
 * criação automática e o endereço a responder.
 *
 * COMO MEDE, SEM TOCAR EM ESCOLA NENHUMA. Cria um nome descartável (`prova-<carimbo>.padd.com.br`)
 * apontado ao script da RAIZ, espera o DNS assentar, pede `https://<nome>/api/saude` (que a raiz
 * responde sem senha) e **apaga tudo no fim, sempre** — mesmo se a asserção falhar. Nunca usa o
 * nome de uma escola: uma prova que escreve em `calango.padd.com.br` pode deixar o endereço de uma
 * escola a apontar para o script errado.
 *
 * O QUE CADA RESULTADO QUER DIZER:
 *   · `403` no registo DNS → falta `Zone → DNS → Edit` no token (o estado medido a 13/11/2026);
 *   · `404`/`1016` na URL → o DNS assentou mas a rota não serve: a origem não é aceite como está;
 *   · `200` com `{"tipo":"raiz"}` → o mecanismo inteiro está provado.
 *
 *   CLOUDFLARE_API_TOKEN=... node experimentos/provar-dominio-ao-vivo.js
 *   CLOUDFLARE_API_TOKEN=... node experimentos/provar-dominio-ao-vivo.js --manter   # não apaga
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const dominio = require(path.join(RAIZ, 'motor/servidor/dominio-da-escola.js'));

const TOKEN = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
const MANTER = process.argv.includes('--manter');
/* UMA ESCOLA, E NÃO A RAIZ (13/11/2026) — por uma razão que só apareceu na zona real.
 *
 * A zona `padd.com.br` tem hoje uma rota CURINGA `*.padd.com.br/*` → script `danca` (a raiz). Com
 * ela, um nome de prova apontado à RAIZ responderia 200 pelo caminho errado: o `/api/saude` da raiz
 * responde sem senha, e a prova passaria mesmo que a rota específica que ela criou não servisse
 * nada. Um falso positivo, e do pior tipo — o que dá alívio.
 *
 * Apontando a um script de ESCOLA, a resposta é distinguível: o `/api/saude` de uma escola diz
 * `{"tipo":"escola","slug":"<slug>"}`, e a raiz diz `{"tipo":"raiz"}`. Assim a asserção prova DUAS
 * coisas de uma vez: que o registo funciona como origem, e que a rota ESPECÍFICA vence a curinga.
 *
 * O `calango` é o script estável desta conta; ele não é tocado — quem nasce e morre é o nome
 * `prova-<carimbo>.padd.com.br`. */
const ESCOLA_DO_SCRIPT = 'calango';

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (!TOKEN) {
    console.error('falta CLOUDFLARE_API_TOKEN');
    process.exit(2);
  }
  /* Um carimbo com segundos: dois ensaios no mesmo dia não colidem, e o nome diz quando nasceu. */
  const marca = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14).toLowerCase();
  const escola = 'prova-' + marca;

  console.log('prova ao vivo: ' + dominio.hostname(escola) + ' → script «' + ESCOLA_DO_SCRIPT + '»');
  console.log('(o nome é descartável e é apagado no fim)\n');

  const ligado = await dominio.ligarDominio({ token: TOKEN, escola, script: ESCOLA_DO_SCRIPT });
  provar('o registo e a rota foram criados', ligado.ok === true, {
    dns: ligado.dns && ligado.dns.estado, rota: ligado.rota && ligado.rota.estado,
    erro: ligado.erro, dica: ligado.dica,
  });

  if (!ligado.ok) {
    /* A FALHA É O RESULTADO. Quando é a permissão, diz-se onde a acrescentar — é o único passo
     * manual que resta deste mecanismo, e repeti-lo aqui poupa a procura no painel. */
    console.log('\n  → o domínio não foi ligado.');
    if (/Zone → DNS/.test(String(ligado.dica))) {
      console.log('  → falta a permissão «Zone → DNS → Edit» no CLOUDFLARE_API_TOKEN.');
      console.log('     Cloudflare → My Profile → API Tokens → Edit → Permissions.');
    }
    console.log('\nFALHOU — ' + ko + ' falha(s). Nada ficou criado' +
      (ligado.dns && ligado.dns.ok ? ' (o registo DNS pode ter ficado: verifique)' : '') + '.');
    process.exit(1);
  }

  /* O DNS PRECISA DE ASSENTAR. O proxy da Cloudflare é rápido, mas não é instantâneo, e um
   * primeiro pedido cedo demais mediria a propagação em vez do mecanismo. Tenta-se algumas vezes,
   * com espera crescente, e diz-se quantas foram precisas. */
  const url = 'https://' + dominio.hostname(escola) + '/api/saude';
  let ultimo = null;
  let respondeu = false;
  const esperas = [0, 2000, 3000, 5000, 8000, 12000];
  for (let i = 0; i < esperas.length && !respondeu; i += 1) {
    if (esperas[i]) await dormir(esperas[i]);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'lastro-prova' } });
      const corpo = await res.text();
      ultimo = { tentativa: i + 1, status: res.status, corpo: corpo.slice(0, 120) };
      /* A RESPOSTA TEM DE SER A DA ESCOLA. Um `tipo: "raiz"` aqui significa que quem respondeu
       * foi a rota curinga — e isso é uma FALHA, não um sucesso: quer dizer que a rota específica
       * não venceu. */
      if (res.ok && new RegExp('"tipo"\\s*:\\s*"escola"').test(corpo)
        && corpo.indexOf('"' + ESCOLA_DO_SCRIPT + '"') !== -1) respondeu = true;
    } catch (erro) {
      ultimo = { tentativa: i + 1, erro: (erro && erro.message) || String(erro) };
    }
    console.log('  · tentativa ' + (i + 1) + ': ' +
      (ultimo.status ? 'HTTP ' + ultimo.status : ultimo.erro));
  }
  provar('o endereço próprio SERVE — a rota intercepta antes da origem de 192.0.2.1',
    respondeu, ultimo);
  provar('e é a rota ESPECÍFICA que serve, e não a curinga (o corpo diz «tipo: escola»)',
    respondeu && !/"tipo"\s*:\s*"raiz"/.test(String(ultimo && ultimo.corpo)), ultimo);
  if (respondeu) {
    console.log('\n  → o registo `A` para 192.0.2.1, proxyado, funciona como origem de rota,');
    console.log('     e a rota por escola vence a curinga da zona.');
  }

  /* ── A LIMPEZA. Sempre, e mesmo que a asserção acima tenha falhado: um nome de prova deixado
   * no ar é lixo no DNS de verdade, e o próximo ensaio criaria outro. ─────────────────────── */
  if (MANTER) {
    console.log('\n  (--manter: o nome ' + dominio.hostname(escola) + ' fica no ar para inspecção)');
  } else {
    const limpo = await dominio.desligarDominio({ token: TOKEN, escola, script: ESCOLA_DO_SCRIPT });
    provar('o registo foi apagado', limpo.dns && limpo.dns.apagados === 1, limpo.dns);
    provar('a rota foi apagada', limpo.rota && limpo.rota.apagadas === 1, limpo.rota);
  }

  console.log('\n' + (ko ? 'FALHOU' : 'TUDO CERTO') + ' — ' + ok + ' asserção(ões)' +
    (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko ? 1 : 0);
})().catch((erro) => { console.error(erro); process.exit(1); });
