#!/usr/bin/env node
'use strict';

/*
 * check-sem-destruicao.js — O REPOSITÓRIO NÃO SE APAGA, E ISTO É O QUE O IMPEDE.
 *
 *   uso: node tools/check-sem-destruicao.js
 *
 * ── PORQUE ESTE FICHEIRO EXISTE (17/11/2026) ─────────────────────────────────────────────────
 *
 * A decisão é dela, e não é uma preferência de estilo:
 *
 *   «Você nunca pode deletar um repositório, mesmo que eu peça. Não pode. Se for solicitado, você
 *    tem que dizer como isso é feito manualmente. Nunca pode deletar nenhum repositório. […] eu
 *    tenho medo disso por causa do expurgo.»
 *
 * O medo tem fundamento, e a sonda provou-o no mesmo dia: com `administration=write` — que a
 * alternância de visibilidade do painel exige —, um `DELETE /repos/{dono}/{repo}` **passa a
 * autenticação** (respondeu 404 a um nome inexistente, com `documentation_url` a apontar o
 * endpoint de apagar repositório, e não 403). Ou seja: o poder existe. Uma promessa não é uma
 * trava; um poder que existe e depende de boa conduta é exactamente o que esta casa recusa.
 *
 * ── O QUE SE PROCURA, e são duas coisas diferentes ──────────────────────────────────────────
 *
 *   A) **UM `DELETE` AO REPOSITÓRIO INTEIRO.** O endereço perigoso é `/repos/{dono}/{repo}` — o
 *      caminho que termina no repositório. `/repos/{dono}/{repo}/contents/…` é outra coisa (apaga
 *      um ficheiro, e é o que o expurgo faz); `/repos/{dono}/{repo}/actions/runs/{id}` é outra
 *      (apaga um registo de execução). A distinção é o CAMINHO, não o método: `DELETE` sobre o
 *      repositório apaga tudo, `DELETE` sobre um ficheiro apaga um ficheiro.
 *
 *   B) **UMA CHAMADA AO GITHUB CUJO MÉTODO VEM DE FORA.** Uma função que monta `{ method: metodo }`
 *      com o método recebido por parâmetro é uma porta aberta: quem a chama pode passar `DELETE`,
 *      e a leitura estática não vê. Só se olha para ficheiros que falam com a API do GitHub — o
 *      resto é ruído, e um guarda que grita 33 vezes não guarda nada. Um ficheiro do GitHub com a
 *      porta é DECLARADO em `PORTAS_ABERTAS`, com o motivo.
 *
 *   C) **O VERBO.** Ao endereço do repositório inteiro só se vai com `GET` (ler) ou `PATCH`
 *      (a visibilidade do §L9e). `PUT`, `POST` e `DELETE` nesse caminho ou apagam, ou transferem,
 *      ou mudam de dono — nenhum deles é uma operação desta casa.
 *
 * ── O QUE ESTE SCRIPT NÃO FAZ, e é honesto dizê-lo ─────────────────────────────────────────
 *
 * Não impede o agente de usar uma ferramenta externa que apague repositórios. Isso não se resolve
 * em código: resolve-se na instrução permanente (`AGENTS.md` §«O que nunca se faz» e
 * `.github/instructions/proibicoes.instructions.md`), que é carregada em todas as sessões. Este
 * script guarda o CÓDIGO — o outro guarda a CONDUTA. São duas camadas, e nenhuma das duas chega
 * sozinha.
 *
 * Sai com código 1 se encontrar um caminho que possa apagar o repositório.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');

/* Onde se procura. `experimentos/` entra de propósito: uma prova que apague um repositório a sério
 * é o pior sítio para ela existir, porque é onde ninguém olha antes de correr. */
const DIRETORIOS = ['motor', 'tools', 'experimentos', 'porta', 'raiz'];

/* AS DUAS ÚNICAS EXCLUSÕES, e ambas pela mesma razão: contêm as cadeias que se procuram PORQUE é
 * isso que elas fazem. Um auditor que se auditasse a si mesmo reprovaria sempre, e uma prova que
 * testa a recusa tem de conter aquilo que é recusado.
 *
 * A LISTA É FECHADA E CURTA DE PROPÓSITO. A prova `provar-trava-de-repositorio` confere que ela
 * tem exactamente estes dois nomes — acrescentar um terceiro exige mexer na prova, e é isso que
 * impede uma exclusão de entrar por descuido. */
const IGNORADOS = new Map([
  ['tools/check-sem-destruicao.js', 'é o auditor: contém as cadeias que procura'],
  ['experimentos/provar-trava-de-repositorio.js', 'é a prova do auditor: contém, em fixtures, o '
    + 'DELETE que tem de ser recusado — e escreve-os em ficheiros temporários, nunca num real'],
]);

/* Ficheiros cujo método HTTP vem de um parâmetro, e por isso não se pode decidir lendo.
 *
 * A LISTA TEM DE ESTAR CERTA NOS DOIS SENTIDOS: um ficheiro aqui que já não tenha a porta é uma
 * linha morta (e o script di-lo); um ficheiro com a porta que não esteja aqui é uma falha. */
const PORTAS_ABERTAS = [
  {
    ficheiro: 'motor/servidor/provisionar-escola.js',
    motivo: 'tem um helper genérico `api(etapa, token, metodo, caminho, corpo)` — mas ele monta '
      + '`https://api.cloudflare.com/client/v4` + caminho, e vai só para o Cloudflare. As chamadas '
      + 'ao GITHUB neste ficheiro (disparar o workflow e ler os runs) levam o verbo literal. Revisto '
      + 'a 17/11/2026: nenhum método variável chega a um endereço do GitHub.',
  },
];

/** Todos os `.js` de um diretório, recursivamente. */
function ficheirosJs(dir) {
  const saida = [];
  let entradas = [];
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch (erro) {
    return saida;
  }
  for (const e of entradas) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) saida.push(...ficheirosJs(p));
    else if (e.isFile() && /\.js$/.test(e.name)) saida.push(p);
  }
  return saida;
}

/**
 * O endereço é o REPOSITÓRIO INTEIRO?
 *
 * O caso perigoso é o caminho que termina no par dono/repo. Construções por concatenação são a
 * norma neste código, portanto a pergunta faz-se sobre o TEXTO da expressão: se ela contém
 * `/repos/` e NÃO contém, depois dele, nada que a prolongue (`/contents/`, `/actions/`, `/git/`,
 * `/branches`, `/pulls`, `/issues`, `/commits`, `/keys`, `/collaborators`, `/pages`, `/traffic`,
 * `/settings`), então aponta ao repositório.
 */
const PROLONGAMENTOS = [
  '/contents', '/actions', '/git', '/branches', '/pulls', '/issues', '/commits', '/keys',
  '/collaborators', '/pages', '/traffic', '/settings', '/releases', '/tags', '/hooks',
  '/deployments', '/environments', '/check-runs', '/statuses', '/labels', '/milestones',
  '/tarball', '/zipball', '/forks', '/transfer', '/readme', '/topics', '/languages', '/teams',
];

function apontaAoRepositorioInteiro(expressao) {
  const t = String(expressao || '');
  if (t.indexOf('/repos/') === -1) return false;
  /* Tudo o que vem depois do último `/repos/` — é aí que o prolongamento apareceria. */
  const cauda = t.slice(t.lastIndexOf('/repos/') + '/repos/'.length);
  return !PROLONGAMENTOS.some((p) => cauda.indexOf(p) !== -1);
}

/** As linhas com método DELETE explícito, e a expressão de URL na mesma instrução. */
function procurarDeletesDeRepositorio(texto) {
  const achados = [];
  const linhas = texto.split('\n');
  for (let i = 0; i < linhas.length; i += 1) {
    const l = linhas[i];
    if (!/method\s*:\s*['"]DELETE['"]/i.test(l)) continue;
    /* A URL pode estar na mesma linha, na anterior ou na seguinte — é como este código é escrito
     * (o `fetch(url, {…})` em várias linhas). Olha-se uma janela de cinco para cada lado. */
    const janela = linhas.slice(Math.max(0, i - 5), Math.min(linhas.length, i + 6)).join('\n');
    if (apontaAoRepositorioInteiro(janela)) achados.push({ linha: i + 1, texto: l.trim() });
  }
  return achados;
}

/**
 * O ficheiro fala com a API do GitHub?
 *
 * A pergunta é estreita de propósito: `method: metodo` num `fetch` falso de uma prova não é uma
 * porta para lado nenhum, e marcá-lo faria o guarda gritar 33 vezes — ruído que ensina a ignorá-lo.
 */
function falaComOGithub(texto) {
  return /api\.github\.com|\/repos\/|github-api/.test(texto);
}

/** Um `method:` que não é literal — a porta aberta. */
function temMetodoVariavel(texto) {
  return /method\s*:\s*(?!['"`])[A-Za-z_$][\w$.]*/.test(texto);
}

/**
 * O VERBO com que se vai ao repositório inteiro.
 *
 * Devolve a lista de verbos encontrados numa instrução cujo URL aponta ao repositório. `GET` e
 * `PATCH` são os legítimos: um lê, o outro muda a visibilidade (§L9e). Os outros são falha.
 */
function verbosNoRepositorio(texto) {
  const achados = [];
  const linhas = texto.split('\n');
  for (let i = 0; i < linhas.length; i += 1) {
    const janela = linhas.slice(Math.max(0, i - 5), Math.min(linhas.length, i + 6)).join('\n');
    if (!apontaAoRepositorioInteiro(janela)) continue;
    const m = /method\s*:\s*['"]([A-Z]+)['"]/i.exec(linhas[i]);
    if (m) achados.push({ linha: i + 1, verbo: m[1].toUpperCase(), texto: linhas[i].trim() });
  }
  return achados;
}

function principal() {
  const falhas = [];
  const notas = [];

  const comPorta = new Set();
  let lidos = 0;
  for (const d of DIRETORIOS) {
    for (const f of ficheirosJs(path.join(raiz, d))) {
      const rel = path.relative(raiz, f).split(path.sep).join('/');
      if (IGNORADOS.has(rel)) continue;
      let texto = '';
      try {
        texto = fs.readFileSync(f, 'utf8');
      } catch (erro) {
        falhas.push({ ficheiro: rel, motivo: 'não consegui ler o ficheiro' });
        continue;
      }
      lidos += 1;

      /* (A) O DELETE AO REPOSITÓRIO INTEIRO — a proibição. */
      for (const a of procurarDeletesDeRepositorio(texto)) {
        falhas.push({
          ficheiro: rel,
          linha: a.linha,
          motivo: 'um DELETE ao repositório inteiro — isto apaga tudo, e é proibido',
          trecho: a.texto,
        });
      }

      /* (C) O VERBO no endereço do repositório inteiro. O `DELETE` já foi apanhado acima e não se
       * repete aqui: um guarda que diz o mesmo erro duas vezes parece avariado, e a segunda linha
       * não acrescenta nada a quem o lê. */
      for (const v of verbosNoRepositorio(texto)) {
        if (v.verbo === 'GET' || v.verbo === 'PATCH' || v.verbo === 'HEAD') continue;
        if (v.verbo === 'DELETE') continue;
        falhas.push({
          ficheiro: rel,
          linha: v.linha,
          motivo: 'um ' + v.verbo + ' ao endereço do repositório inteiro — só GET (ler) e PATCH '
            + '(a visibilidade) vão a esse caminho',
          trecho: v.texto,
        });
      }

      /* (B) O MÉTODO QUE VEM DE FORA — só conta em quem fala com o GitHub. */
      if (falaComOGithub(texto) && temMetodoVariavel(texto)) comPorta.add(rel);
    }
  }

  const declaradas = new Set(PORTAS_ABERTAS.map((p) => p.ficheiro));
  for (const f of comPorta) {
    if (!declaradas.has(f)) {
      falhas.push({
        ficheiro: f,
        motivo: 'monta `method` a partir de um valor que não é literal — quem chamar pode passar '
          + 'DELETE, e a leitura estática não vê. Declare o ficheiro em PORTAS_ABERTAS com o motivo, '
          + 'ou escreva o verbo',
      });
    }
  }
  for (const p of PORTAS_ABERTAS) {
    if (!comPorta.has(p.ficheiro)) {
      notas.push(p.ficheiro + ' — declarado como porta aberta, mas já não monta `method`: '
        + 'a linha da lista está morta e deve sair');
    }
    /* DECLARADO E AUSENTE É NOTA, NÃO FALHA. Se o ficheiro for apagado ou renomeado, a declaração
     * fica velha — mas um ficheiro NOVO com a porta é apanhado pelo teste acima, portanto nada fica
     * escondido. Tratar a ausência como falha faria o guarda disparar sobre o que já não existe. */
    if (!fs.existsSync(path.join(raiz, p.ficheiro))) {
      notas.push(p.ficheiro + ' — declarado em PORTAS_ABERTAS e ausente do disco: a linha está morta');
    }
  }

  if (falhas.length) {
    console.log('FALHA — o código pode apagar o repositório, e isso não se faz.\n');
    for (const f of falhas) {
      console.log('  ERRO ' + f.ficheiro + (f.linha ? ':' + f.linha : ''));
      console.log('       ' + f.motivo);
      if (f.trecho) console.log('       → ' + f.trecho);
    }
    console.log('\n  O repositório não se apaga por código, por script nem por prova.');
    console.log('  Apagar um repositório faz-se à mão, em GitHub → Settings → Danger Zone,');
    console.log('  e é a proprietária quem o faz — nunca um agente, nunca um workflow.');
    process.exit(1);
  }

  console.log('  ok   ' + lidos + ' ficheiro(s) lidos em ' + DIRETORIOS.join('/, ') + '/');
  console.log('  ok   nenhum DELETE ao repositório inteiro (o caminho que apaga tudo)');
  console.log('  ok   nenhum verbo destrutivo no endereço do repositório inteiro (só GET e PATCH)');
  console.log('  ok   ' + (comPorta.size
    ? comPorta.size + ' porta(s) de método variável no GitHub, todas declaradas'
    : 'nenhum ficheiro que fala com o GitHub monta o método a partir de um valor recebido'));
  for (const n of notas) console.log('  nota ' + n);
}

principal();
