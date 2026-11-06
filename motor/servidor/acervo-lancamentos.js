'use strict';

/**
 * acervo-lancamentos.js — o LANÇAMENTO DA AULA no repositório, e não no KV.
 *
 * O QUE MOTIVOU (06/11/2026, o relato dela). No celular, o lançamento da aula foi enviado, a
 * tela disse «aula lançada» — e ao recarregar a página a aula não existia mais, não havia
 * caderno, e o índice dizia que a aula nunca tinha sido dada. O diagnóstico não é «perdeu-se o
 * dado»: o dado estava lá, no KV, com o carimbo certo (`calango/rabo-gramde/01-2026-11-06T1537/`).
 * O que faltava era **quem o lesse**. Tudo o que este sistema mostra deriva do REPOSITÓRIO — o
 * pacote publicado, o índice de aulas, o caderno, o relatório. O KV não é lido por ninguém.
 *
 * A causa, e ela é de uma linha: o armazenamento composto (`acervo-envelopes.js`, `combinar`)
 * roteia a escrita pela FAMÍLIA da chave. `envelope/` foi para o repositório em 20/10/2026; o
 * lançamento, que não tinha família, caiu no «resto» — o KV — e ficou lá. O `ARQUITETURA-CAPTURA`
 * registou esta metade como aberta desde 29/09/2026: «a consolidação dos lançamentos de volta
 * para o repositório não existe». Este módulo é essa consolidação, feita do lado certo: em vez
 * de copiar depois, grava-se onde se lê.
 *
 * O QUE ELE GRAVA, E ONDE. A chave é `lancamento/<escola>/<professor>/<ciclo>-<carimbo>/<nome>`
 * (a mesma forma de sempre, com a família à frente), e o destino é o arquivo que a geração lê:
 *
 *   professores/<professor>/ciclos/ciclo-<NN>-<variante>-dados.json
 *
 * — o `-dados.json` CANÓNICO, aquele que o `fonte_dados()` de `tools/lib-fontes.sh` resolve. É
 * por isso que gravar aqui é o que faz a aula existir: o pacote é gerado a partir dele.
 *
 * «CADA ESTADO DO JSON É UM COMMIT» (IDEIA-CAPTURA, e é a razão de não haver carimbo dentro do
 * ficheiro). O histórico dos lançamentos é o histórico do Git — não uma pasta de envelopes, não
 * uma chave de KV. Apagar o KV não apaga nada, e é essa a prova de que a migração está feita.
 *
 * A FUSÃO, E PORQUE ELA NÃO É OPCIONAL. O cliente envia o ficheiro INTEIRO, montado a partir do
 * que leu. Um separador aberto há três dias carrega três dias de atraso: sem fusão, lançar a
 * aula 03 nesse separador APAGAVA a aula 06. A fusão é por aula (`aulas[nn]`), e a que chega
 * vence a que estava — salvo se for mais ANTIGA: o resgate do KV traz a versão de antes, e uma
 * aula já relançada não pode voltar atrás só porque o resgate correu depois. Quem manda é o
 * carimbo (`ultimo_lancamento`), que é o registro do próprio ato. As outras aulas ficam, e é
 * isso que torna o lançamento um acrescento e não uma substituição.
 *
 * A FONTE VAI EM CLARO, E A CÓPIA DO PACOTE VAI CIFRADA (06/11/2026). O `-dados.json` do
 * repositório é a FONTE e vai em CLARO — como sempre foi (`ciclo-01-…-dados.json` no `main`).
 * Cifrar a fonte quebraria a derivação do estado da aula: `ler_lancadas()` do `gerar-ciclo.sh` lê
 * `aulas` do ficheiro, e um `_cifrado` não tem `aulas`. Ao lado dela, o `<…>-dados.cifrado.json`
 * é a cópia PÚBLICA — e quem a copia para o pacote é o gerador, sem nunca ver a senha. Enquanto a
 * fonte só mudava no «Guardar» do PO, era ele que escrevia as duas. Agora o lançamento muda a
 * fonte, e este adaptador escreve as duas no mesmo acto: sem a cópia em dia, o `check-pacote`
 * reprova («a cópia do pacote DIVERGE da fonte na estrutura») e a aula não chega ao site.
 */

const { cabecalhosDe, base64De, textoDeBase64, detalheDe } = require('./github-api.js');
const { cifrarEnvelopeDeDados } = require('./cifrar-envelope.js');

const DONO_PADRAO = 'tmenegaz';
const REPO_PADRAO = 'danca';
const REF_PADRAO = 'main';

const API = 'https://api.github.com';

/** `lancamento/<escola>/<professor>/<ciclo>-<carimbo>/<nome>` → as partes, ou `null`. */
function partesDaChave(chave) {
  const m = /^lancamento\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(String(chave || ''));
  if (!m) return null;
  const [, escola, professor, cicloCarimbo, nome] = m;
  const c = /^(\d{2})-(.+)$/.exec(cicloCarimbo);
  if (!c) return null;
  // `.`/`..` e barras já não passam no regex; o que resta é o professor não poder escapar.
  if (professor === '.' || professor === '..') return null;
  return { escola, professor, ciclo: c[1], carimbo: c[2], nome };
}

/** O nome do arquivo de dados → a variante. `ciclo-01-calango-bale-…-dados-2026-…json`. */
function varianteDoNome(nome) {
  const m = /^ciclo-\d{2}-(.+)-dados(?:-\d{4}-\d{2}-\d{2}T\d{4})?\.json$/.exec(String(nome || ''));
  return m ? m[1] : null;
}

/** O caminho do `-dados.json` canónico — o que a geração lê. */
function caminhoDoDados(partes) {
  const variante = varianteDoNome(partes.nome);
  if (!variante) return null;
  return 'professores/' + partes.professor + '/ciclos/ciclo-' + partes.ciclo + '-' + variante + '-dados.json';
}

/** O carimbo de uma aula (`AAAA-MM-DDTHHMM`), que ordena lexicograficamente. `''` quando falta. */
const carimboDaAula = (a) => (a && typeof a.ultimo_lancamento === 'string' ? a.ultimo_lancamento : '');

function fundirAulas(antes, depois) {
  const a = (antes && antes.aulas) || {};
  const d = (depois && depois.aulas) || {};
  /* A QUE CHEGA VENCE — MAS SÓ SE NÃO FOR MAIS ANTIGA (06/11/2026). A regra nasceu para o
   * AJUSTE e para o separador aberto há dias: o cliente manda o ficheiro inteiro, e a aula que
   * ele acabou de escrever é a mais recente. Só que existe um segundo caminho, o RESGATE do KV:
   * o que está lá é a versão ANTIGA de uma aula que pode já ter sido relançada. Com «a que chega
   * vence» cegamente, resgatar o lançamento das 15:37 apagava o das 16:29 — o remédio desfazia o
   * trabalho que veio salvar. O carimbo é ISO até ao minuto, ordena em texto, e é o próprio
   * registro do ato: quem chegou depois é que é o estado. Sem carimbo num dos lados, vale a que
   * chega — é o único lado que pode ser o ato presente. */
  const aulas = Object.assign({}, a);
  for (const [nn, nova] of Object.entries(d)) {
    const velha = a[nn];
    if (velha && carimboDaAula(velha) && carimboDaAula(nova) && carimboDaAula(nova) < carimboDaAula(velha)) {
      continue;
    }
    aulas[nn] = nova;
  }
  const apelidos = Object.assign({}, (antes && antes.apelidos) || {}, (depois && depois.apelidos) || {});
  /* A RAIZ COMEÇA NA QUE JÁ ESTAVA e é sobreposta pela que chega. O cliente manda o ficheiro
   * inteiro, e no caso normal os dois coincidem — mas se um campo da raiz faltar no que chega
   * (`po`, `criado_em`), perdê-lo seria perder a ligação do ciclo ao PO, que é o que a proveniência
   * usa. Um campo em falta não é um campo apagado. */
  const saida = Object.assign({}, antes || {}, depois, { aulas });
  if (Object.keys(apelidos).length) saida.apelidos = apelidos;
  return saida;
}

/**
 * A CÓPIA CIFRADA DO PACOTE, QUE TEM DE ACOMPANHAR A FONTE (06/11/2026).
 *
 * O `gerar-ciclo.sh` NÃO cifra: quando existe o `<...>-dados.cifrado.json` ao lado da fonte, ele
 * apenas o COPIA para o pacote (caminho (a) — a `SENHA_CRIPTO` vive no Worker, e o Runner não a
 * tem). Enquanto o lançamento ia para o KV, a fonte só mudava no «Guardar» do PO, que escrevia as
 * duas; agora o lançamento muda a fonte, e a cópia ficou velha. A geração seguinte copiou-a e o
 * `check-pacote` reprovou: «a cópia do pacote DIVERGE da fonte na estrutura (lancamentos/apelidos)»
 * — o pacote saía com a aula por lançar, que é o sintoma dela outra vez, agora no CI.
 *
 * Por isso o adaptador escreve as DUAS: a fonte em claro e a cópia cifrada do pacote. A cópia é o
 * MESMO envelope do «Guardar» do PO (`cifrarEnvelopeDeDados`: `_cifrado`, `lancamentos`,
 * `apelidos`, `_nota`), para o formulário e o `check-pacote` não notarem diferença.
 */
function cifraEmDia(texto, dados) {
  try {
    const envelope = JSON.parse(texto);
    if (!envelope || !envelope._cifrado) return false;
    const lancamentos = Object.keys((dados && dados.aulas) || {}).length;
    if (Number(envelope.lancamentos) !== lancamentos) return false;
    return JSON.stringify(envelope.apelidos || {}) === JSON.stringify((dados && dados.apelidos) || {});
  } catch (erro) {
    return false;
  }
}

function criarAcervoDeLancamentos({ token, dono, repo, ref, fetchImpl, senhaCripto } = {}) {
  const f = fetchImpl || fetch;
  const donoFinal = dono || DONO_PADRAO;
  const repoFinal = repo || REPO_PADRAO;
  const ramo = ref || REF_PADRAO;
  const base = API + '/repos/' + donoFinal + '/' + repoFinal;

  /** Lê um caminho do repositório: `{ texto, sha }` ou `null` quando não existe. */
  async function lerCaminho(caminho) {
    const r = await f(base + '/contents/' + caminho + '?ref=' + encodeURIComponent(ramo), {
      method: 'GET',
      headers: cabecalhosDe(token),
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('leitura de ' + caminho + ': ' + await detalheDe(r));
    const dados = await r.json();
    if (!dados || typeof dados.content !== 'string') return null;
    return { texto: textoDeBase64(dados.content), sha: dados.sha };
  }

  /** Grava (ou cria) um caminho. Relê o `sha` a cada tentativa: a Contents API exige-o. */
  async function escreverCaminho(caminho, texto, mensagem) {
    let ultimo = 'não se tentou';
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      let sha = null;
      try {
        const atual = await lerCaminho(caminho);
        sha = atual ? atual.sha : null;
      } catch (erro) {
        return { ok: false, erro: erro.message };
      }
      const r = await f(base + '/contents/' + caminho, {
        method: 'PUT',
        headers: cabecalhosDe(token, { conteudo: true }),
        body: JSON.stringify(Object.assign({
          message: mensagem,
          content: base64De(texto),
          branch: ramo,
        }, sha ? { sha } : {})),
      });
      if (r.ok) {
        const dados = await r.json().catch(() => null);
        return {
          ok: true,
          criado: !sha,
          caminho,
          commit: dados && dados.commit && dados.commit.sha ? dados.commit.sha : null,
        };
      }
      ultimo = await detalheDe(r);
      // 409 é corrida com outro escritor (o `sha` mudou entre a leitura e a escrita): repete.
      if (r.status !== 409) break;
    }
    return { ok: false, erro: 'o repositório recusou a escrita: ' + ultimo };
  }

  return {
    /**
     * NUNCA «JÁ EXISTE». O destino é um arquivo só — o `-dados.json` canónico —, e ele existe
     * desde o «Guardar» do PO. Um `existe` verdadeiro aqui faria o SEGUNDO lançamento de um
     * ciclo ser recusado com «já existe um lançamento com este carimbo», que é falso: o carimbo
     * é outro. Quem protege contra o duplo clique é a fusão, que reconhece o mesmo carimbo na
     * aula e não escreve duas vezes (ver `guardar`).
     */
    async existe() {
      return false;
    },

    async guardar(chave, texto) {
      const partes = partesDaChave(chave);
      if (!partes) throw new Error('chave de lançamento inválida: ' + chave);
      // O ÍNDICE NÃO SE GRAVA: `ciclos.json` é GERADO pelo `gerar-ciclo.sh` a partir do `.conf` e
      // do calendário (e o `SOURCE_DATE_EPOCH` o torna determinístico). Gravá-lo aqui daria duas
      // versões da mesma lista, e a do cliente — montada a partir de um pacote velho — venceria.
      if (partes.nome === 'ciclos.json') {
        return { ok: true, ignorado: 'o ciclos.json é regenerado pela geração' };
      }
      const caminho = caminhoDoDados(partes);
      if (!caminho) throw new Error('não sei que arquivo de dados é «' + partes.nome + '»');

      let entrada;
      try {
        entrada = JSON.parse(texto);
      } catch (erro) {
        throw new Error('o lançamento não é JSON válido (' + erro.message + ')');
      }

      const atual = await lerCaminho(caminho);
      let antes = null;
      if (atual) {
        try { antes = JSON.parse(atual.texto); } catch (erro) { antes = null; }
      }
      // O MESMO CARIMBO DUAS VEZES É O MESMO ACTO — não se escreve de novo. Sem isto, o duplo
      // clique fazia dois commits idênticos, e o histórico passava a mentir sobre quantas vezes
      // a aula foi lançada.
      const aulas = (entrada && entrada.aulas) || {};
      const mesmos = Object.keys(aulas).length > 0 && Object.keys(aulas).every((nn) => {
        const deAntes = antes && antes.aulas && antes.aulas[nn];
        return deAntes && deAntes.ultimo_lancamento
          && deAntes.ultimo_lancamento === aulas[nn].ultimo_lancamento;
      });
      const fundido = fundirAulas(antes, entrada);
      const caminhoCifrado = caminho.replace(/-dados\.json$/, '-dados.cifrado.json');
      /* A CÓPIA CIFRADA É PARTE DO ACTO (06/11/2026). Mesmo que a fonte esteja igual, a cópia pode
       * estar velha — foi assim que a primeira geração depois do lançamento reprovou no CI. Se
       * ela está fora de dia, o acto ainda tem trabalho a fazer. Sem `SENHA_CRIPTO` (escola
       * legada, que cifra no gerador pelo `.senhas-locais`), não há cópia a manter: a fonte basta. */
      const numeros = Object.keys(aulas).sort();
      let fontePrecisa = !mesmos;
      let cifraPrecisa = false;
      if (fontePrecisa) {
        cifraPrecisa = Boolean(senhaCripto);
      } else if (senhaCripto) {
        const cifradoAtual = await lerCaminho(caminhoCifrado);
        cifraPrecisa = !(cifradoAtual && cifraEmDia(cifradoAtual.texto, fundido));
      }
      if (!fontePrecisa && !cifraPrecisa) return { ok: true, semMudanca: true, caminho };

      const mensagem = [
        'feat(lancamento): a aula ' + (numeros.join(' e ') || '?') + ' de '
          + partes.escola + '/' + partes.professor + '/' + varianteDoNome(partes.nome),
        '',
        'O lançamento da aula dado pelo formulário, gravado na FONTE que a geração lê'
          + ' (`-dados.json`), e não no KV. O KV não é lido por ninguém: era por isso que a'
          + ' aula «lançada» deixava de existir ao recarregar a página.',
        '',
        'Fusão por aula: o cliente envia o ficheiro inteiro montado a partir do que leu, e um'
          + ' separador aberto há dias apagaria as aulas lançadas desde então. As aulas que já'
          + ' estavam ficam; a que chega vence a dela (é o ajuste).',
        '',
        'Refs: ' + caminho + (cifraPrecisa ? '\nRefs: ' + caminhoCifrado : ''),
        'Regras: P-02, P-03, P-04, P-17',
        'Auditoria: lançamento de ' + partes.carimbo + ' — aula(s) ' + (numeros.join(', ') || '?')
          + '; fusão sobre ' + (antes ? Object.keys(antes.aulas || {}).length : 0) + ' aula(s) já gravada(s)',
      ].join('\n');

      let resultado = { ok: true, caminho };
      if (fontePrecisa) {
        const r = await escreverCaminho(caminho, JSON.stringify(fundido, null, 2) + '\n', mensagem);
        if (!r.ok) throw new Error(r.erro || 'o lançamento não foi gravado');
        resultado = r;
      }
      if (cifraPrecisa) {
        /* A CÓPIA CIFRADA DO PACOTE — a que o `gerar-ciclo.sh` copia. Se ela falhar, a fonte já
         * está gravada (o que é o dado), e o erro diz o que falta; o próximo acto a repara, porque
         * `cifraEmDia` confere a cópia mesmo quando a fonte não mudou. */
        const envelope = await cifrarEnvelopeDeDados(JSON.stringify(fundido, null, 2) + '\n', senhaCripto);
        const rc = await escreverCaminho(caminhoCifrado, JSON.stringify(envelope, null, 2) + '\n', mensagem);
        if (!rc.ok) {
          throw new Error('a fonte foi gravada, mas a cópia cifrada do pacote não: '
            + (rc.erro || 'o repositório recusou a escrita'));
        }
        resultado.cifrado = true;
      }
      return Object.assign({}, resultado, { aulas: numeros });
    },

    /** A leitura, para a consolidação e para quem quiser conferir. */
    async ler(chave) {
      const partes = partesDaChave(chave);
      const caminho = partes && caminhoDoDados(partes);
      if (!caminho) return null;
      const r = await lerCaminho(caminho);
      return r ? r.texto : null;
    },

    /**
     * A listagem desta família é a listagem dos CICLOS com dados — não há aqui um diretório por
     * onde andar. Devolve vazio, e diz porquê: quem precisa dos lançamentos de um ciclo lê o
     * `-dados.json` (é UM ficheiro, e é o mesmo que a geração lê).
     */
    async listar() {
      return [];
    },
  };
}



/**
 * A CONSOLIDAÇÃO DO QUE JÁ ESTAVA NO KV — e ela existe por um motivo datado.
 *
 * Enquanto a chave do lançamento não teve família, cada lançamento virou uma chave de KV
 * (`<escola>/<professor>/<ciclo>-<carimbo>/<nome>`, CIFRADA). Essas chaves não se apagam: a
 * escola Calango tem lá o lançamento de 06/11/2026 às 15:37, e ele é trabalho da pesquisadora,
 * não um resto. Este passo lê-as, decifra-as com a `SENHA_CRIPTO` do Worker e grava-as na fonte
 * — e depois disso o KV fica sem função, sem que nada se perca.
 *
 * É de propósito um ACTO e não um serviço: corre quando alguém o pede, diz o que consolidou e
 * não fica a varrer o KV em segundo plano. Um migrador que corre sozinho é um escritor que
 * ninguém vê — e o sistema já tem escritores assíncronos demais.
 *
 * O que ele NÃO faz: apagar as chaves do KV. Uma migração que apaga não se pode repetir, e a
 * repetição é o que garante que um erro de percurso não custou o dado.
 */
async function consolidarDoKv({ armazenamento, acervo, senhaCripto, escola, professor, Cifra }) {
  if (!armazenamento || typeof armazenamento.listar !== 'function') {
    return { ok: false, erro: 'não há armazenamento antigo para ler' };
  }
  const prefixo = String(escola || '').trim() + '/' + String(professor || '').trim() + '/';
  let chaves = [];
  try {
    chaves = await armazenamento.listar(prefixo);
  } catch (erro) {
    return { ok: false, erro: 'não consegui listar o armazenamento antigo: ' + erro.message };
  }
  // SÓ OS ARQUIVOS DE DADOS entram: o `ciclos.json` é gerado, e as chaves de anamnese de
  // escolas antigas não são lançamento — cada família tem o seu caminho.
  const alvos = (chaves || []).filter((c) => /-dados(?:-\d{4}-\d{2}-\d{2}T\d{4})?\.json$/.test(c)).sort();
  const feitos = [];
  const falhas = [];
  for (const chave of alvos) {
    try {
      let texto = await armazenamento.ler(chave);
      if (texto === null || texto === undefined) { falhas.push({ chave, erro: 'chave vazia' }); continue; }
      // O KV guardou o ENVELOPE (`_cifrado`); a fonte é o texto em claro. É a única parte deste
      // caminho que precisa da chave, e ela nunca sai do Worker.
      let bruto = null;
      try { bruto = JSON.parse(texto); } catch (erro) { bruto = null; }
      if (bruto && bruto._cifrado) {
        if (!senhaCripto) { falhas.push({ chave, erro: 'o lançamento está cifrado e o Worker não tem a chave' }); continue; }
        texto = await Cifra.decifrar(bruto._cifrado, senhaCripto);
      }
      const partes = partesDaChave('lancamento/' + chave);
      if (!partes) { falhas.push({ chave, erro: 'não sei ler esta chave' }); continue; }
      const r = await acervo.guardar('lancamento/' + chave, texto);
      /* A VARIANTE VAI NA RESPOSTA (06/11/2026). Quem chamou precisa dela para pedir a geração
       * do pacote certo — sem isso o resgate grava a fonte e o site continua a mostrar a versão
       * anterior, que é o mesmo sintoma uma camada abaixo. Ela sai do NOME do ficheiro, como em
       * todo o resto deste módulo. */
      feitos.push({
        chave,
        caminho: r.caminho,
        aulas: r.aulas,
        semMudanca: Boolean(r.semMudanca),
        professor: partes.professor,
        ciclo: partes.ciclo,
        variante: varianteDoNome(partes.nome),
      });
    } catch (erro) {
      falhas.push({ chave, erro: erro.message });
    }
  }
  return { ok: falhas.length === 0, consolidados: feitos, falhas, total: alvos.length };
}

module.exports.consolidarDoKv = consolidarDoKv;

module.exports = {
  criarAcervoDeLancamentos,
  partesDaChave,
  caminhoDoDados,
  varianteDoNome,
  fundirAulas,
  DONO_PADRAO,
  REPO_PADRAO,
  REF_PADRAO,
};

module.exports.consolidarDoKv = consolidarDoKv;
