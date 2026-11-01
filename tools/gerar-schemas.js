#!/usr/bin/env node
'use strict';

/*
 * gerar-schemas.js — escreve os cinco schemas do ciclo, e é o ÚNICO escritor deles.
 *
 *   uso: node tools/gerar-schemas.js --professor <slug> --ciclo <NN> [--raiz <dir>] [--forcar]
 *        node tools/gerar-schemas.js --conferir
 *
 * PORQUE EXISTE (01/11/2026). Os schemas nasciam de uma cópia: `tools/criar-escola.sh` copiava
 * cinco ficheiros com `cp`, e o provisionador do Worker ia buscá-los por HTTP, cada um a sua vez.
 * Duas maneiras de ler o mesmo molde são duas verdades, e a segunda só se descobre no dia em que
 * dói — foi o que aconteceu quando o molde ficou atrás dos professores e a geração de um ciclo
 * morreu em «campo ausente». `motor/nucleo/schemas.js` passou a ser o leitor único; este ficheiro
 * é a PORTA dele para o shell, e é o que o `criar-escola.sh` chama em vez do `cp`.
 *
 * O QUE ELE NÃO FAZ: não inventa, não valida e não decide. O conteúdo vem de
 * `motor/nucleo/schemas.js` (que lê `modelo/ciclos/`), o número do ciclo entra só no nome do
 * ficheiro, e a regra de proveniência — **não sobrescrever o que existe** — é a mesma do
 * scaffolder: um schema que já está é do professor, e uma cópia por cima apagaria o que ele tem.
 * `--forcar` existe para o caso declarado de quem quer mesmo reescrever, e diz o que fez.
 *
 * `--conferir` responde à outra pergunta: o molde em DISCO e o que o módulo serve dizem o mesmo?
 * É a pergunta que fecha o circuito — se um `require` apontar para outro ficheiro, ou se o JSON
 * em disco deixar de ser legível, é aqui que se vê, e não numa geração a meio.
 *
 * Sai com 0 quando escreveu o que faltava (ou nada havia a escrever) e com 1 quando algo falhou.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

/** Os argumentos, à mão: são quatro, e um `parseArgs` daria mais código do que o problema. */
function argumentos(argv) {
  const lido = { professor: '', ciclo: '', raiz: RAIZ, forcar: false, conferir: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--professor' || a === '--ciclo' || a === '--raiz') {
      lido[a.replace(/^--/, '')] = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (a === '--forcar') lido.forcar = true;
    else if (a === '--conferir') lido.conferir = true;
    else if (a === '--ajuda' || a === '-h' || a === '--help') lido.ajuda = true;
    else throw new Error('argumento desconhecido: ' + a);
  }
  return lido;
}

/**
 * Escreve os cinco schemas na pasta `professores/<professor>/ciclos/` da raiz dada.
 *
 * O `raiz` é parâmetro — e não a constante do topo — para a prova poder medir a escrita numa
 * árvore sintética sem tocar no repositório. É o mesmo motivo de `check-schemas.js --professor`.
 *
 * Devolve `{ criados, pulados, erros, ok }`, com os caminhos RELATIVOS à raiz (é assim que o
 * `criar-escola.sh` os mostra, e é assim que se lê num log de CI).
 */
function escreverSchemas({ professor, ciclo, raiz = RAIZ, forcar = false }) {
  const relatorio = { criados: [], pulados: [], erros: [], ok: true };
  // O `require` é feito AQUI, e não no topo, por uma razão só: a prova pode apontar a raiz para
  // outra árvore, e o módulo resolve os `require` a partir do seu próprio sítio. A raiz do módulo
  // é sempre a do repositório; a raiz da ESCRITA é a que o chamador dá. As duas coincidem em uso
  // normal, e é a coincidência que a `--conferir` verifica.
  const schemas = require('../motor/nucleo/schemas.js');

  const prof = String(professor || '').trim();
  const nn = String(ciclo || '').trim().padStart(2, '0');
  if (!prof) { relatorio.ok = false; relatorio.erros.push('falta --professor'); return relatorio; }
  if (!nn || !/^\d+$/.test(nn)) { relatorio.ok = false; relatorio.erros.push('falta --ciclo (NN)'); return relatorio; }

  const pasta = path.join(raiz, 'professores', prof, 'ciclos');
  try {
    fs.mkdirSync(pasta, { recursive: true });
  } catch (e) {
    relatorio.ok = false;
    relatorio.erros.push('não criei ' + path.relative(raiz, pasta) + ': ' + e.message);
    return relatorio;
  }

  for (const sufixo of schemas.SUFIXOS) {
    const nome = schemas.nomeDoArquivo(sufixo, nn);
    const relativo = 'professores/' + prof + '/ciclos/' + nome;
    const destino = path.join(pasta, nome);
    try {
      const existe = fs.existsSync(destino);
      if (existe && !forcar) {
        relatorio.pulados.push(relativo);
        continue;
      }
      fs.writeFileSync(destino, schemas.texto(sufixo));
      relatorio.criados.push(relativo);
    } catch (e) {
      relatorio.ok = false;
      relatorio.erros.push(relativo + ': ' + (e && e.message ? e.message : String(e)));
    }
  }
  return relatorio;
}

/**
 * O molde em disco e o que o módulo serve dizem o mesmo? Compara CONTEÚDO, não bytes: um ficheiro
 * indentado de outra maneira continua a dizer o mesmo schema, e recusá-lo seria recusar
 * formatação — a mesma regra de `tools/check-schemas.js`.
 */
function conferirMolde({ raiz = RAIZ } = {}) {
  const schemas = require('../motor/nucleo/schemas.js');
  const divergencias = [];
  for (const sufixo of schemas.SUFIXOS) {
    const p = path.join(raiz, 'modelo', 'ciclos', schemas.nomeDoArquivo(sufixo, schemas.CICLO_BASE));
    const relativo = path.relative(raiz, p);
    if (!fs.existsSync(p)) { divergencias.push('falta ' + relativo); continue; }
    let doDisco;
    try {
      doDisco = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      divergencias.push(relativo + ' não é JSON legível: ' + e.message);
      continue;
    }
    const doModulo = schemas.dados(sufixo);
    if (JSON.stringify(doDisco) !== JSON.stringify(doModulo)) {
      divergencias.push(relativo + ' difere do que o módulo serve (o `require` aponta para outro ' +
        'sítio, ou o ficheiro foi editado depois de o módulo carregar)');
    }
  }
  return divergencias;
}

module.exports = { escreverSchemas, conferirMolde };

// ------------------------------------------------------------------ a linha de comando
if (require.main === module) {
  let opcoes;
  try {
    opcoes = argumentos(process.argv.slice(2));
  } catch (e) {
    console.error('gerar-schemas: ' + e.message);
    process.exit(1);
  }

  if (opcoes.ajuda) {
    console.log([
      'uso: node tools/gerar-schemas.js --professor <slug> --ciclo <NN> [--raiz <dir>] [--forcar]',
      '     node tools/gerar-schemas.js --conferir',
      '',
      'Escreve os cinco schemas do ciclo na pasta do professor, a partir de',
      'motor/nucleo/schemas.js (que lê modelo/ciclos/). Não sobrescreve o que existe:',
      'um schema já gravado é do professor. --forcar reescreve, e diz que reescreveu.',
      '--conferir compara o molde em disco com o que o módulo serve, e não escreve nada.',
    ].join('\n'));
    process.exit(0);
  }

  if (opcoes.conferir) {
    const divergencias = conferirMolde({ raiz: opcoes.raiz });
    if (divergencias.length) {
      for (const d of divergencias) console.error('FALHA  ' + d);
      process.exit(1);
    }
    console.log('ok     o molde em disco e o módulo dizem o mesmo (5 schemas)');
    process.exit(0);
  }

  const r = escreverSchemas(opcoes);
  for (const c of r.criados) console.log((opcoes.forcar ? 'reescrito' : 'criado   ') + ' ' + c);
  for (const p of r.pulados) console.log('pulado   ' + p + ' (já existe — é do professor)');
  for (const e of r.erros) console.error('erro     ' + e);
  if (!r.ok) process.exit(1);
  console.log('schemas: ' + r.criados.length + ' escrito(s), ' + r.pulados.length + ' já existente(s)');
}
