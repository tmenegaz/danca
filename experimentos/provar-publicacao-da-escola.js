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
    '  <a href="plano-observacao/?fonte=po">Plano de Observação</a>\n' +
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
    const ROTAS_DA_PORTA = /^(anamnese|plano-ensino|plano-observacao)\//;
    const hrefs = [...indice.matchAll(/href="([^"#?]+)"/g)]
      .map((m) => m[1])
      .filter((h) => !/^(https?:|mailto:)/.test(h))
      .filter((h) => !ROTAS_DA_PORTA.test(h));
    const mortos = hrefs.filter((h) => !existe(pub, h));
    checar('nenhum link do índice aponta para o vazio', mortos.length === 0, mortos);
    checar('e o índice aponta à apresentação, que existe', hrefs.indexOf('sistema.html') !== -1);
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
      checar('o `' + arquivo + '` aponta a publicação da escola (`publicacao/' + slug + '`)',
        dir === 'publicacao/' + slug, dir);
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
    const iDW = criarWf.indexOf('npx wrangler deploy');
    checar('o `criar-escola.yml` monta a publicação antes de subir o motor', iMW !== -1 && iMW < iDW,
      { montar: iMW, deploy: iDW });
    checar('e chama o script sem `--deploy` (o deploy é um passo separado — e é por isso que a'
      + ' montagem não pode viver no ramo dele)',
      criarWf.indexOf('--deploy') === -1, criarWf.indexOf('--deploy'));

    const prov = fs.readFileSync(path.join(RAIZ, 'motor/servidor/provisionar-escola.js'), 'utf8');
    checar('o provisionamento delega o deploy no workflow (não sobe uma pasta que não montou)',
      prov.indexOf('npx wrangler deploy') === -1, 'provisionar-escola.js corre wrangler deploy');
  }

  fs.rmSync(raiz, { recursive: true, force: true });
  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal();
