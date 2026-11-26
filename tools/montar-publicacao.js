#!/usr/bin/env node
'use strict';

/*
 * montar-publicacao.js — o SITE DA ESCOLA, montado a partir das partes.
 *
 * O PROBLEMA (20/10/2026, terceira vez). Um Worker tem UM `assets.directory`. O
 * `criar-escola.sh` grava ali o pacote-zero — a apresentação do sistema, sem `DOCS`, logo sem
 * Ciclo nem Aulas no menu. O ciclo gerado sai ao lado, em `ciclo-NN-<escola>-<turma>/`, e o site
 * continuava a mostrar o esqueleto: o pacote existia no repositório e não no ar. Foi assim com a
 * `breu` e com a `batata`, e as duas vezes a correcção foi apontar a config ao pacote da turma.
 *
 * PORQUE ISSO JÁ NÃO SERVE. Uma escola tem TURMAS, e cada turma tem o seu ciclo, o seu pacote e o
 * seu Plano de Observação. Com três turmas, apontar a config a uma delas esconde as outras duas —
 * e cada geração passaria a trocar o site de turma. O Worker não sabe servir três directorias; a
 * resposta é montar UMA.
 *
 * O QUE ESTA FERRAMENTA FAZ. Monta `publicacao/<escola>/`, que passa a ser o `assets.directory`:
 *
 *   index.html         ← o ÍNDICE DAS TURMAS (gerado aqui)
 *   sistema.html       ← a apresentação do sistema (o `index.html` do pacote-zero)
 *   assets/            ← a pele do ciclo (CSS, nav, ícone), do pacote-zero
 *   plano-observacao/  ← a PORTA (anamnese, plano de ensino, PO), do pacote-zero
 *   <variante>/        ← cada pacote de turma, inteiro e sem alteração
 *
 * O QUE NÃO FAZ. Não gera ciclo, não reancora, não valida pacote — o pacote já vem validado do
 * `gerar-ciclo.sh`. Não versiona nada: `publicacao/` está no `.gitignore`, porque é saída. E não
 * edita os pacotes: copia-os como estão, para o que está no ar ser exactamente o que o `check-pacote`
 * aprovou.
 *
 * A PASTA É RECONSTRUÍDA DE ZERO a cada execução. É o que a torna idempotente — e o que apaga a
 * turma de um ciclo que já não existe, sem deixar fantasma a ser servido.
 *
 *   node tools/montar-publicacao.js <escola>
 *   node tools/montar-publicacao.js <escola> --listar
 *   node tools/montar-publicacao.js <escola> --raiz <dir>   (a árvore de uma prova)
 *   node tools/montar-publicacao.js <escola> --com-propostas  (serve as bancadas de layout)
 */

const fs = require('fs');
const path = require('path');

// A FORMA DA BARRA — a mesma que o gerador do ciclo usa (marca, hamburger, contêiner). O que se
// compartilha é a FORMA; o que NÃO se compartilha é a lista de itens (ver o cabeçalho do módulo).
// Sem isto, o índice da escola teria uma terceira cópia do markup da marca — e as três
// envelheceriam em ritmos diferentes.
const nav = require(path.join(__dirname, '..', 'motor', 'nucleo', 'nav.js'));
// AS PÁGINAS DE LISTA — geradas aqui, desenhadas ali. O módulo não tem `fs`: recebe os dados e
// devolve a página. É o que permite ao `check-identidade` medir as peças que ela usa sem montar
// a escola inteira (ver `superficiesQueEmitem`).
const listas = require(path.join(__dirname, '..', 'motor', 'nucleo', 'lista-html.js'));

/*
 * A RAIZ É PARÂMETRO (`--raiz`), e não uma constante: é o que permite montar uma árvore de
 * prova — um pacote-zero e dois pacotes de turma de mentira, num directório temporário — sem
 * tocar nos pacotes a sério. O default é o repositório.
 */
const RAIZ = (() => {
  const i = process.argv.indexOf('--raiz');
  if (i !== -1 && process.argv[i + 1]) return path.resolve(process.argv[i + 1]);
  const j = process.argv.indexOf('--raiz=');
  if (j !== -1) return path.resolve(process.argv[j].split('=').slice(1).join('='));
  return path.join(__dirname, '..');
})();
const PUB = path.join(RAIZ, 'publicacao');

/** A pasta dos ciclos de um professor. */
const CICLOS = (professor) => path.join(RAIZ, 'professores', professor, 'ciclos');

/**
 * AS TURMAS DE UMA ESCOLA — os pacotes gerados, um por variante.
 *
 * O nome do pacote é `ciclo-NN-<escola>-<variante>`, e o `<escola>` pode ele próprio ter hífens
 * (`calando-teste-1`): o separador é o hífen, e o que distingue o pacote-zero do pacote da turma é
 * haver ALGO depois do nome da escola. Sem essa distinção, `ciclo-01-calango` entraria como se
 * fosse uma turma.
 */
/* O QUE FICOU DE FORA, e por quê — lido pela montagem e pelo `--listar`. */
const achadasDeixadas = [];

function turmasDaEscola(escola) {
  achadasDeixadas.length = 0;
  const achadas = [];
  const professores = fs.readdirSync(path.join(RAIZ, 'professores'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'README.md')
    .map((d) => d.name)
    .sort();
  for (const professor of professores) {
    const dir = CICLOS(professor);
    if (!fs.existsSync(dir)) continue;
    for (const nome of fs.readdirSync(dir).sort()) {
      const m = new RegExp('^ciclo-([0-9]{2})-' + escola.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-(.+)$').exec(nome);
      if (!m) continue;
      const completo = path.join(dir, nome);
      if (!fs.statSync(completo).isDirectory()) continue;
      achadas.push({ professor, ciclo: m[1], variante: m[2], nome, pasta: completo });
    }
  }
  /* UMA VARIANTE, UM PACOTE — E O VENCEDOR NÃO É O DA SORTE ALFABÉTICA (10/11/2026).
   *
   * MEDIDO. Derivar a Turma para outro professor cria o elo novo na pasta DELE
   * (`professores/<novo>/ciclos/ciclo-01-<escola>-<variante>/`) e o pacote antigo fica onde
   * estava. A montagem encontrava os dois, com a MESMA variante, e o `copiar` do ciclo
   * seguinte sobrescrevia o anterior — em silêncio. Quem ganhava era quem viesse por último na
   * ordem das pastas, o que é sorte: `redinha-rosa` vem depois de `pe-torto`, mas bastava a
   * pasta antiga chamar-se `zzz-…` para o site publicar o documento do professor que já saiu.
   *
   * A REGRA ESCOLHIDA É A DO PROJETO: o vigente é o elo que ninguém substituiu. Em disco, quem
   * diz isso é o carimbo do PO que o pacote declara no `-dados.json` — `po-AAAAMMDD-HHMM` ordena
   * como texto, e o mais recente é o elo novo. O pacote mais antigo não é apagado: ele fica no
   * repositório como proveniência, e a montagem DIZ que o deixou de fora.
   *
   * Sem carimbo (pacote antigo, ou sem `-dados.json`), o empate fica pela ordem — como antes. */
  const carimboDoPacote = (pasta, arquivo) => {
    try {
      const dados = JSON.parse(fs.readFileSync(path.join(pasta, arquivo), 'utf8'));
      return String(dados.po || dados.plano || '').trim();
    } catch (erro) { return ''; }
  };
  const porVariante = new Map();
  for (const t of achadas) {
    const chave = String(t.ciclo) + '/' + String(t.variante);
    /* O CARIMBO ESTÁ NO IRMÃO DA PASTA, e não dentro dela — são DOIS ficheiros com o mesmo nome.
     *
     * Dentro do pacote, `ciclo-01-calango-rosa/ciclo-01-calango-rosa-dados.json` é a cópia
     * PUBLICADA (`_cifrado`, `lancamentos`, `apelidos`). O irmão, em `ciclos/`, é o que a
     * geração escreve e o que declara `po`, `plano` e `professor`. Ler o de dentro dava
     * carimbo vazio para os dois pacotes — e, com os dois vazios, ganhava o primeiro por ordem,
     * que era exactamente a sorte que esta regra veio tirar. */
    const carimbo = carimboDoPacote(path.dirname(t.pasta), t.nome + '-dados.json');
    const jaTem = porVariante.get(chave);
    if (!jaTem) { porVariante.set(chave, Object.assign({}, t, { carimbo })); continue; }
    // Fica o do carimbo maior; se nenhum tem carimbo, fica o primeiro (o de antes desta regra).
    if (carimbo && (!jaTem.carimbo || carimbo > jaTem.carimbo)) {
      achadasDeixadas.push(jaTem);
      porVariante.set(chave, Object.assign({}, t, { carimbo }));
    } else {
      achadasDeixadas.push(Object.assign({}, t, { carimbo }));
    }
  }
  return [...porVariante.values()];
}

/** O pacote-zero da escola — o esqueleto que traz a apresentação, a pele e a porta. */
function pacoteZeroDaEscola(escola) {
  for (const professor of fs.readdirSync(path.join(RAIZ, 'professores'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name).sort()) {
    const dir = CICLOS(professor);
    if (!fs.existsSync(dir)) continue;
    for (const nome of fs.readdirSync(dir).sort()) {
      if (!new RegExp('^ciclo-[0-9]{2}-' + escola.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$').test(nome)) continue;
      const completo = path.join(dir, nome);
      if (fs.statSync(completo).isDirectory()) return { professor, nome, pasta: completo };
    }
  }
  return null;
}

/** Lê uma chave `CHAVE="valor"` de um `.conf` do ciclo (o formato do `gerar-ciclo.sh`). */
function chaveDoConf(texto, chave) {
  const m = new RegExp('^' + chave + '="(.*)"$', 'm').exec(String(texto || ''));
  return m ? m[1] : '';
}

/**
 * O NOME DA TURMA, para quem lê a página.
 *
 * Vem do `NOME` do `.conf` da variante, que é `Ciclo NN — <escola> · <turma>`. O que interessa é o
 * que está depois do último separador; sem ele, o `NOME` inteiro serve — e sem `NOME`, a variante.
 * Nunca se inventa um nome: uma turma aparece com o nome que a escola lhe deu, ou com o slug.
 */
function nomeDaTurma(pasta, variante) {
  const conf = path.join(path.dirname(pasta), 'ciclo-' + path.basename(pasta).slice(6, 8) + '-' + variante + '.conf');
  // O `.conf` é irmão do pacote: `ciclo-NN-<variante>.conf`.
  const irmao = path.join(path.dirname(pasta), path.basename(pasta) + '.conf');
  const arquivo = fs.existsSync(irmao) ? irmao : conf;
  if (!fs.existsSync(arquivo)) return variante;
  const nome = chaveDoConf(fs.readFileSync(arquivo, 'utf8'), 'NOME');
  if (!nome) return variante;
  const partes = nome.split('·');
  return String(partes[partes.length - 1] || '').trim() || nome.trim() || variante;
}

/**
 * O NOME DE EXIBIÇÃO DA ESCOLA — `ESCOLA="Calango"` no `.conf` dela.
 *
 * O slug serve para o Worker e para o caminho; quem lê a página é a pessoa, e a página tem de
 * dizer «Calango». Sem o `.conf` (ou sem a chave), o slug é o que há — e o slug é verdade, só é
 * feio.
 */
function nomeDaEscola(pacoteZero, escola) {
  const conf = path.join(path.dirname(pacoteZero.pasta), pacoteZero.nome + '.conf');
  if (!fs.existsSync(conf)) return escola;
  const nome = chaveDoConf(fs.readFileSync(conf, 'utf8'), 'ESCOLA');
  return String(nome || '').trim() || escola;
}

/** O que o `ciclos.json` do pacote diz do ritmo — o que a página mostra de cada turma. */
function resumoDaTurma(pastaDoPacote) {
  const arquivo = path.join(pastaDoPacote, 'ciclos.json');
  if (!fs.existsSync(arquivo)) return null;
  try {
    const dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    const ciclo = (dados.ciclos || [])[0];
    if (!ciclo) return null;
    const aulas = Array.isArray(ciclo.aulas) ? ciclo.aulas.length : 0;
    const lancadas = Array.isArray(ciclo.aulas) ? ciclo.aulas.filter((a) => a && a.lancada).length : 0;
    return {
      inicio: ciclo.inicio || '',
      fim: ciclo.fim || '',
      total: Number(ciclo.total_aulas) || aulas,
      duracao: Number(ciclo.duracao_min) || null,
      // `aulas` é a CONTAGEM (o corpo da página usa-a assim) — a LISTA vai em `listaDeAulas`,
      // porque são duas coisas e já confundi-las custou caro uma vez (`0 || []` em `indices.js`).
      aulas,
      listaDeAulas: (Array.isArray(ciclo.aulas) ? ciclo.aulas : []).map((a) => ({
        n: String(a && a.n ? a.n : '').padStart(2, '0'),
        marco: String((a && a.marco) || '').trim(),
        /* A HORA, O DIA E A DURAÇÃO DE CADA AULA (24/10/2026). O `ciclos.json` já os tinha, e a
         * listagem de aulas passou a mostrá-los: «que horas começa, quanto dura, quem a dá».
         * Sem eles aqui, a linha da aula só sabia o número e o marco — e o horário é a primeira
         * coisa que se procura numa lista de aulas. */
        data: String((a && a.data) || '').trim(),
        inicio: String((a && a.inicio) || '').trim(),
        fim: String((a && a.fim) || '').trim(),
      })).filter((a) => a.n),
      lancadas,
    };
  } catch (erro) {
    return null;
  }
}

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** DD/MM/AAAA a partir do `AAAA-MM-DD` do `ciclos.json`. */
function data(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

/**
 * OS TRÊS DESTINOS DA ÁREA DO PROFESSOR — uma definição, dois consumidores (26/10/2026).
 *
 * Eles aparecem no MENU (o grupo «Área do Professor», em `menuDaEscola`) e no RODAPÉ do índice da
 * escola. Até hoje cada um escrevia o seu endereço, e os dois divergiram: o menu foi para as
 * LISTAS (`/area-do-professor/<fonte>/`), e o rodapé ficou nas ROTAS DA PORTA (`/anamnese/`,
 * `/plano-ensino/`, `/plano-observacao/`) — endereços que só fazem sentido COM o contexto do ato.
 *
 * O DEFEITO, medido na tela: quem clicava no rodapé caía em `/anamnese/` sem contexto, a porta
 * abria e imediatamente se descartava, e a pessoa via a pálida de um formulário que nunca ia abrir
 * antes de ser levada à lista. «Esses links me levam para essa URL que está fora da área do
 * professor. E isso está errado.»
 *
 * Agora o endereço é UM, e é o da lista — que é onde se escolhe o ato (a decisão de 23/10/2026:
 * «porque uma lista, e não a porta directa»).
 */
const AREA_DO_PROFESSOR = {
  anamnese: '/area-do-professor/anamnese/',
  plano: '/area-do-professor/plano-de-ensino/',
  po: '/area-do-professor/plano-de-observacao/',
};

/** O bloco de uma turma no índice. */
function cartaoDaTurma(t) {
  const r = t.resumo || {};
  const linhas = [];
  if (r.inicio && r.fim) linhas.push(data(r.inicio) + ' a ' + data(r.fim));
  if (r.total) linhas.push(r.total + (r.total === 1 ? ' aula' : ' aulas'));
  if (r.duracao) linhas.push(r.duracao + ' min por encontro');
  if (r.lancadas) linhas.push(r.lancadas + ' já lançada' + (r.lancadas === 1 ? '' : 's'));
  /* O «CICLO» SAIU DO CARTÃO, E O NOME PASSOU A ABRIR O DOCUMENTO (26/10/2026).
   *
   * O item dizia «Ciclo» e apontava para `<variante>/index.html` — que NÃO é o ciclo: é a
   * APRESENTAÇÃO do sistema, copiada dentro de cada pacote (o `index` do gerador sai de
   * `biblioteca/apresentacao.md`). Medido na escola: o link «Ciclo» abria «Sistema Lastro», a
   * mesma página que `/sistema.html`. A pesquisadora: «tem o link ciclo que está me levando para
   * a apresentação do sistema. E não pode, tem que levar para o lugar certo.»
   *
   * Não existe página própria do ciclo: o documento do ciclo é o `plano.html` («Plano do Ciclo
   * 01 — …»). Então o NOME da turma — que ia para a mesma apresentação — passa a abrir esse
   * documento, e o item «Ciclo» sai. «Plano» sai com ele: dois rótulos para o mesmo endereço é a
   * ambiguidade que o menu já recusou («Dois itens para a mesma página não são um atalho»).
   *
   * SEM CLASSE INVENTADA. O CSS é o do ciclo (`tools/templates/ciclo.css`, congelado): usar uma
   * classe que ele não conhece é pedir estilo que ninguém escreveu — e a página sai nua. O que
   * existe é `li { margin }`, o `<a>` do documento e o `.subtitulo`. É o suficiente. */
  return [
    '<li>',
    '<a href="' + esc(t.variante) + '/plano.html"><strong>' + esc(t.nome) + '</strong></a>',
    linhas.length ? '<br><span class="subtitulo">' + esc(linhas.join(' · ')) + '</span>' : '',
    '<br><span class="subtitulo">',
    '<a href="' + esc(t.variante) + '/aula-01.html">Aulas</a> &middot; ',
    '<a href="' + esc(t.variante) + '/notacao.html">Notação</a> &middot; ',
    '<a href="' + esc(t.variante) + '/referencias.html">Referências</a>',
    '</span>',
    '</li>',
  ].join('\n');
}

/**
 * O ÍNDICE DA ESCOLA. A página que o professor encontra em `/`.
 *
 * Ela não substitui a apresentação — essa passa a `sistema.html`, com o mesmo conteúdo e os mesmos
 * atalhos. Aqui o que interessa é o que existe: as turmas, cada uma com o seu ritmo e o caminho
 * para o ciclo dela. Sem turma gerada, a página diz isso em vez de ficar vazia.
 */
function indiceDaEscola({ escola, nome, professor, turmas, nav }) {
  const lista = turmas.length
    ? '<ul>\n' + turmas.map(cartaoDaTurma).join('\n') + '\n</ul>'
    : '<p class="aviso">Ainda não há ciclo gerado para esta escola. O ciclo nasce quando o Plano ' +
      'de Observação de uma turma é concluído — depois disso, ele aparece aqui.</p>';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sistema Lastro — ${esc(nome || escola)}</title>
<link rel="stylesheet" href="assets/style.css">
<script>/* Anti-flash: aplica o modo ANTES de a página pintar. */
try{if(!document.documentElement.hasAttribute('data-modo-fonte')&&localStorage.getItem('ciclo-modo')==='noturna')document.documentElement.setAttribute('data-modo','noturna');}catch(e){}</script>
</head>
<body id="top" data-tela="escola">

${nav}

<header class="doc">
  <h1>Sistema Lastro</h1>
  <p class="subtitulo">${esc(professor ? 'Professor ' + professor : '')}</p>
</header>

<main>
<div class="conteudo">
<h2 id="turmas">Turmas</h2>
<p>Cada turma tem o seu ciclo: o plano de ensino, as aulas, a notação e as referências. O que se
planeja para uma serve de base para a outra — é o lastro da próxima.</p>
${lista}
<p class="subtitulo">O que é o Sistema Lastro, como se usa e o que ele ajuda a resolver:
<a href="sistema.html">a apresentação do sistema</a>.</p>
<p class="subtitulo">E para começar a trabalhar: <a href="/bastidores/estudio">comece por aqui</a> —
Bastidores &rarr; Estúdio. É o painel da escola, e é por ele que se entra.</p>
</div>
</main>

<a class="topo" href="#top" title="Voltar ao topo">&#8593;</a>

<footer class="rodape">
  <p>Ciclo ${esc((turmas[0] || {}).ciclo || '01')} — ${esc(nome || escola)} &middot; <strong>${esc(nome || escola)}</strong></p>
  <p><a href="${AREA_DO_PROFESSOR.anamnese}">Anamnese do aluno</a> &middot; <a href="${AREA_DO_PROFESSOR.plano}">Plano de ensino</a> &middot; <a href="${AREA_DO_PROFESSOR.po}">Plano de Observação</a></p>
</footer>

<script src="assets/nav.js"></script>

</body>
</html>
`;
}

/**
 * OS BLOCOS DO SISTEMA, lidos do pacote-zero — «Área do Professor» e «Bastidores».
 *
 * Eles NÃO são reconstruídos aqui. As URLs deles carregam o professor, a escola e o ciclo, e
 * esses três já estão escritos, certos, no pacote-zero (foi o `criar-escola.sh` que os compôs).
 * Reescrevê-los seria uma segunda derivação dos mesmos parâmetros — e a segunda é a que fica
 * errada quando a primeira muda. O que se extrai é o `<details>` inteiro, tal como está.
 */
function blocosDoSistema(pacoteZero) {
  const arquivo = path.join(pacoteZero, 'index.html');
  if (!fs.existsSync(arquivo)) return [];
  const html = fs.readFileSync(arquivo, 'utf8');
  const blocos = [];
  const re = /<details class="menu">\s*<summary>([^<]+)<\/summary>[\s\S]*?<\/details>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (/^(Área do Professor|Bastidores)$/i.test(m[1].trim())) blocos.push(m[0]);
  }
  return blocos;
}

/** O que existe no pacote de uma turma — o menu não aponta para o que não foi publicado. */
/**
 * O QUE ESTE PACOTE TEM, e com que NOME DE FICHEIRO.
 *
 * A REGRA É UMA SÓ: o valor é o NOME DO FICHEIRO, ou `''` quando ele não existe — nunca um
 * booleano. `plano` e `referencias` devolviam `true`/`false`, e isso funcionava enquanto o
 * único consumidor era um `if`. Quando as listas passaram a construir LINKS com este valor, o
 * booleano foi direto para o `href`: a lista da notação abria `/bale-nivel-2-teste-2/true`, um
 * 404 com o nome da variável dentro. O defeito esteve no ar até 23/10/2026, e é o género de
 * coisa que só se vê do lado de lá — do lado de cá o código diz «existe».
 *
 * O `glossario` já devolvia o ficheiro (o nome varia: `glossario-benesh.html`), e por isso era
 * o único que funcionava. Agora todos devolvem nomes, e quem quer o booleano escreve `!!`.
 */
function documentosDaTurma(pacote) {
  const lista = fs.readdirSync(pacote);
  const primeiro = (re) => lista.filter((f) => re.test(f)).sort()[0] || '';
  return {
    plano: primeiro(/^plano\.html$/),
    referencias: primeiro(/^referencias\.html$/),
    notacao: primeiro(/^notacao\.html$/),
    glossario: primeiro(/^glossario[-a-z]*\.html$/),
    pdf: primeiro(/^ciclo-.*\.pdf$/),
  };
}

/**
 * O MENU DA ESCOLA — a COLUNA e a BARRA (23/10/2026).
 *
 * O QUE MUDOU, E PORQUÊ. Até aqui o menu enumerava documentos: um item por plano, por
 * referências, por aula, por glossário, por captura — vezes o número de turmas. Medido na escola
 * de teste, com duas turmas e uma aula publicada em cada: 24 entradas. Com três turmas e as 18
 * aulas que o `.conf` já declara, 84. Nenhuma delas é um DESTINO: são todas documentos, e o menu
 * crescia com o acervo, que é o único crescimento que não tem fim.
 *
 * Agora o menu tem destinos fixos, e cada um leva a uma página que lista o que existe. A conta
 * deixa de ter turmas e aulas dentro — com 1 aula ou com 18, com 2 turmas ou com 3, o menu é o
 * mesmo.
 *
 * DUAS PARTES, DOIS LUGARES:
 *   · `coluna` — o trabalho de sala: Ciclos, Aulas, Planejamento, Área do Professor;
 *   · `barra`  — o Bastidores, na ponta oposta à marca, com o Estúdio e a Produção.
 *
 * O BASTIDORES SAIU DA COLUNA porque não é trabalho de sala: é a escola a olhar-se. E porque dois
 * menus a competir pelo mesmo espaço é o problema que a barra única veio resolver.
 *
 * A FORMA DO `nav.json` NÃO MUDOU DE CONTRATO — mudou de conteúdo. `motor/nucleo/nav.js` já
 * aceitava `tipo: 'menu'` e `tipo: 'link'`, e desenha a coluna quando encontra `coluna`. Um
 * `nav.json` antigo (só `grupos`) continua a desenhar a barra de sempre.
 */
function menuDaEscola({ turmas, blocos }) {
  /* A COLUNA. Cada grupo é `tipo: 'menu'` (um título que abre) ou `tipo: 'link'` (um destino
     sem submenu). Hoje só há grupos: a lista de aulas deixou de ser um destino próprio e passou
     a viver dentro da Área do Professor — ver a nota em «Aulas», mais abaixo. */
  const coluna = [];

  const temCiclos = turmas.some((t) => t.documentos && (t.documentos.plano || t.documentos.referencias));
  if (temCiclos) {
    /* «REFERÊNCIAS» SAIU DO GRUPO (26/10/2026), e a razão é a mesma que tirou «Aulas» da raiz.
     *
     * Havia dois caminhos para o mesmo documento — «Ciclos · Referências» (uma listagem com
     * «Procurar» e uma linha por turma) e o «Referências» que o cartão do plano já traz na
     * lista de Planos. A pesquisadora disse-o por extenso: «eu não preciso ter aqui em ciclos no
     * menu referências e a listagem das referências… É a partir dali que eu chego até
     * referências.» A listagem foi removida com ele.
     *
     * O QUE NÃO SE PERDE: o grupo continua a ser um acordeão com um item — «Planos» —, e é ele
     * que fica aceso quando se abre o plano OU as referências. Aprofundar dentro de Planos não é
     * sair de Planos. */
    coluna.push({ tipo: 'menu', rotulo: 'Ciclos', itens: [
      { rotulo: 'Planos', href: '/ciclos/planos/' },
    ] });
  }
  /* «AULAS» SAIU DA RAIZ DO MENU (24/10/2026). Ela era um destino no topo da coluna — e havia
     um segundo «Aulas», dentro da Área do Professor, a apontar para o MESMO endereço. Dois
     itens para a mesma página não são um atalho: são uma ambiguidade, e a pesquisadora viu-a
     como aquilo que ela é — «as duas abrem a mesma coisa».
     A lista ficou no lugar em que o trabalho acontece (a área onde se lança e se imprime a
     captura), e o rótulo de lá passou a ser «Aulas». O destino continua a existir sempre que
     haja turma: sem turma não há aula nenhuma para listar, e o item apontaria para uma página
     vazia, que é a versão educada de um menu que mente. */

  /* A ÁREA DO PROFESSOR — quatro destinos, e nenhum leva a turma na URL.
   *
   * Era aqui que o menu mais crescia: a harmonização, a captura e o lançamento entravam um por
   * turma. A harmonização saiu do menu (é assunto da direção, e vive na Produção); a captura
   * passou a ser uma ação da lista de aulas; e os três formulários passaram a apontar para uma
   * LISTA DE TURMAS — a página que escolhe de quem é o ato antes de o formulário abrir.
   *
   * PORQUE UMA LISTA, E NÃO A PORTA DIRECTA (23/10/2026). O menu apontava para `/anamnese/`, e a
   * porta abria com a barra de contexto vazia: quem chegava tinha de saber, de cor, qual era o
   * professor e qual o ciclo — e o que ele escolhesse ali não tinha passado pela curadoria, que é
   * quem liga professor e turma. A lista mostra as turmas que a curadoria já autorizou, e leva o
   * contexto no endereço. O menu continua sem citar turma nenhuma: quem a cita é a página.
   *
   * Sem turma curada o grupo não entra: não há ato para preencher, e quatro itens a levar a três
   * listas vazias seriam um menu a mentir com educação.
   */
  /* OS TRÊS FORMULÁRIOS SÃO MOLDURA, E NÃO CONTEÚDO (05/11/2026) — e a condição que os guardava
   * era o que faltava numa escola recém-criada.
   *
   * A regra era `if (turmas.length)`, com o motivo escrito abaixo: «sem turma curada não há ato
   * para preencher, e quatro itens a levar a três listas vazias seriam um menu a mentir com
   * educação». O motivo é honesto e a decisão estava errada, e a pesquisadora viu o resultado na
   * tela: «quando é criada a escola nova, ela está nascendo sem os menus, que são os de plano de
   * ensino e de plano de observação e do plano da anamnese».
   *
   * TRÊS RAZÕES, e a primeira é de domínio:
   *
   *   1. A ANAMNESE VEM ANTES DA TURMA. Ela é o instrumento de ENTRADA — a aluna nova é
   *      entrevistada antes de haver turma para a pôr. Esconder o item até haver turma esconde a
   *      porta exactamente de quem ainda não tem nada.
   *   2. O PLANO DE ENSINO É O QUE CRIA A TURMA (é ele que abre o ciclo). Sem o item, a escola
   *      nova não tem por onde começar — o menu fica a apontar só para os Bastidores.
   *   3. A MOLDURA É INEGOCIÁVEL. «Em hipótese alguma, independentemente da rota, a página pode
   *      perder o menu lateral esquerdo e o menu superior.» Um menu que muda de forma conforme o
   *      acervo não é moldura: é conteúdo.
   *
   * As listas existem sempre — a ponte as serve, e vazias dizem o que fazer («ainda não há…»).
   * «AULAS» FICA DE FORA ATÉ HAVER TURMA, e essa distinção é a que a pesquisadora fez: «os demais
   * itens de menu só vão existir quando for gerado o plano de ensino… eles são criados
   * dinamicamente». Aula é documento de ciclo; sem ciclo não há aula nenhuma para listar. */
  const itensDaArea = [
    { rotulo: 'Anamnese do aluno', href: AREA_DO_PROFESSOR.anamnese },
    { rotulo: 'Plano de ensino', href: AREA_DO_PROFESSOR.plano },
    { rotulo: 'Plano de Observação', href: AREA_DO_PROFESSOR.po },
  ];
  if (turmas.length) {
    /* «AULAS», E NÃO «LANÇAMENTO DE AULA» (24/10/2026). O item abre a LISTA das aulas — as
       mesmas que a captura para impressão e o lançamento servem, uma linha de cada vez. O
       nome antigo prometia um formulário e entregava uma lista; e, com o destino do topo da
       coluna removido, «Aulas» é também o nome que diz onde as aulas estão. O formulário
       `lancamento.html` continua a chamar-se «Lançamento de aula — formulário eletrônico»:
       ele é o documento, e o documento diz o que é. */
    itensDaArea.push({ rotulo: 'Aulas', href: '/aulas/' });
    /* «AULAS DADAS» — A LISTA DO QUE JÁ ACONTECEU (06/11/2026).
     *
     * «Aulas» lista as aulas DECLARADAS pelo ciclo (o plano, a data, o marco). Esta lista as que
     * foram DADAS e lançadas, com o registro de cada uma — quando foi lançada, até quando se
     * ajusta, se houve ajuste —, e é por ela que se abre o que foi preenchido. A página é SERVIDA
     * pela ponte (`motor/servidor/aulas-dadas.js`), e não montada aqui: o que ela lista muda a
     * cada lançamento, e uma página montada no deploy mostraria a escola do dia do deploy.
     *
     * O item vive no menu mesmo antes de haver aula dada: uma lista vazia que diz «Nenhuma aula
     * foi realizada até o momento» é a resposta certa a «onde estão as aulas dadas?» — e um item
     * que só aparece depois do primeiro lançamento obrigaria a saber que ele existe. */
    itensDaArea.push({ rotulo: 'Aulas dadas', href: '/area-do-professor/aulas-dadas/' });
  }
  coluna.push({ tipo: 'menu', rotulo: 'Área do Professor', itens: itensDaArea });

  /* A BARRA. Os blocos do sistema vinham do pacote-zero, e o `Bastidores` vinha lá dentro com os
     dois destinos dele. O que se usa é só esse grupo: a Área do Professor deixou de vir de lá,
     porque a versão do pacote-zero carrega a turma na URL. */
  const barra = [];
  for (const bloco of blocos) {
    const rotulo = (/<summary>([^<]+)<\/summary>/.exec(bloco) || [])[1] || '';
    if (!/^Bastidores$/i.test(rotulo.trim())) continue;
    const itens = [...bloco.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
      .map((m) => ({ rotulo: m[2].trim(), href: absolutizar(m[1]) }));
    if (itens.length) barra.push({ tipo: 'menu', rotulo: rotulo.trim(), itens });
  }
  if (!barra.length) {
    /* Sem pacote-zero não há bloco de onde extrair; o destino é fixo no sistema. Era um par —
     * «Estúdio de Dança» e «Produção» —, e a 22/11/2026 ficou um: a cena saiu, e a produção passou
     * a chamar-se estúdio. Ver `tools/templates/nav-html.js`. */
    barra.push({ tipo: 'menu', rotulo: 'Bastidores', itens: [
      { rotulo: 'Estúdio', href: '/bastidores/estudio' },
    ] });
  }

  return { versao: 2, coluna, barra };
}

/**
 * OS DADOS DE UM PLANO, para a lista — lidos de onde já estão, sem campo novo.
 *
 * `NOME`, `PROFESSOR`, `TOTAL_AULAS` e `CICLO` vêm do `.conf` da turma; `ancorado_em`, `po_state`
 * e `hash` vêm da âncora encadeada. É a regra da casa: **nenhuma coluna é inventada**. O que não
 * existir fica vazio, e a linha mostra menos — não se abre um campo novo para encher uma tabela.
 */
function dadosDoPlano(t, i) {
  const irmao = path.join(path.dirname(t.pasta), path.basename(t.pasta) + '.conf');
  const conf = fs.existsSync(irmao) ? fs.readFileSync(irmao, 'utf8') : '';
  const fipp = fs.existsSync(irmao.replace(/\.conf$/, '.fipp'))
    ? fs.readFileSync(irmao.replace(/\.conf$/, '.fipp'), 'utf8') : '';
  const doFipp = (chave) => {
    const m = new RegExp('^' + chave + ':[ \\t]*(.*)$', 'm').exec(fipp);
    return m ? m[1].trim() : '';
  };
  const po = doFipp('po_state');
  const data = doFipp('ancorado_em');
  const daData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  return {
    nome: chaveDoConf(conf, 'NOME') || 'Ciclo ' + t.ciclo + ' — ' + t.nome,
    turma: t.nome,
    turmaCurta: String(t.nome).replace(/\s+—\s+Teste\s+\d+$/i, ''),
    professor: chaveDoConf(conf, 'PROFESSOR') || chaveDoConf(conf, 'RESPONSAVEL') || '',
    ciclo: chaveDoConf(conf, 'CICLO') || t.ciclo || '01',
    aulas: chaveDoConf(conf, 'TOTAL_AULAS') || '',
    ancorada: daData ? daData[3] + '/' + daData[2] + '/' + daData[1] : data,
    po: po ? 'PO ' + po.replace(/^Input_PO_/, '').replace(/_/g, ' ').toLowerCase() : '',
    poClasse: /aguardando|pendente/i.test(po) ? 'alerta' : (po ? 'ok' : 'discreto'),
    hash: doFipp('hash'),
    hrefPlano: '/' + t.variante + '/plano.html',
    hrefReferencias: '/' + t.variante + '/referencias.html',
    hrefPdf: (t.documentos && t.documentos.pdf) ? '/' + t.variante + '/' + t.documentos.pdf : '',
    indice: i,
  };
}


/** `2027-02-02` → `02/02/27`: o dia e o mês ficam, e o século sai.
 *
 * É a forma que cabe na caixa do cartão. A caixa tem 97px úteis a 390px, e `02/02/2027 →
 * 29/04/2027` mede 187px — pedia três linhas. Com dois dígitos no ano mede 152 e cabe em duas.
 * As datas inteiras continuam no painel do período, que é onde se vão ler por extenso. */
function dataCurta(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1].slice(2) : '';
}

/** O período de um ciclo em duas palavras curtas — ou «a preencher», e nunca uma data inventada. */
function periodoCurto(t) {
  const r = t.resumo || {};
  const de = dataCurta(r.inicio);
  const a = dataCurta(r.fim);
  return (de && a) ? de + ' → ' + a : 'a preencher';
}

/**
 * O ITEM DA LISTA DE PLANOS — as três caixas na ordem fixa: de quem · quem · quando.
 *
 * O ESTADO DA CADEIA NÃO É UMA QUARTA CAIXA. Ele já vivia num SELO ao lado do nome, e é lá que
 * fica: o selo é «estado», e a caixa é «facto». A data de ancoragem desce para o painel do
 * período, junto das datas que ela acompanha. Cinco factos couberam em três caixas porque dois
 * deles não competem pelo mesmo lugar — e a alternativa (quatro caixas) é a que a grelha não
 * aguenta a 390px.
 */
function itemDoPlano(t) {
  const p = dadosDoPlano(t);
  const r = t.resumo || {};
  const turmaCurta = p.turmaCurta;
  return {
    nome: p.nome,
    ler: t.documentos && t.documentos.plano ? p.hrefPlano : '',
    lerDica: 'abrir o plano do ciclo',
    selo: p.po || '',
    seloClasse: p.poClasse,
    acoes: [
      ['Referências', p.hrefReferencias, 'secundario'],
      p.hrefPdf ? ['PDF do ciclo', p.hrefPdf, 'secundario'] : null,
    ].filter(Boolean),
    /* A LINHA DE CONTEXTO NÃO REPETE AS CAIXAS. A turma e o professor estão lá em cima; aqui
     * ficam o ciclo e o volume, que é o que não cabe numa caixa. */
    contexto: ['Ciclo ' + p.ciclo, p.aulas ? p.aulas + ' aulas previstas' : ''].filter(Boolean).join(' · '),
    turma: p.turma,
    professor: p.professor,
    caixas: [
      { rotulo: 'Turma', valor: turmaCurta,
        painel: listas.painelDoCartao([
          ['Turma', p.turma], ['Ciclo', p.ciclo], ['Aulas previstas', p.aulas]],
          'Modalidade e tradição vêm da sala, com o professor.') },
      { rotulo: 'Professor', valor: p.professor,
        painel: listas.painelDoCartao([
          ['Professor', p.professor], ['Turma', p.turma]],
          'É a turma que liga professor e sala. Sem ela, este plano não existe.') },
      { rotulo: 'Período', valor: periodoCurto(t),
        painel: listas.painelDoCartao([
          ['Começa', data(r.inicio) || 'a preencher'],
          ['Termina', data(r.fim) || 'sai do início'],
          ['Frequência', chaveDoConf(confDaTurma(t), 'FREQUENCIA')],
          ['Ancorada em', p.ancorada]],
          'A cadeia acrescenta, não edita: um ajuste é um elo novo.') },
    ],
  };
}

/** O `.conf` da variante, ao lado do pacote — o mesmo que o `dadosDoPlano` lê. */
function confDaTurma(t) {
  const irmao = path.join(path.dirname(t.pasta), path.basename(t.pasta) + '.conf');
  return fs.existsSync(irmao) ? fs.readFileSync(irmao, 'utf8') : '';
}

/**
 * O ITEM DA LISTA DE AULAS — a turma, o professor, e a HORA.
 *
 * «Que turma é essa, que horas começa a aula, qual é a duração, quem é o professor» — é o que a
 * pesquisadora pediu, e é o que três caixas dão. A SALA não existe no modelo: a turma tem dias,
 * hora de início por dia e duração, e não tem sala. A caixa diz «não declarada» em vez de
 * inventar um sítio — e o campo entra com o PLANO-TABELA-DE-ATIVIDADES, que é quando a sala passa
 * a ser um dado e não uma suposição.
 */
function itemDaAula(t, a, indice, total) {
  const p = dadosDoPlano(t);
  const hora = a.inicio ? a.inicio + (a.fim ? '–' + a.fim : '') : '';
  const duracao = (t.resumo && t.resumo.duracao) ? t.resumo.duracao + ' min' : '';
  const quando = [hora || duracao, hora && duracao ? duracao : ''].filter(Boolean).join(' · ');
  const paginaAula = 'aula-' + a.n + '.html';
  const ler = fs.existsSync(path.join(t.pasta, paginaAula))
    ? '/' + t.variante + '/' + paginaAula
    : '';
  // «Abrir notação» NÃO É AÇÃO DA LISTA (28/10/2026). Era a primeira ação da linha da aula:
  // o professor escolhia o documento antes de saber o que ia ler, e o botão ficava fora do
  // documento a que pertence. Passou para o cabeçalho da própria Aula — a listagem abre a
  // aula, e a leitura em notação é um botão lá dentro.
  const acoes = [];
  if (fs.existsSync(path.join(t.pasta, 'lancamento.html'))) {
    acoes.push(['Lançar', '/' + t.variante + '/lancamento.html', 'secundario']);
  }
  if (fs.existsSync(path.join(t.pasta, 'captura-aula-' + a.n + '.html'))) {
    acoes.push(['Captura para impressão', '/' + t.variante + '/captura-aula-' + a.n + '.html', 'secundario']);
  }
  const pdfAula = paginaAula.replace(/\.html$/, '.pdf');
  if (fs.existsSync(path.join(t.pasta, pdfAula))) {
    acoes.push(['PDF da aula', '/' + t.variante + '/' + pdfAula, 'secundario']);
  }

  /*
   * O GUIA DE OBSERVAÇÃO À MÃO, NO CARTÃO (04/11/2026).
   *
   * A pesquisadora: «o professor precisa de ter acesso rápido e prático ao seu Guia de
   * Observação — o que observar durante aquela aula — sem forçar a entrar na tela interna da aula
   * apenas para conferir o que deve observar». O guia está na §5 da aula, e chegava lá só por
   * dentro; no cartão, a linha dizia três caixas técnicas (turma, professor, horário) e nada do
   * que se observa. É o único dado pedagógico da listagem, e era o que faltava.
   *
   * A FONTE É A CÓPIA DO PO NO PACOTE (`po-01.json`) — a mesma que a porta lê. Ela traz as
   * dimensões e os itens já na forma do documento (`{dimensao, itens}`), e NADA aqui é deduzido:
   * dimensão sem item sai dita, como no `.md`.
   */
  const guia = guiaDoCartao(t, a);

  return {
    /* O CARTÃO NOMEIA O DOCUMENTO PELO QUE ELE É (04/11/2026). Era «Aula 01 — <marco>», e o
     * documento que ele abre chama-se «Plano para a Aula 01 — <objetivo>»: o cartão e a página
     * diziam nomes diferentes para a mesma coisa. O cartão passa a usar a mesma família — o
     * marco continua a discriminar, como no título. */
    nome: 'Plano para a Aula ' + a.n + (a.marco ? ' — ' + a.marco : ''),
    ler,
    lerDica: 'abrir a versão em prosa da aula',
    acoes,
    contexto: 'Ciclo ' + p.ciclo + ' · aula ' + Number(a.n) + ' de ' + total,
    turma: p.turma,
    professor: p.professor,
    /* A LINHA DE APOIO DO CARTÃO É O OBJETIVO GERAL DO PO (04/11/2026).
     *
     * A pesquisadora: «a linha de resumo exibida atualmente abaixo do título da aula e acima das
     * informações de ciclo/aula (que lista os eixos e contagens…) — essa informação já está
     * perfeitamente posicionada e detalhada dentro do Guia de Observação, tornando redundante a
     * sua exibição na listagem principal». E o que entra no lugar é o OBJETIVO GERAL do Plano de
     * Observação, com o prefixo que ela fixou.
     *
     * A HIERARQUIA FICA COMPLETA: o título do cartão é o objetivo ESPECÍFICO da aula (o marco), e
     * esta linha diz o objetivo GERAL do ciclo. Duas escalas, cada uma no seu lugar — e a síntese
     * por eixo continua na caixa do guia, que é onde ela se lê sem repetir.
     *
     * A FONTE É O PO CONSOLIDADO no pacote (`po-01.json`), e o campo é `horizonte` — o mesmo que
     * a capa do PO chama «Horizonte (objetivo geral de conjunto)». Sem ele, a linha DIZ que falta:
     * um cartão em branco leria como «este ciclo não tem objetivo geral», que é uma afirmação
     * sobre o trabalho de alguém. */
    ...(guia.objetivoGeral
      ? { fatos: ['Plano de Observação — ' + guia.objetivoGeral] }
      : {}),
    caixas: [
      /* A «TURMA» CONCENTRA O QUE ESTAVA EM DUAS CAIXAS (04/11/2026). O horário tinha caixa
       * própria ao lado da turma, e são a mesma pergunta: «que aula é esta, e quando». A contagem
       * («Aula 1 de 35») e a identificação já estavam aqui; o dia, a hora e a duração passam a
       * estar, e a caixa do horário deixa de existir — três caixas continuam a ser o limite, e
       * agora são turma · professor · guia. */
      { rotulo: 'Turma', valor: p.turmaCurta,
        /* O CICLO NÃO É ATRIBUTO DA TURMA (04/11/2026). A pesquisadora: «remover a informação de
         * "ciclo 01", pois o ciclo não é um atributo estrutural da turma». É a mesma leitura que
         * a listagem da Área do Professor já faz — lá o ciclo aparece onde é o ciclo (na geração,
         * nos índices), e não como se fosse um dado da turma. O cartão continua a dizer a turma,
         * a aula («Aula 1 de 35»), o dia, as horas, a duração e a sala. */
        painel: listas.painelDoCartao([
          ['Turma', p.turma],
          ['Aula', Number(a.n) + ' de ' + total],
          ['Dia', data(a.data) || '—'],
          ['Começa às', a.inicio || '—'],
          ['Termina às', a.fim || '—'],
          ['Duração', duracao || '—'],
          /* A SALA NÃO EXISTE NO MODELO, E A LISTAGEM DIZ ISSO. A turma tem dias, hora de
           * início por dia e duração; sala não tem. A caixa diz «não declarada» em vez de
           * inventar um sítio — e o campo entra com o PLANO-TABELA-DE-ATIVIDADES, que é quando a
           * sala passa a ser um dado e não uma suposição. */
          ['Sala', 'não declarada']],
          'A sala entra no modelo com o PLANO-TABELA-DE-ATIVIDADES. Até lá, a listagem diz que '
          + 'não a tem — não inventa um sítio.') },
      /* O PROFESSOR É TRÊS DADOS, E NÃO UM SLUG (04/11/2026). A pesquisadora: o bloco «deve
       * exibir obrigatoriamente três informações que já existem na base — nome do professor,
       * modalidade que ele ensina, tradição de referência». O painel dizia uma linha só, e dizia
       * o IDENTIFICADOR (`coqui-de-redinha`), que não é o nome de ninguém.
       *
       * AS TRÊS VÊM DO DADO, cada uma do seu sítio, e nenhuma é deduzida:
       *   · o NOME e a MODALIDADE são da PESSOA — `professores/<slug>/perfil.json` (a habilitação
       *     é dela, não do tenant; decisão de 03/11/2026). O rótulo da modalidade sai da lista do
       *     catálogo (`biblioteca/modalidades/modalidades.json`), não de uma capitalização;
       *   · a TRADIÇÃO é do PLANO — é ele que declara `metodologiaDeReferencia` («RAD»), e é a
       *     tradição com que ESTA turma é ensinada. Pô-la no perfil seria dizer que a pessoa só
       *     trabalha numa tradição, que é mais do que o dado afirma.
       *
       * O QUE FALTA É DITO, e não inventado: sem perfil, o painel mostra o professor que o
       * `.conf` declara e escreve «não declarada» nas duas linhas que dependem dele. */
      { rotulo: 'Professor', valor: perfilDoProfessor(t).nome || p.professor || '—',
        painel: listas.painelDoCartao([
          ['Professor', perfilDoProfessor(t).nome || p.professor || '—'],
          ['Modalidade', perfilDoProfessor(t).modalidade || 'não declarada'],
          ['Tradição de referência', tradicaoDaTurma(t) || 'não declarada'],
        ]) },
      /* O GUIA — a caixa nova. O valor é a conta (quantos critérios, em quantas dimensões); o
       * painel, um par por dimensão com os itens. A §5 da aula continua a ser o documento, e o
       * nome da aula é o link para lá. */
      { rotulo: 'Guia de observação', valor: guia.valor,
        painel: listas.painelDoCartao(
          guia.pares.length ? guia.pares : [['Guia', 'o Plano de Observação ainda não declarou dimensões']],
          guia.pares.length
            ? 'O guia completo está na Aula ' + Number(a.n) + ', na secção «Guia de observação do '
              + 'professor» — aqui fica o que se observa, para se ter à mão sem abrir a aula.'
            : 'As dimensões vêm do Plano de Observação desta turma. Sem elas, não há o que '
              + 'observar — e a lista não inventa critérios.') },
    ],
  };
}

/** As três frentes do guia, na ordem em que o documento as apresenta (ver `derivar-ciclo.js`). */
const EIXOS_DO_GUIA = [
  { id: 'corpo', rotulo: 'Corpo' },
  { id: 'tecnica', rotulo: 'Técnica' },
  { id: 'poiesis', rotulo: 'Poiesis' },
];
/* O MAPA DOS EIXOS ERA UMA SEGUNDA CÓPIA (04/11/2026). Estava escrito aqui e outra vez em
 * `motor/nucleo/derivar-ciclo.js` — duas declarações da mesma taxonomia, que divergiriam ao
 * primeiro bloco novo (a mesma dimensão no eixo técnico na aula e na poiesis no cartão). Agora é
 * uma só, em `motor/nucleo/eixos.js`. E ela trouxe a correcção que faltava: o CORPO é eixo
 * próprio, e não uma técnica — aqui qualquer bloco que não fosse musicalidade/expressão caía em
 * «tecnica», e o corpo do plano ia para o eixo errado. */
const eixosDaDanca = require(path.join(__dirname, '..', 'motor', 'nucleo', 'eixos.js'));
const blocoDaDimensaoNoCartao = eixosDaDanca.blocoDaDimensao;
const eixoDoBlocoNoCartao = eixosDaDanca.eixoDoBloco;

/**
 * O PERFIL DO PROFESSOR — nome e modalidade, do ficheiro da PESSOA.
 *
 * `professores/<slug>/perfil.json` é o sítio da habilitação (03/11/2026: a modalidade nasce da
 * competência de quem ensina, não do edifício). O cartão mostra o NOME, e não o slug: um
 * identificador não é o nome de ninguém.
 *
 * Sem perfil — escola antiga, professor que ainda não declarou — devolve vazio, e quem mostra diz
 * «não declarada». Nada é capitalizado a partir do slug para parecer um nome.
 */
function perfilDoProfessor(t) {
  const slug = String((t && (t.professor || (t.resumo && t.resumo.professor))) || '').trim();
  if (!slug) return { nome: '', modalidade: '' };
  const arquivo = path.join(RAIZ, 'professores', slug, 'perfil.json');
  let perfil = null;
  if (fs.existsSync(arquivo)) {
    try { perfil = JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch (erro) { perfil = null; }
  }
  const lista = (perfil && Array.isArray(perfil.modalidades)) ? perfil.modalidades.map(String) : [];
  return {
    nome: String((perfil && perfil.nome) || '').trim(),
    // O RÓTULO VEM DO CATÁLOGO, e não de uma transformação do id: `bale-classico` → «Balé
    // clássico» está escrito em `biblioteca/modalidades/modalidades.json`. Sem entrada lá, mostra
    // o próprio id — que é feio mas é verdade, e diz onde ir declarar.
    modalidade: lista.map(rotuloDaModalidade).filter(Boolean).join(', '),
  };
}

/** O nome de uma modalidade, do catálogo. Sem catálogo legível, o id fica como está. */
function rotuloDaModalidade(id) {
  const arquivo = path.join(RAIZ, 'biblioteca', 'modalidades', 'modalidades.json');
  let lista = [];
  if (fs.existsSync(arquivo)) {
    try {
      const dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
      lista = Array.isArray(dados) ? dados : (Array.isArray(dados.modalidades) ? dados.modalidades : []);
    } catch (erro) { lista = []; }
  }
  const achada = lista.find((m) => m && (m.id === id || m.slug === id));
  return (achada && (achada.nome || achada.rotulo)) || String(id || '').trim();
}

/**
 * A TRADIÇÃO DE REFERÊNCIA DA TURMA — do PLANO, que é quem a declara.
 *
 * A fonte é a cópia do plano no pacote (`plano-01.json`), no campo `contexto.metodologiaDeReferencia`
 * — que é o que o professor respondeu no formulário («RAD»). Nada é deduzido do nome da turma nem
 * do catálogo: uma turma de balé clássico pode ser RAD ou Vaganova, e é o plano que diz qual.
 */
function tradicaoDaTurma(t) {
  for (const nome of ['plano-01.json', 'plano-aula-01.json']) {
    const arquivo = path.join(t.pasta, nome);
    if (!fs.existsSync(arquivo)) continue;
    let plano = null;
    try { plano = JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch (erro) { plano = null; }
    const ctx = plano && plano.contexto;
    const tradicao = ctx && (ctx.metodologiaDeReferencia || ctx.tradicao);
    if (tradicao) return String(tradicao).trim();
  }
  return '';
}

/**
 * O GUIA DE UMA AULA, PARA O CARTÃO — lido da cópia do PO no pacote.
 *
 * Devolve `{valor, resumo, pares, objetivoGeral}`:
 *   · `valor` — a conta, que é o que a caixa mostra fechada («8 critérios · 3 dimensões»);
 *   · `resumo` — a síntese por eixo («Técnica — Barra, Centro · Poiesis — Musicalidade»), que
 *     ficou SEM consumidor no cartão em 04/11/2026 (a linha passou a ser o objetivo geral) e se
 *     mantém porque é o que a caixa fechada do guia resume;
 *   · `pares` — `[dimensão, itens]`, um por dimensão, para o painel;
 *   · `objetivoGeral` — o `horizonte` do PO, que é o OBJETIVO GERAL de conjunto. É ele que a
 *     linha do cartão publica agora.
 *
 * Sem PO no pacote, tudo sai vazio e a caixa DIZ porquê — um cartão em branco leria como «não há
 * nada a observar», que é uma afirmação sobre a aula de alguém.
 */
function guiaDoCartao(t, a) {
  const arquivo = path.join(t.pasta, 'po-' + a.n + '.json');
  const doPo = fs.existsSync(arquivo) ? arquivo : path.join(t.pasta, 'po-01.json');
  let po = null;
  if (fs.existsSync(doPo)) {
    try { po = JSON.parse(fs.readFileSync(doPo, 'utf8')); } catch (erro) { po = null; }
  }
  const dimensoes = (po && Array.isArray(po.dimensoesObservadas)) ? po.dimensoesObservadas.map(String) : [];
  const cru = (po && Array.isArray(po.itensPorDimensao)) ? po.itensPorDimensao : [];
  const porDimensao = new Map();
  for (const registro of cru) {
    if (!registro || typeof registro !== 'object') continue;
    const nome = String(registro.dimensao || registro.sujeito || '').trim();
    if (!nome) continue;
    // O `;` separa itens (a regra do gerador, desde 01/11/2026); a linha quebrada também.
    const itens = []
      .concat(Array.isArray(registro.itens) ? registro.itens : String(registro.itens == null ? '' : registro.itens).split(/[;\n]+/))
      .map((x) => String(x == null ? '' : x).trim())
      .filter(Boolean);
    porDimensao.set(nome, itens);
  }
  const nomes = dimensoes.length ? dimensoes : [...porDimensao.keys()];
  const porEixo = new Map(EIXOS_DO_GUIA.map((e) => [e.id, []]));
  for (const nome of nomes) {
    const bloco = blocoDaDimensaoNoCartao(nome);
    const eixo = eixoDoBlocoNoCartao(bloco);
    if (!porEixo.has(eixo)) porEixo.set(eixo, []);
    porEixo.get(eixo).push({ dimensao: nome, bloco, itens: porDimensao.get(nome) || [] });
  }

  /* O CORPO DO PLANO (04/11/2026). O eixo do corpo não tem dimensões no PO: tem os aspectos
   * físicos que o PLANO declara. Até aqui a caixa contava só as dimensões do PO, e o corpo
   * aparecia como uma frente sem uma linha — «o guia contempla as três dimensões» era verdade no
   * documento e mentira no cartão.
   *
   * A FONTE PASSOU A SER A AULA (04/11/2026, à noite), e a razão é a regra nova: o detalhe do
   * corpo vive na AULA 01 e o plano publica o ponteiro. O cartão lia a tabela do `plano-01.json`,
   * que deixou de a ter — e ler um ponteiro como se fosse a tabela dava **zero** aspectos, em
   * silêncio («Corpo 15» viraria «sem dimensões»). O que se lê agora é a cópia extraída da aula
   * (`plano-aula-NN.json`, `guiaDeObservacao.Corpo`), que é o MESMO dado no lugar onde ele passou
   * a ser impresso. O plano fica como **retrocompatível**: um pacote gerado antes desta data tem a
   * tabela no `plano-NN.json` e continua a contar — a leitura antiga vale como recurso, e não
   * como primeira escolha (P-04: o passado não se reescreve para caber no presente). */
  const aspectos = (() => {
    const doCaminho = (nome) => {
      const arquivo = path.join(t.pasta, nome);
      if (!fs.existsSync(arquivo)) return null;
      try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch (erro) { return null; }
    };
    const daAula = doCaminho('plano-aula-' + a.n + '.json') || doCaminho('plano-aula-01.json');
    const linhasDaAula = daAula && daAula.guiaDeObservacao && Array.isArray(daAula.guiaDeObservacao.Corpo)
      ? daAula.guiaDeObservacao.Corpo
      : [];
    const daAulaLimpas = linhasDaAula
      .map((l) => (l && typeof l === 'object' ? String(l.criterio || '').trim() : ''))
      .filter(Boolean);
    if (daAulaLimpas.length) return daAulaLimpas;
    const plano = doCaminho('plano-' + a.n + '.json') || doCaminho('plano-01.json');
    const linhas = plano && Array.isArray(plano.aspectoFisico) ? plano.aspectoFisico : [];
    return linhas.map((l) => {
      if (!l || typeof l !== 'object') return '';
      const celulas = Object.keys(l).map((k) => String(l[k] == null ? '' : l[k]).trim()).filter(Boolean);
      return celulas.length ? celulas[0] : '';
    }).filter(Boolean);
  })();
  if (aspectos.length) porEixo.get('corpo').push({ dimensao: 'Corpo', bloco: 'Corpo', itens: aspectos });

  const total = nomes.reduce((soma, n) => soma + (porDimensao.get(n) || []).length, 0) + aspectos.length;
  /* OS PARES SÃO UM POR EIXO, e não um por dimensão (04/11/2026). A caixa é a mesma peça em toda
   * a listagem, e o que ela diz tem de ser o que o documento passou a mostrar: três frentes. Um
   * par por dimensão repetia «Técnica — Barra», «Técnica — Centro» — a leitura que ela recusou
   * («o guia não pode chamar tudo de técnica»). */
  const pares = EIXOS_DO_GUIA
    .map((e) => {
      const lista = porEixo.get(e.id) || [];
      if (!lista.length) return null;
      const quantos = lista.reduce((soma, d) => soma + d.itens.length, 0);
      const blocos = lista.map((d) => d.bloco).join(', ');
      // O CORPO NÃO REPETE O PRÓPRIO NOME: o eixo já se chama «Corpo», e o grupo dele também —
      // «Corpo 15 · Corpo» lê-se como um erro. Fica a contagem.
      return [e.rotulo, blocos && blocos !== e.rotulo ? quantos + ' · ' + blocos : String(quantos)];
    })
    .filter(Boolean);
  const resumo = pares.map(([rotulo, valorDoEixo]) => rotulo + ' — ' + valorDoEixo).join(' · ');
  /* O OBJETIVO GERAL VEM DO PO, e é o `horizonte` (04/11/2026). O conteúdo do PO chama-lhe
   * literalmente «Horizonte (objetivo geral de conjunto)» — não há um segundo campo a inventar.
   * Sem horizonte, `''`: o cartão diz que falta, e não põe lá a pergunta nem o fenómeno, que
   * dizem outra coisa. */
  const declarado = po && (po.horizonte !== undefined ? po.horizonte : po.horizonteDoConjunto);
  const objetivoGeral = String(declarado == null ? ''
    : (Array.isArray(declarado) ? declarado.join(' ') : declarado)).trim();
  const valor = (total || nomes.length)
    ? total + (total === 1 ? ' critério' : ' critérios') + ' · '
      + EIXOS_DO_GUIA.filter((e) => (porEixo.get(e.id) || []).length).length
      + ((EIXOS_DO_GUIA.filter((e) => (porEixo.get(e.id) || []).length).length === 1) ? ' eixo' : ' eixos')
    : 'sem dimensões no PO';
  return { valor, resumo, pares, objetivoGeral };
}

/**
 * O DESENHO do menu, pelo módulo que a ponte de produção também usa (`motor/nucleo/nav.js`).
 * Uma função só para os dois lados é a diferença entre «o menu certo» e «o menu certo no sítio
 * onde eu me lembrei de o corrigir».
 */
function navDoMenu(menu, pedido, titulo) {
  return nav.desenhar(menu, pedido, titulo ? { titulo } : undefined) || '';
}

/** Um href de raiz: `/x`, e não `x` nem `./x`. Já absoluto (http, `#`) fica como está. */
function absolutizar(href) {
  const h = String(href == null ? '' : href).trim();
  if (!h) return '/';
  if (/^(https?:|mailto:|data:|#)/.test(h)) return h;
  return h.startsWith('/') ? h : '/' + h;
}

/**
 * A CÓPIA DO PACOTE PARA A PUBLICAÇÃO.
 *
 * `excluir` é uma lista de NOMES de ficheiro que ficam de fora. Ela existe por causa da
 * harmonização (23/10/2026): o documento é gerado — e continua a ser, porque é ele que a
 * direção lê — mas não se publica. Ele fala do linguajar dos professores, e isso é assunto da
 * escola com a direção, não da página que qualquer visitante abre.
 *
 * O `cpSync` não tem filtro por nome, e copiar-e-apagar-depois deixaria o ficheiro publicado no
 * disco entre os dois passos — e um Worker que sirva no meio do processo serviria o que não devia.
 * Daí o filtro na origem, com a mesma recursão que o `cpSync` faz.
 */
function copiar(de, para, excluir = []) {
  const fora = new Set(excluir);
  fs.mkdirSync(para, { recursive: true });
  for (const entrada of fs.readdirSync(de, { withFileTypes: true })) {
    if (fora.has(entrada.name)) continue;
    const origem = path.join(de, entrada.name);
    const destino = path.join(para, entrada.name);
    if (entrada.isDirectory()) { copiar(origem, destino, excluir); continue; }
    if (fora.size && /\.(html|md)$/.test(entrada.name)) {
      fs.writeFileSync(destino, podarLinks(fs.readFileSync(origem, 'utf8'), [...fora]), 'utf8');
      continue;
    }
    fs.copyFileSync(origem, destino);
  }
}

/**
 * TIRAR DO HTML OS LINKS PARA O QUE NÃO SE PUBLICA — e o separador que ficaria órfão.
 *
 * Não basta não copiar o ficheiro. O rodapé do pacote lista os documentos do ciclo — «Plano ·
 * Harmonização de linguagem · Captura em aula · …» —, e um link para um documento que já não
 * está ao lado é um beco: quem o segue recebe 404, e o 404 lê-se como «o sistema perdeu o
 * documento». Deixar de publicar exige deixar de apontar.
 *
 * O `&middot;` que separa as entradas sai com a entrada: sem ele, o rodapé ficaria com dois
 * separadores encostados — «Plano · · Captura» —, que é a marca de uma remoção mal feita.
 */
function podarLinks(html, nomes) {
  let saida = String(html);
  const escapar = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const nome of nomes) {
    const href = 'href="' + escapar(nome) + '"';
    const ancora = '<a[^>]*' + href + '[^>]*>[^<]*</a>';
    // o separador ANTERIOR, se houver; senão o SEGUINTE; senão a âncora sozinha
    saida = saida
      .replace(new RegExp('\\s*&middot;\\s*' + ancora, 'g'), '')
      .replace(new RegExp(ancora + '\\s*&middot;\\s*', 'g'), '')
      .replace(new RegExp('\\s*' + ancora, 'g'), '');
    /* O `README.md` DO PACOTE também lista os ficheiros, em Markdown. Ele é copiado para a
       publicação, e uma lista que cita um ficheiro ausente é a mesma mentira em outra língua. */
    saida = saida
      .replace(new RegExp('\\s*`' + escapar(nome) + '`\\s*·\\s*', 'g'), ' ')
      .replace(new RegExp('\\s*·\\s*`' + escapar(nome) + '`', 'g'), '');
  }
  return saida;
}

/**
 * O QUE NÃO SE PUBLICA, e porquê — uma lista, e não uma condição espalhada.
 *
 * · `harmonizacao.html` — o relatório do linguajar. Decisão de 23/10/2026: ele passa a viver só
 *   na Produção (`/bastidores/producao`), que é onde a direção o lê. Publicá-lo punha a análise
 *   da fala dos professores numa página aberta.
 */
const FORA_DA_PUBLICACAO = ['harmonizacao.html'];


/**
 * A CÓPIA PARTILHADA DE `/assets/` — `publicacao/assets/` (14/11/2026).
 *
 * POR QUE ELA EXISTE. Num shard, o `assets.directory` é `publicacao/`, e todas as escolas vivem
 * uma pasta abaixo. O `run_worker_first` só consegue mandar um caminho direto ao ASSETS sem
 * invocar o Worker se o caminho for o mesmo em todas — e `/assets/style.css` é: medido a
 * 14/11/2026, o `style.css` e o `nav.js` das três escolas são byte a byte iguais. Uma cópia na
 * raiz de `publicacao/` mantém a negativa `!/assets/*` verdadeira, e é o que segura o custo em
 * **2 invocações por página em vez de 4** (`PLANO-SHARD.md` §2.2).
 *
 * O QUE ELA NÃO FAZ, E É O IMPORTANTE: não unifica aparências por acidente. Se a cópia que lá
 * está DIVERGE da que a escola acabou de montar, isto **falha e diz de quem é a que ficou** — em
 * vez de escolher uma em silêncio e mudar a cara de uma escola que ninguém abriu. Uma escola com
 * folha própria é uma decisão legítima; o que não pode é ela ser tomada por omissão.
 */
function garantirAssetsPartilhados(dirDaEscola, escola) {
  const origem = path.join(dirDaEscola, 'assets');
  if (!fs.existsSync(origem)) return null;
  const alvo = path.join(PUB, 'assets');
  if (!fs.existsSync(alvo)) {
    copiar(origem, alvo);
    return { estado: 'criada', escola };
  }
  const diferencas = compararPastas(origem, alvo);
  if (!diferencas.length) return { estado: 'igual', escola };
  console.error('aviso: `publicacao/assets/` DIVERGE de `publicacao/' + escola + '/assets/`:');
  for (const d of diferencas.slice(0, 6)) console.error('  ' + d);
  console.error('       a cópia partilhada NÃO foi alterada. Se a divergência é intencional, a');
  console.error('       escola precisa do seu próprio `/assets/` — e nesse caso o shard não a serve.');
  return { estado: 'diverge', escola, diferencas };
}

/** Os ficheiros que existem num lado e não no outro, ou que diferem. Vazio = iguais. */
function compararPastas(a, b) {
  const lista = (dir, base) => {
    const saida = new Map();
    const andar = (d) => {
      for (const item of fs.readdirSync(d, { withFileTypes: true })) {
        const completo = path.join(d, item.name);
        if (item.isDirectory()) { andar(completo); continue; }
        saida.set(path.relative(base, completo), fs.readFileSync(completo));
      }
    };
    andar(dir);
    return saida;
  };
  const da = lista(a, a);
  const db = lista(b, b);
  const out = [];
  for (const [rel, conteudo] of da) {
    if (!db.has(rel)) out.push('só em ' + path.basename(a) + ': ' + rel);
    else if (!conteudo.equals(db.get(rel))) out.push('diferente: ' + rel);
  }
  for (const rel of db.keys()) if (!da.has(rel)) out.push('só em ' + path.basename(b) + ': ' + rel);
  return out;
}

/**
 * AS ESCOLAS DE UM SHARD — as que o declaram no índice delas (15/11/2026).
 *
 * Num shard o `assets.directory` é `publicacao/`, e a árvore é PARTILHADA: o que se sobe é a de
 * todas as escolas dele. Montar uma só e subir apagaria as outras — o `wrangler deploy` substitui
 * a versão inteira, e não faz um remendo. Portanto a montagem de um shard é sempre «todas as
 * escolas dele», e a lista tem de vir de um sítio VERSIONADO: `escola/<slug>/indice.json`, campo
 * `shard`, que é o mesmo que o `criar-escola.sh --shard` grava e o mesmo que o expurgo lê.
 *
 * Devolve a lista ordenada. Vazia quer dizer «ninguém declara este shard» — e aí não se monta
 * nada, porque uma árvore vazia publicada é N escolas a responder 404.
 */
function escolasDoShard(shard, raiz) {
  const base = path.join(raiz || RAIZ, 'escola');
  if (!fs.existsSync(base)) return [];
  const escolas = [];
  for (const item of fs.readdirSync(base, { withFileTypes: true })) {
    if (!item.isDirectory()) continue;
    const arquivo = path.join(base, item.name, 'indice.json');
    if (!fs.existsSync(arquivo)) continue;
    let indice;
    try { indice = JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch (erro) { continue; }
    if (String((indice && indice.shard) || '').trim() === shard) escolas.push(item.name);
  }
  return escolas.sort();
}

/**
 * A MONTAGEM DE UM SHARD INTEIRO. Cada escola é montada pelo MESMO caminho de sempre — um
 * processo por escola, e não uma segunda cópia da montagem aqui dentro: o que a `criar-escola.sh`
 * e o CI fazem tem de ser exactamente o que se faz à mão, senão o deploy passa a ser
 * irreprodutível a partir do commit.
 */
function montarShard(shard) {
  if (!shard) {
    console.error('uso: node tools/montar-publicacao.js --shard <script>');
    process.exit(2);
  }
  const iRaiz = process.argv.indexOf('--raiz');
  const extra = iRaiz !== -1 ? ['--raiz', process.argv[iRaiz + 1]] : [];
  /* AS BANCADAS DE LAYOUT ATRAVESSAM O SHARD (17/11/2026).
   *
   * O DEFEITO, medido: o `--com-propostas` chegava a este processo e morria aqui. Este ramo
   * relança a montagem por escola (`spawnSync`) e passava só `--raiz` — a flag não viajava, e a
   * escola servida por um shard ficava sem `/propostas/`. Sintoma ao vivo, antes desta correcção:
   * `breu.padd.com.br/propostas/index.html` → **404**, com as bancadas geradas no mesmo run e
   * listadas no log. Montada à mão com a flag, a mesma pasta dava **16 páginas**.
   *
   * O que isto NÃO muda: a montagem por escola continua a ser a mesma função, e o shard continua
   * a montar-se inteiro (`--shard` recusa montar zero). Muda só o que se passa ao filho. */
  const comPropostas = process.argv.indexOf('--com-propostas') !== -1 ? ['--com-propostas'] : [];
  const raizDosIndices = iRaiz !== -1 ? path.resolve(process.argv[iRaiz + 1]) : RAIZ;
  const declaradas = escolasDoShard(shard, raizDosIndices);

  /* O ÍNDICE SOBREVIVE AO EXPURGO — E É POR ISSO QUE ESTA LISTA PRECISA DE UM FILTRO (15/11/2026).
   *
   * `escola/<slug>/indice.json` é o elo do expurgo e fica de propósito depois de a escola morrer:
   * é ele que guarda a data e o motivo. Só que ele continua a dizer `shard: lastro-teste`. Sem
   * esta linha, a lista do shard incluiria a escola expurgada, a montagem dela sairia com erro
   * («não há pacote-zero»), e o `--shard` inteiro falhava — ou seja, EXPURGAR UMA ESCOLA DEIXAVA
   * O SHARD INTEIRO SEM CONSEGUIR PUBLICAR. É o pior momento possível para o defeito aparecer:
   * ela expurga as três e recria, e o primeiro deploy depois disso não subia.
   *
   * O FILTRO É O MESMO DO `deploy-escolas`: a escola entra se o pacote-zero dela existe. Não se
   * olha para o campo `expurgo` do índice — poderiam existir dois critérios para a mesma pergunta,
   * e o que decide o que há para publicar é o pacote, não o registo. */
  const semPacote = [];
  const escolas = declaradas.filter((e) => {
    if (pacoteZeroDaEscola(e)) return true;
    semPacote.push(e);
    return false;
  });
  if (semPacote.length) {
    console.log('  sem pacote-zero, e por isso fora da montagem: ' + semPacote.join(', '));
  }
  if (!escolas.length) {
    console.error('erro: nenhuma escola COM PACOTE declara o shard «' + shard + '».'
      + (declaradas.length ? ' (declaram-no ' + declaradas.join(', ') + ', mas sem pacote-zero —'
        + ' escola expurgada não se publica)' : ''));
    console.error('       Montar zero escolas e subir o shard apagaria a árvore de todas.');
    process.exit(1);
  }
  console.log('shard «' + shard + '»: ' + escolas.length + ' escola(s) — ' + escolas.join(', '));
  /* A CÓPIA PARTILHADA DE `/assets/` É APAGADA ANTES DE RECOMEÇAR (26/11/2026).
   *
   * O DEFEITO, medido ao vivo: `publicacao/assets/style.css` era de **23/11** e as duas escolas
   * deste shard já traziam a folha de **25/11**. O `garantirAssetsPartilhados` NÃO a actualiza
   * quando ela diverge — e é certo que não o faça: uma folha própria é uma decisão legítima, e
   * trocá-la em silêncio mudaria a cara de uma escola que ninguém abriu.
   *
   * O que faltava é a outra metade: a cópia partilhada é SAÍDA, e o cabeçalho deste ficheiro diz
   * que a pasta é «reconstruída de zero». Não era — só a pasta de cada escola era apagada. Num
   * checkout limpo do CI o problema não existe, porque a pasta nasce ali; numa máquina onde
   * `publicacao/` já existe, a cópia velha sobrevive, a regra `!/assets/*` do shard serve-a
   * directo ao ASSETS, e a página publicada fica com uma folha que já não é a do repositório.
   * Foi assim que a `breu` e a `clablun` passaram a ser servidas com um `style.css` diferente do
   * `tools/templates/ciclo.css` — medido por `provar-ambiente`, que compara os bytes do que está
   * no ar com os da fonte.
   *
   * Apagada, ela é recriada da PRIMEIRA escola montada, com a folha dessa escola; a comparação com
   * as seguintes continua a avisar se divergirem. A regra de não unificar aparências fica intacta
   * — o que muda é que a cópia deixa de poder ser a de ontem. */
  const partilhado = path.join(PUB, 'assets');
  if (fs.existsSync(partilhado)) {
    fs.rmSync(partilhado, { recursive: true, force: true });
    console.log('  /assets/ partilhado: apagado, para ser recriado da primeira escola');
  }
  for (const escola of escolas) {
    const r = require('child_process').spawnSync(process.execPath,
      [__filename, escola].concat(extra, comPropostas),
      { stdio: 'inherit', cwd: RAIZ });
    if (r.status !== 0) {
      console.error('erro: a montagem de «' + escola + '» falhou — o shard NÃO se publica pela metade.');
      process.exit(r.status || 1);
    }
  }
  console.log('publicação do shard «' + shard + '» montada: ' + escolas.length + ' escola(s)');
}

/**
 * A MINIFICAÇÃO DO QUE VAI AO BROWSER (24/11/2026).
 *
 * O QUE MOTIVOU, medido. `porta/index.html` saía com **545 KB**, dos quais **490 KB** eram um
 * `<script>` inline e **234 KB** (49 %) eram COMENTÁRIO de fonte. `raiz/index.html`, 127 KB com
 * 30 KB de comentário. Ia tudo para o parser do browser em cada carregamento — e o brotli do
 * Cloudflare reduzia-o a 143 KB e 32 KB, respectivamente, o que quer dizer que dois terços do
 * que se transferia era texto que ninguém executa.
 *
 * O QUE SE MINIFICA, e só isto: os `<script>` INLINE (sem `src`) e os `<style>`. Os ficheiros
 * `.js`/`.css` partilhados de `assets/` **não se tocam** — são comparados byte a byte entre
 * escolas por `garantirAssetsPartilhados`, e são pequenos.
 *
 * AS FONTES NÃO SE TOCAM. Isto corre sobre a ÁRVORE MONTADA (`publicacao/`), depois de todas as
 * páginas estarem escritas. `porta/index.html`, `raiz/index.html` e o que o gerador escreve
 * ficam como estão: o `check-identidade` lê as fontes, e uma fonte minificada deixaria de poder
 * ser lida por quem tem de a ler.
 *
 * SEM `esbuild`, AVISA E NÃO MINIFICA. Não é uma dependência declarada — vem com o `wrangler` —,
 * e um deploy que falha por causa de uma optimização seria pior do que um deploy 2× maior. O
 * aviso é alto o suficiente para ninguém se enganar sobre o que subiu.
 *
 * Devolve o número de blocos minificados, para o chamador poder dizê-lo.
 */
function minificarInline(html) {
  let esbuild;
  try { esbuild = require('esbuild'); } catch (erro) { return { html, blocos: 0, semEsbuild: true }; }
  let blocos = 0;
  const saida = String(html).replace(/<(script|style)([^>]*)>([\s\S]*?)<\/\1>/g, (todo, tag, attrs, corpo) => {
    if (tag === 'script' && /\bsrc\s*=/.test(attrs)) return todo;
    if (!corpo || !corpo.trim()) return todo;
    try {
      const r = esbuild.transformSync(corpo, {
        loader: tag === 'script' ? 'js' : 'css',
        minify: true,
        charset: 'utf8',
        // O ALVO É O QUE OS BROWSERS DE HOJE JÁ ENTENDEM. Sem isto o `esbuild` transpila para
        // ES5 e reescreve o código todo — maior e mais lento do que o original.
        target: 'es2020',
      });
      blocos += 1;
      return '<' + tag + attrs + '>' + r.code + '</' + tag + '>';
    } catch (erro) {
      /* Um bloco que não compila como JS isolado (um `type="text/template"`, por exemplo) fica
       * como está. Minificar não é compilar: o que já funcionava tem de continuar a funcionar. */
      return todo;
    }
  });
  return { html: saida, blocos };
}

/**
 * A PASSAGEM FINAL: minificar TODAS as páginas da árvore montada.
 *
 * Corre depois de `percorrer` (que lhes põe a barra de hoje) porque é a última coisa a mexer no
 * ficheiro — minificar antes seria trabalho deitado fora por quem escrevesse a seguir.
 */
function minificarArvore(destino) {
  if (!fs.existsSync(destino)) return { paginas: 0, blocos: 0, antes: 0, depois: 0, semEsbuild: false };
  const conta = { paginas: 0, blocos: 0, antes: 0, depois: 0, semEsbuild: false };
  const percorrer = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const completo = path.join(dir, item.name);
      if (item.isDirectory()) { percorrer(completo); continue; }
      if (!/\.html$/.test(item.name)) continue;
      const html = fs.readFileSync(completo, 'utf8');
      const r = minificarInline(html);
      if (r.semEsbuild) { conta.semEsbuild = true; return; }
      conta.paginas += 1;
      conta.antes += Buffer.byteLength(html, 'utf8');
      if (r.blocos) {
        conta.blocos += r.blocos;
        fs.writeFileSync(completo, r.html, 'utf8');
        conta.depois += Buffer.byteLength(r.html, 'utf8');
      } else {
        conta.depois += Buffer.byteLength(html, 'utf8');
      }
    }
  };
  percorrer(destino);
  return conta;
}

function principal() {
  const iShard = process.argv.indexOf('--shard');
  if (iShard !== -1) return montarShard(String(process.argv[iShard + 1] || '').trim());
  const escola = String(process.argv[2] || '').trim();
  if (!escola || escola.indexOf('-') === 0) {
    console.error('uso: node tools/montar-publicacao.js <escola> [--listar] [--raiz <dir>] [--com-propostas]');
    process.exit(2);
  }
  const soListar = process.argv.indexOf('--listar') !== -1;

  const zero = pacoteZeroDaEscola(escola);
  if (!zero && !soListar) {
    console.error('erro: não há pacote-zero de «' + escola + '» em professores/*/ciclos/ciclo-NN-' + escola);
    console.error('       sem ele não há apresentação, pele nem porta para publicar.');
    process.exit(1);
  }

  const turmas = turmasDaEscola(escola).map((t) => {
    const resumo = resumoDaTurma(t.pasta) || {};
    return Object.assign({}, t, {
      nome: nomeDaTurma(t.pasta, t.variante),
      resumo,
      // O QUE O MENU PRECISA: os documentos que existem e as aulas declaradas.
      documentos: documentosDaTurma(t.pasta),
      aulas: resumo.listaDeAulas || [],
      codigo: 'Benesh',
    });
  }).sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0));

  if (soListar) {
    console.log('escola: ' + escola);
    console.log('pacote-zero: ' + (zero ? zero.pasta.replace(RAIZ + path.sep, '') : '(nenhum)'));
    console.log('turmas: ' + turmas.length);
    for (const t of turmas) console.log('  ' + t.variante + '  →  ' + t.nome);
    /* O QUE A REGRA DEIXOU DE FORA — dito, e não apagado. Derivar para outro professor cria o
     * elo novo na pasta dele e deixa o pacote antigo onde estava; sem esta linha, o professor
     * via um site que podia ser o do antecessor e nada lhe dizia que havia dois. */
    for (const d of achadasDeixadas) {
      console.log('  (de fora) ' + d.nome + ' de ' + d.professor
        + (d.carimbo ? ' — substituído (o vigente é o de carimbo maior)' : ''));
    }
    return;
  }

  const destino = path.join(PUB, escola);
  fs.rmSync(destino, { recursive: true, force: true });
  fs.mkdirSync(destino, { recursive: true });

  // 1. A BASE: a apresentação, a pele e a porta vêm do pacote-zero. O `index.html` dele passa a
  //    `sistema.html` — o índice da raiz é o das turmas, e a apresentação não se perde.
  copiar(path.join(zero.pasta, '.'), destino);
  const apresentacao = path.join(destino, 'index.html');
  if (fs.existsSync(apresentacao)) fs.renameSync(apresentacao, path.join(destino, 'sistema.html'));

  // 2. AS TURMAS: cada pacote inteiro, no seu sítio. Copiado, não ligado — o que está no ar tem
  //    de ser o que o `check-pacote` aprovou, e um link simbólico não sobrevive a um upload.
  for (const t of turmas) copiar(t.pasta, path.join(destino, t.variante), FORA_DA_PUBLICACAO);
  for (const d of achadasDeixadas) {
    console.log('  de fora: ' + d.pasta.replace(RAIZ + path.sep, '') + ' — a variante «'
      + d.variante + '» já é publicada pelo elo vigente');
  }

  // 3. O MENU, COMO DADO. `nav.json` é o contrato entre a montagem (que lê o disco) e a ponte de
  //    produção (que não tem `fs`): a montagem diz o que existe, a ponte desenha em cada página
  //    que serve. É o que faz a barra ser UMA — inclusive nas páginas que já estão geradas e
  //    nunca serão regeradas, que são a maioria.
  const blocos = blocosDoSistema(zero.pasta);
  const menu = menuDaEscola({ turmas, blocos });
  fs.writeFileSync(path.join(destino, 'nav.json'), JSON.stringify(menu, null, 2) + '\n', 'utf8');

  /* 3.1 QUE ESCOLA É ESTE PACOTE (13/11/2026). Um ficheiro de duas linhas, e ele é a única coisa
   * no pacote que responde a «que conteúdo é este?». A ponte de produção confere-o contra a escola
   * que o HOST reivindica: `name` certo com `assets.directory` de outra escola é o deploy trocado
   * que a trava antiga apanhava pela `vars`, e a `vars` deixou de existir.
   *
   * Vai na raiz do pacote (e não dentro de uma turma) porque a pergunta é da ESCOLA, não do ciclo.
   * Fica fora do `nav.json` de propósito: não é navegação, é identidade. */
  fs.writeFileSync(path.join(destino, 'escola.json'),
    JSON.stringify({ escola, gerado_em: new Date().toISOString() }, null, 2) + '\n', 'utf8');

  // 4. O ÍNDICE. A barra vem do MESMO desenho que a ponte usa — não de uma segunda construção,
  //    que voltaria a divergir no dia seguinte. Aqui ela é só o estado estático da página; ao
  //    servir, a ponte reescreve-a a partir do `nav.json`.
  fs.writeFileSync(path.join(destino, 'index.html'), indiceDaEscola({
    escola,
    nome: nomeDaEscola(zero, escola),
    professor: zero ? zero.professor : '',
    turmas,
    nav: navDoMenu(menu, '/'),
  }), 'utf8');

  /* 4.2 AS PÁGINAS DE LISTA (23/10/2026). O menu novo aponta para listas, e uma lista que não
   * existe é a versão educada de um menu que mente. Elas nascem aqui, antes da varredura que
   * reescreve a barra — para já levarem a barra certa de saída, e não só quando o Worker servir.
   *
   * Cada uma é escrita uma vez, a partir do que existe no disco. **E paginam** (21/11/2026): «o
   * ciclo e os planos já nascem com a paginação». Aqui dizia-se o contrário — «não há paginação…
   * quando passar de ~200, a paginação da Produção entra» —, e o número de ~200 nunca foi medido:
   * a lista de aulas do mesmo pacote já paginava a 25. A peça é uma (`.paginas`, da casa), o
   * número é um (25), e o rodapé só aparece a partir de duas páginas — o que mantém a lista curta
   * inteira, sem um rodapé de um botão desactivado. */
  const escrever = (caminho, html) => {
    const alvo = path.join(destino, caminho);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, html, 'utf8');
  };
  const escreverLista = (caminho, titulo, subtitulo, itens, vazio, extras) => escrever(caminho,
    listas.paginaDeLista(Object.assign({
      titulo, subtitulo, itens,
      nav: navDoMenu(menu, caminho.replace(/index\.html$/, ''), titulo),
      vazio,
    }, extras || {})));

  /* 4.2.1 — OS PLANOS DO CICLO. A lista que fixou o padrão, e a primeira a cumpri-lo. */
  const planos = turmas.map((t) => itemDoPlano(t));
  escreverLista('ciclos/planos/index.html', 'Planos do ciclo',
    nomeDaEscola(zero, escola) + ' · '
      + (planos.length === 1 ? '1 plano' : planos.length + ' planos'),
    planos,
    'Ainda não há plano de ciclo nesta escola. Ele nasce quando o Plano de Observação de '
      + 'uma turma é concluído.',
    /* A PAGINAÇÃO NASCE COM A LISTA (21/11/2026). Ela: «o ciclo e os planos já nascem com a
     * paginação». A peça é a da casa — o rodapé `.paginas`, que nasce `hidden` e só aparece a
     * partir de duas páginas —, e o número é o mesmo das outras listas longas deste produto.
     *
     * É a MESMA decisão que o comentário acima (4.2) tomava ao contrário: «não há paginação…
     * quando passar de ~200, a paginação da Produção entra — e não antes». O número de ~200 não
     * estava medido em lado nenhum, e a lista de aulas do mesmo pacote já pagina a 25. Duas
     * listas irmãs com regras diferentes é o defeito; a regra passa a ser uma. */
    { singular: 'plano', plural: 'planos', campos: ['busca'], porPagina: 25 });

  /* A LISTA DE AULAS reúne a leitura em prosa e a outra vista da Aula 01. O título abre a aula;
     a leitura em notação é um botão do CABEÇALHO da aula (28/10/2026), não uma ação desta lista.
     Lançamento, captura e PDF continuam na mesma linha.
   *
   * As antigas listas independentes de Notação e Consulta deixam de ser geradas: a notação é
   * acessada pela aula correspondente, e o glossário pelo cabeçalho persistente da Notação.
   * A LISTA DE REFERÊNCIAS NÃO NASCE MAIS (26/10/2026): o documento abre pelo cartão do plano ou
   * pelo próprio plano, sem uma listagem intermediária por turma.
   *
   * A LISTA DE AULAS É A QUE PAGA (23/10/2026): o `.conf` de cada turma declara dezoito aulas, e
     três turmas dão 54 linhas — a primeira lista a passar do que cabe numa tela. Ela pagina pela
     peça da Produção, e o filtro dela não tem professor: uma aula não tem professor no cartão,
     quem o tem é a turma, e a turma já está no filtro. */
  escreverLista('aulas/index.html', 'Aulas', 'A aula dada e a folha que a acompanha',
    turmas.flatMap((t) => (t.aulas || []).map((a) => itemDaAula(t, a, Number(a.n), t.aulas.length))
      .filter((i) => i.ler || i.acoes.length)),
    'Ainda não há aula publicada nesta escola.', {
      campos: ['busca', 'turma'], singular: 'aula', plural: 'aulas', porPagina: 25,
      dica: 'pelo número, pelo marco ou pela turma',
    });

  /* AS TRÊS LISTAS DA ÁREA DO PROFESSOR NÃO SÃO MONTADAS AQUI (24/10/2026).
   *
   * Elas listavam TURMAS — uma linha por turma, e as três páginas iguais. Mas o que a listagem
   * tem de dizer é «a anamnese de quem, feita por quem, quando», e isso não está no disco: está
   * no ACERVO, no KV da escola, e muda a cada ato registado. Uma página montada no deploy
   * mostraria o acervo do dia do deploy.
   *
   * Elas passaram a ser SERVIDAS PELA PONTE (`motor/servidor/producao.js`), que lê o índice de
   * envelopes e desenha a mesma lista. O que fica aqui é só o que a montagem ainda pode dizer: o
   * menu aponta para as três, e as três existem porque a ponte as serve.
   */

  // A APRESENTAÇÃO TAMBÉM. Ela nasce do `index.html` do pacote-zero, com a barra de lá — a básica,
  // de antes de haver ciclo. Servida ao lado da raiz com outra barra, seria a segunda barra que
  // esta função existe para eliminar.
  const apresentacaoAlvo = path.join(destino, 'sistema.html');
  if (fs.existsSync(apresentacaoAlvo)) {
    const html = fs.readFileSync(apresentacaoAlvo, 'utf8');
    /* A APRESENTAÇÃO NÃO SE RECOLHE POR PARTES (23/11/2026). «No endereço breu.padd.com.br/sistema
     * você também colocou botão de colapsar e expandir em todos os títulos. Tira, não precisa disso
     * aqui.» Ela é a MESMA peça da campanha — um texto que se lê de cima abaixo —, e o `nav.js` a
     * exclui pelo nome (`TELAS_SEM_DOBRA.sistema`). O nome tem de ir no `<body>`, e é aqui que ele
     * entra: no pacote-zero essa página é o `index.html`, e um `data-tela` lá seria o da escola. */
    const comTela = html.replace(/<body([^>]*)>/, (todo, atributos) => (/data-tela=/.test(atributos)
      ? todo : '<body' + atributos + ' data-tela="sistema">'));
    const trocado = nav.enquadrar(comTela, menu, '/sistema');
    if (trocado && trocado !== comTela) fs.writeFileSync(apresentacaoAlvo, trocado, 'utf8');
    else if (comTela !== html) fs.writeFileSync(apresentacaoAlvo, comTela, 'utf8');
  }

  /* A PORTA TAMBÉM NASCE ENQUADRADA (05/11/2026), e não só ao servir.
   *
   * Ela vinha do pacote-zero com o marcador `<!-- NAV -->` — que a GERAÇÃO substitui, mas que a
   * cópia não. O resultado medido ao vivo: `/anamnese/` servida com o marcador cru, sem barra e
   * sem coluna, enquanto a listagem ao lado tinha as duas. A ponte passou a enquadrar toda
   * resposta, e isso já cobre o que está no ar hoje; escrever também aqui faz o ARTEFACTO estar
   * completo por si — quem o abrir do disco, ou o servir um CDN sem Worker, vê a mesma moldura.
   *
   * É `enquadrar`, e não `aplicar`, porque a porta não tem `<nav>`: tem o marcador. */
  const portaPublicada = path.join(destino, 'plano-observacao', 'index.html');
  if (fs.existsSync(portaPublicada)) {
    const html = fs.readFileSync(portaPublicada, 'utf8');
    const trocado = nav.enquadrar(html, menu, '/plano-observacao/');
    if (trocado && trocado !== html) fs.writeFileSync(portaPublicada, trocado, 'utf8');
  }

  /*
   * 4.1 AS PROPOSTAS DE LAYOUT, QUANDO PEDIDAS (21/10/2026).
   *
   * MOTIVO DECLARADO (`tools/` é congelado). A decisão sobre o título que não se perde e sobre a
   * paginação no celular SÓ se pode tomar num telemóvel: as duas mudam de comportamento com a
   * largura, e é no telemóvel que a escolha é difícil. As bancadas viviam em `experimentos/`, que
   * não é publicado — e uma proposta que só abre no computador de quem a escreveu não é uma
   * proposta, é um ficheiro. A primeira versão foi exactamente isso, e a resposta foi «não estão
   * operáveis».
   *
   * O QUE NÃO MUDA: a fórmula do hash, a cobertura da âncora, os validadores, as regras e as
   * pétreas. Nada disto toca em conteúdo de ciclo. As propostas vivem em `publicacao/<escola>/
   * propostas/` e NÃO entram no `nav.json` — não são um documento da escola, e o menu não as
   * anuncia. Quem as quiser abre o endereço.
   *
   * É TEMPORÁRIO, e é explícito: sem `--com-propostas` esta pasta não é escrita, e a próxima
   * montagem normal apaga-a. Depois de a escolha estar feita, as bancadas saem do repositório.
   */
  const propostas = process.argv.indexOf('--com-propostas') !== -1;
  if (propostas) {
    const origem = path.join(RAIZ, 'experimentos', 'propostas');
    const arquivos = fs.existsSync(origem)
      ? fs.readdirSync(origem).filter((f) => /\.html$/.test(f))
      : [];
    if (!arquivos.length) {
      console.error('aviso: --com-propostas pedido sem propostas montadas.');
      console.error('       corra antes: node experimentos/propostas/construir.js');
    } else {
      const alvo = path.join(destino, 'propostas');
      fs.mkdirSync(alvo, { recursive: true });
      for (const arquivo of arquivos) {
        fs.copyFileSync(path.join(origem, arquivo), path.join(alvo, arquivo));
      }
      console.log('  propostas: ' + arquivos.length + ' página(s) em /propostas/');
    }
  }

  // 5. AS PÁGINAS DO PACOTE E DA PORTA — também já escritas com a barra do dia em que nasceram.
  //    Aqui ficam com a barra de HOJE, e a ponte volta a reescrevê-la ao servir (é o que cobre as
  //    que venham a ser geradas depois). Sem este passo, quem abre o site num sítio estático ou
  //    sem o Worker veria a barra velha; com ele, o arquivo publicado já diz a verdade.
  let reescritas = 0;
  const percorrer = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const completo = path.join(dir, item.name);
      if (item.isDirectory()) { percorrer(completo); continue; }
      if (!/\.html$/.test(item.name)) continue;
      const rel = '/' + path.relative(destino, completo).split(path.sep).join('/');
      const html = fs.readFileSync(completo, 'utf8');
      /* `nav.aplicar` E NÃO UM `replace` À MÃO (23/10/2026). Ele faz três coisas que um
       * `replace` não faz: tira a COLUNA que a página já trazia (senão cada passagem deixava
       * uma ao lado da outra), lê o TÍTULO do `<h1>` para o caminho da barra, e devolve `null`
       * quando não há barra — em vez de estragar a página. */
      const trocado = nav.aplicar(html, menu, rel);
      if (trocado && trocado !== html) { fs.writeFileSync(completo, trocado, 'utf8'); reescritas += 1; }
    }
  };
  percorrer(destino);

  /* A MINIFICAÇÃO, DEPOIS DA BARRA (24/11/2026) — é a última coisa a mexer nos ficheiros. Ver
   * `minificarArvore`: os `<script>` inline e os `<style>`, nunca as fontes nem os `assets/`. */
  const minificado = minificarArvore(destino);
  if (minificado.semEsbuild) {
    console.log('  AVISO: `esbuild` não está instalado — as páginas sobem SEM minificação.');
  } else if (minificado.blocos) {
    console.log('  minificado: ' + minificado.blocos + ' bloco(s) inline em ' + minificado.paginas
      + ' página(s) — ' + (minificado.antes / 1024).toFixed(0) + ' KB → '
      + (minificado.depois / 1024).toFixed(0) + ' KB');
  }

  /* A CÓPIA PARTILHADA, ao fim e não ao princípio: só depois de a escola estar montada é que se
   * sabe se a folha dela coincide com a que já lá está. */
  const partilhados = garantirAssetsPartilhados(destino, escola);

  console.log('publicação montada: publicacao/' + escola);
  console.log('  apresentação: sistema.html');
  console.log('  porta: plano-observacao/');
  console.log('  turmas: ' + (turmas.length ? turmas.map((t) => t.variante).join(', ') : '(nenhuma — o índice diz isso)'));
  console.log('  assets.directory do Worker: publicacao/' + escola);
  if (partilhados) {
    console.log('  /assets/ partilhado: publicacao/assets (' + partilhados.estado + ')');
  }
}

/* SÓ CORRE QUANDO É CHAMADO (23/10/2026). Era `principal();` no topo, e por isso um `require`
 * desta montagem publicava uma escola inteira — o que impediria qualquer prova de medir uma
 * função dela sem efeito colateral. O `require.main === module` mantém a linha de comando
 * igual (`node tools/montar-publicacao.js <escola>`) e permite a `provar-barra-e-caminho`
 * perguntar a `documentosDaTurma` o que ele devolve, que é onde o `/variante/true` nasceu. */
if (require.main === module) principal();

module.exports = {
  /* A MINIFICAÇÃO, exportada para a prova (24/11/2026): ela mede o que se ganha e o que NÃO se
   * toca, e uma prova que reconstruísse a passagem mediria a prova. */
  minificarInline, minificarArvore,
  documentosDaTurma, dadosDoPlano, itemDoPlano, menuDaEscola,
  /* A LISTA DAS ESCOLAS DE UM SHARD, exportada para a prova (15/11/2026): é ela que decide o que
   * uma publicação de shard sobe, e o erro dela (uma árvore vazia) apaga N escolas de uma vez. */
  escolasDoShard,
};
