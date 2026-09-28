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
 *      em todas as páginas;
 *   6) todo ciclo que tem aula tem harmonização de linguagem (P-17 + P-21): o
 *      artefato é obrigatório, e a ausência é erro — não aviso;
 *   7) quando o manifesto declara ACOMPANHAMENTO_CRIPTOGRAFADO="sim", as páginas
 *      acompanhamento-*.html estão cifradas (PageCrypt): valida existência,
 *      tamanho mínimo e ausência de conteúdo em claro — conteúdo, não.
 *   8) o config da captura POR AULA casa com o que o pacote publica: toda aula
 *      cuja folha de captura existe na fonte tem o seu `captura-aula-NN.json` no
 *      pacote, e todo `captura-aula-NN.json` do pacote é declarado por uma aula só.
 *      O `config` declarado sem folha na fonte é aviso, não erro (o produtor o
 *      declara incondicionalmente — ver ARQUITETURA-AULA.md §4.1/§4.2).
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

// ------------------------- 1b) P-17/P-21: ciclo com aula tem harmonização
// A P-17 exige que todo ciclo novo produza os mesmos tipos de artefato do ciclo
// piloto, e a P-21 manda que documento publicado use linguagem harmonizada. Sem esta
// checagem a regra fica só declarada — um ciclo pode ser gerado e publicado sem a
// tabela bruto × harmonizado, que é o caso do Duo até 19/09/2026.
//
// O texto da P-17 lista os artefatos sem nomear a harmonização (ela entrou na lista
// depois), por isso a checagem cita as duas pétreas em vez de só uma. A presença do
// `harmonizacao.html` já é exigida acima, pelo `DOCS`; o que se verifica aqui é a
// declaração no manifesto e a existência da FONTE que o documento publica.
if (aulas.length > 0) {
  const candidatas = [
    variante && `ciclo-${ciclo}-${variante}-harmonizacao.md`,
    `ciclo-${ciclo}-harmonizacao.md`,
  ].filter(Boolean);
  const fonteH = candidatas
    .map((f) => path.join(dirFontes, f))
    .find((f) => fs.existsSync(f));
  if (!docsDoCiclo || !docsDoCiclo.includes('harmonizacao')) {
    erros.push('P-17/P-21: ciclo com aula precisa declarar `harmonizacao` no DOCS do manifesto');
  } else if (!fonteH) {
    erros.push(`P-17/P-21: DOCS declara harmonizacao, mas a fonte não existe (${candidatas.join(' ou ')})`);
  } else {
    ok.push(`harmonização: ${path.basename(fonteH)}`);
  }
}

const paginas = fs.readdirSync(pacote).filter((f) => f.endsWith('.html')).sort();

// A criptografia dos acompanhamentos é declarada no manifesto — o .conf NUNCA
// carrega a senha, porque o repositório é público. Quando declarada, as páginas
// acompanhamento-*.html deixam de ser verificáveis por conteúdo (estão cifradas):
// o que se exige delas é existirem, terem tamanho de página de verdade e NÃO
// trazerem o conteúdo em claro. É o que fecha o furo: um acompanhamento publicado
// aberto, com a criptografia declarada, reprova — mesmo com a estrutura correta.
const criptografiaDeclarada = (() => {
  let flag = null;
  const confs = [`ciclo-${ciclo}.conf`, variante && `ciclo-${ciclo}-${variante}.conf`]
    .filter(Boolean);
  for (const conf of confs) {
    const p = path.join(dirFontes, conf);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(/^\s*ACOMPANHAMENTO_CRIPTOGRAFADO="([^"]*)"/m);
    if (m) flag = m[1].trim();
  }
  return flag === 'sim';
})();

const ehAcompanhamento = (f) => /^acompanhamento-.*\.html$/.test(f);
// Marcas do PageCrypt no HTML cifrado. São várias de propósito: uma string só
// quebraria numa atualização da biblioteca (o nome dela, por exemplo, não
// aparece na página gerada). O que não pode aparecer é o conteúdo em claro.
const MARCAS_CIFRADA = [/AES-GCM/, /PBKDF2/, /Protected Page/, /pre\[data-i\]/];
const MARCA_CLARO = 'class="topnav"';        // conteúdo de página aberta
const TAM_MIN_CIFRADA = 1000;                // bytes; cifra real fica bem acima

// ------------------------------------------- 2) estrutura fixa de cada página
// Páginas de FERRAMENTA: têm HTML, mas não são documento — não vão ao PDF e não têm título
// conferível lá. Hoje é uma só: o formulário de lançamento (Fase 2.3).
const FERRAMENTAS = ['lancamento.html'];
const conteudos = {};
paginas.forEach((f) => {
  const html = fs.readFileSync(path.join(pacote, f), 'utf8');
  const cifrada = criptografiaDeclarada && ehAcompanhamento(f);
  const ferramenta = FERRAMENTAS.includes(f);
  conteudos[f] = (cifrada || ferramenta) ? '' : html;   // cifrada/ferramenta: sem conteúdo conferível
  if (cifrada) {
    const bytes = Buffer.byteLength(html, 'utf8');
    const marcas = MARCAS_CIFRADA.filter((re) => re.test(html)).length;
    if (marcas === 0) {
      erros.push(`${f}: ACOMPANHAMENTO_CRIPTOGRAFADO="sim" mas a página não está cifrada`);
    }
    if (html.includes(MARCA_CLARO)) {
      erros.push(`${f}: página cifrada contém conteúdo em claro (${MARCA_CLARO})`);
    }
    if (bytes < TAM_MIN_CIFRADA) {
      erros.push(`${f}: página cifrada pequena demais (${bytes} B) — cifra suspeita`);
    } else if (marcas > 0 && !html.includes(MARCA_CLARO)) {
      ok.push(`cifrada: ${f} (${bytes} B, ${marcas} marca(s) de cifra)`);
    }
    return;
  }
  const exigidos = [
    ['barra de navegação', 'class="topnav"'],
    // O "índice desta página" NÃO é exigido das páginas de FERRAMENTA: o formulário não é documento,
    // e o `toc-local` — coluna presa à direita a partir de 1200px — fica por cima do conteúdo dele
    // (medido em 20/09/2026; a pesquisadora o apontou e ele saiu).
    ...(FERRAMENTAS.includes(f) ? [] : [['índice interno', 'class="toc-local"']]),
    ['botão voltar ao topo', 'class="topo"'],
    ['rodapé', 'class="rodape"'],
    ['idioma pt-BR', 'lang="pt-BR"'],
    ['folha de estilo', 'assets/style.css'],
  ];
  exigidos.forEach(([rotulo, marca]) => {
    if (!html.includes(marca)) erros.push(`${f}: falta ${rotulo} (${marca})`);
  });
  const ativos = (html.match(/class="ativo"/g) || []).length;
  // A página tem de estar marcada no menu — MAS só se o MENU a lista. Duas razões medidas aqui:
  // (1) o `apanhado-historico` saiu do menu em 20/09 (não pertence a grupo nenhum — decisão da
  // pesquisadora) e o RODAPÉ continua citando-o, então o que vale é o menu, não qualquer link da
  // página; (2) o `lancamento.html` não tem conteúdo conferível (é ferramenta), e a marca dele só
  // existe no menu. Fora do menu, cabe aviso — não erro.
  const menu = (html.match(/<nav class="topnav"[\s\S]*?<\/nav>/) || [''])[0];
  const marcados = (menu.match(/class="ativo"/g) || []).length;
  if (menu.includes(`href="${f}"`)) {
    if (marcados !== 1) erros.push(`${f}: esperava 1 link marcado como página atual, encontrei ${marcados}`);
  } else {
    avisos.push(`${f}: fora do menu — sem link marcado`);
  }
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

// ------------------------------------------- 2b) o JSON de dados: a cópia × a fonte
// O pacote publica a CÓPIA CIFRADA (o formulário a decifra no navegador). A cifra NÃO é
// determinística — o sal muda a cada cifragem, como nos acompanhamentos —, então comparar byte a
// byte a cópia com a fonte é impossível: o que se confere é o CONTEÚDO. Aqui se decifra a cópia e
// se compara com a fonte; divergência é erro, porque o formulário trabalharia sobre dado velho sem
// avisar ninguém.
const arquivoDados = `ciclo-${ciclo}${variante ? `-${variante}` : ''}-dados.json`;
const copiaDados = path.join(pacote, arquivoDados);
const fonteDados = path.join(dirFontes, arquivoDados);
if (!fs.existsSync(copiaDados)) {
  erros.push(`JSON de dados ausente no pacote: ${arquivoDados}`);
} else if (fs.statSync(copiaDados).size === 0) {
  erros.push(`JSON de dados vazio no pacote: ${arquivoDados}`);
} else if (!fs.existsSync(fonteDados)) {
  erros.push(`fonte do JSON de dados ausente ao lado do pacote: ${arquivoDados}`);
} else {
  let envelopeDados = null;
  try {
    envelopeDados = JSON.parse(fs.readFileSync(copiaDados, 'utf8'));
  } catch (e) {
    erros.push(`JSON de dados do pacote ilegível: ${String(e.message).split('\n')[0]}`);
  }
  if (envelopeDados) {
    if (!envelopeDados._cifrado || !envelopeDados._cifrado.endereco) {
      erros.push(`JSON de dados do pacote NÃO está cifrado: ${arquivoDados}`);
    } else {
      // A senha é a da escola (SENHA_<ESCOLA>), de tools/.senhas-locais — o mesmo caminho e a mesma
      // convenção do cifrador (tools/cifrar-dados.js via tools/lib-senhas.sh).
      const arqSenhas = path.join(__dirname, '.senhas-locais');
      const chaveSenha = `SENHA_${String(variante).toUpperCase()}`;
      const senhas = fs.existsSync(arqSenhas) ? fs.readFileSync(arqSenhas, 'utf8') : '';
      const achou = senhas.match(new RegExp(`^${chaveSenha}="?([^"\\n]+)"?`, 'm'));
      if (!achou) {
        avisos.push(`JSON de dados: ${chaveSenha} não está em tools/.senhas-locais — cópia × fonte não conferida`);
      } else {
        try {
          const Cifra = require('./lib-cifra.js');
          const claro = Cifra.decifrarSync(envelopeDados._cifrado, achou[1]);
          const fonte = fs.readFileSync(fonteDados, 'utf8');
          if (claro === fonte) {
            ok.push('JSON de dados: a cópia cifrada do pacote decifra na fonte, byte a byte '
              + `(${envelopeDados.lancamentos} lançamento(s))`);
          } else {
            erros.push('JSON de dados: a cópia do pacote DIVERGE da fonte — o formulário trabalharia sobre dado velho');
          }
        } catch (e) {
          erros.push('JSON de dados: não consegui decifrar a cópia do pacote '
            + `(${String(e.message).split('\n')[0].slice(0, 80)})`);
        }
      }
    }
  }
}

// ------------------------------ 8) o config da captura POR AULA (§4.1, Defeito 1)
// O índice do pacote (`ciclos.json`) declara `aulas[]`, e cada aula traz o seu `config`
// (`captura-aula-NN.json`). Conferir esse vínculo é o que faltava desde que o config
// deixou de ser um só por ciclo: sem esta checagem, uma geração que perde o arquivo da
// aula passa despercebida, porque nada mais no pacote o cita.
//
// O critério NÃO é "todo `config` declarado tem arquivo": medido em 26/09/2026, o produtor
// declara o `config` incondicionalmente — `gerar-ciclo.sh` emite `'config': 'captura-aula-%s.json' % nn`
// para todo NN de `aulas[]` —, mas só emite o ARQUIVO quando a folha de captura existe na
// fonte. Exigir o arquivo de todo `config` reprovaria Duo (1 folha de 12) e Ritmos (1 de 21)
// POR DESENHO. O critério é a FOLHA NA FONTE, que é a mesma resolução que o produtor usa
// (`fonte_md` de `tools/lib-fontes.sh`: a da variante vence a compartilhada).
const indicePacote = path.join(pacote, 'ciclos.json');
const aulasIndice = (() => {
  if (!fs.existsSync(indicePacote)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(indicePacote, 'utf8'));
    return (j.ciclos && j.ciclos[0] && Array.isArray(j.ciclos[0].aulas)) ? j.ciclos[0].aulas : null;
  } catch (e) {
    erros.push(`ciclos.json ilegível: ${String(e.message).split('\n')[0].slice(0, 80)}`);
    return null;
  }
})();

if (aulasIndice === null) {
  // Postura do arquivo: formato antigo (ou manifesto ausente) não é defeito do pacote —
  // avisa e não falha, como quando o `.conf` não é achado.
  avisos.push('config por aula: ciclos.json sem `aulas[]` (formato antigo) — vínculo não conferido');
} else {
  // A resolução da folha é a de `fonte_md`: a da variante vence; a sem variante é a base.
  const folhaDeAula = (nn) => {
    const candidatas = [
      variante && path.join(dirFontes, `ciclo-${ciclo}-${variante}-captura-aula-${nn}.md`),
      path.join(dirFontes, `ciclo-${ciclo}-captura-aula-${nn}.md`),
    ].filter(Boolean);
    return candidatas.find((f) => fs.existsSync(f)) || null;
  };

  const declaradoPor = new Map();      // arquivo → NN que o declara
  const duplicado = [];
  let estritos = 0;
  aulasIndice.forEach((a) => {
    if (!a || !a.config) return;       // config omitido = não há folha (§4.2) — nada a conferir
    const cfg = String(a.config);
    // O legado `captura-<id do ciclo>.json` é a cópia do config da aula 01 que o formulário
    // publicado ainda lê (`tools/templates/lancamento.html`, até o B3b): por desenho NÃO é
    // declarado por aula, então não é órfão e não é conferido por este bloco.
    if (cfg === `captura-${ciclo}.json`) return;
    if (declaradoPor.has(cfg)) duplicado.push(`${cfg} (aulas ${declaradoPor.get(cfg)} e ${a.n})`);
    else declaradoPor.set(cfg, a.n);

    if (folhaDeAula(a.n)) {
      // Sentido estrito: há folha na fonte ⇒ o arquivo tem de sair no pacote.
      estritos++;
      const p = path.join(pacote, cfg);
      if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
        erros.push(`config da aula ${a.n}: ${cfg} declarado no índice e a folha existe na fonte, mas o arquivo está ausente ou vazio no pacote`);
      }
    } else {
      // Declarado sem folha: o produtor promete um config que não tem fonte. A correção é o
      // produtor parar de declarar (§4.2 já mostra `config` omitido nesse caso) — follow-up
      // de `gerar-ciclo.sh`, fora da fronteira deste arquivo.
      avisos.push(`config da aula ${a.n}: ${cfg} declarado no índice, mas a folha de captura não existe na fonte — o produtor declara "config" sem folha`);
    }
  });
  duplicado.forEach((d) => erros.push(`config declarado por mais de uma aula: ${d}`));

  // Sentido inverso (órfãos): todo `captura-aula-NN.json` do pacote tem de ser declarado.
  const orfaos = fs.readdirSync(pacote)
    .filter((f) => /^captura-aula-\d+\.json$/.test(f))
    .filter((f) => !declaradoPor.has(f))
    .sort();
  orfaos.forEach((f) => erros.push(`config órfão no pacote: ${f} não é declarado por nenhuma aula de ciclos.json`));

  if (estritos > 0) ok.push(`config por aula: ${estritos} arquivo(s) exigido(s) pela folha na fonte`);
  ok.push(`config por aula: ${declaradoPor.size} declarado(s) no índice, ${orfaos.length} órfão(s)`);
}

// ------------------------------------------------------------- relatório
console.log(`Pacote: ${path.relative(process.cwd(), pacote)}`);
ok.forEach((l) => console.log(`  ok    ${l}`));
avisos.forEach((l) => console.log(`  aviso ${l}`));
erros.forEach((l) => console.log(`  ERRO  ${l}`));
console.log(`\n${erros.length ? 'FALHOU' : 'OK'}: ${erros.length} erro(s), ${avisos.length} aviso(s).`);

// --- guarda: nenhum U+FFFD nas saidas (REGISTRO.md, 23/09/2026) ---
{
  const U = String.fromCharCode(0xFFFD);
  const arqs = [];
  (function anda(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const q = path.join(d, e.name);
      if (e.isDirectory()) anda(q);
      else if (/\.(html|md|css|json|txt|js)$/i.test(e.name)) arqs.push(q);
    }
  })(pacote);
  const ruins = [];
  for (const q of arqs) {
    fs.readFileSync(q, 'utf8').split('\n').forEach((l, i) => {
      if (l.includes(U)) ruins.push(path.relative(pacote, q) + ':' + (i + 1));
    });
  }
  if (ruins.length === 0) ok.push('Texto: nenhum U+FFFD nas saidas');
  else erros.push('Texto: U+FFFD em ' + ruins.length + ' linha(s): ' + ruins.slice(0, 5).join(', '));
}
process.exit(erros.length ? 1 : 0);

