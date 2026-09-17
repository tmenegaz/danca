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
 *   4) o PDF consolidado tem índice, links internos, bookmarks e rodapé numerado
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

const obrigatorios = [
  'index.html', 'plano.html', 'notacao.html', 'pre-requisitos.html',
  'musicalidade.html', 'apanhado-historico.html', 'referencias.html',
  'assets/style.css', `${nomePacote}.pdf`,
];

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

// ------------------------------------------------------------- 4) PDF
// Os PDF do LaTeX comprimem os objetos: procurar "/Outlines" nos bytes crus dá
// falso negativo. Aqui todos os streams são inflados antes da busca.
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
    const info = cp.execSync(`pdfinfo "${pdf}"`, { encoding: 'utf8' });
    const total = parseInt((info.match(/^Pages:\s*(\d+)/m) || [, '0'])[1], 10);
    const minimo = paginas.length + 1; // capa/índice + ao menos uma página por documento
    if (total >= minimo) ok.push(`PDF: ${total} páginas (mínimo esperado: ${minimo})`);
    else erros.push(`PDF: ${total} páginas — esperava ao menos ${minimo} (documentos em páginas separadas)`);

    // rodapé numerado + identificação do ciclo em todas as páginas
    const semRodape = [];
    for (let p = 1; p <= total; p++) {
      const t = cp.execSync(`pdftotext -f ${p} -l ${p} "${pdf}" - 2>/dev/null`, { encoding: 'utf8' });
      if (!new RegExp(`p\\.\\s*${p}\\b`).test(t) || !/Ciclo/i.test(t)) semRodape.push(p);
    }
    if (semRodape.length === 0) ok.push(`PDF: rodapé com identificação do ciclo e número nas ${total} páginas`);
    else erros.push(`PDF: rodapé ausente/incompleto nas páginas ${semRodape.join(', ')}`);

    // índice navegável nas páginas iniciais + títulos dos documentos no texto
    const inicial = cp.execSync(`pdftotext -f 1 -l ${Math.min(3, total)} "${pdf}" - 2>/dev/null`, { encoding: 'utf8' });
    if (/Índice/i.test(inicial)) ok.push('PDF: índice navegável presente');
    else erros.push('PDF: título "Índice" não encontrado nas primeiras páginas');

    // nada pode passar da margem do texto (detecta tabela larga demais, por exemplo)
    // margem = 2 cm (geometry do gerador); 6 pt de tolerância para justificação
    const MARGEM = 56.7, TOLERANCIA = 6;
    const bbox = cp.execSync(`pdftotext -bbox "${pdf}" - 2>/dev/null`, { encoding: 'utf8' });
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

    const texto = cp.execSync(`pdftotext "${pdf}" - 2>/dev/null`, { encoding: 'utf8' });
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
    avisos.push('PDF: pdfinfo/pdftotext indisponíveis — checagens de paginação/rodapé puladas');
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

