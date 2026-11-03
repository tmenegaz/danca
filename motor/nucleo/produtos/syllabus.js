'use strict';

/**
 * syllabus.js — o PRODUTO «syllabus»: a sequência de unidades de cada nível, com o que cada uma
 * exige, ensina e expressa.
 *
 * A DIFERENÇA EM RELAÇÃO AO DICIONÁRIO, e é a única: o dicionário responde «o que é este passo»;
 * o syllabus responde «em que ordem este nível o ensina, e para quê». O átomo é o mesmo (o termo
 * do vocabulário e o verbete que o decompõe); o que o syllabus acrescenta é a **ordem** — que já
 * existe em `progressao.json` — e a **camada pedagógica**, que é conteúdo e ainda não existe.
 *
 * A CAMADA PEDAGÓGICA NÃO SE INVENTA. O plano (PLANO-PRODUTOS-DO-MOTOR §7-B) diz que faltam três
 * declarações por unidade: o que ela **exige** do corpo, o que ela **ensina** (o eixo prioritário
 * naquele nível) e o que ela **expressa** (música, carácter, história, oralidade). Enquanto não
 * estiverem no dado, cada unidade sai com `[Preencher: …]` — e o manifesto conta as que faltam.
 * Um syllabus com as três em branco é uma LISTA, e o documento di-lo com essas palavras; o que
 * não se faz é preencher as três com texto de encher.
 *
 * E ELAS SÃO TRÊS DECLARAÇÕES, NÃO TRÊS EIXOS DE MEDIÇÃO (C20). O aviso é do plano e vale a pena
 * repeti-lo aqui: «os três eixos não são eixos — são prefixo de rótulo». Quem medir o aluno mede
 * nas dimensões do PO; isto é o programa, não a régua.
 *
 * DETERMINÍSTICO, como o dicionário: mesma entrada, mesmo byte.
 */

const comum = require('./comum.js');
const notacao = require('../notacao.js');

/** A camada pedagógica, lida de três chaves — e declarada em falta quando qualquer uma falta. */
const CAMPOS_DA_CAMADA = [
  { chave: 'exige', rotulo: 'Exige do corpo' },
  { chave: 'ensina', rotulo: 'Ensina' },
  { chave: 'expressa', rotulo: 'Expressa' },
];

/**
 * DE ONDE VEM CADA CAMPO DA CAMADA — a herança com sobreposição (decisão de 02/11/2026).
 *
 * O mesmo passo, ensinado em dois níveis, quase sempre **exige** a mesma coisa do corpo e quase
 * nunca **expressa** a mesma coisa: o que muda com o nível é o eixo prioritário. Repetir a
 * exigência em cada relação transformaria o dado numa cópia, e a primeira correcção deixaria as
 * cópias a divergir — que é a razão pela qual o «método» do verbete também não se repete.
 *
 * Então há dois lugares, e **a relação vence sempre**:
 *
 *   - no **termo** (`vocabulario.json`), o padrão daquele exercício — vale em todos os níveis;
 *   - na **relação** (`progressao.json`), a sobreposição — vale só naquele nível.
 *
 * A ORIGEM VAI ESCRITA NO DOCUMENTO. Um syllabus que apresenta como «do nível» o que veio do termo
 * faz uma afirmação falsa sobre quem declarou o quê; a marca `(herdado do termo)` custa três
 * palavras e devolve a autoria a quem a tem. E é a mesma regra do «— herda a metodologia do plano —».
 *
 * `ausente` quando **nenhum dos dois** declara: é a única situação que vira `[Preencher: …]`, e a
 * única que conta como lacuna. Herdar não é faltar.
 */
function camadaDaUnidade(termo, relacao) {
  const saida = {};
  for (const campo of CAMPOS_DA_CAMADA) {
    const noNivel = comum.comoLista(relacao && relacao[campo.chave]);
    if (noNivel.length) {
      saida[campo.chave] = { valores: noNivel, origem: 'nivel' };
      continue;
    }
    const noTermo = comum.comoLista(termo && termo[campo.chave]);
    saida[campo.chave] = noTermo.length
      ? { valores: noTermo, origem: 'herdado' }
      : { valores: [], origem: 'ausente' };
  }
  return saida;
}

/** A unidade tem a camada completa quando nenhum dos três campos está ausente. */
function camadaCompleta(camada) {
  return CAMPOS_DA_CAMADA.every((c) => camada[c.chave].origem !== 'ausente');
}

/** As unidades de um nível, na ordem em que `progressao.json` as declara. */
function unidadesDoNivel(relacoes, idDoNivel) {
  return (Array.isArray(relacoes) ? relacoes : [])
    .filter((r) => r && String(r.turma || '').trim() === idDoNivel);
}

/** O termo de uma unidade: pelo `id` (a forma do dado) e, se preciso, pelo nome (a antiga). */
function termoDaUnidade(porId, porNome, relacao) {
  const alvo = String((relacao && relacao.termo) || '').trim();
  if (!alvo) return null;
  return porId.get(alvo) || porNome.get(alvo) || null;
}

/** As músicas de um exercício, com a integridade de cada uma — a mesma leitura do dicionário. */
function musicasDoExercicio(alfabeto, nomeDoExercicio, escola) {
  const verbetes = (alfabeto && alfabeto.verbetes) || {};
  // A VISTA É A DA ESCOLA (03/11/2026): o catálogo mais o que é dela, com o dela a vencer. Sem o
  // parâmetro, é o catálogo — e é o que a edição que se vende tem de ser.
  const doExercicio = comum.semComentario(
    notacao.registosDaEscola(verbetes[nomeDoExercicio] || {}, escola));
  return Object.keys(doExercicio)
    .map((k) => comum.chaveDaMusica(k))
    .filter(Boolean)
    .sort((a, b) => Number(a.tempos) - Number(b.tempos) || comum.comparar(a.compasso, b.compasso))
    .map((m) => {
      const verbete = doExercicio[m.chave];
      return {
        musica: m,
        verbete,
        integridade: comum.integridadeDoVerbete(
          (verbete && verbete.celulas) || {}, verbete && verbete.cobre, m.tempos,
          notacao.coberturaDe),
      };
    });
}

/** O documento de um nível. Recebe tudo pronto; não lê nada. */
function documentoDoNivel({ turma, unidades, unidadesLidas, e, versao, licenca, fotografia }) {
  const linhas = [];
  linhas.push('---');
  linhas.push('projeto: Sistema Lastro');
  linhas.push('produto: syllabus');
  linhas.push('produto_id: produto:syllabus:' + e.modalidade + '/' + turma.id);
  linhas.push('modalidade: ' + e.modalidade);
  linhas.push('nivel: ' + turma.id);
  linhas.push('versao: ' + versao);
  if (fotografia) linhas.push('fotografia: ' + fotografia);
  linhas.push('licenca: ' + licenca.replace(/\n/g, ' '));
  linhas.push('---');
  linhas.push('');
  linhas.push('# Syllabus — ' + String(turma.nome || turma.id));
  linhas.push('');
  linhas.push('> **O que este documento é.** A sequência de unidades deste nível, na ordem em que');
  linhas.push('> o nível as declara, com o que cada uma exige do corpo, ensina e expressa —');
  linhas.push('> quando a escola o declarou.');
  linhas.push('>');
  linhas.push('> **O que ele não é.** Não é a aula: a aula é uma **sessão** deste programa, com a');
  linhas.push('> duração e a música da turma. E não é avaliação: o que se mede no aluno vive no');
  linhas.push('> Plano de Observação.');
  linhas.push('');
  const ref = [];
  if (String(turma.programaReferencia || '').trim()) {
    ref.push('**Programa de referência.** ' + String(turma.programaReferencia).trim());
  }
  if (String(turma.nivelReferencia || '').trim()) {
    ref.push('**Nível de referência.** ' + String(turma.nivelReferencia).trim());
  }
  if (ref.length) {
    linhas.push(ref.join(' · '));
    linhas.push('');
  }
  const comCamada = unidadesLidas.filter((u) => u.camadaCompleta).length;
  const comDecomposicao = unidadesLidas.filter((u) => u.musicas.length).length;
  linhas.push('**Conteúdo.** ' + unidades.length
    + (unidades.length === 1 ? ' unidade' : ' unidades')
    + ' — ' + comCamada + ' com a camada pedagógica completa, ' + comDecomposicao
    + ' com decomposição.');
  linhas.push('');

  if (!unidades.length) {
    linhas.push('> **[Preencher]** Este nível ainda não tem unidades declaradas. Enquanto não');
    linhas.push('> tiver, o syllabus dele é a lacuna — e publicá-lo vazio seria dizer que o nível');
    linhas.push('> não ensina nada.');
    linhas.push('');
    return linhas.join('\n') + '\n';
  }

  linhas.push('## Unidades');
  linhas.push('');
  unidadesLidas.forEach((u, i) => {
    linhas.push('### ' + (i + 1) + '. ' + String(u.termo ? (u.termo.termo || u.termo.id) : u.relacao.termo));
    linhas.push('');
    const selo = [];
    if (u.termo) selo.push('**Categoria.** ' + comum.rotuloDaCategoria(u.termo.categoria, e.rotulosDeCategoria));
    if (u.termo && String(u.termo.tradicao || '').trim()) {
      selo.push('**Tradição.** ' + String(e.rotuloDaTradicao
        ? e.rotuloDaTradicao(u.termo.tradicao) : u.termo.tradicao));
    }
    if (selo.length) {
      linhas.push(selo.join(' · '));
      linhas.push('');
    }
    if (!u.termo) {
      linhas.push('> **[conferir]** A relação aponta para `' + String(u.relacao.termo || '')
        + '`, que não está no vocabulário. A unidade fica sem definição até o id ser corrigido.');
      linhas.push('');
    }
    for (const campo of CAMPOS_DA_CAMADA) {
      const lido = u.camada[campo.chave];
      const marca = lido.origem === 'herdado' ? ' _(herdado do termo)_'
        : lido.origem === 'nivel' ? ' _(declarado no nível)_' : '';
      linhas.push('**' + campo.rotulo + '.** ' + (lido.valores.length
        ? lido.valores.join('; ') + marca
        : '[Preencher: ' + campo.rotulo.toLowerCase() + ']'));
      linhas.push('');
    }
    if (u.musicas.length) {
      const partes = u.musicas.map((m) => m.musica.tempos + ' tempos em ' + m.musica.compasso
        + (m.integridade.ok ? '' : ' [conferir: ' + m.integridade.motivos.join('; ') + ']'));
      linhas.push('**Decomposição.** ' + partes.join(' · '));
    } else {
      linhas.push('**Decomposição.** [Preencher: o exercício ainda não tem verbete]');
    }
    linhas.push('');
  });
  return linhas.join('\n') + '\n';
}

/** O documento de índice: todos os níveis, o que cada um tem e o que falta. */
function documentoIndice({ turmas, porNivel, e, versao, licenca, fotografia }) {
  const linhas = [];
  linhas.push('---');
  linhas.push('projeto: Sistema Lastro');
  linhas.push('produto: syllabus');
  linhas.push('produto_id: produto:syllabus:' + e.modalidade);
  linhas.push('modalidade: ' + e.modalidade);
  linhas.push('versao: ' + versao);
  if (fotografia) linhas.push('fotografia: ' + fotografia);
  linhas.push('licenca: ' + licenca.replace(/\n/g, ' '));
  linhas.push('---');
  linhas.push('');
  linhas.push('# Syllabus — ' + String(e.nomeDaModalidade || 'Balé Clássico'));
  linhas.push('');
  linhas.push('> **O que este documento é.** O índice do programa: cada nível, quantas unidades');
  linhas.push('> declara, e quantas têm a camada pedagógica e a decomposição. O programa de cada');
  linhas.push('> nível vive no seu próprio documento (`syllabus-<nível>.md`).');
  linhas.push('');
  linhas.push('| # | nível | unidades | com camada | com decomposição |');
  linhas.push('|:--|:--|--:|--:|--:|');
  for (const t of turmas) {
    const lido = porNivel.get(t.id);
    linhas.push('| ' + (t.ordem == null ? '' : t.ordem) + ' | ' + comum.celula(t.nome || t.id)
      + ' | ' + lido.unidades.length + ' | ' + lido.comCamada + ' | ' + lido.comVerbete + ' |');
  }
  linhas.push('');
  const vazios = turmas.filter((t) => !porNivel.get(t.id).unidades.length);
  if (vazios.length) {
    linhas.push('> **[Preencher] ' + vazios.length
      + (vazios.length === 1 ? ' nível ainda não tem unidades' : ' níveis ainda não têm unidades')
      + '.** ' + vazios.map((t) => t.nome || t.id).join(' · ') + '.');
    linhas.push('>');
    linhas.push('> O programa de um nível não se deduz do vizinho: cada um declara o seu. Enquanto');
    linhas.push('> não declarar, o syllabus dele é a lacuna — e é isso que este índice diz, em vez');
    linhas.push('> de o esconder numa linha vazia.');
    linhas.push('');
  }
  return linhas.join('\n') + '\n';
}

/**
 * O PRODUTO. `opcoes.nivel` gera um só nível; sem ele, o índice e um documento por nível.
 */
function gerar(entrada) {
  const e = entrada || {};
  const modalidade = String(e.modalidade || notacao.MODALIDADE_PADRAO);
  const alfabeto = e.alfabeto || null;
  const progressao = e.progressao || {};
  const incluirAdicoes = e.incluirAdicoes === true;
  const termos = comum.compor(e.vocabulario, incluirAdicoes ? e.adicoes : []);
  const versao = String(e.versao || '0.1.0');
  const fotografia = comum.rotuloDaFotografia(e.fotografia);
  const licenca = comum.licencaCitavel(e.licenca, e.fotografia);

  const porId = new Map();
  const porNome = new Map();
  for (const t of termos) {
    if (!t) continue;
    if (t.id) porId.set(String(t.id), t);
    if (t.termo) porNome.set(String(t.termo), t);
  }

  const lacunas = [];
  const turmas = (Array.isArray(progressao.turmas) ? progressao.turmas : [])
    .filter((t) => t && t.ativo !== false)
    .slice()
    .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0) || comum.comparar(a.nome, b.nome));

  const filtro = String(e.nivel || '').trim();
  const escolhidas = filtro
    ? turmas.filter((t) => String(t.id) === filtro || String(t.nome) === filtro)
    : turmas;

  if (filtro && !escolhidas.length) {
    return {
      ok: false,
      produto: 'syllabus',
      erro: 'o nível «' + filtro + '» não existe em progressao.json',
      lacunas: [comum.lacuna('nivel-inexistente', filtro, 'o nível no catálogo')],
      documentos: [],
      manifesto: null,
    };
  }

  const documentos = [];
  const porNivel = new Map();
  for (const turma of escolhidas) {
    const unidades = unidadesDoNivel(progressao.relacoes, String(turma.id || ''));
    const lidas = unidades.map((relacao) => {
      const termo = termoDaUnidade(porId, porNome, relacao);
      if (!termo) {
        lacunas.push(comum.lacuna('relacao-orfa', String(turma.id) + ' · ' + String(relacao.termo),
          'o termo no vocabulário'));
      }
      const musicas = termo ? musicasDoExercicio(alfabeto, termo.termo, e.escola) : [];
      const camada = camadaDaUnidade(termo, relacao);
      const completa = camadaCompleta(camada);
      if (!completa) {
        const faltam = CAMPOS_DA_CAMADA.filter((c) => camada[c.chave].origem === 'ausente')
          .map((c) => c.chave);
        lacunas.push(comum.lacuna('unidade-sem-camada', String(turma.id) + ' · '
          + String(termo ? termo.termo : relacao.termo),
        'a camada pedagógica (falta: ' + faltam.join(' · ') + ')'));
      }
      if (termo && !musicas.length) {
        lacunas.push(comum.lacuna('unidade-sem-verbete', String(turma.id) + ' · ' + termo.termo,
          'a decomposição em música'));
      }
      for (const m of musicas) {
        if (!m.integridade.ok) {
          lacunas.push(comum.lacuna('verbete-nao-fecha',
            String(turma.id) + ' · ' + termo.termo + ' · ' + m.musica.chave,
            m.integridade.motivos.join('; ')));
        }
      }
      return { relacao, termo, musicas, camada, camadaCompleta: completa };
    });

    if (!unidades.length) {
      lacunas.push(comum.lacuna('nivel-sem-unidades', String(turma.id),
        'as unidades do nível em progressao.json'));
    }

    porNivel.set(String(turma.id), {
      turma,
      unidades,
      unidadesLidas: lidas,
      comCamada: lidas.filter((u) => u.camadaCompleta).length,
      comVerbete: lidas.filter((u) => u.musicas.length).length,
      herdados: lidas.reduce((n, u) => n + CAMPOS_DA_CAMADA
        .filter((c) => u.camada[c.chave].origem === 'herdado').length, 0),
      declarados: lidas.reduce((n, u) => n + CAMPOS_DA_CAMADA
        .filter((c) => u.camada[c.chave].origem === 'nivel').length, 0),
      ausentes: lidas.reduce((n, u) => n + CAMPOS_DA_CAMADA
        .filter((c) => u.camada[c.chave].origem === 'ausente').length, 0),
    });

    documentos.push({
      nome: 'syllabus-' + String(turma.id) + '.md',
      texto: documentoDoNivel({
        turma, unidades, unidadesLidas: lidas, e: Object.assign({}, e, { modalidade }),
        versao, licenca, fotografia,
      }),
    });
  }

  // O ÍNDICE SÓ FAZ SENTIDO QUANDO HÁ MAIS DE UM NÍVEL. Um produto de um nível é o documento
  // dele; um índice com uma linha só seria uma capa a repetir o título.
  if (!filtro) {
    documentos.unshift({
      nome: 'syllabus-' + modalidade + '.md',
      texto: documentoIndice({ turmas: escolhidas, porNivel,
        e: Object.assign({}, e, { modalidade }), versao, licenca, fotografia }),
    });
  }
  if (!licenca) {
    lacunas.push(comum.lacuna('sem-licenca', 'produto',
      'o texto da licença que o contrato cita (LICENSE.md)'));
  }
  if (!fotografia) {
    lacunas.push(comum.lacuna('sem-fotografia', 'produto',
      'a data do catálogo que a licença nomeia (cláusula 1, ARQUITETURA-GERAL §10.2)'));
  }

  const manifesto = {
    id: 'produto:syllabus:' + modalidade,
    produto: 'syllabus',
    modalidade,
    versao,
    licenca,
    fotografia: fotografia || null,
    fonte: {
      fotografia: e.fotografia || null,
      alfabeto: alfabeto ? { id: alfabeto.id, versao: alfabeto.versao } : null,
      vocabulario: {
        catalogo: (Array.isArray(e.vocabulario) ? e.vocabulario : []).length,
        adicoes: (Array.isArray(e.adicoes) ? e.adicoes : []).length,
        incluidas: incluirAdicoes,
      },
      progressao: {
        turmas: turmas.length,
        niveis_gerados: escolhidas.length,
        relacoes: (Array.isArray(progressao.relacoes) ? progressao.relacoes : []).length,
      },
    },
    niveis: escolhidas.map((t) => {
      const lido = porNivel.get(String(t.id));
      return {
        id: String(t.id),
        nome: t.nome || String(t.id),
        ordem: t.ordem == null ? null : t.ordem,
        unidades: lido.unidades.length,
        com_camada: lido.comCamada,
        com_decomposicao: lido.comVerbete,
        camada: { herdados: lido.herdados, declarados: lido.declarados, ausentes: lido.ausentes },
        documento: 'syllabus-' + String(t.id) + '.md',
      };
    }),
    contagens: {
      niveis: escolhidas.length,
      niveis_com_unidades: escolhidas.filter((t) => porNivel.get(String(t.id)).unidades.length).length,
      unidades: Array.from(porNivel.values()).reduce((n, x) => n + x.unidades.length, 0),
      camada_herdada: Array.from(porNivel.values()).reduce((n, x) => n + x.herdados, 0),
      camada_declarada: Array.from(porNivel.values()).reduce((n, x) => n + x.declarados, 0),
      camada_ausente: Array.from(porNivel.values()).reduce((n, x) => n + x.ausentes, 0),
      lacunas: lacunas.length,
    },
    lacunas,
  };

  return {
    ok: true,
    produto: 'syllabus',
    id: manifesto.id,
    modalidade,
    versao,
    licenca,
    documentos,
    manifesto,
    lacunas,
  };
}

module.exports = { gerar, CAMPOS_DA_CAMADA, camadaDaUnidade, camadaCompleta };
