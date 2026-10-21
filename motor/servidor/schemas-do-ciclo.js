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

module.exports = { garantirSchemasDoCiclo, SUFIXOS, CICLO_DO_MOLDE };
