#!/usr/bin/env node
'use strict';

/*
 * expurgar.js — a metade LOCAL do expurgo (§17.5): limpa o repositório por slug.
 *
 * A outra metade (apagar o Worker, o subdomínio e as chaves do KV no Cloudflare) é o
 * Cron da raiz (`motor/servidor/raiz.js` → `expurgar-escola.js`). Aqui limpa o que vive
 * no AMBIENTE DE DESENVOLVIMENTO, na próxima sincronização — a "Norma — limpeza" do
 * §17.5. Roda à mão ou por um hook `post-merge`.
 *
 *   uso: node escola/expurgar.js <slug> --professor <p> --ciclo <NN>
 *
 * Checklist (a norma da limpeza):
 *   1. verifica «não está a pagar» — o índice carrega a flag; se `pagante:true`, NÃO apaga;
 *   2. `SENHA_<SLUG>` em tools/.senhas-locais;
 *   3. `<slug>` em tools/.escolas-teste;
 *   4. `wrangler.<slug>.jsonc`;
 *   5. `professores/<p>/ciclos/ciclo-<NN>-<slug>/` (pacote) e `ciclo-<NN>-<slug>*` (fontes);
 *   6. regista o ELO do expurgo em `escola/<slug>/indice.json` — que SOBREVIVE (o índice
 *      não se apaga; recebe um elo novo, nunca é reescrito — proveniência acrescenta).
 *
 * Sai com 0 se limpou (ou não havia nada a limpar); com 1 se a escola está a pagar.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

function lerArgs(argv) {
  const slug = argv[0];
  const resto = argv.slice(1);
  const pega = (nome) => {
    const i = resto.indexOf(nome);
    return i >= 0 && resto[i + 1] ? resto[i + 1] : null;
  };
  return { slug, professor: pega('--professor'), ciclo: pega('--ciclo') };
}

function caminhoDaEscola(slug) {
  return path.join(RAIZ, 'escola', slug);
}

function lerIndice(slug) {
  const arq = path.join(caminhoDaEscola(slug), 'indice.json');
  try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return null; }
}

// Remove as linhas de `arquivo` que casam com o padrão (uma por linha), e reescreve o
// arquivo. Devolve `true` se alguma linha saiu. Só toca arquivos locais fora do Git.
function removerLinhas(arquivo, pred) {
  if (!fs.existsSync(arquivo)) return false;
  const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
  const restam = linhas.filter((l) => !pred(l));
  if (restam.length === linhas.length) return false;
  fs.writeFileSync(arquivo, restam.join('\n'));
  return true;
}

// Apaga (recursivo) um caminho que existe; devolve `true` se existia.
function apagar(caminho) {
  if (!fs.existsSync(caminho)) return false;
  fs.rmSync(caminho, { recursive: true, force: true });
  return true;
}

// O elo do expurgo — o índice NÃO é reescrito: ganha uma entrada nova no fim.
function registrarElo(slug, professor, ciclo, relatorio) {
  const dir = caminhoDaEscola(slug);
  fs.mkdirSync(dir, { recursive: true });
  const arq = path.join(dir, 'indice.json');
  const indice = lerIndice(slug) || {
    escola: slug,
    professor: { slug: professor || null },
    ciclo: ciclo || null,
    senha: { chave: 'SENHA_' + slug.toUpperCase().replace(/[^A-Z0-9]/g, '_'), arquivo: 'tools/.senhas-locais' },
    arquivos: [],
  };
  indice.expurgo = indice.expurgo || [];
  indice.expurgo.push({
    em: new Date().toISOString(),
    motivo: 'desabilitada + prazo de expurgo vencido',
    apagado: relatorio.apagado,
    naoApagado: relatorio.naoApagado,
  });
  fs.writeFileSync(arq, JSON.stringify(indice, null, 2) + '\n');
  return arq;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('uso: node escola/expurgar.js <slug> --professor <p> --ciclo <NN>');
    process.exit(2);
  }
  const { slug, professor, ciclo } = lerArgs(args);
  if (!slug || !professor || !ciclo) {
    console.error('erro: informe --professor e --ciclo (o slug vem primeiro).');
    process.exit(2);
  }

  const indice = lerIndice(slug);
  if (indice && indice.pagante === true) {
    console.error('recusado: a escola "' + slug + '" está a pagar — não se apaga (§17.5).');
    process.exit(1);
  }

  const relatorio = { apagado: [], naoApagado: [] };
  const confere = (rotulo, feito) => (feito ? relatorio.apagado : relatorio.naoApagado).push(rotulo);

  const chaveSenha = 'SENHA_' + slug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  confere('senha ' + chaveSenha + ' em tools/.senhas-locais',
    removerLinhas(path.join(RAIZ, 'tools', '.senhas-locais'), (l) => l.trim().startsWith(chaveSenha + '=')));
  confere('slug ' + slug + ' em tools/.escolas-teste',
    removerLinhas(path.join(RAIZ, 'tools', '.escolas-teste'), (l) => l.trim() === slug));
  confere('wrangler.' + slug + '.jsonc',
    apagar(path.join(RAIZ, 'wrangler.' + slug + '.jsonc')));

  const base = path.join(RAIZ, 'professores', professor, 'ciclos');
  const prefixo = 'ciclo-' + String(ciclo).padStart(2, '0') + '-' + slug;
  // o pacote (pasta) e as fontes da variante (`ciclo-NN-<slug>*`, menos o pacote).
  confere('pacote ' + prefixo + '/', apagar(path.join(base, prefixo)));
  if (fs.existsSync(base)) {
    const fontes = fs.readdirSync(base).filter((n) => n.startsWith(prefixo) && n !== prefixo);
    fontes.forEach((n) => confere('fonte ' + n, apagar(path.join(base, n))));
  }

  const arqIndice = registrarElo(slug, professor, ciclo, relatorio);
  console.log('expurgado:', slug);
  console.log('  apagado:', relatorio.apagado.length ? relatorio.apagado.join(', ') : '(nada)');
  console.log('  não apagado (já não existia):', relatorio.naoApagado.length ? relatorio.naoApagado.join(', ') : '(nada)');
  console.log('  elo registrado em:', path.relative(RAIZ, arqIndice));
  console.log('  (revise com `git status` e commite — a senha e o .escolas-teste são locais, fora do Git)');
}

main();
