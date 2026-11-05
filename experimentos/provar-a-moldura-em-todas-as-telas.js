#!/usr/bin/env node
'use strict';

/**
 * provar-a-moldura-em-todas-as-telas.js — a barra e a coluna existem em TODA página que o Worker
 * serve, e o menu de uma escola recém-criada já tem os três formulários.
 *
 * O QUE A PESQUISADORA VIU (05/11/2026):
 *
 *   «Quando eu vou criar uma anamnese, ou editar, ou ajustar, e isso se reflete também no plano de
 *   ensino e no plano de observação, eu estou numa página que não tem identidade visual. Ela é só
 *   um formulário… Não pode, em momento nenhum que eu abra qualquer página do sistema Lastro, não
 *   existir o menu lateral e não existir o menu do topo.»
 *
 *   «Quando é criada a escola nova, ela está nascendo sem os menus, que são os de plano de ensino e
 *   de plano de observação e do plano da anamnese.»
 *
 * AS DUAS CAUSAS, e são independentes:
 *
 *   1. A MOLDURA ERA UM SUBSTITUIDOR. `motor/nucleo/nav.js#aplicar` procura uma
 *      `<nav class="topnav">` e troca-a. A porta (`porta/index.html`, e tudo o que dela é copiado)
 *      não tem uma: traz o marcador `<!-- NAV -->`, que a GERAÇÃO substitui. Quando a cópia
 *      publicada ficou com o marcador — e ficou, medido ao vivo —, `aplicar` devolvia `null` e a
 *      ponte servia a página intacta: sem barra e sem coluna, enquanto a listagem ao lado tinha as
 *      duas. A secção 1 mede as duas funções sobre o mesmo HTML.
 *
 *   2. O MENU DE UMA ESCOLA NOVA NÃO TINHA OS TRÊS FORMULÁRIOS. `menuDaEscola` só punha o grupo
 *      «Área do Professor» `if (turmas.length)`. Uma escola recém-criada não tem turma — e a
 *      anamnese é justamente o instrumento que vem ANTES de haver turma. A secção 4 mede o menu
 *      de uma escola sem turma nenhuma.
 *
 * COMO É MEDIDO. Monta-se uma publicação de verdade (`tools/montar-publicacao.js --raiz <temp>`)
 * sobre uma árvore que reproduz o defeito — a porta do pacote-zero com o MARCADOR, como está no
 * repositório —, e serve-se pela ponte (`producao.fetch`). Nada de aplicar menu à mão: quem aplica
 * é quem serve, e é isso que se mede.
 *
 *   node experimentos/provar-a-moldura-em-todas-as-telas.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const FERRAMENTA = path.join(RAIZ, 'tools', 'montar-publicacao.js');
const nav = require(path.join(RAIZ, 'motor/nucleo/nav.js'));
const { menuDaEscola } = require(FERRAMENTA);
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const CONTEUDO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'porta', 'po', 'conteudo', 'po.json'), 'utf8'));

const ESCOLA = 'prova';
const PROF = 'prova-prof';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

function escrever(raiz, rel, texto) {
  const alvo = path.join(raiz, rel);
  fs.mkdirSync(path.dirname(alvo), { recursive: true });
  fs.writeFileSync(alvo, texto, 'utf8');
}

/**
 * A ÁRVORE DE PROVA — e o detalhe que importa está assinalado.
 *
 * O pacote-zero traz a apresentação COM barra (é assim que `criar-escola.sh` o deixa) e a porta
 * **com o marcador** — que é o estado real do repositório hoje, e o que produziu o defeito.
 */
function arvore() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'moldura-'));
  const ciclos = path.join('professores', PROF, 'ciclos');
  const zero = path.join(ciclos, 'ciclo-01-' + ESCOLA);

  escrever(raiz, path.join(zero, 'index.html'),
    '<!DOCTYPE html><html lang="pt-BR"><body>\n' + nav.desenhar({
      versao: 2, coluna: [], barra: [{ tipo: 'menu', rotulo: 'Bastidores',
        itens: [{ rotulo: 'Produção', href: '/bastidores/producao' }] }],
    }, '/') + '\n<main><h1>Sistema Lastro</h1></main></body></html>\n');
  escrever(raiz, path.join(zero, 'assets', 'style.css'), 'body{}\n');
  escrever(raiz, path.join(zero, 'assets', 'nav.js'), '// nav\n');
  escrever(raiz, path.join(zero, 'assets', 'favicon.svg'), '<svg/>\n');
  /* A PORTA DO PACOTE-ZERO COM O MARCADOR, tal como está no repositório. */
  escrever(raiz, path.join(zero, 'plano-observacao', 'index.html'),
    '<!DOCTYPE html><html lang="pt-BR"><body data-tela="porta">\n<!-- NAV -->\n'
    + '<main id="conducao"><h1>Anamnese</h1></main></body></html>\n');
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA + '.conf'), 'ESCOLA="Prova Escola"\n');

  const pacote = path.join(ciclos, 'ciclo-01-' + ESCOLA + '-nivel-1');
  escrever(raiz, path.join(pacote, 'index.html'),
    '<!DOCTYPE html><html><body><h1>Balé Nível 1</h1></body></html>\n');
  for (const pagina of ['plano', 'aula-01']) {
    escrever(raiz, path.join(pacote, pagina + '.html'),
      '<!DOCTYPE html><html><body><h1>' + pagina + '</h1></body></html>\n');
  }
  escrever(raiz, path.join(pacote, 'ciclo-01-' + ESCOLA + '-nivel-1.pdf'), '%PDF ciclo\n');
  escrever(raiz, path.join(pacote, 'aula-01.pdf'), '%PDF aula\n');
  /* E A PORTA DO PACOTE DA TURMA TAMBÉM COM O MARCADOR: é a segunda cópia da mesma página, e é
   * servida em `/<variante>/plano-observacao/`. Um remendo que só olhasse a raiz deixaria esta. */
  escrever(raiz, path.join(pacote, 'plano-observacao', 'index.html'),
    '<!DOCTYPE html><html lang="pt-BR"><body data-tela="porta">\n<!-- NAV -->\n'
    + '<main id="conducao"><h1>Plano de Observação</h1></main></body></html>\n');
  escrever(raiz, path.join(pacote, 'ciclos.json'), JSON.stringify({
    ciclos: [{ id: '01', escola: 'Prova Escola', inicio: '2026-10-20', fim: '2026-12-17',
      total_aulas: 18, duracao_min: 60,
      aulas: Array.from({ length: 18 }, (_, i) => ({ n: String(i + 1).padStart(2, '0'),
        lancada: i === 0 })) }],
  }, null, 2) + '\n');
  escrever(raiz, path.join(ciclos, 'ciclo-01-' + ESCOLA + '-nivel-1.conf'),
    'NOME="Ciclo 01 — Prova Escola · Balé Nível 1"\n');
  return raiz;
}

function kvDeMentira() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list(op) {
      const prefixo = (op && op.prefix) || '';
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefixo))
        .map((name) => ({ name })), list_complete: true };
    },
  };
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.pdf': 'application/pdf' };

/**
 * O ASSETS DE MENTIRA — e ele tem de resolver DIRECTORIES como o verdadeiro.
 *
 * O binding `ASSETS` do Cloudflare serve `/ciclos/planos/` a partir de `ciclos/planos/index.html`;
 * um servidor de ficheiros ingénuo devolve 404 e a prova passa a medir uma página que não existe.
 * Foi o que aconteceu na primeira versão desta bancada: três rotas «passavam» com o corpo `nao`.
 */
function assetsDe(publicacao) {
  const resolver = (rel) => {
    /* A PORTA LÊ O CONTEÚDO DELA DO PREFIXO `plano-observacao/` (o `ASSETS` de produção é a
     * publicação inteira, e o conteúdo vive dentro do subdirectório). A publicação de prova não
     * o tem — ela é montada a partir de um pacote-zero mínimo —, e o recurso é o mesmo que as
     * outras bancadas usam: cair em `porta/`, a fonte de onde o gerador copia. */
    const candidatos = [rel, rel.replace(/^plano-observacao\//, '')];
    for (const candidato of candidatos) {
      for (const base of [publicacao, path.join(RAIZ, 'porta')]) {
        const alvo = path.join(base, candidato);
        if (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) return alvo;
        const indice = path.join(alvo, 'index.html');
        if (fs.existsSync(indice) && fs.statSync(indice).isFile()) return indice;
      }
    }
    return null;
  };
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      const alvo = resolver(rel);
      if (!alvo) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(alvo), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' } });
    },
  };
}

const relatorio = (id) => ({ id, estado: 'prova', contagem: { respondidos: 0, obrigatorios: 0 },
  elos: [], paradas: [], idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' },
  errosDoDocumento: [], linhas: [] });

const BASE = 'https://prova.tmenegaz77.workers.dev';
const MOLdura = (html) => ({
  barra: /<nav class="topnav"/.test(html),
  coluna: /<aside class="coluna/.test(html),
  marcador: html.indexOf('<!-- NAV -->') !== -1,
  links: [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)]
    .map((m) => m[2].trim()).filter(Boolean),
});

(async () => {
  const raiz = arvore();
  execFileSync(process.execPath, [FERRAMENTA, ESCOLA, '--raiz', raiz], { encoding: 'utf8',
    stdio: 'pipe' });
  const publicacao = path.join(raiz, 'publicacao', ESCOLA);

  const env = { ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's',
    SENHA_PROFESSOR: 'p', PROFESSOR_NOME: 'Prova', PADD_KV: kvDeMentira(),
    ASSETS: assetsDe(publicacao) };
  await env.PADD_KV.put('bastidores/' + ESCOLA + '/curadorias', JSON.stringify([
    { id: 'c1', professor: PROF, modalidade: 'balé', turma: 'Balé Nível 1',
      turmas: ['Balé Nível 1'], alunas: ['Aluna A'] },
  ]));
  const armazenamento = producao.__armazenamento(env);
  const PLANO = { id: 'plano-20261101', contexto: { escola: ESCOLA, professor: PROF, ciclo: '01',
    turma: 'Balé Nível 1' }, respostas: { 'contexto-turma': { valor: 'Balé Nível 1' } },
    ajuste_de: null, gerado_em: '2026-11-01T10:00' };
  const ANAMNESE = { id: 'anamnese-20261101', contexto: { escola: ESCOLA, professor: PROF,
    aluna: 'Aluna A' }, respostas: {}, ajuste_de: null, gerado_em: '2026-11-01T09:00' };
  const PO = { id: 'po-20261101', contexto: { escola: ESCOLA, professor: PROF, ciclo: '01',
    turma: 'Balé Nível 1' }, respostas: { sujeitos: { valor: ['Aluna A'] } },
    ajuste_de: null, gerado_em: '2026-11-01T11:00' };
  for (const d of [PLANO, ANAMNESE, PO]) {
    await porta.gravarEnvelope(armazenamento, d, relatorio(d.id));
  }

  const pedir = async (caminho) => {
    const r = await producao.fetch(new Request(BASE + caminho), env);
    return { status: r.status, html: await r.text() };
  };

  /* -------------------------------------------------------------------------------------- */
  console.log('\n1 · AS DUAS FUNÇÕES SOBRE A MESMA PORTA — porque a moldura desaparecia');
  /* -------------------------------------------------------------------------------------- */
  /* Esta é a prova da causa, e ela é de contrato: `aplicar` devolve `null` sobre a página que a
   * ponte serve (a que traz o marcador), e `enquadrar` devolve a página com a moldura. Se um dia
   * alguém trocar uma pela outra, esta secção cai. */
  const htmlDaPorta = fs.readFileSync(path.join(publicacao, 'plano-observacao', 'index.html'), 'utf8');
  const menuDaEscolaPublicada = JSON.parse(fs.readFileSync(
    path.join(publicacao, 'nav.json'), 'utf8'));
  provar('o artefacto da porta JÁ NASCE com a moldura (a montagem enquadra)',
    /<nav class="topnav"/.test(htmlDaPorta) && /<aside class="coluna/.test(htmlDaPorta)
      && htmlDaPorta.indexOf('<!-- NAV -->') === -1,
    MOLdura(htmlDaPorta));
  /* E o controlo: sobre o MESMO texto, mas com o marcador no lugar da barra — o estado em que o
   * repositório estava —, `aplicar` não faz nada e `enquadrar` faz. */
  const comMarcador = htmlDaPorta.replace(/<aside class="coluna[\s\S]*?<\/aside>\s*(?:<div class="ve[u]"[^>]*><\/div>\s*)?/, '')
    .replace(/<nav class="topnav"[\s\S]*?<\/nav>/, '<!-- NAV -->');
  provar('CONTROLO: com o marcador, `aplicar` devolve `null` (era por isto que nada acontecia)',
    nav.aplicar(comMarcador, menuDaEscolaPublicada, '/plano-observacao/') === null);
  const enquadrada = nav.enquadrar(comMarcador, menuDaEscolaPublicada, '/plano-observacao/');
  provar('…e `enquadrar` devolve a página com barra, coluna e sem marcador',
    Boolean(enquadrada) && /<nav class="topnav"/.test(enquadrada)
      && /<aside class="coluna/.test(enquadrada) && enquadrada.indexOf('<!-- NAV -->') === -1,
    enquadrada ? MOLdura(enquadrada) : enquadrada);
  provar('…e é IDEMPOTENTE (a segunda passagem não duplica a moldura)',
    nav.enquadrar(enquadrada, menuDaEscolaPublicada, '/plano-observacao/') === enquadrada);
  provar('…e não inventa moldura num fragmento sem `<body>` e sem marcador',
    nav.enquadrar('<div>um pedaço</div>', menuDaEscolaPublicada, '/') === null);

  /* -------------------------------------------------------------------------------------- */
  console.log('\n2 · TODAS AS TELAS QUE O WORKER SERVE — barra e coluna, sem exceção');
  /* -------------------------------------------------------------------------------------- */
  /* A lista é a da navegação real: as três listas, as três portas (com o contexto que cada uma
   * exige), os dois documentos do pacote, a raiz da escola e os Bastidores. */
  const TELAS = [
    ['a raiz da escola', '/'],
    ['a apresentação', '/sistema.html'],
    ['a lista da anamnese', '/area-do-professor/anamnese/'],
    ['a lista do plano de ensino', '/area-do-professor/plano-de-ensino/'],
    ['a lista do plano de observação', '/area-do-professor/plano-de-observacao/'],
    ['a lista de planos do ciclo', '/ciclos/planos/'],
    ['a lista de aulas', '/aulas/'],
    ['a porta — anamnese com «Novo registo»',
      '/anamnese/?novo=' + ANAMNESE.id + '&professor=' + PROF + '&aluna=Aluna%20A'],
    ['a porta — anamnese em edição',
      '/anamnese/?editar=' + ANAMNESE.id + '&professor=' + PROF + '&aluna=Aluna%20A'],
    ['a porta — plano de ensino',
      '/plano-ensino/?fonte=plano&professor=' + PROF + '&ciclo=01'],
    ['a porta — plano de observação',
      '/plano-observacao/?fonte=po&professor=' + PROF + '&ciclo=01&plano=' + PLANO.id],
    ['a porta do pacote da turma', '/nivel-1/plano-observacao/?fonte=po&professor=' + PROF
      + '&ciclo=01'],
    ['o plano do ciclo (documento)', '/nivel-1/plano.html'],
    ['a aula (documento)', '/nivel-1/aula-01.html'],
    ['os Bastidores — Produção', '/bastidores/producao'],
    ['os Bastidores — Estúdio', '/bastidores/estudio'],
  ];

  const molduras = [];
  for (const [rotulo, caminho] of TELAS) {
    const r = await pedir(caminho);
    const m = MOLdura(r.html);
    molduras.push({ rotulo, caminho, m });
    provar(rotulo + ' responde HTML (não é erro nem redireccionamento)', r.status === 200, r.status);
    provar('…com a barra do topo', m.barra === true);
    provar('…com a coluna da esquerda', m.coluna === true);
    provar('…e sem o marcador `<!-- NAV -->` à vista', m.marcador === false);
  }

  /* A MOLDURA É A MESMA, e é isso que faz dela uma moldura. Compara-se o CONJUNTO de rótulos de
   * link de cada tela com o da lista da anamnese: nenhuma tela pode ter menos base do que ela. */
  console.log('');
  const baseDosLinks = molduras.find((x) => /lista da anamnese/.test(x.rotulo)).m.links;
  const BASE_OBRIGATORIA = ['Anamnese do aluno', 'Plano de ensino', 'Plano de Observação'];
  for (const nome of BASE_OBRIGATORIA) {
    provar('a base da navegação tem «' + nome + '»', baseDosLinks.indexOf(nome) !== -1,
      baseDosLinks.slice(0, 8));
  }
  for (const { rotulo, m } of molduras) {
    const faltam = BASE_OBRIGATORIA.filter((n) => m.links.indexOf(n) === -1);
    provar('«' + rotulo + '» leva os três formulários, como a lista', faltam.length === 0, faltam);
  }

  /* -------------------------------------------------------------------------------------- */
  console.log('\n3 · O MENU DA ESCOLA NOVA — os três formulários antes de existir turma');
  /* -------------------------------------------------------------------------------------- */
  /* A outra causa, e ela é de DADOS: `menuDaEscola` com zero turmas. A anamnese é o instrumento
   * de ENTRADA (vem antes da turma) e o plano de ensino é o que CRIA o ciclo — esconder os dois
   * até haver turma esconde a porta de quem ainda não tem nada. */
  const semTurma = menuDaEscola({ turmas: [], blocos: [] });
  const grupo = (semTurma.coluna || []).find((g) => /Área do Professor/i.test(g.rotulo));
  provar('com ZERO turmas o menu ainda tem o grupo «Área do Professor»', Boolean(grupo),
    semTurma.coluna.map((g) => g.rotulo));
  const rotulos = grupo ? grupo.itens.map((i) => i.rotulo) : [];
  for (const nome of BASE_OBRIGATORIA) {
    provar('…com «' + nome + '»', rotulos.indexOf(nome) !== -1, rotulos);
  }
  provar('…e SEM «Aulas»: aula é documento de ciclo, e sem ciclo não há aula para listar',
    rotulos.indexOf('Aulas') === -1, rotulos);
  const desenhoVazio = nav.desenhar(semTurma, '/');
  provar('…e o desenho dessa escola vazia já sai com barra e coluna',
    Boolean(desenhoVazio) && /<nav class="topnav"/.test(desenhoVazio)
      && /<aside class="coluna/.test(desenhoVazio));

  const comTurma = menuDaEscola({ turmas: [{ variante: 'nivel-1', nome: 'Balé Nível 1' }],
    blocos: [] });
  const grupoComTurma = (comTurma.coluna || []).find((g) => /Área do Professor/i.test(g.rotulo));
  const rotulosComTurma = grupoComTurma ? grupoComTurma.itens.map((i) => i.rotulo) : [];
  provar('com turma, «Aulas» entra (o resto do menu continua dinâmico, como estava)',
    rotulosComTurma.indexOf('Aulas') !== -1, rotulosComTurma);

  fs.rmSync(raiz, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: a barra e a coluna existem em todas as '
    + TELAS.length + ' telas que o Worker serve (nada de aplicar menu à mão), o artefacto já nasce '
    + 'enquadrado, e o menu de uma escola sem turma nenhuma já leva os três formulários.');
})().catch((erro) => {
  console.error('provar-a-moldura-em-todas-as-telas: ' + erro.message);
  process.exit(1);
});
