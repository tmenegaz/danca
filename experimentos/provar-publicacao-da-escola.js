'use strict';

/*
 * provar-publicacao-da-escola.js — o site da escola mostra as TURMAS, não o esqueleto.
 *
 * O DEFEITO (20/10/2026, terceira escola). O `assets.directory` do Worker apontava o pacote-zero
 * — a apresentação do sistema, que não tem `DOCS`. O resultado, medido no calango: o Plano de
 * Observação foi concluído, o pacote foi gerado, e o menu do site continuava sem Ciclo nem Aulas.
 * A correcção das duas escolas anteriores foi apontar a config ao pacote da turma; esta não serve
 * ao calango, que tem TRÊS turmas e um Worker só com um `assets.directory`.
 *
 * O QUE MUDOU. `publicacao/<escola>/` é montado a partir das partes:
 *
 *   index.html         ← o índice das turmas (gerado)
 *   sistema.html       ← a apresentação (o `index.html` do pacote-zero)
 *   assets/            ← a pele, do pacote-zero
 *   plano-observacao/  ← a Porta, do pacote-zero
 *   <variante>/        ← cada pacote de turma, inteiro
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   A. A MONTAGEM. A pasta fica com as quatro partes e com um subdirectório por turma — cada um
 *      com o ciclo e as aulas que o pacote trazia.
 *   B. O ÍNDICE. Lista TODAS as turmas, com o nome que a escola lhes deu (não o slug), e todos os
 *      links dele apontam para um arquivo que existe. Um índice com link morto é um site que
 *      parece quebrado sem estar.
 *   C. A IDEMPOTÊNCIA E O FANTASMA. Montar duas vezes dá o mesmo índice; e a turma cujo pacote
 *      desapareceu sai do índice e do disco. É o que separa «montado» de «acumulado».
 *   D. A LIGAÇÃO. O `wrangler.<escola>.jsonc` aponta a publicação (e não o pacote-zero), o
 *      `.gitignore` ignora-a (é saída, não se versiona), e os dois sítios que fazem deploy — o
 *      workflow `gerar-ciclo` e o `criar-escola.sh` — montam ANTES de subir. Uma pasta que não
 *      existe faz o `wrangler deploy` falhar; é essa a falha que a montagem evita.
 *
 * ÁRVORE DE PROVA: um pacote-zero e dois pacotes de turma de mentira, num directório temporário
 * (`--raiz`). Nada é montado sobre os pacotes a sério.
 *
 *   node experimentos/provar-publicacao-da-escola.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const FERRAMENTA = path.join(RAIZ, 'tools', 'montar-publicacao.js');

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'prova-escola';
const PROF = 'prova-professor';

/** Escreve um arquivo, criando as pastas. */
function escrever(base, rel, texto) {
  const alvo = path.join(base, rel);
  fs.mkdirSync(path.dirname(alvo), { recursive: true });
  fs.writeFileSync(alvo, texto, 'utf8');
}

/**
 * A ÁRVORE DE PROVA. O pacote-zero traz o que a montagem copia — a apresentação com o `<nav>`, a
 * pele e a porta. Cada turma traz o que o índice lê: o `.conf` (o `NOME`), o `ciclos.json` (o
 * ritmo) e as páginas que os links apontam.
 */
function arvore() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'publicacao-'));
  const ciclos = path.join('professores', PROF, 'ciclos');

  // O pacote-zero.
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA, 'index.html'),
    '<!DOCTYPE html><html><body>\n' +
    '<nav class="topnav" aria-label="Navegação do ciclo">\n' +
    '  <a class="ativo" href="index.html">Sistema Lastro</a>\n' +
    // OS DOIS BLOCOS DO SISTEMA. A barra da raiz COPIA-OS daqui em vez de os reconstruir: as
    // URLs deles carregam professor, escola e ciclo, e reescrevê-las seria uma segunda
    // derivação dos mesmos parâmetros. O fixture tem de os ter, ou a cópia não é exercida.
    '  <details class="menu">\n    <summary>Área do Professor</summary>\n    <div class="submenu">\n' +
    '      <a href="anamnese/?professor=prova&escola=' + ESCOLA + '&ciclo=01">Anamnese do aluno</a>\n' +
    '    </div>\n  </details>\n' +
    '  <details class="menu">\n    <summary>Bastidores</summary>\n    <div class="submenu">\n' +
    '      <a href="bastidores/producao">Produção</a>\n' +
    '    </div>\n  </details>\n' +
    '</nav>\n<main><h1>Sistema Lastro</h1></main></body></html>\n');
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA, 'assets', 'style.css'), 'body{}\n');
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA, 'assets', 'nav.js'), '// nav\n');
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA, 'assets', 'favicon.svg'), '<svg/>\n');
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA, 'plano-observacao', 'index.html'), '<!DOCTYPE html><html></html>\n');
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA + '.conf'), 'ESCOLA="Prova Escola"\n');

  const turma = (variante, nome, inicio, total) => {
    const pacote = path.join(ciclos, 'ciclo-01-' + ESCOLA + '-' + variante);
    escrever(raiz, path.join(pacote, 'index.html'), '<!DOCTYPE html><html><title>' + nome + '</title></html>\n');
    for (const pagina of ['plano', 'aula-01', 'notacao', 'referencias']) {
      escrever(raiz, path.join(pacote, pagina + '.html'), '<!DOCTYPE html><html></html>\n');
    }
    escrever(raiz, path.join(pacote, 'ciclo-01-' + ESCOLA + '-' + variante + '.pdf'), '%PDF ciclo\n');
    escrever(raiz, path.join(pacote, 'aula-01.pdf'), '%PDF aula\n');
    escrever(raiz, path.join(pacote, 'ciclos.json'), JSON.stringify({
      ciclos: [{
        id: '01', escola: 'Prova Escola', inicio, fim: '2026-12-17',
        total_aulas: total, duracao_min: 60,
        aulas: Array.from({ length: total }, (_, i) => ({ n: String(i + 1).padStart(2, '0'), lancada: i === 0 })),
      }],
    }, null, 2) + '\n');
    escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA + '-' + variante + '.conf'),
      'NOME="Ciclo 01 — Prova Escola · ' + nome + '"\n');
  };
  turma('nivel-1', 'Balé Nível 1', '2026-10-20', 18);
  turma('nivel-2', 'Balé Nível 2', '2026-10-21', 12);
  return raiz;
}

function montar(raiz) {
  return execFileSync(process.execPath, [FERRAMENTA, ESCOLA, '--raiz', raiz], { encoding: 'utf8' });
}

const ler = (base, rel) => fs.readFileSync(path.join(base, rel), 'utf8');
const existe = (base, rel) => fs.existsSync(path.join(base, rel));

function principal() {
  const raiz = arvore();
  const pub = path.join(raiz, 'publicacao', ESCOLA);

  // ------------------------------------------------------------------ A
  console.log('\nA. a montagem junta as partes');
  {
    montar(raiz);
    checar('o índice da escola existe', existe(pub, 'index.html'));
    checar('a apresentação continua acessível, em `sistema.html`', existe(pub, 'sistema.html'));
    checar('a pele vem do pacote-zero', existe(pub, 'assets/style.css') && existe(pub, 'assets/nav.js'));
    checar('a Porta vem do pacote-zero', existe(pub, 'plano-observacao/index.html'));
    checar('cada turma tem o seu subdirectório, inteiro',
      existe(pub, 'nivel-1/index.html') && existe(pub, 'nivel-1/aula-01.html')
        && existe(pub, 'nivel-2/index.html') && existe(pub, 'nivel-2/plano.html'));
    checar('as listas independentes de Notação e Consulta não são publicadas',
      !existe(pub, 'area-do-professor/notacao/index.html') && !existe(pub, 'consulta/index.html'));
    checar('e o `ciclos.json` de cada uma veio junto (é o que a página de lançamento lê)',
      existe(pub, 'nivel-1/ciclos.json') && existe(pub, 'nivel-2/ciclos.json'));
    // A apresentação NÃO pode continuar a ser o índice da raiz: quem abre `/` vê as turmas.
    checar('o índice da raiz não é a apresentação (são duas páginas, não uma renomeada)',
      ler(pub, 'index.html') !== ler(pub, 'sistema.html')
        && ler(pub, 'index.html').indexOf('As turmas desta escola') !== -1
        && ler(pub, 'sistema.html').indexOf('As turmas desta escola') === -1);
  }

  // ------------------------------------------------------------------ B
  console.log('\nB. o índice lista as turmas, com o nome delas e sem link morto');
  {
    const indice = ler(pub, 'index.html');
    checar('a turma 1 aparece com o NOME que a escola deu', indice.indexOf('Balé Nível 1') !== -1);
    checar('a turma 2 também', indice.indexOf('Balé Nível 2') !== -1);
    checar('e o slug não é o rótulo (o nome humano venceu)',
      indice.indexOf('>nivel-1<') === -1 && indice.indexOf('>nivel-2<') === -1);
    checar('o ritmo de cada turma vem do `ciclos.json` (18 e 12 aulas)',
      indice.indexOf('18 aulas') !== -1 && indice.indexOf('12 aulas') !== -1);
    checar('e a data de início é a da turma, não a de hoje',
      indice.indexOf('20/10/2026') !== -1 && indice.indexOf('21/10/2026') !== -1);

    // O LINK MORTO é o defeito clássico de uma página montada à mão: aponta para o que devia
    // existir. Aqui todos os `href` relativos do índice têm de existir no disco.
    //
    // `anamnese/`, `plano-ensino/` e `plano-observacao/` são ROTAS da porta — o Worker as serve do
    // mesmo ASSETS, mas elas não são um arquivo com esse nome. O que se exige delas é que a pasta
    // da porta exista publicada; é o que a secção A já mede.
    // `bastidores/` também: é rota do Worker (o painel), não um arquivo do pacote.
    //
    // DESDE 20/10/2026 OS HREF DA BARRA SÃO ABSOLUTOS (`/turma/plano.html`): é o que faz a mesma
    // barra valer dentro do pacote e na porta. Aqui isso muda a MEDIÇÃO, não a exigência: o que
    // se confere é o caminho, com ou sem a barra inicial.
    /* `/area-do-professor/` ENTRA NA LISTA (26/10/2026). As três listas da Área do Professor são
       SERVIDAS pela ponte (leem o acervo no KV), não são arquivos do pacote — como as rotas da
       porta e os Bastidores. Desde 26/10 é para lá que o rodapé aponta, e uma asserção que as
       tratasse como arquivo reprovaria a correção em nome do defeito. */
    const ROTAS_DO_WORKER = /^\/?(anamnese|plano-ensino|plano-observacao|area-do-professor|bastidores)\//;
    const hrefs = [...indice.matchAll(/href="([^"#?]+)"/g)]
      .map((m) => m[1])
      .filter((h) => !/^(https?:|mailto:)/.test(h))
      .filter((h) => !ROTAS_DO_WORKER.test(h));
    const mortos = hrefs.filter((h) => !existe(pub, h));
    checar('nenhum link do índice aponta para o vazio', mortos.length === 0, mortos);
    checar('e o índice aponta à apresentação, que existe',
      hrefs.some((h) => /^\/?sistema\.html$/.test(h)), hrefs);
    checar('o menu não anuncia rotas independentes de Notação ou Consulta',
      !/href="\/(?:area-do-professor\/notacao|consulta)\//.test(indice),
      (indice.match(/href="\/(?:area-do-professor\/notacao|consulta)[^"]*"/g) || []));

    /* NENHUM CAMINHO FORA DA ÁREA DO PROFESSOR (26/10/2026).
     *
     * O rodapé do índice levava a `/anamnese/`, `/plano-ensino/` e `/plano-observacao/` — as
     * ROTAS DA PORTA, que só fazem sentido COM o contexto do ato. Quem clicava caía numa página
     * que abria e se descartava: «esses links me levam para essa URL que está fora da área do
     * professor». O destino passa a ser a LISTA de cada fonte, que é onde se escolhe o ato.
     *
     * A asserção é sobre o ENDEREÇO, e não sobre o rótulo: é o `href` que a pessoa segue. */
    /* SÓ O RODAPÉ. Os mesmos três rótulos estão no menu da coluna — e é justamente o fato de
       estarem nos dois sítios que fez os endereços divergirem. Medir o documento inteiro contaria
       seis, e não diria de onde vem cada um. */
    const rodape = (/<footer class="rodape">[\s\S]*?<\/footer>/.exec(indice) || [''])[0];
    const doRodape = [...rodape.matchAll(/<a href="([^"]+)">(Anamnese do aluno|Plano de ensino|Plano de Observação)<\/a>/g)]
      .map((m) => ({ href: m[1], rotulo: m[2] }));
    checar('o rodapé tem os três destinos da Área do Professor', doRodape.length === 3, doRodape);
    checar('…e os três apontam para a LISTA, dentro de `/area-do-professor/`',
      doRodape.every((d) => d.href.indexOf('/area-do-professor/') === 0), doRodape);
    checar('…nenhum deles é uma rota da porta',
      !/<a href="\/?(anamnese|plano-ensino|plano-observacao)\//.test(indice),
      (indice.match(/<a href="\/?(anamnese|plano-ensino|plano-observacao)[^"]*"/g) || []));

    /* O «CICLO» DO CARTÃO (26/10/2026). Ele apontava para `<variante>/index.html`, que no pacote
     * é a APRESENTAÇÃO do sistema — a mesma página de `/sistema.html`. O nome da turma ia para o
     * mesmo sítio. Os dois passam a abrir o documento do ciclo (`plano.html`), e o item «Ciclo»
     * sai: não existe página própria do ciclo, e um link que promete o ciclo e entrega a
     * apresentação é o defeito que a pesquisadora viu. */
    checar('o nome da turma abre o documento do ciclo (`plano.html`)',
      indice.indexOf('<a href="nivel-1/plano.html"><strong>Balé Nível 1</strong></a>') !== -1,
      (indice.match(/<a href="[^"]+"><strong>[^<]+<\/strong><\/a>/g) || []));
    checar('…e nenhum link do índice leva ao `index.html` de um pacote (a apresentação)',
      !/href="[^"]*\/index\.html"/.test(indice),
      (indice.match(/href="[^"]*\/index\.html"/g) || []));
    checar('o item «Ciclo» saiu do cartão, e com ele o «Plano» que repetia o mesmo destino',
      !/>Ciclo<\/a>/.test(indice) && !/>Plano<\/a>/.test(indice),
      (indice.match(/>[^<]*Ciclo[^<]*<\/a>/g) || []));
    checar('…e as três outras páginas do ciclo continuam à mão',
      ['aula-01', 'notacao', 'referencias'].every((p) => indice.indexOf('nivel-1/' + p + '.html') !== -1));
  }

  // ------------------------------------------------------------------ B2
  console.log('\nB2. UMA barra por domínio — e é a completa quando há ciclo');
  {
    /*
     * DUAS BARRAS NO MESMO DOMÍNIO É O MESMO QUE NENHUMA (20/10/2026).
     *
     * A raiz do site servia «Sistema Lastro · Área do Professor · Bastidores»; o pacote da turma
     * servia «Sistema Lastro · Ciclos · Aulas · Planejamento · Área do Professor · PDF». Quem
     * gerava o ciclo via os documentos no pacote e não os encontrava na raiz — e a raiz é o
     * endereço que a logo abre. Não se sabe onde se está nem o que já existe.
     *
     * A barra é DINÂMICA: sem turma gerada é a básica (a escola ainda não tem ciclo, e anunciar
     * documentos que não existem seria pior do que não os anunciar); com turma, entram os três
     * grupos com os documentos dela.
     */
    const navDe = (arquivo) => {
      const html = ler(pub, arquivo);
      const m = /<nav class="topnav"[\s\S]*?<\/nav>/.exec(html);
      return m ? m[0] : '';
    };
    const indice = navDe('index.html');
    const apresentacao = navDe('sistema.html');

    checar('a raiz e a apresentação têm a MESMA barra (só muda o item marcado)',
      indice.replace(/ class="ativo"/, '') === apresentacao.replace(/ class="ativo"/, ''),
      { indice: indice.length, apresentacao: apresentacao.length });

    /* O MENU DE DESTINOS (24/10/2026). Estas quatro asserções procuravam `<summary>Ciclos</summary>`
       e `<summary>Planejamento</summary>` — a forma da barra ANTERIOR. O menu passou a ser a COLUNA
       (`coluna-grupo` com um `button` de título), «Planejamento» deixou de existir, e «Aulas» foi
       para dentro da Área do Professor. A prova descrevia um menu que já não havia, e por isso
       reprovava o presente em nome do passado. O que se guarda agora é a forma que existe. */
    const coluna = (/<aside class="coluna[\s\S]*?<\/aside>/.exec(ler(pub, 'index.html')) || [''])[0];
    checar('com ciclo gerado, a coluna tem o grupo «Ciclos»', coluna.indexOf('<span>Ciclos</span>') !== -1);
    checar('…e o grupo «Área do Professor», com «Aulas» dentro', 
      coluna.indexOf('<span>Área do Professor</span>') !== -1 && coluna.indexOf('href="/aulas/"') !== -1);
    checar('…e os «Bastidores» continuam, no fim da coluna',
      coluna.indexOf('<span>Bastidores</span>') !== -1);
    checar('…e «Planejamento» NÃO voltou (o grupo foi extinto em 24/10/2026)',
      coluna.indexOf('Planejamento') === -1);
    checar('…e Notação e Consulta não viraram destinos da coluna',
      !/Notação|Consulta/.test(coluna), coluna);
    checar('a coluna não enumera turma nenhuma — ela é de DESTINOS, não de documentos',
      !/Balé Nível|nivel-1|nivel-2/.test(coluna), coluna.length);

    const listaAulas = ler(pub, 'aulas/index.html');
    /* O NOME DO DOCUMENTO DA AULA (04/11/2026): «Aula 01» passou a «Plano para a Aula 01 — …».
     * A asserção continua a medir o mesmo — o nome abre a leitura em prosa numa nova aba —, e
     * passa a exigir o nome novo: o cartão e a página dizem o mesmo. */
    checar('o nome da Aula 01 abre sua leitura em prosa numa nova aba',
      /<a href="\/nivel-1\/aula-01\.html" target="_blank" rel="noopener" title="abrir a versão em prosa da aula">Plano para a Aula 01/.test(listaAulas),
      (listaAulas.match(/<a[^>]+>Aula 01[^<]*<\/a>/g) || []));
    /* «ABRIR NOTAÇÃO» SAIU DA LISTA (28/10/2026): é botão do cabeçalho da AULA. A lista abre o
     * documento; a leitura em notação procura-se lá dentro, onde o professor já sabe o que está
     * a ler. A prova passou a exigir o contrário do que exigia: o rótulo NÃO aparece aqui. */
    checar('«Abrir notação» não é ação da lista de aulas',
      !/Abrir notação/.test(listaAulas),
      (listaAulas.match(/<a[^>]+>Abrir notação<\/a>/g) || []));
    checar('a Aula 01 oferece o PDF individual da aula',
      /href="\/nivel-1\/aula-01\.pdf"[^>]*>PDF da aula<\/a>/.test(listaAulas),
      (listaAulas.match(/<a[^>]+>PDF da aula<\/a>/g) || []));

    const listaPlanos = ler(pub, 'ciclos/planos/index.html');
    checar('o nome do ciclo abre o plano em vez de um botão separado',
      /<a href="\/nivel-1\/plano\.html" target="_blank" rel="noopener" title="abrir o plano do ciclo">Ciclo 01 — Prova Escola · Balé Nível 1<\/a>/.test(listaPlanos)
        && !/Abrir o plano/.test(listaPlanos), listaPlanos);
    checar('a lista de Planos mantém Referências e o PDF do ciclo',
      /Referências/.test(listaPlanos)
        && /href="\/nivel-1\/ciclo-01-prova-escola-nivel-1\.pdf"[^>]*>PDF do ciclo<\/a>/.test(listaPlanos),
      (listaPlanos.match(/<a[^>]+>(?:Referências|PDF do ciclo)<\/a>/g) || []));

    // TODOS os links da barra resolvem — nenhum aponta para o que não foi publicado. Os href da
    // barra são ABSOLUTOS (a mesma barra serve o pacote e a porta), e as rotas da porta não são
    // arquivos: confere-se o caminho, com ou sem a barra inicial.
    const externo = /^(https?:|mailto:|#)/;
    const rota = /^\/?(anamnese|plano-ensino|plano-observacao|area-do-professor|bastidores)\//;
    /* A PÁGINA INTEIRA, e não só a `<nav class="topnav">` (26/10/2026). A coluna é um `<aside>`
       FORA da barra, e desde 24/10 é ela que carrega os destinos; medir só a barra deixava os
       links da coluna de fora e a asserção «aponta às listas» perguntava a um elemento que já
       não os tinha. */
    const paginaDoIndice = ler(pub, 'index.html');
    const links = [...paginaDoIndice.matchAll(/<a[^>]+href="([^"#?]+)"/g)].map((m) => m[1])
      .filter((h) => !externo.test(h) && !rota.test(h));
    const mortos = links.filter((h) => !existe(pub, h));
    checar('nenhum link da barra aponta para o vazio', mortos.length === 0, mortos);
    /* O MENU NÃO APONTA DOCUMENTOS DESDE 24/10/2026 — aponta as LISTAS que os nomeiam. Era a
       decisão que parou o crescimento: com três turmas e dezoito aulas por turma, o menu de
       documentos dava 84 entradas. O que se exige agora é o destino, e que ele EXISTA. */
    checar('e ela aponta às listas que nomeiam os documentos da turma',
      links.some((h) => /^\/?ciclos\/planos\/$/.test(h))
        && links.some((h) => /^\/?aulas\/$/.test(h)), links);

    // A MARCA É O CAMINHO DE VOLTA, e agora está na barra de todas as páginas do domínio.
    checar('a marca da barra é um link para a raiz do domínio',
      /<a class="marca" href="\/"/.test(indice) && /<a class="marca" href="\/"/.test(apresentacao));

    // A ESCOLA SEM CICLO: barra básica, sem grupos que não têm o que listar.
    const vazia = fs.mkdtempSync(path.join(os.tmpdir(), 'publicacao-vazia-'));
    const ciclosVazio = path.join('professores', PROF, 'ciclos');
    escrever(vazia, path.join(ciclosVazio, 'ciclo-01-' + ESCOLA, 'index.html'),
      '<!DOCTYPE html><html><body>\n<nav class="topnav" aria-label="Navegação do ciclo">\n'
      + '  <div class="nav-links" id="nav-links">\n'
      + '  <details class="menu"><summary>Área do Professor</summary><div class="submenu">'
      + '<a href="anamnese/">Anamnese do aluno</a></div></details>\n'
      + '  <details class="menu"><summary>Bastidores</summary><div class="submenu">'
      + '<a href="bastidores/producao">Produção</a></div></details>\n'
      + '  </div>\n</nav>\n</body></html>\n');
    escrever(vazia, path.join(ciclosVazio, 'ciclo-01-' + ESCOLA, 'assets', 'style.css'), 'body{}\n');
    montar(vazia);
    const navVazia = /<nav class="topnav"[\s\S]*?<\/nav>/.exec(
      ler(path.join(vazia, 'publicacao', ESCOLA), 'index.html'))[0];
    checar('sem turma gerada, a barra é a BÁSICA — sem «Ciclos», «Aulas» ou «Planejamento»',
      navVazia.indexOf('<summary>Ciclos</summary>') === -1
        && navVazia.indexOf('<summary>Aulas</summary>') === -1
        && navVazia.indexOf('<summary>Planejamento</summary>') === -1, navVazia.length);
    /* A ESCOLA SEM CICLO TEM BARRA (26/10/2026). Ela não tinha NENHUMA: o `nav.json` saía com
       `coluna: []` e a conta de `nav.desenhar` lia a coluna como «forma velha», devolvia `null`,
       e o índice de uma escola recém-criada ficava sem menu — precisamente quando é por ele que
       se chega à Área do Professor para criar o primeiro ciclo. O que se exige agora:
         · a barra existe e traz os Bastidores (o destino que não depende de haver turma);
         · o grupo «Área do Professor» NÃO entra — sem turma curada não há ato para preencher,
           e quatro itens a levar a três listas vazias seriam um menu a mentir com educação;
         · e o caminho para as três listas está no RODAPÉ, que é a página onde se está. */
    checar('sem turma, a barra existe e traz os Bastidores',
      /<nav class="topnav"/.test(navVazia) && navVazia.indexOf('Bastidores') !== -1, navVazia.length);
    checar('…e não anuncia a Área do Professor, que ali não teria o que listar',
      navVazia.indexOf('Área do Professor') === -1, navVazia.length);
    const rodapeVazio = (/<footer class="rodape">[\s\S]*?<\/footer>/.exec(
      ler(path.join(vazia, 'publicacao', ESCOLA), 'index.html')) || [''])[0];
    checar('…mas o rodapé leva às três listas, que é por onde se começa',
      ['anamnese', 'plano-de-ensino', 'plano-de-observacao']
        .every((f) => rodapeVazio.indexOf('/area-do-professor/' + f + '/') !== -1), rodapeVazio);
    fs.rmSync(vazia, { recursive: true, force: true });
  }

  // ------------------------------------------------------------------ C
  console.log('\nC. montar de novo não acumula, e a turma que sai não deixa fantasma');
  {
    const antes = ler(pub, 'index.html');
    montar(raiz);
    checar('montar duas vezes dá o MESMO índice (é determinístico)', ler(pub, 'index.html') === antes);

    // A TURMA QUE SAI. O pacote da turma 2 desaparece (como faria um expurgo parcial): o índice
    // não pode continuar a anunciá-la, e o subdirectório dela não pode ficar a ser servido.
    fs.rmSync(path.join(raiz, 'professores', PROF, 'ciclos', 'ciclo-01-' + ESCOLA + '-nivel-2'), { recursive: true });
    montar(raiz);
    const depois = ler(pub, 'index.html');
    checar('a turma sem pacote sai do índice', depois.indexOf('Balé Nível 2') === -1);
    checar('e o directório dela não fica para trás a ser servido', !existe(pub, 'nivel-2'));
    checar('a turma que ficou continua lá', depois.indexOf('Balé Nível 1') !== -1 && existe(pub, 'nivel-1/index.html'));
  }

  // ------------------------------------------------------------------ D
  console.log('\nD. a ligação: a config aponta a publicação, e quem faz deploy monta antes');
  {
    /*
     * TODAS as escolas que existem, e não uma escolhida a dedo (20/10/2026).
     *
     * Esta asserção fixava o `calango`, e o `calango` foi expurgado horas depois: a prova passou a
     * estourar com `ENOENT` em vez de medir. Uma prova que depende de uma escola viva deixa de
     * medir quando a escola sai — e pior, ESTOURA, o que não diz qual asserção falhou. Agora
     * percorre as configs que HOUVER, e declara quando não há nenhuma: «o repositório não tem
     * escola» é um estado, não uma falha da regra.
     */
    const configs = fs.readdirSync(RAIZ)
      .filter((f) => /^wrangler\.[a-z0-9-]+\.jsonc$/.test(f) && f !== 'wrangler.danca.jsonc')
      .sort();
    if (!configs.length) {
      console.log('   — nenhuma escola no repositório (só a raiz): não há config para medir');
    }
    for (const arquivo of configs) {
      const slug = arquivo.replace(/^wrangler\./, '').replace(/\.jsonc$/, '');
      const conf = fs.readFileSync(path.join(RAIZ, arquivo), 'utf8');
      const dir = (/"directory"\s*:\s*"([^"]+)"/.exec(conf) || [])[1] || '';
      /* UM SHARD APONTA `publicacao/` E NÃO `publicacao/<nome>` (15/11/2026), e é o contrário de
       * um defeito: é a razão de ele existir. A árvore é partilhada, cada escola vive uma pasta
       * abaixo, e a ponte reescreve `/aulas/` para `/calango/aulas/` pelo mapa. Medir o shard pela
       * regra da escola daria uma falha com a explicação certa ao lado — que é pior do que a
       * asserção que se faz. */
      const ehShard = /"PACOTE_PARTILHADO"/.test(conf);
      checar('o `' + arquivo + '` aponta a publicação ' + (ehShard ? 'PARTILHADA (`publicacao`)' : 'da escola (`publicacao/' + slug + '`)'),
        ehShard ? dir === 'publicacao' : dir === 'publicacao/' + slug, dir);
      // O DEFEITO ORIGINAL, nomeado: o `assets.directory` era o pacote-zero. O teste é sobre o
      // VALOR, e não sobre o texto do arquivo — o `wrangler` carrega comentários, e a prosa que
      // explica a correcção cita o caminho antigo: procurá-lo no texto dava um falso positivo
      // (o mesmo defeito que a secção do workflow apanhou com o `wrangler deploy`).
      checar('e o valor não é o pacote-zero (`ciclos/ciclo-NN-' + slug + '`)',
        !new RegExp('ciclos/ciclo-[0-9]{2}-' + slug + '$').test(dir), dir);
    }

    const ignorado = fs.readFileSync(path.join(RAIZ, '.gitignore'), 'utf8');
    checar('o `.gitignore` ignora a publicação — é saída, e não se versiona',
      /^publicacao\/$/m.test(ignorado));

    const wf = fs.readFileSync(path.join(RAIZ, '.github/workflows/gerar-ciclo.yml'), 'utf8');
    const iMontar = wf.indexOf('montar-publicacao.js');
    const iDeploy = wf.lastIndexOf('wrangler deploy');
    checar('o workflow monta a publicação', iMontar !== -1);
    checar('e monta ANTES de publicar (uma pasta que não existe faz o deploy falhar)',
      iMontar !== -1 && iDeploy !== -1 && iMontar < iDeploy);

    const criar = fs.readFileSync(path.join(RAIZ, 'tools/criar-escola.sh'), 'utf8');
    checar('o `criar-escola.sh` escreve `publicacao/<escola>` no `assets.directory`',
      /"directory": "publicacao\/\$ESCOLA"/.test(criar));

    // MONTAR NÃO PERTENCE AO RAMO DO `--deploy` (20/10/2026). Foi assim que a escola `batata`
    // morreu: o `criar-escola.yml` chama o script SEM `--deploy` e faz o deploy num passo
    // separado, e a montagem, que vivia lá dentro, nunca corria. O ramo do deploy não pode ser o
    // único sítio onde a pasta nasce.
    const ramoDeploy = criar.slice(criar.indexOf('if [ "$DEPLOY" = 1 ]'));
    checar('e a montagem NÃO está presa ao ramo do `--deploy`',
      ramoDeploy.indexOf('montar-publicacao.js') === -1,
      'a montagem vive dentro de `if [ "$DEPLOY" = 1 ]` — o CI não passa por lá');
    const iMontarScript = criar.indexOf('node "$RAIZ/tools/montar-publicacao.js" "$ESCOLA"');
    checar('o script monta sempre, depois de escrever a config que a aponta',
      iMontarScript !== -1 && iMontarScript > criar.indexOf('  worker: $WRANGLER'),
      iMontarScript);

    // O WORKFLOW QUE CRIA A ESCOLA. A secção D só olhava o `gerar-ciclo.yml`, e o deploy que
    // falhou é deste. Um passo cujo resultado é uma pasta tem de a montar ANTES de a usar — e a
    // dependência tem de estar ESCRITA, não herdada de um efeito lateral de outro passo.
    const criarWf = fs.readFileSync(path.join(RAIZ, '.github/workflows/criar-escola.yml'), 'utf8');
    const iMW = criarWf.indexOf('montar-publicacao.js');
    // O COMANDO, não a menção: o `wrangler deploy` aparece num comentário do cabeçalho, e um
    // `indexOf` da frase dava a posição do comentário — a asserção passava com o deploy a correr
    // ANTES da montagem. É a mesma armadilha que a secção D já tinha apanhado no outro workflow.
    /* O COMANDO MUDOU DE FORMA (26/10/2026): o CI passou a chamar o binário local
       (`./node_modules/.bin/wrangler deploy`), e a asserção procurava `npx wrangler deploy`.
       Ela reprovava o workflow certo por causa da forma do comando. A leitura passa a ser por
       LINHA de comando: a primeira que chama `wrangler deploy` e não é comentário. */
    const linhaDoDeploy = (texto) => texto.split('\n')
      .findIndex((l) => /\bwrangler deploy\b/.test(l) && !/^\s*#/.test(l));
    const iDW = linhaDoDeploy(criarWf);
    checar('o `criar-escola.yml` monta a publicação antes de subir o motor',
      iMW !== -1 && iDW !== -1
        && criarWf.split('\n').findIndex((l) => l.indexOf('montar-publicacao.js') !== -1) < iDW,
      { montar: criarWf.split('\n').findIndex((l) => l.indexOf('montar-publicacao.js') !== -1), deploy: iDW });
    checar('e chama o script sem `--deploy` (o deploy é um passo separado — e é por isso que a'
      + ' montagem não pode viver no ramo dele)',
      criarWf.indexOf('--deploy') === -1, criarWf.indexOf('--deploy'));

    // O WORKFLOW QUE PUBLICA A CADA PUSH — e o único que nunca teve cobertura aqui (22/10/2026).
    //
    // Ele descobria as escolas por `"directory": "professores/…"`, que é o valor ANTERIOR à
    // divisão do site em `publicacao/<escola>/`. Depois da divisão o `grep` deixou de casar,
    // a lista saía `[]` e o job `publicar` ficava `skipped` em TODOS os runs — um mês de
    // `motor/**` e `tools/templates/**` a chegar ao repositório e nunca ao Worker. Foi por
    // isto que a correção dos schemas do professor secundário não apareceu em produção: o
    // código estava certo, a âncora fechava, e o Worker continuava o da criação da escola.
    //
    // AS TRÊS ASSERÇÕES SÃO SOBRE O QUE QUEBROU, e cada uma reprova a versão antiga:
    //   1. a descoberta não pode depender do valor do `assets.directory`;
    //   2. a descoberta tem de encontrar o pacote-zero da escola que existe;
    //   3. o deploy não pode correr sem a pasta montada.
    const depWf = fs.readFileSync(path.join(RAIZ, '.github/workflows/deploy-escolas.yml'), 'utf8');
    checar('o `deploy-escolas.yml` não filtra mais pelo `assets.directory`',
      depWf.indexOf('"directory": *"professores/') === -1,
      'o filtro pelo `assets.directory` voltou — é o que deixava `escolas` vazio em todos os runs');
    checar('e descobre pela pasta do pacote-zero, que é a FONTE do site',
      depWf.indexOf('professores/*/ciclos/ciclo-[0-9][0-9]-"$slug"') !== -1);
    /* A MESMA CORREÇÃO DO `criar-escola.yml` (26/10/2026): o comando do deploy passou a ser o
       binário local, e a asserção procurava `npx wrangler deploy`. Lê-se a LINHA de comando. */
    const iMD = depWf.split('\n').findIndex((l) => l.indexOf('montar-publicacao.js') !== -1);
    const iDD = depWf.split('\n')
      .findIndex((l) => /\bwrangler deploy\b/.test(l) && !/^\s*#/.test(l));
    checar('e monta a publicação antes de subir (o `assets.directory` é uma SAÍDA, git-ignored)',
      iMD !== -1 && iDD !== -1 && iMD < iDD, { montar: iMD, deploy: iDD });

    // A DESCOBERTA, EXECUTADA. Uma asserção sobre o texto do script diria «contém um glob»; o
    // que interessa é que ele ENCONTRE a escola viva — e que o mesmo script, sem o pacote,
    // a descarte. É o teste que o `grep` antigo teria reprovado.
    // O bloco `run:` do passo `id: lista`, extraído à mão. Não se acrescenta o pacote `yaml`
    // por causa de uma asserção: o que se precisa é do TEXTO do script, e a indentação do
    // bloco literal é regular (dez espaços, e o primeiro `<` quebra o bloco).
    const passo = (() => {
      const i = depWf.indexOf('- id: lista');
      if (i === -1) return null;
      const j = depWf.indexOf('run: |', i);
      if (j === -1) return null;
      const linhas = depWf.slice(j + 'run: |'.length).split('\n').slice(1);
      const corpo = [];
      for (const l of linhas) {
        if (l.trim() === '') { corpo.push(''); continue; }
        if (!/^ {10}/.test(l)) break;
        corpo.push(l.slice(10));
      }
      return { run: corpo.join('\n').replace(/\s+$/, '') };
    })();
    if (passo && passo.run) {
      const rodar = (cwd) => {
        const saida = path.join(cwd, '.saida-descobrir');
        const r = spawnSync('bash', ['-c', passo.run], {
          cwd, encoding: 'utf8',
          env: Object.assign({}, process.env, { GITHUB_OUTPUT: saida, FILTRO: '' }),
        });
        return { r, saida: fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '' };
      };

      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'descobrir-'));
      /* A BANCADA REPÕE O QUE O PASSO ESPERA ENCONTRAR (24/11/2026). A descoberta passou a
       * perguntar ao shard (`source tools/lib-shard.sh`) se a escola é servida por ele — e a
       * bancada isolava o conteúdo num `tmp` sem `tools/`, de modo que o `source` falhava e a
       * asserção media a ausência da lib, não a descoberta. Copia-se a lib, que é o que existe
       * na raiz do repositório quando o passo corre a sério. */
      fs.mkdirSync(path.join(tmp, 'tools'), { recursive: true });
      fs.copyFileSync(path.join(RAIZ, 'tools', 'lib-shard.sh'), path.join(tmp, 'tools', 'lib-shard.sh'));
      fs.mkdirSync(path.join(tmp, 'professores', 'um-professor', 'ciclos', 'ciclo-01-escola-viva'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'wrangler.escola-viva.jsonc'),
        '{"assets": {"directory": "publicacao/escola-viva"}}');
      // Também uma escola EXPURGADA: config presente, pacote ausente. Tem de ser descartada.
      fs.writeFileSync(path.join(tmp, 'wrangler.escola-morta.jsonc'),
        '{"assets": {"directory": "publicacao/escola-morta"}}');
      fs.writeFileSync(path.join(tmp, 'wrangler.danca.jsonc'),
        '{"assets": {"directory": "raiz"}}');

      const { r, saida } = rodar(tmp);
      fs.rmSync(tmp, { recursive: true, force: true });
      const encontradas = (/escolas=(.*)/.exec(saida) || [])[1] || '';
      checar('a descoberta ENCONTRA a escola viva', encontradas.indexOf('escola-viva') !== -1,
        { encontradas, stderr: r.stderr });
      checar('e DESCARTA a expurgada (config presente, pacote ausente)',
        encontradas.indexOf('escola-morta') === -1, encontradas);
      checar('e deixa a raiz de fora', encontradas.indexOf('danca') === -1, encontradas);
    } else {
      checar('achei o passo de descoberta no `deploy-escolas.yml` para o executar', false,
        'o passo `lista` não existe — a asserção sobre o texto não verifica o comportamento');
    }

    const prov = fs.readFileSync(path.join(RAIZ, 'motor/servidor/provisionar-escola.js'), 'utf8');
    checar('o provisionamento delega o deploy no workflow (não sobe uma pasta que não montou)',
      prov.indexOf('npx wrangler deploy') === -1, 'provisionar-escola.js corre wrangler deploy');
  }

  // ------------------------------------------------------------------ F
  console.log('\nF. DUAS PASTAS PARA A MESMA VARIANTE — o vigente é o do carimbo maior');
  {
    /* O CASO QUE A DERIVAÇÃO CRIA (10/11/2026). Trocar o professor de uma Turma cria o elo novo
     * na pasta DELE (`professores/<novo>/ciclos/…`) e deixa o pacote antigo onde estava. A
     * montagem encontrava os dois, com a MESMA variante, e o `copiar` do segundo sobrescrevia o
     * primeiro em silêncio: quem ganhava era quem viesse por último na ordem das pastas — sorte,
     * e o site podia publicar o documento do professor que já tinha saído. */
    const casa = fs.mkdtempSync(path.join(os.tmpdir(), 'publicacao-duas-'));
    const escrever2 = (rel, texto) => escrever(casa, rel, texto);
    // O pacote-zero, na pasta do professor antigo.
    escrever2(path.join('professores', 'zzz-antigo', 'ciclos', 'ciclo-01-' + ESCOLA, 'index.html'),
      '<!DOCTYPE html><html><nav class="topnav"><a href="index.html">Sistema</a></nav>'
      + '<main><h1>Sistema Lastro</h1></main></html>\n');
    escrever2(path.join('professores', 'zzz-antigo', 'ciclos', 'ciclo-01-' + ESCOLA + '.conf'),
      'ESCOLA="Prova Escola"\n');
    /* A FIXTURE ESTÁ DO LADO DIFÍCIL DE PROPÓSITO. O pacote ANTIGO é o `zzz-antigo` — o ÚLTIMO
     * na ordem alfabética das pastas —, e o novo é o `aaa-novo`, o primeiro. Assim a ordem antiga
     * (copiar por ordem, o último sobrescreve) publicava o documento do professor que já saiu; só
     * a regra do carimbo publica o certo. Ao contrário, a prova passaria sem provar nada. */
    for (const [prof, carimbo] of [['zzz-antigo', 'po-20261110-1309'], ['aaa-novo', 'po-20261110-2145']]) {
      const ciclos2 = path.join('professores', prof, 'ciclos');
      const pacote = path.join(ciclos2, 'ciclo-01-' + ESCOLA + '-rosa');
      escrever2(path.join(pacote, 'index.html'),
        '<!DOCTYPE html><html><body>' + prof + '</body></html>\n');
      escrever2(path.join(ciclos2, 'ciclo-01-' + ESCOLA + '-rosa.conf'),
        'NOME="Ciclo 01 — Prova Escola · Rosa"\nPROFESSOR="' + prof + '"\n');
      // O IRMÃO do pacote: é ele que declara o carimbo (o de dentro é a cópia publicada).
      escrever2(path.join(ciclos2, 'ciclo-01-' + ESCOLA + '-rosa-dados.json'),
        JSON.stringify({ escola: ESCOLA, professor: prof, po: carimbo }) + '\n');
    }

    const saida = montar(casa);
    const pub2 = path.join(casa, 'publicacao', ESCOLA);
    checar('a variante publicada é a do carimbo MAIOR, e não a da sorte alfabética',
      ler(pub2, path.join('rosa', 'index.html')).indexOf('aaa-novo') !== -1,
      ler(pub2, path.join('rosa', 'index.html')).slice(0, 80));
    checar('e a montagem DIZ qual ficou de fora',
      /de fora/.test(saida) && /zzz-antigo/.test(saida), saida.split('\n').filter((l) => /fora/.test(l)));
    checar('o pacote de fora não é apagado do repositório (é proveniência)',
      fs.existsSync(path.join(casa, 'professores', 'zzz-antigo', 'ciclos',
        'ciclo-01-' + ESCOLA + '-rosa', 'index.html')));
    fs.rmSync(casa, { recursive: true, force: true });
  }

  fs.rmSync(raiz, { recursive: true, force: true });
  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal();
