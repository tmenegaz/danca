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
function turmasDaEscola(escola) {
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
  return achadas;
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
<body id="top">

${nav}

<header class="doc">
  <h1>Sistema Lastro</h1>
  <p class="subtitulo">${esc(professor ? 'Professor ' + professor : '')}</p>
</header>

<main>
<div class="conteudo">
<h2 id="turmas">As turmas desta escola</h2>
<p>Cada turma tem o seu ciclo: o plano de ensino, as aulas, a notação e as referências. O que se
planeja para uma não vale para a outra — o ritmo é de cada uma, e é dele que sai o calendário.</p>
${lista}
<p class="subtitulo">O que é o Sistema Lastro, como se usa e o que ele ajuda a resolver:
<a href="sistema.html">a apresentação do sistema</a>.</p>
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
  if (turmas.length) {
    const itensDaArea = [
      { rotulo: 'Anamnese do aluno', href: AREA_DO_PROFESSOR.anamnese },
      { rotulo: 'Plano de ensino', href: AREA_DO_PROFESSOR.plano },
      { rotulo: 'Plano de Observação', href: AREA_DO_PROFESSOR.po },
      /* «AULAS», E NÃO «LANÇAMENTO DE AULA» (24/10/2026). O item abre a LISTA das aulas — as
         mesmas que a captura para impressão e o lançamento servem, uma linha de cada vez. O
         nome antigo prometia um formulário e entregava uma lista; e, com o destino do topo da
         coluna removido, «Aulas» é também o nome que diz onde as aulas estão. O formulário
         `lancamento.html` continua a chamar-se «Lançamento de aula — formulário eletrônico»:
         ele é o documento, e o documento diz o que é. */
      { rotulo: 'Aulas', href: '/aulas/' },
    ];
    coluna.push({ tipo: 'menu', rotulo: 'Área do Professor', itens: itensDaArea });
  }

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
    // Sem pacote-zero não há bloco de onde extrair; os dois destinos são fixos no sistema.
    barra.push({ tipo: 'menu', rotulo: 'Bastidores', itens: [
      { rotulo: 'Estúdio de Dança', href: '/bastidores/estudio' },
      { rotulo: 'Produção', href: '/bastidores/producao' },
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
          'Modalidade e tradição são decididas na curadoria, com o professor.') },
      { rotulo: 'Professor', valor: p.professor,
        painel: listas.painelDoCartao([
          ['Professor curado', p.professor], ['Turma', p.turma]],
          'É a curadoria que liga professor e turma. Sem ela, este plano não existe.') },
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
  return {
    nome: 'Aula ' + a.n + (a.marco ? ' — ' + a.marco : ''),
    ler,
    lerDica: 'abrir a versão em prosa da aula',
    acoes,
    contexto: 'Ciclo ' + p.ciclo + ' · aula ' + Number(a.n) + ' de ' + total,
    turma: p.turma,
    professor: p.professor,
    caixas: [
      { rotulo: 'Turma', valor: p.turmaCurta,
        painel: listas.painelDoCartao([
          ['Turma', p.turma], ['Ciclo', p.ciclo], ['Aula', Number(a.n) + ' de ' + total]]) },
      { rotulo: 'Professor', valor: p.professor,
        painel: listas.painelDoCartao([['Professor da turma', p.professor]],
          'A aula não tem professor próprio: quem o tem é a turma, e é a curadoria que a liga.') },
      { rotulo: 'Horário', valor: quando || '—',
        painel: listas.painelDoCartao([
          ['Dia', data(a.data) || '—'],
          ['Começa às', a.inicio || '—'],
          ['Termina às', a.fim || '—'],
          ['Duração', duracao || '—'],
          ['Sala', 'não declarada']],
          'A sala entra no modelo com o PLANO-TABELA-DE-ATIVIDADES. Até lá, a listagem diz que '
          + 'não a tem — não inventa um sítio.') },
    ],
  };
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

function principal() {
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

  // 3. O MENU, COMO DADO. `nav.json` é o contrato entre a montagem (que lê o disco) e a ponte de
  //    produção (que não tem `fs`): a montagem diz o que existe, a ponte desenha em cada página
  //    que serve. É o que faz a barra ser UMA — inclusive nas páginas que já estão geradas e
  //    nunca serão regeradas, que são a maioria.
  const blocos = blocosDoSistema(zero.pasta);
  const menu = menuDaEscola({ turmas, blocos });
  fs.writeFileSync(path.join(destino, 'nav.json'), JSON.stringify(menu, null, 2) + '\n', 'utf8');

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
   * Cada uma é escrita uma vez, a partir do que existe no disco. Não há paginação: uma escola
   * com três turmas e dezoito aulas dá 54 linhas, e o filtro do cliente resolve isso. Quando
   * passar de ~200, a paginação da Produção entra — e não antes. */
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
    { singular: 'plano', plural: 'planos' });

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
    const trocado = nav.aplicar(html, menu, '/sistema');
    if (trocado && trocado !== html) fs.writeFileSync(apresentacaoAlvo, trocado, 'utf8');
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

  console.log('publicação montada: publicacao/' + escola);
  console.log('  apresentação: sistema.html');
  console.log('  porta: plano-observacao/');
  console.log('  turmas: ' + (turmas.length ? turmas.map((t) => t.variante).join(', ') : '(nenhuma — o índice diz isso)'));
  console.log('  assets.directory do Worker: publicacao/' + escola);
}

/* SÓ CORRE QUANDO É CHAMADO (23/10/2026). Era `principal();` no topo, e por isso um `require`
 * desta montagem publicava uma escola inteira — o que impediria qualquer prova de medir uma
 * função dela sem efeito colateral. O `require.main === module` mantém a linha de comando
 * igual (`node tools/montar-publicacao.js <escola>`) e permite a `provar-barra-e-caminho`
 * perguntar a `documentosDaTurma` o que ele devolve, que é onde o `/variante/true` nasceu. */
if (require.main === module) principal();

module.exports = { documentosDaTurma, dadosDoPlano, menuDaEscola };
