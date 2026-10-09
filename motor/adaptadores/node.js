'use strict';

/**
 * adaptadores/node.js — o armazenamento sobre o DISCO (fs).
 *
 * Implementa o contrato de `../nucleo/armazenamento.js` com `node:fs`, sob uma
 * raiz. É o mesmo comportamento do motor de sempre: o conteúdo e os envelopes
 * vivem em arquivos. Não sabe o que é um PO nem uma anamnese — só lê e escreve
 * bytes sob chaves.
 *
 * Uso:
 *   const { criarNode } = require('./adaptadores/node.js');
 *   const armazem = criarNode('/caminho/para/a/raiz');
 *   await armazem.guardar('envelope/x.json', texto);
 *   const texto = await armazem.ler('envelope/x.json');
 */

const fs = require('fs');
const path = require('path');

function criarNode(raiz) {
  const absoluto = (chave) => path.join(raiz, chave);

  return {
    async ler(chave) {
      try {
        return await fs.promises.readFile(absoluto(chave), 'utf8');
      } catch (erro) {
        if (erro && erro.code === 'ENOENT') return null;
        throw erro;
      }
    },
    async guardar(chave, valor) {
      const alvo = absoluto(chave);
      await fs.promises.mkdir(path.dirname(alvo), { recursive: true });
      await fs.promises.writeFile(alvo, String(valor), 'utf8');
    },
    async anexar(chave, linha) {
      const alvo = absoluto(chave);
      await fs.promises.mkdir(path.dirname(alvo), { recursive: true });
      await fs.promises.appendFile(alvo, String(linha), 'utf8');
    },
    async listar(prefixo) {
      // O prefixo casa com um diretório: anda-se por ele (recursivo, como o
      // `list({prefix})` do KV) e devolvem-se os caminhos relativos à raiz.
      const resultado = [];
      const dirDoPrefixo = prefixo.replace(/\/+$/, '');
      const andar = async (dirRelativo) => {
        let entradas;
        try {
          entradas = await fs.promises.readdir(absoluto(dirRelativo), { withFileTypes: true });
        } catch (erro) {
          if (erro && erro.code === 'ENOENT') return;
          throw erro;
        }
        for (const e of entradas) {
          const rel = (dirRelativo ? dirRelativo + '/' : '') + e.name;
          if (e.isDirectory()) await andar(rel);
          else if (rel.startsWith(prefixo)) resultado.push(rel);
        }
      };
      await andar(dirDoPrefixo);
      return resultado.sort();
    },
    async existe(chave) {
      try {
        await fs.promises.access(absoluto(chave));
        return true;
      } catch (erro) {
        if (erro && (erro.code === 'ENOENT' || erro.code === 'ENOTDIR')) return false;
        throw erro;
      }
    },
    async apagar(chave) {
      try {
        await fs.promises.unlink(absoluto(chave));
        return true;
      } catch (erro) {
        if (erro && erro.code === 'ENOENT') return false;
        throw erro;
      }
    },
  };
}

module.exports = { criarNode };
