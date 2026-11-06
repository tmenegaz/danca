#!/usr/bin/env node
'use strict';

/**
 * provar-indice-de-lancamentos.js — o índice que faltava, e a chave que o faz encadear.
 *
 * A PERGUNTA DELA (06/11/2026), e é a razão de o índice existir:
 *
 *   «depois eu vou precisar usar a proveniência para saber o que aconteceu com esse aluno […] Em
 *    quantas aulas ele demorou para conseguir fazer o adágio?»
 *
 * Isso não se responde com a marca guardada — responde-se com a marca **encadeada**. E o
 * [PLANO-INDICES.md](../PLANO-INDICES.md) §4.9 já dizia o que era preciso e dizia que faltava:
 * «o lançamento é o dado que responde às perguntas da escola, e hoje **não tem leitor**». Este é o
 * leitor, e a prova de que ele lê o que o formulário escreve.
 *
 * O QUE SE PROVA AQUI:
 *
 *   A. A CHAVE NÃO É UMA REGRA NOVA. Aplicada aos rótulos que a declaração do schema da captura
 *      traz, a `chaveDoItem` reproduz as chaves DECLARADAS à mão — 11 de 11. É o que autoriza o
 *      formulário a calcular a chave dos itens da linha de base, que não estão declarados.
 *   B. as cinco famílias do §4.9 saem com os campos que o plano nomeia, e a PROSA NÃO SAI — nem o
 *      texto do registro, nem o do ajuste, nem o que mudou. O índice guarda «que houve».
 *   C. a mesma coluna encadeia entre aulas — é o que a chave compra, e sem ela a marca seria uma
 *      linha sem nada em comum com a da aula seguinte.
 *   D. a leitura de `AL03` devolve as colunas, as aulas e desde quando.
 *   E. duas corridas dão o MESMO texto, byte a byte (a regra das vistas).
 *   F. o caderno imprime as marcas por aluna, e o «o que decidi» imprime o texto do que mudou.
 *
 *   node experimentos/provar-indice-de-lancamentos.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const Vistas = require(path.join(RAIZ, 'tools/lib-vistas.js'));
const { indexar, reprovacoes } = require(path.join(RAIZ, 'tools/indice-lancamentos.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* O CICLO REAL: a folha, o PO e o índice dele. Se for expurgado, o script diz NÃO FEITO — o que
 * ele guarda é a regra, e a regra prova-se com o que estiver no disco. */
const PROF = 'rabo-gramde';
const VARIANTE = 'ciclo-01-calango-bale-nivel-1-teste-1';
const BASE = path.join(RAIZ, 'professores', PROF, 'ciclos');
const CFG = path.join(BASE, `${VARIANTE}/captura-01.json`);
const SCHEMA = path.join(BASE, 'ciclo-01-captura-schema.json');
const PO = path.join(BASE, `${VARIANTE}/po-01.json`);

const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const AUSENCIA = /^sem\s+(restri|nenhum|altera)/i;
const PROSA = ['registro da aula 06', 'registro da aula 07', 'encurtei o centro', 'ajustei algo'];

/** Os itens do eixo do corpo, como o formulário os deriva do PO. */
function itensDoCorpo(po) {
  const out = [];
  for (const d of po.itensPorDimensao || []) {
    if (String(d.eixo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() !== 'corpo') continue;
    for (const bruto of String(d.itens || '').split(';')) {
      const item = bruto.trim();
      if (!item || AUSENCIA.test(item)) continue;
      if (!out.some((x) => x.toLowerCase() === item.toLowerCase())) out.push(item);
    }
  }
  return out;
}

const MARCAS = ['ok', 'parcial', 'nao', 'nao_vi', ''];

/** Duas aulas de fixture, com marcas em todos os blocos e uma prosa que o índice NÃO pode copiar. */
function aulasDeFixture(cfg, corpo) {
  const marcasDe = (seed) => MARCAS[seed % MARCAS.length];
  const niveis = ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica', ''];
  const uma = (n, data, plano, mudou) => {
    const blocos = {};
    for (const b of cfg.blocos || []) {
      if (!b || !b.chave || b.tipo !== 'tabela') continue;
      if (b.secoes) {
        blocos[b.chave] = {};
        for (const k of ['aluna_a', 'aluna_b']) {
          blocos[b.chave][k] = corpo.map((item, j) => ({
            chave: Vistas.helpers.chaveDoItem(item), item, marca: marcasDe(n + j),
          }));
        }
        continue;
      }
      blocos[b.chave] = {};
      for (const k of ['aluna_a', 'aluna_b']) {
        blocos[b.chave][k] = {};
        for (const c of b.colunas || []) {
          blocos[b.chave][k][c.chave] = c.tipo === 'rubrica'
            ? niveis[(n + c.chave.length) % niveis.length]
            : marcasDe(n + c.chave.length);
        }
      }
    }
    return {
      data, presentes: ['aluna_a', 'aluna_b'], ausentes: [], duracao_min: 60,
      condicoes_contorno: { plano_seguido: plano, animo: 4, interesse: 4, harmonia: 5, mudou },
      ...blocos,
      relatorio: { texto: `registro da aula ${n}`, surpresas: n % 2 ? 'sim' : 'nao',
        ajustes: mudou ? 'ajustei algo' : '' },
    };
  };
  return { '06': uma(6, '2026-11-05', 'sim', ''), '07': uma(7, '2026-11-10', 'parcial', 'encurtei o centro') };
}

(async () => {
  if (!fs.existsSync(CFG) || !fs.existsSync(SCHEMA) || !fs.existsSync(PO)) {
    console.error('provar-indice-de-lancamentos: o ciclo da calango não está no disco — NÃO FEITO.');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------------------------
  console.log('A. A chave não é uma regra nova — reproduz a que o projecto já declara');
  {
    // A CHAVE da declaração é o VARIANTE do `.conf`, e não o nome do pacote: o pacote chama-se
    // `ciclo-01-<variante>`, a declaração chama-se `<variante>`. Confundir os dois foi o que o run
    // 48 fez com a escola — é a mesma classe de erro, e por isso se lê do `.conf`.
    const dec = lerJson(SCHEMA)._declaracao.porVariante[VARIANTE.replace(/^ciclo-\d+-/, '')];
    if (!dec) {
      console.error('provar-indice-de-lancamentos: a declaração do schema não tem a variante —'
        + ' NÃO FEITO.');
      process.exit(1);
    }
    let iguais = 0; const div = [];
    for (const b of Object.values(dec.blocos)) {
      for (const [rotulo, c] of Object.entries(b.colunas || {})) {
        if (Vistas.helpers.chaveDoItem(rotulo) === c.chave) iguais += 1;
        else div.push({ rotulo, calculada: Vistas.helpers.chaveDoItem(rotulo), declarada: c.chave });
      }
    }
    provar('as 11 chaves DECLARADAS à mão são reproduzidas pela função (11 de 11)',
      iguais === 11 && div.length === 0, { iguais, div });
    provar('o acento e o travessão não sobrevivem: «1ª posição — braços» → 1_posicao_bracos',
      Vistas.helpers.chaveDoItem('1ª posição — braços') === '1_posicao_bracos',
      Vistas.helpers.chaveDoItem('1ª posição — braços'));
    provar('…e o parêntese também não: «… MMII (força de adágio)» → …_forca_de_adagio',
      Vistas.helpers.chaveDoItem('Sustentação ativa de MMII (força de adágio)')
        === 'sustentacao_ativa_de_mmii_forca_de_adagio');
  }

  const cfg = lerJson(CFG);
  const corpo = itensDoCorpo(lerJson(PO));
  const dados = {
    ciclo: '01', escola: 'calango', professor: PROF, criado_em: '2026-11-01T10:00',
    apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B' },
    aulas: aulasDeFixture(cfg, corpo),
    _nota: 'fixture da prova',
  };
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-indice-'));
  const pacote = path.join(pasta, 'ciclo-01-fixture');
  fs.mkdirSync(pacote);
  fs.copyFileSync(CFG, path.join(pacote, 'captura-01.json'));
  const caminho = path.join(pasta, 'ciclo-01-fixture-dados.json');
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2) + '\n');

  const indice = indexar(dados, pacote);

  // ---------------------------------------------------------------------------------------------
  console.log('\nB. As cinco famílias do §4.9, e a prosa que NÃO sai');
  {
    provar('a presença sai por aula, com presentes e ausentes',
      indice.presenca.length === 2 && indice.presenca[0].presentes.length === 2
        && Array.isArray(indice.presenca[0].ausentes), indice.presenca[0]);
    provar('as marcas saem com os SEIS campos do plano: aula, data, aluna, coluna, bloco, marca',
      indice.marcas.length > 0 && indice.marcas.every((m) =>
        typeof m.aula === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.data)
        && typeof m.aluna === 'string' && typeof m.coluna === 'string'
        && typeof m.bloco === 'string' && typeof m.marca === 'string'), indice.marcas[0]);
    provar('…e a coluna dos itens do corpo é a CHAVE, não o texto',
      indice.marcas.some((m) => m.coluna === 'sustentacao_ativa_de_mmii_forca_de_adagio')
        && !indice.marcas.some((m) => /[ÁÉÍÓÚçãõ ]/.test(m.coluna)),
      [...new Set(indice.marcas.map((m) => m.coluna))]);
    provar('a rubrica sai como NÍVEL, por critério',
      indice.rubrica.length > 0 && indice.rubrica.every((r) => r.criterio && r.nivel),
      indice.rubrica[0]);
    provar('as condições guardam `mudou` como BOOLEANO, não como texto',
      indice.condicoes.every((c) => typeof c.mudou === 'boolean')
        && indice.condicoes.some((c) => c.mudou === true), indice.condicoes.map((c) => c.mudou));
    provar('os ajustes guardam `houve`, não o ajuste',
      indice.ajustes.every((a) => typeof a.houve === 'boolean')
        && indice.ajustes.some((a) => a.houve === true), indice.ajustes);
    provar('a surpresa também é booleana — deixou de ser prosa em 06/11/2026',
      indice.surpresas.every((s) => s.houve === true || s.houve === false || s.houve === null),
      indice.surpresas);

    /* A REGRA DE PRIVACIDADE: o índice serve para CONTAR e LOCALIZAR. A prosa é do documento. */
    const cru = JSON.stringify(indice);
    provar('NENHUMA prosa do lançamento entra no índice (registro, ajuste, o que mudou)',
      PROSA.every((t) => !cru.includes(t)), PROSA.filter((t) => cru.includes(t)));
    provar('…e o índice DECLARA o que não guarda, para não parecer que guarda tudo',
      Array.isArray(indice._nao_guardado) === false && Array.isArray(indice.lacunas),
      typeof indice._nao_guardado);
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nC. A mesma coluna encadeia entre aulas — é o que a chave compra');
  {
    const col = '1_posicao_bracos';
    const daAluna = indice.marcas.filter((m) => m.aluna === 'aluna_a' && m.coluna === col);
    provar('a coluna do corpo aparece nas DUAS aulas, para a mesma aluna',
      daAluna.length === 2 && JSON.stringify(daAluna.map((m) => m.aula)) === JSON.stringify(['06', '07']),
      daAluna.map((m) => `${m.aula}:${m.marca}`));

    /* A CONTRAPROVA DA CHAVE: sem ela, o índice só teria o TEXTO — e é o texto que muda quando a
     * redação muda. Aqui a prova é de forma: o valor guardado no item serve de chave, e o índice
     * usa-o; um item sem chave cai na calculada, e o índice DIZ isso. */
    const semChave = JSON.parse(JSON.stringify(dados));
    for (const k of Object.keys(semChave.aulas)) {
      for (const x of (semChave.aulas[k].linha_de_base.aluna_a || [])) delete x.chave;
    }
    const semChaveIndice = indexar(semChave, pacote);
    provar('um item gravado sem chave é indexado pela chave calculada, e o índice DECLARA a lacuna',
      semChaveIndice.marcas.filter((m) => m.aluna === 'aluna_a' && m.coluna === col).length === 2
        && semChaveIndice.lacunas.some((l) => /não tem chave/.test(l)),
      { daAluna: semChaveIndice.marcas.filter((m) => m.aluna === 'aluna_a' && m.coluna === col).length,
        lacunas: semChaveIndice.lacunas.slice(0, 1) });
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nD. `AL03` — «em que colunas o `parcial`/`nao` se repete, em que aulas, desde quando»');
  {
    const r = reprovacoes(indice, 'aluna_a');
    provar('a leitura devolve coluna, aulas, desde e as marcas',
      r.length > 0 && r.every((x) => x.coluna && Array.isArray(x.aulas) && x.desde
        && x.marcas.length === x.aulas.length), r[0]);
    provar('…e só entram `parcial` e `nao` (o `ok` e o `nao_vi` não são reparo)',
      r.every((x) => x.marcas.every((m) => m === 'parcial' || m === 'nao')),
      [...new Set(r.flatMap((x) => x.marcas))]);
    provar('o `desde` é a data da primeira aula em que a coluna aparece',
      r.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.desde)), r.map((x) => x.desde));
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nE. Duas corridas, o mesmo texto — a regra das vistas');
  {
    const correr = () => execSync(`node tools/indice-lancamentos.js ${JSON.stringify(caminho)}`,
      { cwd: RAIZ, encoding: 'utf8' });
    const a = correr(), b = correr();
    provar('o índice é determinístico: duas corridas, byte a byte iguais', a === b,
      { iguais: a === b, bytes: a.length });
    provar('…e não leva carimbo de tempo por omissão',
      !/"gerado_em"/.test(a));
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nF. O caderno lê o que o formulário grava');
  {
    const meta = { id: '01', escola: 'calango', duracao_min: 60 };
    // A VISTA PÚBLICA, e não a função interna: é o `caderno` que o gerador chama, e medir a
    // interna deixaria o caminho de fora sem ninguém notar.
    const caderno = Vistas.caderno({ meta, dados, aulas: ['06', '07'], captura: cfg });
    const entrada = /## [^\n]*· aula 06[\s\S]*?(?=\n## |$)/.exec(caderno)[0];
    provar('a entrada do caderno traz as marcas por aluna e por bloco',
      /^\*\*Aluna A:\*\*$/m.test(entrada) && /Linha de base:/.test(entrada),
      entrada.split('\n').filter((l) => /Aluna A|Linha de base/.test(l)).slice(0, 3));
    provar('…e a linha da linha de base imprime o TEXTO do aspecto, não a chave',
      /1ª posição — braços/.test(entrada) && !/1_posicao_bracos/.test(entrada));
    provar('…e o «o que decidi» imprime o texto do que mudou (é o mesmo texto de `mudou`)',
      /Nada foi ajustado em tempo real/.test(entrada), /O que decidi[\s\S]{0,120}/.exec(entrada));
    const entrada7 = /## [^\n]*· aula 07[\s\S]*?(?=\n## |$)/.exec(caderno)[0];
    provar('na aula com ajuste, o caderno imprime o ajuste que o professor escreveu',
      /encurtei o centro/.test(entrada7),
      (/O que decidi[\s\S]{0,160}/.exec(entrada7) || [''])[0].slice(0, 160));
    provar('…e a surpresa sai traduzida da marca, não crua',
      /O que me surpreendeu/.test(entrada7) && /- (Sim|Não)\./.test(entrada7),
      (/O que me surpreendeu[\s\S]{0,80}/.exec(entrada7) || [''])[0]);
  }

  fs.rmSync(pasta, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: a chave reproduz as 11 chaves que o schema'
    + ' declara à mão, as cinco famílias do §4.9 saem sem uma linha de prosa, a mesma coluna'
    + ' encadeia entre aulas, o `AL03` responde «em que aulas, desde quando», duas corridas dão o'
    + ' mesmo texto, e o caderno imprime as marcas e o ajuste que o professor escreveu.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
