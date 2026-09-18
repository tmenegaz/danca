#!/usr/bin/env node
'use strict';

/*
 * check-pacote.js — valida a entrega de um ciclo (Regra 16).
 *
 *   uso: node tools/check-pacote.js [ciclos/ciclo-01]
 *
 * Confere, sem dependências externas:
 *   1) todos os arquivos obrigatórios do pacote existem;
 *   2) toda página tem barra de navegação, índice interno, botão "voltar ao topo"
 *      e rodapé — e exatamente uma marcação de página atual;
 *   3) todo link interno resolve (arquivo existe; âncora existe no arquivo alvo);
 *   4) o registro em Benesh e o glossário do ciclo são consistentes entre si
 *      (glossário exaustivo: todo símbolo do corpo tem verbete — tools/check-glossario.js);
 *   5) o PDF consolidado tem índice, links internos, bookmarks e rodapé numerado
 *      em todas as páginas.
 *
 * Sai com código 1 se algo estiver quebrado. É o último passo de
 * tools/gerar-ciclo.sh, então cada geração já sai verificada.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const cp = require('child_process');

const pacote = path.resolve(process.argv[2] || 'ciclos/ciclo-01');
const nomePacote = path.basename(pacote);
const mCiclo = nomePacote.match(/ciclo-(\d+)/);
const ciclo = mCiclo ? mCiclo[1] : '01';
// O nome do PDF acompanha o nome do pacote: ciclo-01-duo/ → ciclo-01-duo.pdf
const pdf = path.join(pacote, `${nomePacote}.pdf`);

const erros = [];
const avisos = [];
const ok = [];

// As fontes ficam ao lado do pacote (em <...>/ciclos/), qualquer que seja o
// professor: derivar do caminho do pacote evita repetir a estrutura de pastas aqui.
const dirFontes = path.dirname(pacote);

// Os arquivos obrigatórios são DERIVADOS do manifesto, não fixos. Um ciclo que não
// tem notação, pré-requisitos ou musicalidade — uma escola de pas de deux, por
// exemplo — não gera essas páginas, e a lista fixa reprovava o pacote por arquivos
// que nunca deveriam existir. O que se exige é o que o `DOCS` do ciclo declara.
const variante = nomePacote.replace(new RegExp(`^ciclo-${ciclo}(-|$)`), '');
const docsDoCiclo = (() => {
  let docs = null;
  const confs = [`ciclo-${ciclo}.conf`, variante && `ciclo-${ciclo}-${variante}.conf`]
    .filter(Boolean);
  for (const conf of confs) {
    const p = path.join(dirFontes, conf);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(/^\s*DOCS="([^"]*)"/m);
    if (m) docs = m[1].trim().split(/\s+/);   // a variante sobrescreve o manifesto base
  }
  return docs;
})();

const obrigatorios = [];
if (docsDoCiclo) {
  obrigatorios.push('index.html', ...docsDoCiclo.map((d) => `${d}.html`));
} else {
  avisos.push('manifesto do ciclo não encontrado ao lado do pacote — exigindo só o mínimo');
  obrigatorios.push('index.html');
}
obrigatorios.push('assets/style.css', `${nomePacote}.pdf`);

if (!fs.existsSync(pacote)) {
  console.error(`erro: pacote não encontrado: ${pacote}`);
  process.exit(1);
}

// ---------------------------------------------------------------- 1) arquivos
obrigatorios.forEach((f) => {
  const p = path.join(pacote, f);
  if (fs.existsSync(p) && fs.statSync(p).size > 0) ok.push(`arquivo: ${f}`);
  else erros.push(`arquivo ausente ou vazio: ${f}`);
});

const aulas = fs.readdirSync(pacote).filter((f) => /^aula-\d+\.html$/.test(f)).sort();
if (aulas.length === 0) erros.push('nenhuma aula encontrada (aula-NN.html)');
else ok.push(`aulas: ${aulas.length} (${aulas.join(', ')})`);

const paginas = fs.readdirSync(pacote).filter((f) => f.endsWith('.html')).sort();

// ------------------------------------------- 2) estrutura fixa de cada página
const conteudos = {};
paginas.forEach((f) => {
  const html = fs.readFileSync(path.join(pacote, f), 'utf8');
  conteudos[f] = html;
  const exigidos = [
    ['barra de navegação', 'class="topnav"'],
    ['índice interno', 'class="toc-local"'],
    ['botão voltar ao topo', 'class="topo"'],
    ['rodapé', 'class="rodape"'],
    ['idioma pt-BR', 'lang="pt-BR"'],
    ['folha de estilo', 'assets/style.css'],
  ];
  exigidos.forEach(([rotulo, marca]) => {
    if (!html.includes(marca)) erros.push(`${f}: falta ${rotulo} (${marca})`);
  });
  const ativos = (html.match(/class="ativo"/g) || []).length;
  if (ativos !== 1) erros.push(`${f}: esperava 1 link marcado como página atual, encontrei ${ativos}`);
});
ok.push(`páginas verificadas: ${paginas.length}`);

// ------------------------------------------------------- 3) links internos
const idsDe = (html) => new Set((html.match(/\sid="([^"]+)"/g) || []).map((s) => s.slice(5, -1)));
const ids = {};
paginas.forEach((f) => { ids[f] = idsDe(conteudos[f]); });

let linksChecados = 0;
paginas.forEach((f) => {
  const html = conteudos[f];
  const alvos = [
    ...html.matchAll(/href="([^"]+)"/g),
    ...html.matchAll(/src="([^"]+)"/g),
  ].map((m) => m[1]);

  alvos.forEach((alvo) => {
    if (/^(https?:|mailto:|data:)/.test(alvo)) return;
    linksChecados++;
    const [arq, ancora] = alvo.split('#');
    if (arq === '') {
      if (ancora && !ids[f].has(ancora)) erros.push(`${f}: âncora local inexistente → #${ancora}`);
      return;
    }
    const destino = path.join(pacote, decodeURIComponent(arq));
    if (!fs.existsSync(destino)) {
      erros.push(`${f}: link aponta para arquivo inexistente → ${alvo}`);
      return;
    }
    if (ancora && arq.endsWith('.html')) {
      const alvoIds = ids[path.basename(arq)] || idsDe(fs.readFileSync(destino, 'utf8'));
      if (!alvoIds.has(ancora)) erros.push(`${f}: âncora inexistente em ${arq} → #${ancora}`);
    }
  });
});
ok.push(`links internos verificados: ${linksChecados}`);

// -------------------------------------- 3b) registro Benesh × glossário (fontes)
// Roda sobre as FONTES do ciclo, não sobre o pacote gerado: o HTML não diz qual
// símbolo virou verbete. O registro e o glossário são compartilhados pelas escolas
// (manifesto base), então a checagem vale para o ciclo, não por variante.
const checkGlossario = path.join(__dirname, 'check-glossario.js');
const registroMd = path.join(dirFontes, `ciclo-${ciclo}-notacao.md`);
const glossarioMd = path.join(dirFontes, `ciclo-${ciclo}-glossario-benesh.md`);
// Só entra quando ESTE ciclo declara notação e glossário no DOCS: um ciclo de pas
// de deux não tem esses documentos, e a checagem valia para ele por causa dos
// arquivos de outra escola que ficam ao lado, no mesmo diretório de fontes.
const temRegistroEGlossario = Array.isArray(docsDoCiclo)
  && docsDoCiclo.includes('notacao') && docsDoCiclo.includes('glossario-benesh');
if (temRegistroEGlossario && fs.existsSync(registroMd) && fs.existsSync(glossarioMd)) {
  let saida = '';
  try {
    saida = cp.execSync(`node "${checkGlossario}" "${registroMd}" "${glossarioMd}"`,
      { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    saida = `${e.stdout || ''}${e.stderr || ''}`;
    if (!/ERRO/.test(saida)) saida += `ERRO  glossário: validação falhou (${String(e.message).split('\n')[0].slice(0, 90)})`;
  }
  saida.split('\n').forEach((l) => {
    const linha = l.trim();
    if (/^ok: glossário/.test(linha)) ok.push(linha);
    else if (/^aviso /.test(linha)) avisos.push(`glossário: ${linha.replace(/^aviso\s*/, '')}`);
    else if (/^ERRO/.test(linha)) erros.push(`glossário: ${linha.replace(/^ERRO\s*/, '')}`);
  });
} else if (temRegistroEGlossario && fs.existsSync(registroMd)) {
  avisos.push(`glossário: ${glossarioMd} ausente — consistência do registro não verificada`);
}

// ------------------------------------------------------------- 4) PDF
// Os PDF do LaTeX comprimem os objetos: procurar "/Outlines" nos bytes crus dá
// falso negativo. Aqui todos os streams são inflados antes da busca.
//
// maxBuffer alto de propósito: `pdftotext -bbox` de um ciclo inteiro passa de
// 1 MB e o padrão do Node aborta com ENOBUFS (foi o que aconteceu quando o
// pacote chegou a 27 páginas — as checagens de PDF eram puladas em silêncio).
const executar = (comando, limite = 128 * 1024 * 1024) =>
  cp.execSync(comando, { encoding: 'utf8', maxBuffer: limite, stdio: ['ignore', 'pipe', 'ignore'] });

function textoDoPdf(caminho) {
  const cru = fs.readFileSync(caminho).toString('latin1');
  const partes = [cru];
  const re = /stream\r?\n([\s\S]*?)endstream/g;
  let m;
  while ((m = re.exec(cru)) !== null) {
    const dados = Buffer.from(m[1], 'latin1');
    for (const fn of [zlib.inflateSync, zlib.inflateRawSync]) {
      try { partes.push(fn(dados).toString('latin1')); break; } catch (e) { /* tenta o próximo */ }
    }
  }
  return partes.join('\n');
}

if (fs.existsSync(pdf)) {
  const conteudo = textoDoPdf(pdf);

  if (/\/Outlines/.test(conteudo)) ok.push('PDF: bookmarks (barra lateral do leitor) presentes');
  else erros.push('PDF: sem bookmarks (/Outlines ausente)');

  const links = (conteudo.match(/\/Subtype\s*\/Link/g) || []).length;
  if (links > 0) ok.push(`PDF: ${links} links internos clicáveis`);
  else erros.push('PDF: nenhum link interno clicável encontrado');

  try {
    const info = executar(`pdfinfo "${pdf}"`);
    const total = parseInt((info.match(/^Pages:\s*(\d+)/m) || [, '0'])[1], 10);
    const minimo = paginas.length + 1; // capa/índice + ao menos uma página por documento
    if (total >= minimo) ok.push(`PDF: ${total} páginas (mínimo esperado: ${minimo})`);
    else erros.push(`PDF: ${total} páginas — esperava ao menos ${minimo} (documentos em páginas separadas)`);

    // rodapé numerado + identificação do ciclo em TODAS as páginas.
    // Uma única extração do documento inteiro, dividida por \f: evita o artefato
    // de fronteira da extração página a página (o rodapé de uma página pode ser
    // lido junto da seguinte) e não gera um processo por página.
    const completo = executar(`pdftotext "${pdf}" -`);
    const paginasTexto = completo.split('\f');
    const semRodape = [];
    const normalizarTexto = (s) => s.replace(/[\u00a0\u2007\u202f]/g, ' ').replace(/\s+/g, ' ');
    for (let p = 1; p <= total; p++) {
      const t = normalizarTexto(paginasTexto[p - 1] || '');
      if (!new RegExp(`p\\.\\s*${p}(\\D|$)`).test(t) || !/Ciclo/i.test(t)) {
        semRodape.push(`${p} ("${t.trim().slice(-40)}")`);
      }
    }
    if (semRodape.length === 0) ok.push(`PDF: rodapé com identificação do ciclo e número nas ${total} páginas`);
    else erros.push(`PDF: rodapé ausente/incompleto nas páginas ${semRodape.join(', ')}`);

    // índice navegável nas páginas iniciais + títulos dos documentos no texto
    const inicial = executar(`pdftotext -f 1 -l ${Math.min(3, total)} "${pdf}" -`);
    if (/Índice/i.test(inicial)) ok.push('PDF: índice navegável presente');
    else erros.push('PDF: título "Índice" não encontrado nas primeiras páginas');

    // nada pode passar da margem do texto (detecta tabela larga demais, por exemplo)
    // margem = 2 cm (geometry do gerador); 6 pt de tolerância para justificação
    const MARGEM = 56.7, TOLERANCIA = 6;
    const bbox = executar(`pdftotext -bbox "${pdf}" -`);
    const fora = [];
    const rePg = /<page width="([\d.]+)"[\s\S]*?<\/page>/g;
    let pg, numero = 0;
    while ((pg = rePg.exec(bbox)) !== null) {
      numero++;
      const limite = parseFloat(pg[1]) - MARGEM + TOLERANCIA;
      const palavras = pg[0].matchAll(/<word xMin="([\d.]+)" yMin="[\d.]+" xMax="([\d.]+)"[^>]*>([^<]*)<\/word>/g);
      for (const p of palavras) {
        if (parseFloat(p[2]) > limite) fora.push(`p.${numero}: "${p[3]}"`);
      }
    }
    if (fora.length === 0) ok.push('PDF: nenhum texto passa da margem do texto (2 cm)');
    else erros.push(`PDF: ${fora.length} palavra(s) fora da margem → ${fora.slice(0, 4).join(', ')}`);

    const texto = executar(`pdftotext "${pdf}" -`);
    // normaliza espaços: no PDF o título longo quebra linha e a comparação literal falharia
    const normalizar = (s) => s.replace(/\s+/g, ' ').trim();
    const textoNorm = normalizar(texto);
    const faltando = paginas
      .filter((f) => f !== 'index.html')
      .filter((f) => {
        const h1 = normalizar((conteudos[f].match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]);
        return h1 && !textoNorm.includes(h1);
      })
      .map((f) => `"${normalizar((conteudos[f].match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, f])[1])}"`);
    if (faltando.length === 0) ok.push('PDF: todos os documentos das páginas HTML estão no PDF');
    else erros.push(`PDF: documentos ausentes no texto do PDF → ${faltando.join(', ')}`);
  } catch (e) {
    avisos.push('PDF: pdfinfo/pdftotext indisponíveis — checagens de paginação/rodapé puladas'
      + ` (${String(e.message).split('\n')[0].slice(0, 90)})`);
  }
} else {
  erros.push(`PDF ausente: ${path.relative(process.cwd(), pdf)}`);
}

// ------------------------------------------------------------- relatório
console.log(`Pacote: ${path.relative(process.cwd(), pacote)}`);
ok.forEach((l) => console.log(`  ok    ${l}`));
avisos.forEach((l) => console.log(`  aviso ${l}`));
erros.forEach((l) => console.log(`  ERRO  ${l}`));
console.log(`\n${erros.length ? 'FALHOU' : 'OK'}: ${erros.length} erro(s), ${avisos.length} aviso(s).`);
process.exit(erros.length ? 1 : 0);

