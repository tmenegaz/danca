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
    /**
     * GRAVA SÓ SE NÃO EXISTIR — e no disco isto é ATÓMICO de verdade (04/11/2026).
     *
     * O `flag: 'wx'` é o `O_CREAT | O_EXCL` do sistema de ficheiros: o kernel cria o arquivo ou
     * falha com `EEXIST`, e entre a verificação e a criação não há janela nenhuma. É a única
     * implementação deste contrato que pode prometer isso sem ressalva — as outras duas
     * (o GitHub e o KV) perguntam e escrevem em dois passos, e o que as salva é a condição do
     * lado do servidor.
     *
     * O CONTRATO FALTAVA AQUI, e o furo era real: `motor/nucleo/armazenamento.js` declara
     * `criar` desde 04/11/2026, o acervo implementou-o, e os DOIS adaptadores de base ficaram
     * sem ele — de modo que `gravarEnvelope` (que o sonda com `typeof`) caía sempre no
     * `guardar`, e a corrida do nome não estava fechada nem no CLI nem no KV. A bancada não o
     * viu porque montava o acervo direto; hoje ela monta o composto (ver
     * `experimentos/provar-verbos-do-armazenamento.js`).
     */
    async criar(chave, valor) {
      const alvo = absoluto(chave);
      await fs.promises.mkdir(path.dirname(alvo), { recursive: true });
      try {
        await fs.promises.writeFile(alvo, String(valor), { encoding: 'utf8', flag: 'wx' });
        return { criado: true };
      } catch (erro) {
        if (erro && erro.code === 'EEXIST') return { criado: false, jaExiste: true };
        throw erro;
      }
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
