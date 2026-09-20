#!/usr/bin/env node
'use strict';

/*
 * cifrar-dados.js — cifra o JSON de dados do ciclo para o pacote.
 *
 *   uso: SENHA=<senha> node tools/cifrar-dados.js <fonte.json> <destino.json>
 *
 * POR QUE EXISTE. O formulário de produção lê o JSON de dados AO LADO DELE, e o pacote é PÚBLICO:
 * então o JSON vai cifrado, como os acompanhamentos (a mesma senha, o mesmo esquema — tools/lib-cifra.js).
 *
 * O ENVELOPE tem três coisas:
 *   · `_cifrado`  — {algoritmo, iteracoes, endereco}, que a lib lê de volta;
 *   · `lancamentos` — QUANTAS aulas já têm dado. Não é segredo (o calendário é público) e é o que
 *     permite ao formulário abrir sem pedir a senha quando não há nada lançado: quem precisa da
 *     senha é quem vai LER o que já foi lançado;
 *   · `_nota`     — para quem abrir o arquivo sem saber o que ele é.
 *
 * A SENHA CHEGA POR AMBIENTE, não por argumento: argumento aparece na lista de processos do
 * sistema, ambiente não.
 */

const fs = require('fs');
const path = require('path');
const Cifra = require('./lib-cifra.js');

const [origem, destino] = process.argv.slice(2);
if (!origem || !destino) {
  console.error('uso: SENHA=<senha> node tools/cifrar-dados.js <fonte.json> <destino.json>');
  process.exit(2);
}
const senha = process.env.SENHA || '';
if (!senha) {
  console.error('cifrar-dados: falta a senha (ambiente SENHA)');
  process.exit(2);
}

const texto = fs.readFileSync(origem, 'utf8');
let lancamentos = 0;
let dados;
try {
  dados = JSON.parse(texto);
} catch (e) {
  console.error(`cifrar-dados: ${origem} não é JSON válido (${e.message})`);
  process.exit(1);
}
lancamentos = Object.keys((dados && dados.aulas) || {}).length;

const envelope = {
  _cifrado: Cifra.cifrarSync(texto, senha),
  lancamentos,
  _nota: 'O JSON de dados do ciclo, CIFRADO com a senha da escola (a mesma dos acompanhamentos): '
    + 'o pacote e publico e ele traz o lancamento por aluna. Quem decifra e o formulario de '
    + 'lancamento, no navegador, com tools/lib-cifra.js. O campo "lancamentos" NAO e secreto: diz '
    + 'se ha o que mostrar, para o formulario nao pedir a senha a toa. Nao editar a mao.',
};
fs.writeFileSync(destino, JSON.stringify(envelope, null, 2) + '\n', 'utf8');
console.log(`cifrado: ${path.basename(destino)} (${lancamentos} lançamento(s), `
  + `${envelope._cifrado.iteracoes} iterações)`);
