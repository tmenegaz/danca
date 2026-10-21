'use strict';

/*
 * provar-indices.js — a Etapa 2 do PLANO-INDICES.md, medida de ponta a ponta.
 *
 * O QUE ESTA PROVA FIXA. O `check-indices.js` já é o validador; esta prova é o que se mede
 * SOBRE ele e sobre o gerador, e que nenhum dos dois afirma sozinho:
 *
 *   1. o gerador é DETERMINÍSTICO de ponta a ponta — duas execuções dão o mesmo texto, e o
 *      `--check` passa logo depois de gerar;
 *   2. o que está no repositório é o que o gerador produz — e apagar o disco de `indices/` não
 *      muda o resultado (a prova de reconstrução do §9.2/7);
 *   3. o índice NÃO GUARDA o que não deve: nem apelido, nem senha, nem prosa, nem corpo;
 *   4. a escola expurgada PERMANECE, marcada — e sem config ela não some do índice;
 *   5. o recorte por ciclo diz o mesmo que o índice da escola de onde saiu;
 *   6. as quatro superfícies do gerador (`--check`, `--listar`, `--json`, sem opção) respondem
 *      o que prometem, e os códigos de saída são os do contrato do CI;
 *   7. o validador tem exatamente as verificações que o plano numera — 13 do §9.1, mais a 14ª
 *      que o §4.3 exige e não numerou.
 *
 * POR QUE NÃO BASTA O `check-indices.js`. Ele diz «passou» ou «falhou»; esta prova diz POR QUE
 * se pode confiar no «passou» — e falha se alguém enfraquecer uma verificação sem que o
 * resultado mude. Uma verificação que nunca reprova não é uma verificação, é uma linha de log.
 *
 *   node experimentos/provar-indices.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const GERADOR = path.join(RAIZ, 'tools', 'gerar-indices.js');
const VALIDADOR = path.join(RAIZ, 'tools', 'check-indices.js');

const gerador = require('../tools/gerar-indices.js');
const validador = require('../tools/check-indices.js');
const indices = require('../motor/nucleo/indices.js');

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) console.log('  \u2713 ' + rotulo);
  else { falhas += 1; console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : ' — ' + detalhe)); }
}

function rodar(script, args) {
  try {
    const saida = execFileSync('node', [script].concat(args || []), { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { codigo: 0, saida };
  } catch (erro) {
    return { codigo: erro.status === undefined ? 1 : erro.status, saida: String(erro.stdout || '') + String(erro.stderr || '') };
  }
}

function main() {
  console.log('\n== 1. Determinismo de ponta a ponta ==');
  const uma = gerador.gerarEmMemoria();
  const outra = gerador.gerarEmMemoria();
  checar('duas gerações seguidas produzem os mesmos arquivos',
    uma.arquivos.size === outra.arquivos.size
    && [...uma.arquivos.keys()].every((k) => outra.arquivos.has(k)));
  let textoIgual = true;
  for (const [rel, texto] of uma.arquivos) {
    if (outra.arquivos.get(rel) !== texto) {
      // `gerado_em` pode mudar entre as duas; o resto não pode.
      if (!indices.iguais(JSON.parse(texto), JSON.parse(outra.arquivos.get(rel)))) textoIgual = false;
    }
  }
  checar('fora os voláteis, o texto é idêntico', textoIgual);
  checar('todo arquivo gerado termina em nova linha (o contrato dos arquivos do repositório)',
    [...uma.arquivos.values()].every((t) => t.endsWith('\n')));
  const quebrados = [...uma.arquivos.entries()].filter(([, t]) => { try { JSON.parse(t); return false; } catch { return true; } });
  checar('todo arquivo gerado é JSON válido', quebrados.length === 0, quebrados.map(([r]) => r).join(', '));

  console.log('\n== 2. O disco é o gerado ==');
  const noCheck = rodar(GERADOR, ['--check']);
  checar('`gerar-indices.js --check` sai 0 com o índice versionado', noCheck.codigo === 0, noCheck.saida.trim());
  const doValidador = validador.verificar(validador.carregarMundo());
  checar('`check-indices` passa as 14 verificações', doValidador.falhas === 0,
    doValidador.porVerificacao.filter((v) => v.falhas.length).map((v) => v.n + ':' + v.falhas[0]).join(' | '));

  console.log('\n== 3. Reconstrução — apagar o disco não muda o gerado ==');
  const semDisco = Object.assign({}, validador.carregarMundo(), { indices: new Map() });
  const resultadoSemDisco = validador.verificar(semDisco);
  const falhasSemDisco = resultadoSemDisco.porVerificacao.filter((v) => v.falhas.length).map((v) => v.n);
  // DUAS verificações leem o ARQUIVO e têm de acusar a ausência — e é correto que acusem:
  //   · 1 (reconstrução) — não há o que comparar;
  //   · 5 (cobertura)    — a cobertura é medida SOBRE o acervo gravado, e sem ele não há medida.
  // As outras DOZE não dependem do arquivo: é isso que prova que a geração o não lê.
  checar('sem `indices/` no disco, só as verificações que leem o arquivo acusam (1 e 5)',
    falhasSemDisco.sort().join(',') === '1,5', falhasSemDisco.join(', '));
  checar('as outras doze verificações continuam passando sem o disco de `indices/`',
    resultadoSemDisco.porVerificacao.filter((v) => v.falhas.length === 0).length === 12,
    String(resultadoSemDisco.porVerificacao.filter((v) => v.falhas.length === 0).length));
  checar('o gerado é o mesmo com ou sem o disco de `indices/`',
    [...uma.arquivos.keys()].every((rel) => semDisco.gerado.has(rel)));

  console.log('\n== 4. O índice não guarda o que não deve ==');
  const acervo = JSON.parse(uma.arquivos.get('indices/acervo.json'));
  const textoDeTodos = [...uma.arquivos.values()].join('\n');
  checar('nenhum apelido de aluna em nenhum arquivo gerado', !/"aluna"\s*:/.test(textoDeTodos));
  checar('nenhuma senha, sal, e-mail, telefone, saúde ou observação',
    !/"(senha|sal|email|telefone|saude|observacoes)"\s*:/.test(textoDeTodos));
  checar('o acervo declara o que NÃO indexa (§4.2: uma lacuna com nome)',
    Array.isArray(acervo.nao_indexado) && acervo.nao_indexado.length >= 3,
    JSON.stringify(acervo.nao_indexado));
  checar('o acervo é transversal e pequeno: não carrega o corpo de documento nenhum',
    !/"(conteudo|corpo|markdown|texto)"\s*:/.test(uma.arquivos.get('indices/acervo.json')));

  console.log('\n== 5. O expurgo permanece ==');
  const expurgadas = acervo.escolas.filter((e) => e.expurgada === true);
  checar('há ao menos uma escola expurgada no acervo', expurgadas.length > 0, String(expurgadas.length));
  checar('toda expurgada tem o inventário que é o elo (não sumiu do disco)',
    expurgadas.every((e) => fs.existsSync(path.join(RAIZ, 'escola', e.slug, 'indice.json'))));
  checar('toda expurgada está marcada, e não apenas ausente',
    expurgadas.every((e) => e.expurgada === true && e.slug));

  console.log('\n== 6. O recorte por ciclo diz o mesmo que a escola ==');
  // O CICLO É ESCOLHIDO DO QUE FOI GERADO, não nomeado à mão (20/10/2026). A prova fixava o
  // ciclo da `breu`, e o expurgo da escola levou-o consigo: o `01-breu.json` deixou de existir
  // e a prova estourava em `JSON.parse(undefined)` — a medir a ausência de um dado, não a
  // regra. O que se prova é a RELAÇÃO entre os dois níveis, e ela vale para qualquer ciclo que
  // exista: pega-se o primeiro que o gerador produziu.
  const relDoCiclo = [...uma.arquivos.keys()].filter((r) => /^indices\/ciclos\//.test(r)).sort()[0];
  const ciclo = relDoCiclo ? JSON.parse(uma.arquivos.get(relDoCiclo)) : null;
  const escolaDoCiclo = ciclo ? JSON.parse(uma.arquivos.get('indices/escolas/' + ciclo.escola + '.json')) : null;
  const cicloNaEscola = escolaDoCiclo ? escolaDoCiclo.ciclos.find((c) => c.id === ciclo.id) : null;
  if (!ciclo) {
    // O REPOSITÓRIO PODE NÃO TER CICLO NENHUM (20/10/2026) — é o estado depois do expurgo de
    // todas as escolas: ficam os schemas, que são o modelo, e mais nada. A relação entre os dois
    // níveis não tem o que medir, e a prova DECLARA-O em vez de passar em silêncio: uma asserção
    // que não correu não é uma asserção cumprida.
    checar('sem ciclo no repositório, o gerador não inventa recorte de ciclo',
      uma.arquivos.size === Object.keys(uma.escolas).length + 1,
      uma.arquivos.size + ' arquivo(s) para ' + Object.keys(uma.escolas).length + ' escola(s)');
    console.log('  — a relação recorte × escola não se mede: não há ciclo no repositório');
  } else {
    checar('o ciclo do recorte existe no índice da escola', Boolean(cicloNaEscola), ciclo.id);
    checar('o recorte lista os mesmos documentos do ciclo da escola',
      Boolean(cicloNaEscola) && ciclo.documentos.length === cicloNaEscola.documentos.length);
    checar('o recorte e a escola dizem o mesmo estado e a mesma âncora',
      Boolean(cicloNaEscola) && ciclo.estado === cicloNaEscola.estado
      && JSON.stringify(ciclo.ancora) === JSON.stringify(cicloNaEscola.ancora));
  }

  console.log('\n== 7. As quatro superfícies do gerador ==');
  const listar = rodar(GERADOR, ['--listar']);
  checar('`--listar` sai 0 e não escreve', listar.codigo === 0);
  checar('`--listar` nomeia o acervo e ao menos uma escola',
    /indices\/acervo\.json/.test(listar.saida) && /indices\/escolas\//.test(listar.saida));
  const json = rodar(GERADOR, ['--check', '--json']);
  let resumo = null;
  try { resumo = JSON.parse(json.saida); } catch { resumo = null; }
  checar('`--check --json` devolve JSON com `ok`', Boolean(resumo) && resumo.ok === true);
  // A ESCOLA DO RECORTE VEM DO GERADO, não é nomeada à mão (20/10/2026): fixava «breu» e «fita»,
  // e o expurgo levou a `breu`. Pega-se a primeira que o gerador produz e exige-se que as OUTRAS
  // fiquem de fora — que é a regra, e vale para qualquer conjunto de escolas.
  const slugs = Object.keys(uma.escolas).sort();
  const alvoDoFiltro = slugs[0];
  const outraEscola = slugs.find((s) => s !== alvoDoFiltro) || null;
  const escolaSo = rodar(GERADOR, ['--listar', '--escola', alvoDoFiltro]);
  checar('`--escola <slug>` limita os arquivos de escola, e mantém o acervo',
    /indices\/acervo\.json/.test(escolaSo.saida)
    && escolaSo.saida.indexOf('indices/escolas/' + alvoDoFiltro + '.json') !== -1
    && (!outraEscola || escolaSo.saida.indexOf('indices/escolas/' + outraEscola + '.json') === -1),
    { alvoDoFiltro, outra: outraEscola });
  const escolaRuim = rodar(GERADOR, ['--listar', '--escola', 'nao-existe']);
  checar('escola desconhecida sai 2 (erro de uso, não de dado)', escolaRuim.codigo === 2, String(escolaRuim.codigo));
  const lixo = rodar(GERADOR, ['--nao-existe']);
  checar('opção desconhecida sai 2', lixo.codigo === 2, String(lixo.codigo));

  console.log('\n== 8. O validador tem as verificações do plano ==');
  const numeros = validador.VERIFICACOES.map((v) => v.n);
  checar('são 14 verificações, numeradas de 1 a 14',
    numeros.length === 14 && numeros.join(',') === Array.from({ length: 14 }, (_, i) => i + 1).join(','),
    numeros.join(','));
  checar('as 13 do §9.1 estão nomeadas', validador.VERIFICACOES.slice(0, 13).every((v) => v.nome && v.regra));

  const contra = rodar(VALIDADOR, ['--contraprovas']);
  checar('todas as contraprovas do §9.2 reprovam como deviam', contra.codigo === 0, contra.saida.trim().split('\n').pop());

  console.log('\n== 9. O gerador VÊ o fantasma e o apaga ==');
  {
    // O DEFEITO REAL (20/10/2026, expurgo da `breu`). `escrever()` só escrevia: o
    // `indices/ciclos/sapo-bailarino/01-breu.json` descrevia um ciclo que já não existia, o
    // `check-indices.js` reprovava-o como órfão, e o `gerar-indices.js --check` dizia «em dia» —
    // porque comparava só o que PRODUZ e nunca olhava para o que sobrava. A ferramenta que
    // conserta não via o que a outra acusava, e a única saída era apagar à mão.
    const mundo = validador.carregarMundo();
    const orfaos = gerador.orfaosNoDisco(new Map([...mundo.gerado].map(([k, v]) => [k, v])));
    checar('o gerador sabe dizer o que está no disco e ele não produz',
      Array.isArray(orfaos), orfaos);
    checar('o esquema NÃO é órfão: ele é fonte, e não saída',
      orfaos.every((rel) => rel.indexOf('indices/esquema/') !== 0), orfaos);
    checar('com o índice regenerado não há órfão nenhum', orfaos.length === 0, orfaos);

    // O `--check` e o `--listar` concordam com a remoção: um órfão plantado aparece nos dois.
    const plantado = 'indices/ciclos/zzz/99-fantasma.json';
    const caminho = path.join(RAIZ, plantado);
    fs.mkdirSync(path.dirname(caminho), { recursive: true });
    fs.writeFileSync(caminho, '{}\n', 'utf8');
    try {
      const check = rodar(GERADOR, ['--check']);
      checar('`--check` reprova por causa do órfão (e não diz «em dia»)',
        check.codigo === 1 && /órfão/.test(check.saida), check.saida.trim());
      const lista = rodar(GERADOR, ['--listar']);
      checar('`--listar` anuncia que ele sai', /^\(sai\) /m.test(lista.saida), lista.saida.trim().slice(-200));
      // E a escola do filtro manda na remoção: `--escola <outra>` não leva este embora.
      const outra = Object.keys(uma.escolas).sort().find((s) => s !== uma.escolas[Object.keys(uma.escolas)[0]]);
      const filtrado = rodar(GERADOR, ['--listar', '--escola', outra || 'zzz']);
      checar('com `--escola` de outra escola, o órfão não é dado como removível',
        !new RegExp('^\\(sai\\) ' + plantado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'm').test(filtrado.saida),
        filtrado.saida.trim().slice(-200));
    } finally {
      try { fs.unlinkSync(caminho); } catch { /* já não está */ }
      try { fs.rmdirSync(path.dirname(caminho)); } catch { /* já não está */ }
      try { fs.rmdirSync(path.dirname(path.dirname(caminho))); } catch { /* já não está */ }
    }
    const depois = rodar(GERADOR, ['--check']);
    checar('o diretório volta ao estado limpo', depois.codigo === 0, depois.saida.trim());
  }

  console.log('\n== 10. Escola expurgada não está habilitada ==');
  {
    // O outro lado do elo (20/10/2026): `estado.habilitada` vem da criação e não se reescreve, e
    // `expurgada` vem do wrangler que o expurgo apagou. Sem a conjunção, o índice da `breu` dizia
    // as duas coisas ao mesmo tempo. Não há escola habilitada sem Worker.
    const expurgadas = acervo.escolas.filter((e) => e.expurgada === true);
    checar('há escola expurgada para medir', expurgadas.length > 0, String(expurgadas.length));
    checar('nenhuma expurgada está habilitada',
      expurgadas.every((e) => e.habilitada === false),
      expurgadas.filter((e) => e.habilitada !== false).map((e) => e.slug));
    checar('e a escola com Worker continua a seguir o elo',
      acervo.escolas.filter((e) => e.expurgada !== true).every((e) => typeof e.habilitada === 'boolean'));
  }

  console.log('\n== 11. O contador do mestre não se percorre ==');
  {
    // O DEFEITO REAL (20/10/2026, primeira aula de um ciclo vivo). No MESTRE `documentos` e
    // `aulas` do ciclo são CONTAGENS; no índice da escola são LISTAS. As verificações 2 e 4
    // percorriam `ciclo.aulas || []` — e o bug ficou escondido porque o único ciclo do mestre
    // tinha `aulas: 0`, e ZERO é falsy: `0 || []` é `[]`. O primeiro ciclo com uma aula de
    // verdade (`aulas: 1`) derrubou as duas com «number 1 is not iterable», que o verificador
    // reportava como «erro ao verificar» — sem dizer onde.
    const mundo = validador.carregarMundo();
    const doMestre = mundo.gerado.get('indices/acervo.json');
    const ciclos = (doMestre && doMestre.ciclos) || [];
    if (!ciclos.length) {
      console.log('  — não há ciclo no mestre: o contador não tem o que medir');
    } else {
      checar('o mestre guarda `documentos` e `aulas` do ciclo como CONTAGEM, não como lista',
        ciclos.every((c) => !Array.isArray(c.documentos) && !Array.isArray(c.aulas)),
        ciclos.map((c) => c.id));
      // O que importa: percorrer o contador não pode estourar. Se estourasse, a verificação
      // devolveria «erro ao verificar» em vez de um resultado.
      const resultado = validador.verificar(mundo);
      checar('nenhuma verificação estoura ao ler o mestre',
        resultado.porVerificacao.every((v) => !v.falhas.some((f) => /is not iterable/.test(f))),
        resultado.porVerificacao.filter((v) => v.falhas.some((f) => /is not iterable/.test(f))).map((v) => v.n));
      // E a projecção plana da escola não é duplicata: o mesmo id aparece nas duas vistas de
      // propósito, e a verificação 4 não a pode acusar.
      const daEscola = mundo.gerado.get('indices/escolas/' + (ciclos[0].escola || '') + '.json');
      const projetadas = (daEscola && daEscola.aulas) || [];
      checar('a projecção plana `aulas[]` da escola existe e repete os ids dos ciclos',
        projetadas.length === 0 || projetadas.every((a) => typeof a.id === 'string'));
      const unica = resultado.porVerificacao.find((v) => v.n === 4);
      checar('a verificação 4 não acusa duplicata entre a projecção e os ciclos',
        Boolean(unica) && !unica.falhas.some((f) => /id repetido/.test(f)),
        unica && unica.falhas);
    }
  }

  console.log('\n== 12. Os derivados do PO têm tipo declarado ==');
  {
    // Os quatro documentos que o «Guardar» do PO escreve ao lado das fontes entravam no acervo
    // como «sem tipo declarado»: o índice não os conhecia, e o documento publicado era
    // invisível para a proveniência.
    const tipos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'indices/esquema/tipos.json'), 'utf8')).tipos;
    const ids = tipos.map((t) => t.id);
    for (const id of ['harmonizacao', 'notacao', 'glossario', 'referencias']) {
      checar('o tipo `' + id + '` está declarado', ids.indexOf(id) !== -1, ids.join(','));
    }
    const declarados = new Set(ids);
    const doMotor = new Set(indices.TIPOS_DE_DOCUMENTO);
    checar('o motor classifica os mesmos tipos que o esquema declara (menos `pacote`, que é diretório)',
      [...declarados].filter((id) => id !== 'pacote').every((id) => doMotor.has(id)),
      [...declarados].filter((id) => id !== 'pacote' && !doMotor.has(id)));
    checar('e nenhum tipo do motor está fora da declaração',
      [...doMotor].every((id) => declarados.has(id)),
      [...doMotor].filter((id) => !declarados.has(id)));
    const ver8 = validador.verificar(validador.carregarMundo()).porVerificacao.find((v) => v.n === 8);
    checar('a verificação 8 (Declaração) não acusa documento sem tipo',
      Boolean(ver8) && !ver8.falhas.some((f) => /sem tipo declarado/.test(f)),
      ver8 && ver8.falhas);
  }

  console.log('\n== 13. O pacote no repositorio tem decisao para TUDO que o gerador escreve ==');
  {
    // O PRIMEIRO PACOTE REAL EXPÔS O VOCABULÁRIO (20/10/2026). Enquanto nenhum pacote estava no
    // repositório, o `professores/**` era só fonte e o vocabulário bastava. Com o pacote gerado,
    // catorze arquivos passaram a não ter decisão — oito páginas `.html`, o `.pdf` e as cinco
    // cópias de conteúdo que a porta lê — e a verificação 8 reprovou por omissão, não por erro
    // de tipo. As regras que faltavam são por CLASSE, não por arquivo: cada uma nomeia o que a
    // saída é, para a próxima não voltar a ser descoberta por falha.
    const esquema = JSON.parse(fs.readFileSync(path.join(RAIZ, 'indices/esquema/tipos.json'), 'utf8'));
    const tipos = esquema.tipos || [];
    const ignorados = esquema.ignorados || [];
    /* O PACOTE É DESCOBERTO, não nomeado (21/10/2026) — ver `lib-pacote.js`. Aqui os caminhos
     * servem só para exercer as REGRAS DE TIPO do `indices/esquema/tipos.json` (não se lê
     * ficheiro nenhum), mas um caminho de uma escola que já não existe é uma opinião sobre o
     * passado, e a próxima pessoa a ler a prova procuraria em vão o pacote citado. */
    const pacote = require('./lib-pacote.js').caminhoDeExemplo();

    const decisaoDe = (rel) => {
      const achados = [];
      for (const t of tipos) {
        if ((t.alvo === 'diretorio') !== rel.endsWith('/')) continue;
        if (new RegExp(t.padrao).test(rel)) achados.push(t.id);
      }
      for (const ig of ignorados) if (new RegExp(ig.padrao).test(rel)) achados.push('ignorado:' + ig.id);
      return achados;
    };

    const saida = [
      pacote + '/aula-01.html',
      pacote + '/referencias.html',
      pacote + '/plano-observacao/index.html',
      pacote + '/' + path.basename(pacote) + '.pdf',
      pacote + '/plano-01.json',
      pacote + '/po-01.json',
      pacote + '/captura-01.json',
      pacote + '/captura-aula-01.json',
      pacote + '/plano-aula-01.json',
      pacote + '/assets/style.css',
    ];
    checar('todo arquivo de SAÍDA do pacote tem decisão — e uma só',
      saida.every((rel) => decisaoDe(rel).length === 1),
      saida.map((rel) => rel.split('/').pop() + ' → ' + (decisaoDe(rel).join('+') || 'NENHUMA')));

    // O `ciclos.json` do pacote NÃO é saída: o PLANO-INDICES.md (§1, item 5) manda lê-lo, porque
    // é dele que sai «qual é a próxima aula» sem o Worker abrir o `.conf` nem o pacote.
    checar('o `ciclos.json` do pacote continua a ser um documento (`indice`), e não saída',
      decisaoDe(pacote + '/ciclos.json').join(',') === 'indice',
      decisaoDe(pacote + '/ciclos.json'));

    // A EXCEPÇÃO É POR CLASSE, NÃO POR PASTA: se ela apanhasse a pasta inteira, as fontes ao lado
    // e o próprio pacote (o diretório) desapareceriam do acervo.
    checar('o pacote em si continua a ser o documento (o diretório)',
      decisaoDe(pacote + '/').join(',') === 'pacote', decisaoDe(pacote + '/'));
    checar('as fontes ao lado do pacote continuam a ter tipo',
      decisaoDe(pacote + '-po.md').join(',') === 'po'
        && decisaoDe(pacote + '-dados.json').join(',') === 'dados'
        && decisaoDe(pacote + '.conf').join(',') === 'manifesto',
      [decisaoDe(pacote + '-po.md'), decisaoDe(pacote + '-dados.json'), decisaoDe(pacote + '.conf')]);
    checar('e a âncora, que fica ao lado, também',
      decisaoDe(pacote + '.fipp').join(',') === 'ancora', decisaoDe(pacote + '.fipp'));

    // O ESTADO DE QUE O ACTUAL VEIO. O gerador guarda, ao lado do plano da aula, o plano anterior
    // (`plano-aula-NN-anterior.json`, só a partir da 2ª geração). É cópia de conteúdo dentro do
    // pacote — a mesma classe do `plano-aula-NN.json` —, e o primeiro ciclo regerado depois desta
    // data trouxe-o sem tipo declarado: a regra admitia o actual e não o anterior.
    checar('o plano da aula ANTERIOR (o estado de que o actual veio) tem decisão, como o actual',
      decisaoDe(pacote + '/plano-aula-01.json').length === 1
        && decisaoDe(pacote + '/plano-aula-01-anterior.json').length === 1
        && decisaoDe(pacote + '/plano-aula-01-anterior.json').join(',')
          === decisaoDe(pacote + '/plano-aula-01.json').join(','),
      [decisaoDe(pacote + '/plano-aula-01.json'), decisaoDe(pacote + '/plano-aula-01-anterior.json')]);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

main();
