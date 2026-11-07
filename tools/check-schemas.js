#!/usr/bin/env node
'use strict';

/*
 * check-schemas.js — o MOLDE e os schemas dos professores são a MESMA coisa, ou não são.
 *
 *   uso: node tools/check-schemas.js                    (o repositório inteiro)
 *        node tools/check-schemas.js --professor pe-torto   (só o que impede ESTE de gerar)
 *
 * PORQUE EXISTE, e o caso que o criou (01/11/2026). Os cinco schemas do ciclo são copiados de
 * `modelo/ciclos/ciclo-01-*.json` — por `tools/criar-escola.sh` quando nasce uma escola, e por
 * `motor/servidor/schemas-do-ciclo.js` quando um professor que NÃO criou a escola recebe uma
 * turma em curadoria. Nas duas portas a fonte é o molde.
 *
 * A 26/10/2026 duas correcções tiraram `ciclo` e `rubrica` do `required` do schema do PLANO — a
 * derivação deixou de emitir a ficha de identificação e a segunda tabela da rubrica, e um campo
 * obrigatório que ninguém escreve recusa todo documento. As correcções tocaram nos doze
 * professores que existiam e **não tocaram no molde**. Resultado, medido a 01/11/2026: os cinco
 * professores criados depois dessa data (luz-azul, meia-ponta, pe-torto, pirueta-aberta,
 * so-para-direita) nasceram com o `required` velho, e a primeira geração de ciclo de um deles
 * morreu em «campo ausente: ciclo · campo ausente: rubrica» — depois do PO validado, a meio do
 * caminho, com o pacote por gerar.
 *
 * O defeito não é de nenhum dos cinco: é do molde, e o molde é uma CÓPIA que ninguém comparava
 * com o original. Uma cópia sem comparação é uma segunda verdade, e a segunda verdade só se
 * descobre no dia em que dói.
 *
 * O QUE CONFERE, e são duas invariantes distintas:
 *
 *   1) O `REQUIRED` É O MESMO em todo o lado. O `required` é o contrato: diz o que um documento
 *      TEM de ter. Um professor pode ter mais propriedades (a captura declara as variantes de
 *      cada escola), mas um campo obrigatório a mais ou a menos é divergência de contrato — e é
 *      esta que parte a geração.
 *
 *   2) O CONTEÚDO É O MESMO, nos quatro schemas que não têm dado de ninguém. `schema`,
 *      `po-schema`, `plano-schema` e `aula-schema` são genéricos: nada neles é da escola nem do
 *      professor. A `captura-schema` é a excepção DECLARADA, e a única: ela guarda
 *      `_declaracao.porVariante`, que é de cada escola. Comparar o conteúdo contra o molde
 *      pedir-lhe-ia que perdesse o que a torna útil; o `required` dela continua a ser comparado.
 *
 *      CONTEÚDO, E NÃO BYTES. A 01/11/2026 a comparação era byte a byte — e era o reflexo do
 *      defeito: o molde era uma cópia, e a única coisa que se podia comparar era o ficheiro. Com
 *      um leitor único (`motor/nucleo/schemas.js`) o que interessa passou a ser o que o schema
 *      DIZ. Um ficheiro indentado de outra maneira diz o mesmo, e recusá-lo seria recusar
 *      formatação.
 *
 * A REFERÊNCIA É A MAIORIA, e não o molde. O molde é a fonte dos professores NOVOS, mas é uma
 * cópia — e uma cópia pode ficar atrás. Quando ele é o único no seu grupo, a leitura natural
 * («dezassete professores errados») manda corrigir os dezassete e deixa a fonte a produzir o
 * mesmo defeito. A maioria diz qual é o contrato em vigor; quem está fora dela é que se move.
 *
 * `--professor <slug>` NÃO É UM MODO MAIS FRACO: é a pergunta que a geração faz. O gerador não
 * se importa com os outros dezasseis — importa-se com o professor em causa, e a pergunta é se o
 * contrato DELE está em vigor. Com o filtro, um molde atrasado não bloqueia a geração de quem
 * está certo (e o repositório inteiro continua a ser conferido sem filtro, no pre-commit).
 *
 * Sai com 0 quando os contratos concordam, e 1 quando não — com os campos e os nomes.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');

// A LISTA E O MOLDE VÊM DO MÓDULO (01/11/2026). Havia aqui uma terceira cópia da lista dos cinco
// sufixos — uma no bash, uma no provisionador do Worker, uma nesta checagem —, e uma lista em
// três sítios é uma lista que diverge. `motor/nucleo/schemas.js` é o leitor único do molde,
// partilhado com as duas portas que o escrevem; esta checagem usa a mesma lista que elas.
//
// O `require` é feito por caminho ABSOLUTO, e não pelo `raiz` — é o único ponto em que a raiz do
// módulo e a raiz conferida podem divergir, e a prova (`experimentos/provar-schemas.js`) depende
// de poder apontar a checagem a uma árvore sintética: lá, o módulo é copiado para dentro dela e
// resolve os seus `require` a partir de si mesmo.
const schemas = require(path.join(raiz, 'motor', 'nucleo', 'schemas.js'));
const SUFIXOS = schemas.SUFIXOS;
const CICLO_DO_MOLDE = schemas.CICLO_BASE;
const MOLDE = path.join(raiz, 'modelo', 'ciclos');

/* NENHUM CARREGA DADO DE ESCOLA — DESDE 07/11/2026, E ISSO PASSOU A SER VERIFICADO.
 *
 * Aqui havia uma exceção: a `captura-schema` guardava `_declaracao.porVariante`, com o par
 * rótulo ↔ chave de cada escola, e por isso não se comparava com o molde. A exceção era a
 * cicatriz de um erro de casa — dado da ESCOLA dentro de uma CÓPIA do MOLDE, num ficheiro que o
 * expurgo preserva de propósito. Ela já tinha custado uma geração (a `batata` parou a
 * 20/10/2026, quando a entrada de uma ronda antiga sobreviveu à escola e contradisse o PO novo),
 * e o remédio de então foi um merge — não a mudança de casa.
 *
 * A declaração passou para `ciclo-NN-<variante>-captura-declaracao.json`, ao lado das fontes da
 * variante (o expurgo apaga-a com a escola). O schema voltou a ser o MOLDE, e a exceção sai: os
 * cinco passam a ser comparados pelo que dizem. Um ficheiro que carregue declarações de variante
 * é, agora, um ficheiro que ficou atrás.
 */
const COM_DADO_DA_ESCOLA = new Set();

const erros = [];
const ok = [];

/** O `--professor` — vazio é o repositório inteiro. */
function professorPedido(argv) {
  const i = argv.indexOf('--professor');
  const valor = i !== -1 ? String(argv[i + 1] || '').trim() : '';
  return valor || null;
}

/** Os professores que têm a pasta `ciclos/` — a lista vem do disco, não de uma constante. */
function professores() {
  const pasta = path.join(raiz, 'professores');
  return fs.readdirSync(pasta)
    .filter((nome) => {
      const ciclos = path.join(pasta, nome, 'ciclos');
      return fs.existsSync(ciclos) && fs.statSync(ciclos).isDirectory();
    })
    .sort();
}

/** Uma lista de `required` comparável: ordenada e sem repetidos. A ordem não é contrato. */
const canonico = (lista) => JSON.stringify([...new Set(Array.isArray(lista) ? lista : [])].sort());

/**
 * O CONTEÚDO, e não os bytes. Dois ficheiros que dizem o mesmo schema com indentação diferente
 * dizem a mesma coisa — e recusá-los seria recusar formatação. Foi o que a unificação de
 * 01/11/2026 tornou explícito: o molde é lido por um módulo só, que serve a forma canónica a quem
 * ESCREVE um ficheiro novo; quem já tem o seu continua com ele, e a comparação é do que ele diz.
 *
 * `JSON.stringify` de um objeto parseado é estável (a ordem das chaves é a de inserção, e o
 * `require`/`JSON.parse` preservam-na), e é por isso que serve de assinatura.
 */
const assinatura = (dados) => JSON.stringify(dados);

/** Todos os ficheiros de um sufixo, com o dono e (quando é professor) o slug. */
function ficheirosDe(sufixo) {
  const lista = [];
  const doMolde = path.join(MOLDE, 'ciclo-' + CICLO_DO_MOLDE + '-' + sufixo + '.json');
  if (!fs.existsSync(doMolde)) {
    erros.push('molde: falta ' + path.relative(raiz, doMolde) + ' — sem ele, nenhum professor novo ' +
      'tem os cinco schemas');
    return null;
  }
  lista.push({ dono: 'molde', caminho: doMolde });
  for (const prof of professores()) {
    const pasta = path.join(raiz, 'professores', prof, 'ciclos');
    for (const arquivo of fs.readdirSync(pasta).sort()) {
      const m = new RegExp('^ciclo-(\\d+)-' + sufixo.replace(/-/g, '\\-') + '\\.json$').exec(arquivo);
      if (!m) continue;
      lista.push({ dono: prof + '/ciclo-' + m[1], professor: prof, caminho: path.join(pasta, arquivo) });
    }
  }
  return lista;
}

function conferirSufixo(sufixo, soEste) {
  const ficheiros = ficheirosDe(sufixo);
  if (!ficheiros) return;

  // LÊ TUDO PRIMEIRO. A maioria decide-se com o repositório inteiro, mesmo quando só se vai
  // falar de um professor: «a maioria» é uma propriedade do repositório, não do filtro.
  const lidos = [];
  for (const f of ficheiros) {
    try {
      const dados = JSON.parse(fs.readFileSync(f.caminho, 'utf8'));
      lidos.push(Object.assign({}, f, { required: canonico(dados.required), texto: assinatura(dados) }));
    } catch (e) {
      erros.push(sufixo + ': ' + f.dono + ' — JSON ilegível (' + e.message + ')');
    }
  }
  if (!lidos.length) return;

  if (soEste && !lidos.some((f) => f.professor === soEste)) {
    erros.push(sufixo + ': o professor «' + soEste + '» não tem ciclo-' + CICLO_DO_MOLDE + '-' + sufixo +
      '.json — a geração dele não tem este schema');
    return;
  }

  const grupos = new Map();
  for (const f of lidos) {
    if (!grupos.has(f.required)) grupos.set(f.required, []);
    grupos.get(f.required).push(f);
  }
  const referencia = [...grupos.values()].sort((a, b) => b.length - a.length)[0];
  const contrato = referencia[0].required;
  const emVigor = referencia[0].dono;

  // O QUE ESTE CHAMADOR QUER SABER. Sem filtro, todos os que estão fora da maioria. Com filtro,
  // só o professor pedido — os outros dezasseis não impedem a geração deste.
  const alvos = lidos.filter((f) => f.required !== contrato && (!soEste || f.professor === soEste));

  if (alvos.length) {
    const campos = (chave) => JSON.parse(chave);
    erros.push(sufixo + ': o `required` diverge do contrato em vigor (' + JSON.stringify(campos(contrato)) +
      ', como ' + emVigor + ' declara). Divergem: ' +
      alvos.map((f) => f.dono + ' → ' + JSON.stringify(campos(f.required))).join(' · ') +
      '. Um campo obrigatório que a derivação não escreve recusa TODO documento — e a geração ' +
      'falha em «campo ausente», depois de o PO já ter passado. Alinhe ' +
      (alvos.some((f) => f.dono === 'molde')
        ? 'modelo/ciclos/ciclo-' + CICLO_DO_MOLDE + '-' + sufixo + '.json com ' + emVigor +
          ' — o molde é a fonte dos schemas de quem entra, e um molde atrasado produz o defeito ' +
          'outra vez no próximo professor'
        : 'o schema de ' + alvos[0].dono + ' com o contrato em vigor (' + emVigor + ')'));
    return; // um defeito, um erro: a comparação de bytes acusaria os mesmos ficheiros outra vez
  }
  ok.push(sufixo + ': o `required` é o mesmo nos ' + lidos.length + ' ficheiros (molde + professores)');

  // --- o ficheiro inteiro, nos que não têm dado de ninguém ---
  if (COM_DADO_DA_ESCOLA.has(sufixo)) {
    ok.push(sufixo + ': não se compara byte a byte — declara as variantes de cada escola (' +
      lidos.length + ' ficheiros, `required` conferido)');
    return;
  }
  // Com filtro, o professor é comparado com a MAIORIA (o contrato em vigor); sem filtro, com o
  // molde — e como o `required` já convergiu, o molde está na maioria.
  const modelo = soEste ? referencia[0] : lidos.find((f) => f.dono === 'molde');
  const universo = soEste ? lidos.filter((f) => f.professor === soEste) : lidos.filter((f) => f.dono !== 'molde');
  const divergentes = universo.filter((f) => f.texto !== modelo.texto && f.dono !== modelo.dono);
  if (divergentes.length) {
    // A CORRECÇÃO É UMA CHAMADA, e o erro diz qual — não é preciso «alinhar à mão» cinco ficheiros.
    // É o género de mensagem que faz a diferença entre uma checagem que ensina e uma que só ralha.
    erros.push(sufixo + ': ' + divergentes.map((f) => f.dono).join(', ') + ' diz outra coisa que ' +
      modelo.dono + ', e este schema não tem dado de escola nem de professor — a diferença é ' +
      'deriva, não declaração. O conteúdo em vigor está em ' + path.relative(raiz, modelo.caminho) +
      '; o professor recebe-o com `node tools/gerar-schemas.js --professor <slug> --ciclo <NN> ' +
      '--forcar`, e o molde, se for ele o atrasado, com o conteúdo do contrato em vigor');
  } else {
    ok.push(sufixo + ': os ' + universo.length + ' professores têm o schema igual ao molde');
  }
}

const soEste = professorPedido(process.argv.slice(2));
for (const sufixo of SUFIXOS) conferirSufixo(sufixo, soEste);

if (erros.length) {
  for (const e of erros) console.error('FALHA  ' + e);
  console.error('\ncheck-schemas: ' + erros.length + ' divergência(s).');
  process.exit(1);
}
for (const o of ok) console.log('ok     ' + o);
console.log('\ncheck-schemas: TUDO CERTO — ' + (soEste
  ? 'o contrato de ' + soEste + ' está em vigor'
  : 'o molde e os professores dizem o mesmo contrato') + '.');
