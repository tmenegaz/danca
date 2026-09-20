#!/usr/bin/env node
'use strict';

/*
 * gerar-vista.js — gera UMA vista do ciclo (peça 3 da migração).
 *
 *   uso: node tools/gerar-vista.js <professor> <ciclo> <variante> <vista> [aula]
 *     ex.: node tools/gerar-vista.js tiago 01 duo guia-de-observacao 01
 *
 * Imprime o `.md` no STDOUT — o gerador o usa como fonte da página, no lugar do `.md` escrito à
 * mão. Ele NÃO escreve arquivo: quem decide onde o texto fica é quem chama.
 *
 * A CADEIA, inteira e provada: as FONTES (o PO e o plano, em Markdown) passam pelos EXTRATORES
 * (`validar-po-ciclo.js`, `validar-plano-ciclo.js` — o contrato de extração compartilhado), e o
 * resultado entra na LIB DAS VISTAS (`lib-vistas.js`). O gerador não lê Markdown nem monta texto:
 * ele é o TERCEIRO consumidor da mesma definição — o primeiro é o formulário do experimento.
 *
 * O CARIMBO NÃO ENTRA: o texto que sai daqui é determinístico (a lib só põe a linha "gerado: …"
 * se quem chama passar `prov`, e o gerador não passa). É o que faz o pacote ser reconstruível.
 *
 * HOJE: `guia-de-observacao-NN` — derivado das duas ENTRADAS (o PO e o plano), sem depender da
 * captura. As outras vistas (caderno, relatório, acompanhamento) derivam do JSON de dados e
 * entram quando a captura tiver o dado.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const Vistas = require('./lib-vistas.js');

const RAIZ = path.resolve(__dirname, '..');

function uso() {
  console.error('uso: node tools/gerar-vista.js <professor> <ciclo> <variante> <vista> [aula]');
  console.error('  ex.: node tools/gerar-vista.js tiago 01 duo guia-de-observacao 01');
}

// Os `.conf` são KEY=VAL de shell: aqui se lê o que interessa, sem executar shell.
function lerConf(arquivo) {
  const meta = {};
  if (!fs.existsSync(arquivo)) return meta;
  for (const linha of fs.readFileSync(arquivo, 'utf8').split('\n')) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(linha.trim());
    if (!m) continue;
    meta[m[1]] = m[2].replace(/\s+#.*$/, '').trim().replace(/^"|"$/g, '').trim();
  }
  return meta;
}

function main() {
  const [professor, ciclo, variante, vista, aula] = process.argv.slice(2);
  if (!professor || !ciclo || !variante || !vista) { uso(); return 2; }
  const base = path.join(RAIZ, 'professores', professor, 'ciclos');
  const confBase = lerConf(path.join(base, `ciclo-${ciclo}.conf`));
  const confVar = lerConf(path.join(base, `ciclo-${ciclo}-${variante}.conf`));
  const escola = confVar.ESCOLA || confBase.ESCOLA || variante;
  const duracoes = (confVar.DURACOES || confBase.DURACOES || '').split(',');
  const meta = {
    id: String(ciclo).padStart(2, '0'),
    escola,
    duracao_min: Number(duracoes[0]) || undefined,
  };

  // A precedência da fonte é a do lib-fontes.sh: o documento da VARIANTE vence o sem sufixo.
  const fonteMd = (doc) => {
    const proprio = path.join(base, `ciclo-${ciclo}-${variante}-${doc}.md`);
    return fs.existsSync(proprio) ? proprio : path.join(base, `ciclo-${ciclo}-${doc}.md`);
  };

  // O extrator: o resumo humano dele vai para o stderr (fica no log de quem chamou); o JSON sai
  // do stdout, limpo — é o mesmo `--json` que o experimento consome.
  const extrair = (ferramenta, schema, md) => JSON.parse(execFileSync(process.execPath,
    [path.join(RAIZ, 'tools', ferramenta), schema, md, '--json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] }));

  // A vista vem como a chave do `DOCS` (`guia-de-observacao-01`) — e o número da aula pode vir
  // também por argumento, para quem chama à mão.
  const guia = /^guia-de-observacao(?:-(\d+))?$/.exec(vista);
  if (guia) {
    const numero = guia[1] || aula;
    if (!numero) {
      console.error('gerar-vista: falta a aula (guia-de-observacao-<aula> ou o argumento da aula)');
      return 2;
    }
    const md = fonteMd('po');
    if (!fs.existsSync(md)) {
      console.error(`gerar-vista: o PO do ciclo ${ciclo} não existe (${md}) — sem ele não há o`
        + ' que observar, e a vista não se inventa.');
      return 1;
    }
    const po = extrair('validar-po-ciclo.js', path.join(base, `ciclo-${ciclo}-po-schema.json`), md);
    const planoMd = fonteMd('plano');
    if (!fs.existsSync(planoMd)) {
      console.error(`gerar-vista: o plano do ciclo ${ciclo} não existe (${planoMd})`);
      return 1;
    }
    const plano = extrair('validar-plano-ciclo.js',
      path.join(base, `ciclo-${ciclo}-plano-schema.json`), planoMd);
    process.stdout.write(`${Vistas.guia({ meta, po, plano, aula: numero })}\n`);
    return 0;
  }

  console.error(`gerar-vista: '${vista}' não é uma vista. Hoje: guia-de-observacao-NN.`);
  return 2;
}

process.exit(main());
