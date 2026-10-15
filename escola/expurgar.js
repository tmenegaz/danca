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
 *   uso: node escola/expurgar.js <slug> [--professor <p>] [--ciclo <NN>]
 *
 * O `--professor` e o `--ciclo` podem ser omitidos: o índice da escola
 * (`escola/<slug>/indice.json`, gerado pelo criar-escola.sh) já os carrega. Os
 * argumentos só vencem quando o índice não existe (criação antiga).
 *
 * Checklist (a norma da limpeza):
 *   1. verifica «não está a pagar» — o índice carrega a flag; se `pagante:true`, NÃO apaga;
 *   2. `SENHA_<SLUG>` em tools/.senhas-locais;
 *   3. `LOGIN_<SLUG>` no MESMO arquivo — a senha de ACESSO da direção da escola, que é
 *      outra coisa que a `SENHA_<SLUG>` (aquela é a chave de criptografia). As duas linhas
 *      nomeiam a escola; as duas saem juntas. A `LOGIN_<PESSOA>` do professor NÃO sai: a
 *      pessoa pode entrar em outra escola — e é a mesma linha que a serve;
 *   4. `<slug>` em tools/.escolas-teste;
 *   5. `wrangler.<worker>.jsonc` (o `worker` vem do índice; cai no slug sem índice);
 *   6. `professores/<p>/ciclos/ciclo-<NN>-<slug>/` (pacote) e `ciclo-<NN>-<slug>*` (fontes);
 *   7. regista o ELO do expurgo em `escola/<slug>/indice.json` — que SOBREVIVE (o índice
 *      não se apaga; recebe um elo novo, nunca é reescrito — proveniência acrescenta).
 *
 * ESTA metade é a LOCAL: `tools/.senhas-locais` e `tools/.escolas-teste` não estão no Git,
 * e o Worker da raiz não os alcança. A metade de lá — Worker, subdomínio, KV e os arquivos
 * do repositório — é `motor/servidor/repo-escola.js` + `expurgar-escola.js`, que a página
 * `danca` chama. As duas listas de nomes têm de dizer o MESMO: é o que a `SENHA_<ESCOLA>`
 * é (a chave) e o que a `LOGIN_<ESCOLA>` é (o acesso) na hora de tirar.
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

/**
 * É arcabouço do ciclo — `ciclo-NN.conf` ou `ciclo-NN-<palavra>-schema.json` —, e não
 * arquivo de uma escola? É o que distingue «o professor ainda tem escola» de «só sobrou o
 * arcabouço». A MESMA regra está em `motor/servidor/repo-escola.js`: as duas metades têm de
 * classificar o mesmo arquivo do mesmo jeito, senão uma apaga o que a outra preserva.
 */
function ehArcaboucoDoCiclo(nome, ciclo) {
  const nn = String(ciclo).padStart(2, '0');
  if (nome === 'ciclo-' + nn + '.conf') return true;
  return new RegExp('^ciclo-' + nn + '(?:-[a-z0-9]+)*-schema\\.json$').test(nome);
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
    console.error('uso: node escola/expurgar.js <slug> [--professor <p>] [--ciclo <NN>]');
    process.exit(2);
  }
  const { slug, professor: profArg, ciclo: cicloArg } = lerArgs(args);
  if (!slug) {
    console.error('erro: informe o slug da escola.');
    process.exit(2);
  }

  const indice = lerIndice(slug);
  // O índice (gerado pelo criar-escola.sh) carrega professor e ciclo — os argumentos
  // só vencem quando o índice não existe (criação antiga, sem índice).
  const professor = profArg || (indice && indice.professor && indice.professor.slug) || null;
  const ciclo = cicloArg || (indice && indice.ciclo) || null;
  if (!professor || !ciclo) {
    console.error('erro: informe --professor e --ciclo (ou um índice com esses dados).');
    process.exit(2);
  }

  if (indice && indice.pagante === true) {
    console.error('recusado: a escola "' + slug + '" está a pagar — não se apaga (§17.5).');
    process.exit(1);
  }

  const relatorio = { apagado: [], naoApagado: [] };
  const confere = (rotulo, feito) => (feito ? relatorio.apagado : relatorio.naoApagado).push(rotulo);

  // O índice (gerado pelo criar-escola.sh) é a fonte da chave da senha e do nome do Worker.
  // Sem índice (criação antiga), cai no padrão derivado do slug — retrocompatibilidade.
  const caixa = slug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const worker = (indice && indice.worker) || slug;

  // O NOME da chave muda com o tempo — a `SENHA_CRIPTO` virou `SENHA_BARRA` em 15/10/2026 —
  // e o índice NÃO é reescrito (proveniência acrescenta): ele guarda o nome de quando a
  // escola nasceu. Tirar os DOIS, o declarado e o derivado, é o certo; confiar só no
  // declarado fazia o expurgo responder «já não existia» e DEIXAR a chave no arquivo. O
  // mesmo defeito de nome que o pre-push tinha, e pela mesma razão: quem renomeia não volta
  // para corrigir quem aponta.
  const chaveDoIndice = (indice && indice.senha && indice.senha.chave) || null;
  const nomesDaChave = [chaveDoIndice, 'SENHA_' + caixa]
    .filter(Boolean)
    .filter((n, i, a) => a.indexOf(n) === i);
  for (const nome of nomesDaChave) {
    confere('senha ' + nome + ' em tools/.senhas-locais',
      removerLinhas(path.join(RAIZ, 'tools', '.senhas-locais'), (l) => l.trim().startsWith(nome + '=')));
  }
  // A LOGIN_<SLUG> é OUTRA coisa que a SENHA_<SLUG>: uma é o acesso da direção da escola,
  // a outra é a chave de criptografia. As duas nomeiam a escola, então as duas saem. A
  // LOGIN_<PESSOA> do professor fica: a pessoa pode entrar em outra escola.
  const chaveLogin = 'LOGIN_' + caixa;
  confere('acesso ' + chaveLogin + ' em tools/.senhas-locais',
    removerLinhas(path.join(RAIZ, 'tools', '.senhas-locais'), (l) => l.trim().startsWith(chaveLogin + '=')));
  confere('slug ' + slug + ' em tools/.escolas-teste',
    removerLinhas(path.join(RAIZ, 'tools', '.escolas-teste'), (l) => l.trim() === slug));
  confere('wrangler.' + worker + '.jsonc',
    apagar(path.join(RAIZ, 'wrangler.' + worker + '.jsonc')));

  const base = path.join(RAIZ, 'professores', professor, 'ciclos');
  const prefixo = 'ciclo-' + String(ciclo).padStart(2, '0') + '-' + slug;
  // o pacote (pasta) e as fontes da variante (`ciclo-NN-<slug>*`, menos o pacote).
  confere('pacote ' + prefixo + '/', apagar(path.join(base, prefixo)));
  if (fs.existsSync(base)) {
    const fontes = fs.readdirSync(base).filter((n) => n.startsWith(prefixo) && n !== prefixo);
    fontes.forEach((n) => confere('fonte ' + n, apagar(path.join(base, n))));

    // O ARCABOUÇO do ciclo sai junto SÓ quando o professor ficou sem nenhuma escola: ele não
    // é da escola, é do ciclo — mas o manifesto BASE carrega o nome dela dentro
    // (`NOME="Ciclo 01 — Barra"`) e um órfão desses batiza a próxima escola com o nome da
    // anterior. Se ainda há variante de outra escola aqui, o arcabouço é dela também.
    const restam = fs.readdirSync(base);
    const nn = String(ciclo).padStart(2, '0');
    if (restam.length && restam.every((n) => ehArcaboucoDoCiclo(n, ciclo))) {
      restam.forEach((n) => confere('arcabouço ' + n, apagar(path.join(base, n))));
    } else if (restam.length) {
      console.log('  (o arcabouço do ciclo ' + nn + ' fica: o professor ainda tem outra escola)');
    }
  }

  const arqIndice = registrarElo(slug, professor, ciclo, relatorio);
  console.log('expurgado:', slug);
  console.log('  apagado:', relatorio.apagado.length ? relatorio.apagado.join(', ') : '(nada)');
  console.log('  não apagado (já não existia):', relatorio.naoApagado.length ? relatorio.naoApagado.join(', ') : '(nada)');
  console.log('  elo registrado em:', path.relative(RAIZ, arqIndice));
  console.log('  (revise com `git status` e commite — a senha e o .escolas-teste são locais, fora do Git)');
}

main();
