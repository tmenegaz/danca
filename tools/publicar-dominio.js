#!/usr/bin/env node
'use strict';

/*
 * publicar-dominio.js — liga o endereço próprio a uma escola que já existe.
 *
 * POR QUE ESTE FICHEIRO EXISTE (13/11/2026). O painel `danca` passou a criar o registo DNS e a rota
 * de `<escola>.padd.com.br` ao criar a escola (`motor/servidor/dominio-da-escola.js`). Mas as
 * escolas criadas ANTES disso — a `calango` é a única hoje — nunca passaram por esse caminho, e
 * não há como «recriá-las» sem expurgar (o que destruiria o dado). Este comando chama o MESMO
 * módulo, uma vez, para cada escola que já existe.
 *
 * É o mesmo código que o painel usa, e não uma segunda implementação: uma reimplementação aqui
 * divergiria no primeiro campo novo (a marca do registo, o IP, o padrão da rota), e a que ficasse
 * para trás seria a que apaga.
 *
 * É IDEMPOTENTE. Correr duas vezes não cria nada de novo: o `ligarDominio` lê primeiro e diz
 * «já existia» quando já é nosso, e RECUSA quando o nome está ocupado por outra coisa (com a
 * mensagem a dizer onde resolver). Não sobrescreve, não adivinha.
 *
 * DE ONDE SAI A LISTA. Dos próprios `wrangler.*.jsonc` — a mesma fonte de `publicar-mapa-de-escolas`:
 * uma config é de ESCOLA quando o `assets.directory` está debaixo de `publicacao/`, e o SCRIPT é o
 * `name` dela. Assim a lista de escolas não é escrita duas vezes.
 *
 *   node tools/publicar-dominio.js                # todas as escolas das configs
 *   node tools/publicar-dominio.js calango        # só uma
 *   node tools/publicar-dominio.js --dry-run      # mostra o que faria, sem tocar em nada
 *
 * Precisa de `CLOUDFLARE_API_TOKEN` com **Zone → DNS → Edit** e **Zone → Workers Routes → Edit**
 * na zona. Sem a do DNS, o comando para no registo e diz isso — e a escola fica sem endereço, como
 * fica hoje a `calango`.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const dominio = require(path.join(RAIZ, 'motor/servidor/dominio-da-escola.js'));

/** Lê um `.jsonc` como objeto — pelo MESMO leitor que o `wrangler` (ver `lib-jsonc.js`). */
const { lerJsonc } = require(path.join(__dirname, 'lib-jsonc.js'));

/** As escolas que as configurações declaram: `[{ escola, script, config }]`. */
function escolasDasConfiguracoes() {
  const saida = [];
  const arquivos = fs.readdirSync(RAIZ).filter((n) => /^wrangler\..*\.jsonc$/.test(n)).sort();
  for (const nome of arquivos) {
    const cfg = lerJsonc(path.join(RAIZ, nome));
    const dir = String((cfg.assets && cfg.assets.directory) || '').replace(/\\/g, '/');
    if (!dir.startsWith('publicacao/')) continue;          // a raiz não é escola
    const escola = dir.slice('publicacao/'.length).split('/')[0];
    const script = String(cfg.name || '').trim();
    if (!escola || !script) continue;
    saida.push({ escola, script, config: nome });
  }
  return saida;
}

const simbolo = (estado) => ({
  criado: '+', 'ja-existia': '=', 'sem-permissao': '!', ocupado: 'X', falhou: '!',
}[estado] || '?');

(async () => {
  const args = process.argv.slice(2);
  const seco = args.includes('--dry-run');
  const alvo = args.find((a) => !a.startsWith('--')) || null;

  const todas = escolasDasConfiguracoes();
  const alvos = alvo ? todas.filter((e) => e.escola === alvo) : todas;
  if (!alvos.length) {
    console.error('nenhuma escola' + (alvo ? ' chamada «' + alvo + '»' : '') +
      ' nas configurações (' + todas.map((e) => e.escola).join(', ') + ')');
    process.exit(2);
  }

  const token = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
  if (!token && !seco) {
    console.error('falta CLOUDFLARE_API_TOKEN (o mesmo que o deploy usa)');
    process.exit(2);
  }

  let falhas = 0;
  let pendentes = 0;
  console.log('endereço próprio — zona ' + dominio.ZONA_PADRAO + '\n');

  for (const e of alvos) {
    const host = dominio.hostname(e.escola);
    if (seco) {
      console.log('  · ' + e.escola.padEnd(22) + host + '  →  script «' + e.script + '»  (dry-run)');
      continue;
    }
    const r = await dominio.ligarDominio({ token, escola: e.escola, script: e.script });
    const dns = r.dns ? r.dns.estado : '—';
    const rota = r.rota ? r.rota.estado : '—';
    console.log('  ' + simbolo(r.ok ? 'criado' : (r.dns && !r.dns.ok ? r.dns.estado : 'falhou')) +
      ' ' + e.escola.padEnd(22) + host);
    console.log('      DNS: ' + dns + '   ·   rota: ' + rota + (r.ok ? '   → ' + r.url : ''));
    if (!r.ok) {
      console.log('      ' + (r.erro || 'erro desconhecido'));
      if (r.dica) console.log('      → ' + r.dica);
      if (r.dns && r.dns.estado === 'ocupado' && r.dns.registo) {
        console.log('      registo existente: ' + r.dns.registo.tipo + ' → ' + r.dns.registo.conteudo);
      }
      falhas += 1;
      if (r.pendente) pendentes += 1;
    }
  }

  if (seco) {
    console.log('\n(dry-run: nada foi criado)');
    process.exit(0);
  }
  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' escola(s) sem endereço próprio' +
      (pendentes ? ' (' + pendentes + ' pendente(s): corrija e repita — o comando é idempotente)' : '')
    : 'TUDO CERTO — todas as escolas têm endereço próprio.'));
  process.exit(falhas ? 1 : 0);
})().catch((erro) => { console.error(erro && erro.message ? erro.message : erro); process.exit(1); });
