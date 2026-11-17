'use strict';

/*
 * unicidade.js — «este número já é de alguém?» (16/11/2026).
 *
 * A PERGUNTA NASCEU NA CRIAÇÃO DA ESCOLA: o CNPJ identifica a escola e o CPF identifica o
 * professor, e dois registos com o mesmo número são a mesma entidade contada duas vezes. A
 * varredura vivia em `raiz.js`, ao lado de quem a chamava — e isso bastava enquanto só a criação
 * a fazia.
 *
 * SAIU DE LÁ PORQUE AGORA HÁ UM SEGUNDO SÍTIO: o cadastro do professor, na Produção, passou a
 * poder corrigir o CPF de quem já existe. A conta a fazer é a MESMA — «este número pertence a
 * outra pessoa?» —, e uma segunda cópia divergiria na primeira vez que uma delas esquecesse o
 * `soDigitos` (que é o que faz `987.654.321-00` e `02150062917` serem o mesmo número).
 *
 * O QUE ELA CUSTA, e é bom que fique escrito: `kv.list` é a enumeração do namespace. Não há
 * índice de números, e criá-lo seria uma terceira cópia do dado (o cadastro já lá está) que se
 * esqueceria de atualizar no dia em que um cadastro fosse corrigido. O preço paga-se numa
 * criação de escola e numa correção de CPF — nunca na abertura de uma página.
 */

const cadastroDaEscola = require('../nucleo/cadastro-da-escola.js');

/**
 * QUEM JÁ TEM ESTE NÚMERO — a varredura, uma só, para os dois documentos.
 *
 * `prefixo` + `sufixo` dizem ONDE procurar (`bastidores/<escola>/cadastro` para o CNPJ,
 * `professores/<slug>/contato` para o CPF), e `campo` diz o que comparar. `ignorar` é o slug de
 * quem está a ser corrigido — sem ele, gravar a ficha de um professor sem mudar o CPF encontrá-lo
 * -ia a ele próprio e recusaria a gravação.
 */
async function quemTemEsteNumero(env, { prefixo, sufixo, campo, valor, ignorar }) {
  const alvo = cadastroDaEscola.soDigitos(valor);
  const kv = env && env.PADD_KV;
  if (!alvo || !kv || typeof kv.list !== 'function') return null;
  const re = new RegExp('^' + prefixo + '\\/([a-z0-9-]+)\\/' + sufixo + '$');
  try {
    const lista = await kv.list({ prefix: prefixo + '/' });
    for (const chave of ((lista && lista.keys) || [])) {
      const nome = String((chave && chave.name) || '');
      const m = re.exec(nome);
      if (!m) continue;
      const slug = m[1];
      if (ignorar && slug === ignorar) continue;
      const texto = await kv.get(nome);
      if (!texto) continue;
      let registo = null;
      try { registo = JSON.parse(texto); } catch (erro) { continue; }
      if (registo && cadastroDaEscola.soDigitos(registo[campo]) === alvo) return slug;
    }
  } catch (erro) { return null; }
  return null;
}

/** A escola que já tem este CNPJ — ou `null`. */
function cnpjJaUsado(env, cnpj, ignorar) {
  return quemTemEsteNumero(env, {
    prefixo: 'bastidores', sufixo: 'cadastro', campo: 'cnpj', valor: cnpj, ignorar,
  });
}

/** O professor que já tem este CPF — ou `null`. */
function cpfJaUsado(env, cpf, ignorar) {
  return quemTemEsteNumero(env, {
    prefixo: 'professores', sufixo: 'contato', campo: 'cpf', valor: cpf, ignorar,
  });
}

module.exports = { quemTemEsteNumero, cnpjJaUsado, cpfJaUsado };
