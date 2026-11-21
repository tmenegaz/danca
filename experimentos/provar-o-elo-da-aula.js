#!/usr/bin/env node
'use strict';

/**
 * provar-o-elo-da-aula.js — A GERAÇÃO NÃO PODE APAGAR O ELO DA AULA.
 *
 * O DEFEITO, medido a 20/11/2026. No `tools/gerar-ciclo.sh`, o plano de cada aula era copiado
 * para o `-anterior.json` **incondicionalmente**, antes de o novo ser escrito:
 *
 *     [ -f plano-aula-NN.json ] && cp plano-aula-NN.json plano-aula-NN-anterior.json
 *
 * O efeito é o contrário do que o próprio script decide dois parágrafos acima («o anterior não se
 * perde»): **uma geração sem alteração nenhuma apagava o elo**, e o «anterior» passava a ser uma
 * cópia do atual. Medido no `ciclo-01-breu-rosa`: o elo tinha 44 linhas de diferença, uma corrida
 * de rotina — «correr para ver se está tudo bem» — zerou-as.
 *
 * PORQUE É GRAVE, e não é arrumação: o elo é a §1.2 do `ARQUITETURA-AULA.md` — «o anterior
 * permanece, o novo é um elo, e o diff é a justificativa». Um gerador que o apaga a cada corrida
 * destrói a justificativa de cada ajuste, e destrói-a por rotina. É a família que este repositório
 * não admite: a proveniência acrescenta, não edita.
 *
 * O QUE SE MEDE, e são três casos porque a regra tem três lados:
 *
 *   A. UMA GERAÇÃO SEM MUDANÇA NÃO TOCA NO ELO. É o caso do defeito.
 *   B. UMA GERAÇÃO COM MUDANÇA MOVE O ELO — e move-o para o estado ANTERIOR, que é o que a §1.2
 *      promete. Sem esta asserção, «não mexer nunca» passaria na A e estaria igualmente errado.
 *   C. DEPOIS DE MUDAR, OUTRA GERAÇÃO SEM MUDANÇA NÃO TOCA OUTRA VEZ. Sem esta, o elo mover-se-ia
 *      a cada corrida depois da primeira mudança — o defeito com uma máscara.
 *
 * COMO SE MEDE SEM TOCAR NO REPOSITÓRIO: tudo corre num `git worktree` temporário, criado do HEAD
 * e removido no fim. O ciclo real da `breu-rosa` não é tocado — e o `git status` da sessão fica
 * limpo, que é a diferença entre uma prova e um acidente.
 *
 * O SCRIPT TESTADO É O DO DISCO, e não o do HEAD: o worktree nasce do HEAD, e o `gerar-ciclo.sh` é
 * copiado por cima. Sem isso, a prova mediria a versão antiga sempre que corresse antes do commit —
 * e uma prova que só passa depois do commit não serve para decidir se se commita.
 *
 *   node experimentos/provar-o-elo-da-aula.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PROFESSOR = 'demi-plie';
const CICLO = '01';
const VARIANTE = 'breu-rosa';
const PACOTE = path.join('professores', PROFESSOR, 'ciclos', 'ciclo-' + CICLO + '-' + VARIANTE);
const FONTE_DA_AULA = path.join('professores', PROFESSOR, 'ciclos',
  'ciclo-' + CICLO + '-' + VARIANTE + '-aula-01.md');

let provas = 0;
let falhas = 0;
function conferir(titulo, condicao, detalhe) {
  provas += 1;
  /* UMA CONDIÇÃO QUE NÃO É BOOLEANA É UM ENGANO, NÃO UMA PROVA (20/11/2026).
   *
   * A primeira versão desta prova passava `sha(atual), planoAntes` — duas STRINGS — ao lugar do
   * booleano. Uma string não vazia é `truthy`, portanto as cinco asserções de comparação de hash
   * passavam SEMPRE: com o defeito reposto, a prova continuava verde. Foi a prova de mutação que
   * o mostrou, e é a razão de ela existir.
   *
   * Aqui a condição é verificada: quem escrever a próxima asserção assim recebe uma falha alta em
   * vez de um «ok» que não mede nada. */
  if (typeof condicao !== 'boolean') {
    falhas += 1;
    console.log('FALHA ' + titulo + ' → a condição não é booleana ('
      + typeof condicao + ': ' + JSON.stringify(condicao).slice(0, 60) + ') — é um engano da prova');
    return;
  }
  if (condicao) { console.log('ok    ' + titulo); return; }
  falhas += 1;
  console.log('FALHA ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const sha = (caminho) => crypto.createHash('sha256').update(fs.readFileSync(caminho)).digest('hex');

/** Corre a geração, no worktree, e devolve o que ele disse (silencioso quando dá certo). */
function gerar(onde) {
  const r = execFileSync('bash', [path.join(onde, 'tools', 'gerar-ciclo.sh'),
    PROFESSOR, CICLO, VARIANTE], { cwd: onde, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return r;
}

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'elo-da-aula-'));
  const onde = path.join(temp, 'repo');
  let worktree = false;
  try {
    execFileSync('git', ['worktree', 'add', '--detach', onde, 'HEAD'], { cwd: RAIZ, stdio: 'ignore' });
    worktree = true;
    /* O SCRIPT DO DISCO — ver o cabeçalho. */
    fs.copyFileSync(path.join(RAIZ, 'tools', 'gerar-ciclo.sh'),
      path.join(onde, 'tools', 'gerar-ciclo.sh'));

    const eloDoRepositorio = sha(path.join(RAIZ, PACOTE, 'plano-aula-01-anterior.json'));
    const pacote = path.join(onde, PACOTE);
    const atual = path.join(pacote, 'plano-aula-01.json');
    const elo = path.join(pacote, 'plano-aula-01-anterior.json');
    const fonte = path.join(onde, FONTE_DA_AULA);

    console.log('\nA. Uma geração sem mudança NÃO toca no elo');
    const eloAntes = sha(elo);
    const planoAntes = sha(atual);
    gerar(onde);
    conferir('o plano não mudou (a geração é determinística)', sha(atual) === planoAntes,
      { antes: planoAntes.slice(0, 8), depois: sha(atual).slice(0, 8) });
    conferir('…e o elo continua o mesmo', sha(elo) === eloAntes,
      { antes: eloAntes.slice(0, 8), depois: sha(elo).slice(0, 8) });

    console.log('\nB. Uma geração COM mudança move o elo para o estado anterior');
    /* A mutação é a MENOR possível e continua válida: o volume-alvo é o ponto médio da faixa
     * 150–200, e 170 está dentro dela. Mudar para fora da faixa faria o gerador recusar, e a prova
     * mediria a recusa em vez do elo. */
    /* A MUTAÇÃO ATINGE AS TRÊS OCORRÊNCIAS — e foi preciso descobrir isso à força.
     *
     * A primeira versão mudava só o front-matter (`volume-total-120`), e o plano saiu IGUAL: o
     * validador lê o volume da TABELA do §1 («Volume ativo | 175 tempos») e confere o front-matter
     * contra ela. Mudar um lado só é inconsistência; mudar os dois é o ajuste. A terceira
     * ocorrência é a frase da auditoria do §7, que também sai no JSON. */
    const texto = fs.readFileSync(fonte, 'utf8');
    conferir('a fonte da aula declara o volume que a prova vai mudar',
      (texto.match(/175 tempos/g) || []).length === 3,
      (texto.match(/175 tempos/g) || []).length);
    fs.writeFileSync(fonte, texto.replace(/175 tempos/g, '170 tempos'), 'utf8');
    gerar(onde);
    conferir('o plano da aula mudou', sha(atual) !== planoAntes, {
      antes: planoAntes.slice(0, 8), depois: sha(atual).slice(0, 8),
    });
    /* O ELO PASSA A SER O PLANO QUE ESTAVA LÁ ANTES — byte a byte. É a asserção que distingue
     * «moveu» de «moveu para o sítio certo». */
    conferir('…e o elo é exatamente o plano anterior', sha(elo) === planoAntes,
      { esperado: planoAntes.slice(0, 8), obtido: sha(elo).slice(0, 8) });

    console.log('\nC. Depois de mudar, outra geração sem mudança NÃO toca outra vez');
    const eloDepoisDaMudanca = sha(elo);
    const planoDepoisDaMudanca = sha(atual);
    gerar(onde);
    conferir('o plano continua o mesmo', sha(atual) === planoDepoisDaMudanca,
      { antes: planoDepoisDaMudanca.slice(0, 8), depois: sha(atual).slice(0, 8) });
    conferir('…e o elo NÃO volta a mover-se', sha(elo) === eloDepoisDaMudanca,
      { antes: eloDepoisDaMudanca.slice(0, 8), depois: sha(elo).slice(0, 8) });

    console.log('\nD. O ciclo real não foi tocado');
    /* A PRIMEIRA VERSÃO DESTA ASSERÇÃO ERA VACUIDADE — `sha(...) !== sha(elo) || true`, que passa
     * sempre. É a família que esta casa persegue: uma prova que se declara verde sem medir nada.
     * Agora compara-se o elo do repositório de trabalho com o que ele era antes de a prova correr. */
    conferir('o elo do repositório de trabalho está byte a byte como estava',
      sha(path.join(RAIZ, PACOTE, 'plano-aula-01-anterior.json')) === eloDoRepositorio,
      { antes: eloDoRepositorio.slice(0, 8),
        depois: sha(path.join(RAIZ, PACOTE, 'plano-aula-01-anterior.json')).slice(0, 8) });
  } finally {
    if (worktree) {
      try { execFileSync('git', ['worktree', 'remove', '--force', onde], { cwd: RAIZ, stdio: 'ignore' }); }
      catch (e) { /* a limpeza não é o que se mede */ }
    }
    fs.rmSync(temp, { recursive: true, force: true });
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o elo da aula fica onde está quando nada muda, passa a '
      + 'ser o estado anterior quando a aula muda, e não volta a mover-se na geração seguinte.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova estourou:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
