'use strict';

/**
 * schemas-do-ciclo.js — os cinco schemas do ciclo, na pasta do professor, quando ela não os tem.
 *
 * **O defeito medido (22/10/2026).** Os schemas são por par (professor, ciclo) e nascem em
 * `tools/criar-escola.sh`, copiados do molde (`modelo/ciclos/`) para a pasta de quem **cria** a
 * escola. Uma turma pode estar na curadoria de OUTRO professor: o plano dele é elicitado, os
 * documentos são derivados, a variante é composta — e a pasta dele nunca teve schema. Medido num
 * clone da pasta de um professor novo, com o `.conf` e o PO escritos:
 *
 *   · `tools/hash-ciclo.sh` avisa «o PO existe, mas o po-schema.json não — PO não validado»
 *     e **ancora assim mesmo**;
 *   · e o schema do ciclo, ausente, faz `if [ -f "$SCHEMA" ]` não entrar: o validador do
 *     manifesto **nunca é chamado** (0 invocações, medido com `bash -x`). Não há aviso.
 *
 * Ou seja: o segundo professor recebia um ciclo com validação mais fraca que o do primeiro, em
 * silêncio, e a âncora fechava na mesma. Para quem está a testar o motor é o pior modo de falha:
 * o teste passa, e passou por não ter sido verificado.
 *
 * **Por que aqui e não em `criar-escola.sh`.** Aquele script só corre quando nasce uma ESCOLA. O
 * segundo professor nunca passa por lá — o primeiro ato que cria a pasta dele é a escrita do
 * plano. É aí que os schemas têm de aparecer.
 *
 * **Uma fonte por dado.** Os schemas são genéricos e não levam o número do ciclo no conteúdo
 * (`criar-escola.sh`: «os schemas são do ciclo (genéricos)»), por isso o molde é sempre
 * `modelo/ciclos/ciclo-01-*.json` e o destino leva o ciclo de verdade. Só se escreve o que FALTA:
 * um schema já existente é do professor, e reescrevê-lo seria editar o que já estava certo.
 *
 * Não lança: provisionar schema é um ato de apoio, e uma falha dele não pode abortar a escrita do
 * plano (que é o que o professor pediu). O que falhou é DITO no relatório — nunca engolido.
 */

// O `require` é TARDIO, como nos outros módulos da ponte: `escrever-po.js` requer este arquivo
// para provisionar os schemas, e no topo o ciclo fecharia com as constantes ainda vazias
// (medido: «Accessing non-existent property 'ACEITE' of module exports inside circular
// dependency»). Dentro da função, `escrever-po.js` já terminou de carregar.
const constantes = () => require('./escrever-po.js');

/** Os cinco schemas do domínio, na mesma ordem de `tools/criar-escola.sh`. */
const SUFIXOS = ['schema', 'po-schema', 'plano-schema', 'aula-schema', 'captura-schema'];

/** O ciclo do MOLDE. Fixo: o conteúdo dos schemas não muda com o número do ciclo. */
const CICLO_DO_MOLDE = '01';

function base64De(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

function deBase64(b64) {
  const binario = atob(String(b64).replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Garante os schemas do ciclo na pasta do professor.
 *
 * @param {object} o
 * @param {string} o.token     o PAT; sem ele não há nada a fazer (e não é erro do chamador)
 * @param {string} o.dono      `tmenegaz`
 * @param {string} o.repo      `danca`
 * @param {string} [o.ref]     o ramo (`main`)
 * @param {string} o.professor o SLUG — a pasta em `professores/`
 * @param {string} o.ciclo     `01`, `02`… (normaliza para dois dígitos)
 * @param {Function} [o.fetchImpl]
 * @returns {Promise<{criados: string[], pulados: string[], erros: string[], ok: boolean}>}
 */
async function garantirSchemasDoCiclo({ token, dono, repo, ref, professor, ciclo, fetchImpl }) {
  const relatorio = { criados: [], pulados: [], erros: [], ok: true };
  const prof = String(professor || '').trim();
  const nn = String(ciclo || '').trim().padStart(2, '0');
  if (!token || !prof || !nn) {
    relatorio.ok = false;
    relatorio.erros.push('sem token, professor ou ciclo — os schemas não foram conferidos');
    return relatorio;
  }

  const { ACEITE, API_VERSAO } = constantes();
  const f = fetchImpl || fetch;
  const cabecalhos = {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    'User-Agent': 'danca-worker',
  };
  const raiz = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/';
  const pasta = 'professores/' + prof + '/ciclos/';

  /** Um GET que devolve o texto, ou `null` no 404. */
  const ler = async (caminho) => {
    const resposta = await f(raiz + caminho, { method: 'GET', headers: cabecalhos });
    if (resposta.status === 404) return null;
    if (resposta.status !== 200) throw new Error('HTTP ' + resposta.status + ' em ' + caminho);
    const dados = await resposta.json();
    return deBase64(dados.content || '');
  };

  for (const sufixo of SUFIXOS) {
    const destino = pasta + 'ciclo-' + nn + '-' + sufixo + '.json';
    try {
      const atual = await ler(destino);
      if (atual !== null) {
        relatorio.pulados.push(destino);
        continue;
      }

      const molde = 'modelo/ciclos/ciclo-' + CICLO_DO_MOLDE + '-' + sufixo + '.json';
      const texto = await ler(molde);
      if (texto === null) {
        // Sem molde não se inventa schema: diz-se. É a diferença entre um ciclo sem validação e
        // um ciclo validado, e quem lê o relatório tem de saber qual dos dois tem.
        relatorio.ok = false;
        relatorio.erros.push('o molde ' + molde + ' não existe — ' + destino + ' ficou por criar');
        continue;
      }

      const resposta = await f(raiz + destino, {
        method: 'PUT',
        headers: cabecalhos,
        body: JSON.stringify({
          message: 'feat(schema): os schemas do ciclo na pasta de ' + prof,
          content: base64De(texto),
          ...(ref ? { branch: ref } : {}),
        }),
      });
      if (resposta.status >= 200 && resposta.status < 300) {
        relatorio.criados.push(destino);
      } else {
        relatorio.ok = false;
        relatorio.erros.push('PUT ' + destino + ' recusado: HTTP ' + resposta.status);
      }
    } catch (erro) {
      relatorio.ok = false;
      relatorio.erros.push(destino + ': ' + (erro && erro.message ? erro.message : String(erro)));
    }
  }

  return relatorio;
}

/**
 * OS CICLOS QUE A ESCOLA DECLARA — lidos dos manifestos no repositório.
 *
 * Não se adivinha «01». O `.conf` da escola é `ciclo-<NN>-<escola>.conf`, e vive em
 * `professores/<quem criou a escola>/ciclos/` — é a regra que `tools/criar-escola.sh` escreve.
 *
 * A PASTA DO PROFESSOR NOVO NÃO EXISTE, E ISSO É O CASO NORMAL (22/10/2026). Este é o ato que
 * cria o professor; a pasta dele nasce com os schemas que se está a provisionar. Procurar só
 * nela daria 404 sempre, e o ciclo viraria um palpite em TODA criação. Por isso a busca tem a
 * mesma ordem de `escrever-plano.js` (`confDaEscolaPara`): primeiro a pasta do professor, e
 * depois as dos outros — o manifesto da escola não é do professor que a criou.
 *
 * Devolve `{ ciclos, nota, de }`. `de` é a pasta onde o manifesto foi achado (ou `null`), e
 * `nota` só existe quando o ciclo foi ASSUMIDO — um palpite tem de ser visível.
 */
async function ciclosDaEscola({ token, dono, repo, ref, professor, escola, fetchImpl }) {
  const f = fetchImpl || fetch;
  const prof = String(professor || '').trim();
  const slug = String(escola || '').trim();
  if (!token || !prof || !slug) {
    return { ciclos: [CICLO_DO_MOLDE], de: null, nota: 'sem token, professor ou escola — assumido o ciclo 01' };
  }

  const cabecalhos = {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'danca-worker',
  };
  const raiz = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/';
  const pasta = (p) => raiz + 'professores/' + encodeURIComponent(p) + '/ciclos' +
    (ref ? '?ref=' + encodeURIComponent(ref) : '');

  /** Os nomes de uma pasta, ou `null` quando ela não existe / não respondeu. */
  const listar = async (p) => {
    try {
      const resposta = await f(pasta(p), { method: 'GET', headers: cabecalhos });
      if (resposta.status !== 200) return null;
      const dados = await resposta.json();
      return Array.isArray(dados) ? dados.map((i) => String((i && i.name) || '')) : null;
    } catch { return null; }
  };

  // SÓ O MANIFESTO DA VARIANTE CONTA. O `ciclo-NN.conf` (base) é do PROFESSOR e é partilhado
  // pelas escolas dele: aceitá-lo fazia a `breu` «declarar» o ciclo 01 de outro professor, sete
  // horas depois de ela ter sido expurgada. O que diz «esta escola tem este ciclo» é
  // `ciclo-NN-<escola>.conf`, que é o nome que `tools/criar-escola.sh` escreve.
  const doCiclo = new RegExp('^ciclo-([0-9]{2})-' + slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.conf$');
  const colher = (nomes) => {
    const achados = new Set();
    for (const nome of nomes || []) {
      const m = doCiclo.exec(nome);
      if (m) achados.add(m[1]);
    }
    return achados;
  };

  const primeira = await listar(prof);
  let achados = colher(primeira);
  if (achados.size) return { ciclos: [...achados].sort(), de: prof, nota: null };

  // A pasta do professor NOVO não existe (404 = `null`) ou não tem o manifesto: procura-se nas
  // dos outros. Uma listagem de `professores/`, e depois uma por pasta até achar — e ela acha na
  // primeira tentativa em todo repositório real, porque a escola tem um dono.
  let outras = [];
  try {
    const resposta = await f(raiz + 'professores' + (ref ? '?ref=' + encodeURIComponent(ref) : ''),
      { method: 'GET', headers: cabecalhos });
    if (resposta.status === 200) {
      const dados = await resposta.json();
      outras = (Array.isArray(dados) ? dados : [])
        .filter((i) => i && i.type === 'dir' && i.name !== prof)
        .map((i) => String(i.name));
    }
  } catch { outras = []; }

  for (const outra of outras) {
    achados = colher(await listar(outra));
    if (achados.size) return { ciclos: [...achados].sort(), de: outra, nota: null };
  }

  return {
    ciclos: [CICLO_DO_MOLDE],
    de: null,
    nota: 'nenhum manifesto de ' + slug + ' em pasta de professor — assumido o ciclo 01' +
      (primeira === null && outras.length === 0 ? ' (sem listagem do repositório)' : ''),
  };
}

/**
 * A ESTRUTURA INTEIRA DE UM PROFESSOR — os schemas de TODOS os ciclos que a escola declara.
 *
 * É o que o cadastro de professor chama, e a razão é a do desenho: um professor criado dentro
 * da escola é um professor que vai trabalhar nela. Deixar a estrutura para o «Guardar» do
 * plano ou do PO é deixá-la para o dia em que ela já é necessária — e é nesse dia que a falta
 * aparece, longe do ato que a devia ter criado.
 */
async function garantirEstruturaDoProfessor({ token, dono, repo, ref, professor, escola, fetchImpl }) {
  const { ciclos, nota, de } = await ciclosDaEscola({ token, dono, repo, ref, professor, escola, fetchImpl });
  const relatorio = { ok: true, ciclos: [], criados: [], pulados: [], erros: [], nota, de };
  for (const ciclo of ciclos) {
    const r = await garantirSchemasDoCiclo({ token, dono, repo, ref, professor, ciclo, fetchImpl });
    relatorio.ciclos.push(ciclo);
    relatorio.criados.push(...r.criados);
    relatorio.pulados.push(...r.pulados);
    relatorio.erros.push(...r.erros);
    if (!r.ok) relatorio.ok = false;
  }
  return relatorio;
}

module.exports = { garantirSchemasDoCiclo, garantirEstruturaDoProfessor, ciclosDaEscola, SUFIXOS, CICLO_DO_MOLDE };
