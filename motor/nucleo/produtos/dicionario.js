'use strict';

/**
 * dicionario.js — o PRODUTO «dicionário»: o vocabulário e o que cada passo É.
 *
 * O QUE ELE RESPONDE. «O que é um `battement fondu`, de que categoria é, em que tradição se
 * escreve assim, e como se decompõe em música?» — para o catálogo INTEIRO, e não para o
 * subconjunto de um ciclo (que é o que o glossário do ciclo faz, e continua a fazer).
 *
 * DE ONDE VEM. `vocabulario.json` (o que cada termo é) e `notacao.json` (a decomposição, quando
 * existe). Não há uma terceira fonte: o glossário do ciclo é a MESMA função aplicada a um
 * subconjunto — a diferença é o alcance, não a regra.
 *
 * O QUE ELE NÃO FAZ, e é o que o torna vendável:
 *
 *   · **não inventa.** Um termo sem definição escrita sai com `[Preencher: …]`, e um exercício sem
 *     verbete sai com a lacuna declarada. O documento publicado não é uma promessa do que a
 *     escola vai preencher — é o que o catálogo tem, com o que falta nomeado;
 *   · **não leva as edições de uma escola** por omissão. `adicoes` só entra com `incluirAdicoes`
 *     explícito, e o manifesto diz quantos termos ficaram de fora e por quem foram escritos;
 *   · **não publica um número torto.** Um verbete cujo `cobre` não fecha os tempos aparece com
 *     `[conferir]` e o motivo, nunca com a contagem que ele declara.
 *
 * DETERMINÍSTICO. Não olha o relógio e não ordena por nada que não esteja no dado: duas execuções
 * sobre a mesma entrada dão o mesmo byte. É o que o plano exige (§Fase 2) e o que a prova mede.
 */

const comum = require('./comum.js');
const notacao = require('../notacao.js');

/** Os termos de um exercício no alfabeto, por música — sem a chave de comentário. */
function musicasDoExercicio(alfabeto, nomeDoExercicio, escola) {
  const verbetes = (alfabeto && alfabeto.verbetes) || {};
  // A VISTA É A DA ESCOLA (03/11/2026): o catálogo mais o que é dela, com o dela a vencer. Sem o
  // parâmetro, é o catálogo — e é o que a edição que se vende tem de ser.
  const doExercicio = comum.semComentario(
    notacao.registosDaEscola(verbetes[nomeDoExercicio] || {}, escola));
  const chaves = Object.keys(doExercicio)
    .map((k) => comum.chaveDaMusica(k))
    .filter(Boolean)
    // A ordem das músicas é a dos tempos, e não a dos bytes: `8|4/4` antes de `10|4/4`.
    .sort((a, b) => Number(a.tempos) - Number(b.tempos) || comum.comparar(a.compasso, b.compasso));
  return chaves.map((m) => ({ musica: m, verbete: doExercicio[m.chave] }));
}

/** A tabela de uma música: uma linha por trecho, com o compasso calculado e a notação composta. */
function tabelaDaMusica(musica, verbete) {
  const celulas = comum.semComentario((verbete && verbete.celulas) || {});
  const numerador = Number(String(musica.compasso).split('/')[0]) || 4;
  const compasso = comum.compassosDasCelulas(celulas, notacao.temposDaCelula, numerador);
  const linhas = [];
  for (const direcao of Object.keys(celulas)) {
    (celulas[direcao] || []).forEach((c, k) => {
      linhas.push({
        compasso: compasso.get(direcao + ':' + k) || 1,
        contagem: String((c && c.contagem) || '').trim(),
        // A REPETIÇÃO ENTRA NA COLUNA (02/11/2026). Um trecho «1–2» repetido duas vezes ocupa
        // QUATRO tempos, e a tabela que só mostrasse «1–2» diria a um leitor que ele não enche a
        // música — que é exactamente o contrário do que o verbete declara. O número vai ao lado
        // da contagem, e não numa coluna nova: numa tabela de seis colunas, a sétima é a que
        // ninguém lê.
        repeticoes: Number((c && c.repeticoes) || 1),
        direcao: direcao || '—',
        pista: String((c && c.categoria) || '').trim() || '—',
        bloco: comum.blocoDaCelula(c),
        descricao: String((c && c.descricao) || '').trim(),
      });
    });
  }
  const integridade = comum.integridadeDoVerbete(
    celulas, verbete && verbete.cobre, musica.tempos, notacao.coberturaDe);
  return { linhas, integridade };
}

/**
 * O DOCUMENTO. Recebe o catálogo já lido e devolve texto — nunca lê nada.
 *
 * `opcoes.incluirAdicoes` é a única porta para as adições da escola, e é fechada por omissão: o
 * dicionário que se vende é o do catálogo.
 */
function gerar(entrada) {
  const e = entrada || {};
  const modalidade = String(e.modalidade || notacao.MODALIDADE_PADRAO);
  const alfabeto = e.alfabeto || null;
  const incluirAdicoes = e.incluirAdicoes === true;
  const termos = comum.compor(e.vocabulario, incluirAdicoes ? e.adicoes : []);
  const versao = String(e.versao || '0.1.0');
  const fotografia = comum.rotuloDaFotografia(e.fotografia);
  const licenca = comum.licencaCitavel(e.licenca, e.fotografia);
  // A CONDIÇÃO DE CONTEÚDO DA LICENÇA, EXECUTÁVEL (ARQUITETURA-GERAL §10.4). Por omissão a edição é
  // a INTERNA — mostra tudo, e é a que a escola e o projeto usam. A `paga` é a que se vende, e nela
  // uma descrição sem `fonte` NÃO ENTRA: «não se licencia o que não se declarou como seu». A regra
  // não fica na boa intenção de quem gera — fica no código, e o manifesto conta o que saiu.
  const edicao = String(e.edicao || 'interna').trim() === 'paga' ? 'paga' : 'interna';
  const semFonteComDescricao = termos.filter((t) => String(t.descricao || '').trim()
    && !String(t.fonte || '').trim()).map((t) => t.id || t.termo);

  const lacunas = [];
  const comDefinicao = termos.filter((t) => String(t.descricao || '').trim()).length;
  const comFonte = termos.filter((t) => String(t.fonte || '').trim()).length;
  const comVerbete = [];
  const semVerbete = [];
  const naoFecham = [];

  const porCategoria = new Map();
  for (const t of termos) {
    const cat = String(t.categoria || '').trim() || '(sem categoria)';
    if (!porCategoria.has(cat)) porCategoria.set(cat, []);
    porCategoria.get(cat).push(t);

    if (!String(t.descricao || '').trim()) {
      lacunas.push(comum.lacuna('termo-sem-definicao', t.id || t.termo,
        'a definição do que acontece'));
    }
    if (!String(t.fonte || '').trim()) {
      lacunas.push(comum.lacuna(
        edicao === 'paga' && String(t.descricao || '').trim()
          ? 'descricao-fora-da-edicao-paga' : 'termo-sem-fonte',
        t.id || t.termo,
        'a origem da definição (a licença não a pode cobrir)'));
    }

    const musicas = musicasDoExercicio(alfabeto, t.termo, e.escola);
    if (musicas.length) comVerbete.push(t.id || t.termo);
    else if (t.categoria === 'passo' || t.categoria === 'salto' || t.categoria === 'ligacao'
      || t.categoria === 'giro') {
      // SÓ O EXERCÍCIO PEDE DECOMPOSIÇÃO. Uma posição ou uma direção não se decompõe em música:
      // pedir-lhe um verbete seria pedir a resposta errada com a cara da certa.
      semVerbete.push(t.id || t.termo);
      lacunas.push(comum.lacuna('exercicio-sem-verbete', t.id || t.termo,
        'a decomposição em música'));
    }
    for (const m of musicas) {
      const lida = tabelaDaMusica(m.musica, m.verbete);
      if (!lida.integridade.ok) {
        naoFecham.push(t.id || t.termo);
        lacunas.push(comum.lacuna('verbete-nao-fecha', (t.id || t.termo) + ' · ' + m.musica.chave,
          lida.integridade.motivos.join('; ')));
      }
    }
  }
  if (!licenca) {
    lacunas.push(comum.lacuna('sem-licenca', 'produto',
      'o texto da licença que o contrato cita (LICENSE.md)'));
  }
  if (!fotografia) {
    // A CLÁUSULA 1 NÃO SE CUMPRE SEM ELA — mas ela não se inventa. Sem `git` (ou sem catálogo
    // commitado) não há data a citar, e a lacuna di-lo; o produto continua a gerar-se.
    lacunas.push(comum.lacuna('sem-fotografia', 'produto',
      'a data do catálogo que a licença nomeia (cláusula 1, ARQUITETURA-GERAL §10.2)'));
  }

  // ---------------------------------------------------------------- o documento
  const declaracao = alfabeto ? notacao.declaracao(alfabeto) : null;
  const linhas = [];
  linhas.push('---');
  linhas.push('projeto: Sistema Lastro');
  linhas.push('produto: dicionário');
  // O `produto_id` NOMEIA A EDIÇÃO (02/11/2026): o do catálogo e o de uma escola não são o mesmo
  // objecto, e dar-lhes o mesmo id faria a âncora de um produto (fase 3) cobrir o outro.
  linhas.push('produto_id: produto:dicionario:' + modalidade
    + (String(e.escola || '').trim() ? '/' + String(e.escola).trim() : ''));
  linhas.push('modalidade: ' + modalidade);
  if (declaracao) linhas.push('alfabeto: ' + declaracao.id + ' v' + declaracao.versao);
  linhas.push('versao: ' + versao);
  linhas.push('edicao: ' + edicao);
  if (fotografia) linhas.push('fotografia: ' + fotografia);
  linhas.push('licenca: ' + licenca.replace(/\n/g, ' '));
  linhas.push('---');
  linhas.push('');
  linhas.push('# Dicionário — ' + String(e.nomeDaModalidade || 'Balé Clássico'));
  linhas.push('');
  linhas.push('> **O que este documento é.** O vocabulário do catálogo e aquilo que cada termo');
  linhas.push('> **é**: a definição, a categoria, a tradição em que se escreve assim, e a');
  linhas.push('> decomposição em música quando ela existe.');
  linhas.push('>');
  linhas.push('> **O que ele não é.** Não é avaliação, não é plano de aula e não substitui a');
  linhas.push('> curadoria: ele é a **matéria-prima** que a escola adopta. A origem de cada');
  linhas.push('> definição vai escrita ao lado dela — e, quando não está declarada, o documento');
  linhas.push('> di-lo em vez de a inventar.');
  linhas.push('');
  linhas.push('**Conteúdo.** ' + termos.length + (termos.length === 1 ? ' termo' : ' termos')
    + ' — ' + comDefinicao + ' com definição escrita, ' + comFonte + ' com origem declarada, '
    + comVerbete.length + ' com decomposição.');
  if (edicao === 'paga' && semFonteComDescricao.length) {
    linhas.push('');
    linhas.push('**Edição paga.** ' + semFonteComDescricao.length
      + (semFonteComDescricao.length === 1
        ? ' definição ficou de fora' : ' definições ficaram de fora')
      + ' por a origem não estar declarada — é a condição de conteúdo da licença (§3). Este');
    linhas.push('documento é o que se vende; a edição interna tem as ' + semFonteComDescricao.length
      + ' completas.');
  }
  if (incluirAdicoes) {
    const daEscola = termos.filter((t) => t.origem === 'escola').length;
    linhas.push('');
    linhas.push('**Adições da escola incluídas.** ' + daEscola
      + (String(e.escola || '').trim() ? ' da escola «' + String(e.escola).trim() + '»' : '')
      + ' — este documento NÃO é o do catálogo: são as duas camadas, e o manifesto diz quantas');
    linhas.push('são de cada.');
  }
  linhas.push('');

  if (lacunas.length) {
    linhas.push('> **[conferir] ' + lacunas.length + (lacunas.length === 1 ? ' lacuna' : ' lacunas')
      + ' neste dicionário.** Cada uma está nomeada no sítio onde falta, e o manifesto do');
    linhas.push('> produto repete-as em forma de lista para quem precisar de as fechar.');
    linhas.push('');
  }

  const ordem = comum.categoriasEmOrdem(termos, e.ordemDeCategoria);
  for (const cat of ordem) {
    linhas.push('## ' + comum.rotuloDaCategoria(cat, e.rotulosDeCategoria));
    linhas.push('');
    const lista = porCategoria.get(cat).slice().sort((a, b) => comum.comparar(a.termo, b.termo));
    for (const t of lista) {
      linhas.push('### ' + String(t.termo || t.id || '(sem nome)'));
      linhas.push('');
      const selo = [];
      selo.push('**Categoria.** ' + comum.rotuloDaCategoria(t.categoria, e.rotulosDeCategoria));
      if (String(t.tradicao || '').trim()) {
        selo.push('**Tradição.** ' + String(e.rotuloDaTradicao
          ? e.rotuloDaTradicao(t.tradicao) : t.tradicao));
      }
      if (t.origem === 'escola') selo.push('**Origem do termo.** acréscimo da escola');
      linhas.push(selo.join(' · '));
      linhas.push('');

      const descricao = String(t.descricao || '').trim();
      const retida = edicao === 'paga' && descricao
        && !String(t.fonte || '').trim();
      if (retida) {
        // A DESCRIÇÃO NÃO É APAGADA EM SILÊNCIO. O termo continua no dicionário — o nome do passo
        // não é obra de ninguém —, e o sítio da definição diz porque está vazio. Um buraco
        // explicado é uma lacuna; um buraco calado é uma promessa quebrada.
        linhas.push('> **Fora da edição paga.** A definição deste termo não entra na edição que se');
        linhas.push('> vende enquanto a origem dela não for declarada (licença, §3). Ela continua na');
        linhas.push('> edição interna.');
      } else {
        linhas.push(descricao || '[Preencher: a definição do que acontece]');
      }
      linhas.push('');

      const alternativos = comum.comoLista(t.alternativos);
      if (alternativos.length) {
        linhas.push('**Também chamado de.** ' + alternativos.join(' · '));
        linhas.push('');
      }
      const fonte = String(t.fonte || '').trim();
      linhas.push(fonte
        ? '**Origem.** ' + fonte
        : '**Origem.** [Preencher: de onde vem esta definição — sem isso, ela não entra na edição paga]');
      linhas.push('');

      const musicas = musicasDoExercicio(alfabeto, t.termo, e.escola);
      if (musicas.length) {
        linhas.push('#### Decomposição');
        linhas.push('');
        for (const m of musicas) {
          const lida = tabelaDaMusica(m.musica, m.verbete);
          const rotulo = m.musica.tempos + ' tempos em ' + m.musica.compasso;
          const metodo = String((m.verbete && m.verbete.metodo) || '').trim();
          linhas.push('**' + rotulo + '**'
            + (metodo ? ' · método ' + (e.rotuloDaTradicao ? e.rotuloDaTradicao(metodo) : metodo) : ''));
          linhas.push('');
          if (!lida.integridade.ok) {
            linhas.push('> **[conferir]** ' + lida.integridade.motivos.join('; ') + '.');
            linhas.push('> A contagem não é publicada até fechar — um número torto aqui é o que');
            linhas.push('> estraga a aritmética da aula pronta.');
            linhas.push('');
          }
          if (!lida.linhas.length) {
            linhas.push('[Preencher: a decomposição desta música]');
            linhas.push('');
            continue;
          }
          linhas.push('| compasso | contagem | direção | pista | notação | o que acontece |');
          linhas.push('|:--|:--|:--|:--|:--|:--|');
          for (const l of lida.linhas) {
            linhas.push('| ' + l.compasso + ' | '
              + comum.celula(l.contagem + (l.repeticoes > 1 ? ' ×' + l.repeticoes : '')) + ' | '
              + comum.celula(l.direcao) + ' | ' + comum.celula(l.pista) + ' | `'
              + comum.celula(l.bloco) + '` | ' + comum.celula(l.descricao) + ' |');
          }
          linhas.push('');
        }
      } else if (semVerbete.indexOf(t.id || t.termo) !== -1) {
        linhas.push('#### Decomposição');
        linhas.push('');
        linhas.push('[Preencher: a decomposição em música — este exercício ainda não tem verbete]');
        linhas.push('');
      }
    }
  }

  if (!termos.length) {
    linhas.push('> **Este catálogo está vazio.** Nenhum termo a publicar — e um dicionário vazio');
    linhas.push('> não é um dicionário: é a lacuna com o nome certo.');
    linhas.push('');
  }

  const manifesto = {
    id: 'produto:dicionario:' + modalidade
      + (String(e.escola || '').trim() ? '/' + String(e.escola).trim() : ''),
    escola: String(e.escola || '').trim() || null,
    produto: 'dicionario',
    modalidade,
    versao,
    edicao,
    licenca,
    fotografia: fotografia || null,
    fonte: {
      fotografia: e.fotografia || null,
      alfabeto: declaracao ? { id: declaracao.id, versao: declaracao.versao } : null,
      vocabulario: {
        catalogo: (Array.isArray(e.vocabulario) ? e.vocabulario : []).length,
        adicoes: (Array.isArray(e.adicoes) ? e.adicoes : []).length,
        incluidas: incluirAdicoes,
      },
    },
    contagens: {
      termos: termos.length,
      com_definicao: comDefinicao,
      com_origem: comFonte,
      com_decomposicao: comVerbete.length,
      sem_decomposicao: semVerbete.length,
      verbetes_que_nao_fecham: naoFecham.length,
      definicoes_fora_da_edicao_paga: edicao === 'paga' ? semFonteComDescricao.length : 0,
      lacunas: lacunas.length,
    },
    lacunas,
  };

  return {
    ok: true,
    produto: 'dicionario',
    id: manifesto.id,
    modalidade,
    versao,
    edicao,
    licenca,
    documentos: [{ nome: 'dicionario-' + modalidade + '.md', texto: linhas.join('\n') + '\n' }],
    manifesto,
    lacunas,
  };
}

module.exports = { gerar };
