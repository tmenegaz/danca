#!/usr/bin/env node
'use strict';

/*
 * provar-piso.js — o piso contratado é uma trava do MOTOR, e a recusa nomeia as saídas
 * (16/11/2026).
 *
 * O QUE ELA DECIDIU, e são três frases que só fazem sentido juntas:
 *
 *   «Capacidade dá ideia de teto […] O nosso não é capacidade, o nosso é a partir de.» — o número
 *   do plano é o PISO que a escola contratou, não um máximo que ela tem.
 *
 *   «Coloca no motor, sem dúvida.» — o piso não fica no ecrã: acima dele, o cadastro de professor
 *   e de aluna é RECUSADO. E a recusa é do servidor, porque «a interface não será considerada
 *   mecanismo suficiente de controle de acesso» (§L9b, citando a estratégia).
 *
 *   E a regra da própria frente: a recusa NÃO diz «o Básico não permite dois professores» — diz
 *   que o piso está cheio e nomeia as duas saídas, porque «mensagens diferentes para o mesmo
 *   bloqueio escondem que a primeira é reversível».
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A DECISÃO, pura: abaixo do piso cabe; no piso não cabe; no TETO a resposta é outra e não
 *      oferece um lote que não resolveria; no último degrau, a saída é a conversa.
 *   B. OS DOIS EIXOS NAS ROTAS: um professor a mais é 409 no Básico cheio; uma aluna a mais é 409
 *      quando o cadastro está cheio. E o que NÃO se recusa: a edição, a repetição (que tem uma
 *      mensagem mais específica) e a escola sem contrato.
 *   C. AS CONTAGENS SÃO AS DA FRENTE: o principal conta como um (vive no secret, não na lista), o
 *      desligado NÃO conta (está no registo por proveniência, e não ocupa lugar), e a aluna conta
 *      pelo CADASTRO — não pelo elenco.
 *   D. A RECUSA É LEGÍVEL: a frase tem o número do piso, o número que há, e as saídas; e a
 *      resposta traz os campos que o ecrã usa, em vez de uma string sem números.
 *
 *   node experimentos/provar-piso.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/* ------------------------------- A BANCADA ------------------------------- */

function kvFalso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    bruto: dados,
  };
}

/**
 * O GITHUB DE MENTIRA — o mínimo que o cadastro de um professor pede: a árvore (para saber que
 * planos existem), o inventário da escola (`escola/<escola>/indice.json`, sem o qual o vínculo não
 * tem onde ser escrito) e o perfil do principal. O `ok` vai explícito nas respostas porque o
 * `repo-escola` o lê, e uma resposta sem `ok` é uma resposta que ele — com razão — trata como
 * falha: foi assim que a primeira versão desta bancada devolveu 502 a um cadastro que devia passar.
 */
function githubFalso() {
  const mapa = new Map(Object.entries({
    'escola/breu/indice.json': JSON.stringify({
      escola: 'breu', professor: { slug: 'demi-plie', nome: 'Demi Plié' }, ciclo: '01',
      estado: { habilitada: true }, arquivos: [],
    }),
    'professores/brise-volet/perfil.json': JSON.stringify({
      slug: 'brise-volet', nome: 'Brise Volet', modalidades: ['bale-classico'], criado: '2026-11-16',
    }),
  }));
  const resposta = (status, corpo) => ({
    status, ok: status >= 200 && status < 300,
    json: async () => corpo, text: async () => JSON.stringify(corpo),
  });
  const fetch = async (url, opcoes) => {
    const u = String(url);
    if (u.indexOf('/git/trees/') !== -1) return resposta(200, { tree: [], sha: 'arvore' });
    const metodo = (opcoes && opcoes.method) || 'GET';
    const caminho = decodeURIComponent(u
      .replace(/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\//, '').split('?')[0]);
    if (metodo === 'GET') {
      if (!mapa.has(caminho)) return resposta(404, { message: 'Not Found' });
      return resposta(200, {
        content: Buffer.from(mapa.get(caminho), 'utf8').toString('base64'), sha: 'sha-' + caminho,
      });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      mapa.set(caminho, Buffer.from(String(corpo.content || ''), 'base64').toString('utf8'));
      return resposta(200, { commit: { sha: 'novo' }, content: { sha: 'novo' } });
    }
    return resposta(405, {});
  };
  return { fetch, mapa };
}

function envCom(kv) {
  const gh = githubFalso();
  globalThis.fetch = gh.fetch;
  return {
    ESCOLA_SLUG: 'breu',
    PADD_KV: kv,
    GITHUB_TOKEN: 'gh-de-mentira',
    SENHA_ADMIN: '123',
    PROFESSOR_SLUG: 'brise-volet',
    PROFESSOR_NOME: 'Brise Volet',
    ASSETS: { fetch: async () => new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }) },
  };
}

async function pedir(env, caminho, metodo, corpo) {
  const req = new Request('https://breu.padd.com.br' + caminho, {
    method: metodo || 'GET',
    ...(corpo ? { body: JSON.stringify(corpo), headers: { 'Content-Type': 'application/json' } } : {}),
  });
  const r = await bastidores.fetchSemRede(req, env);
  const d = await r.json().catch(() => ({}));
  return { status: r.status, dados: d };
}

const comSenha = (corpo) => Object.assign({ senhaDirecao: '123' }, corpo || {});
const CONTRATO = (plano, professores, alunos) => JSON.stringify({
  plano, estado: 'ativa', capacidade: { professores, alunos },
  criadoEm: '2026-11-16T12:00:00Z',
});

(async () => {
  console.log('A. A decisão, no núcleo: o piso, o teto, e as saídas certas');
  {
    const noPiso = (contrato, eixo, n) => comercial.travaDoPiso({ contrato, eixo, cadastrados: n });
    const basico = { plano: 'basico', capacidade: { professores: 1, alunos: 10 } };

    conferir('abaixo do piso, o cadastro passa',
      noPiso(basico, 'professores', 0).cabe === true && noPiso(basico, 'alunos', 9).cabe === true,
      noPiso(basico, 'professores', 0));
    conferir('no piso, o cadastro não passa',
      noPiso(basico, 'professores', 1).cabe === false && noPiso(basico, 'alunos', 10).cabe === false,
      noPiso(basico, 'alunos', 10));

    /* AS DUAS SAÍDAS, com números: o lote mais pequeno do eixo e o que o plano de cima inclui. */
    const noPisoBasico = noPiso(basico, 'professores', 1);
    conferir('a recusa nomeia as DUAS saídas — o lote e o plano de cima',
      /duas saídas/i.test(noPisoBasico.erro) && /lote de 1/.test(noPisoBasico.erro)
        && /R\$ 30,00/.test(noPisoBasico.erro) && /plano de cima inclui 3/.test(noPisoBasico.erro),
      noPisoBasico.erro);
    conferir('…e a frase diz o piso e quantos já há, em vez de só recusar',
      /a partir de 1 professor/.test(noPisoBasico.erro) && /já tem 1/.test(noPisoBasico.erro),
      noPisoBasico.erro);
    conferir('…e a resposta traz os números para o ecrã, não uma string solta',
      noPisoBasico.piso === 1 && noPisoBasico.teto === 2 && noPisoBasico.cadastrados === 1
        && JSON.stringify(noPisoBasico.saidas) === JSON.stringify(['lote', 'plano']), noPisoBasico);

    /* NO TETO A RESPOSTA É OUTRA: comprar lote não abre lugar nenhum. */
    const noTeto = noPiso(basico, 'professores', 2);
    conferir('no teto do plano, a recusa NÃO oferece um lote — porque um lote não resolveria',
      noTeto.cabe === false && noTeto.tetoCheio === true && noTeto.lote === null
        && /não abre mais lugar/i.test(noTeto.erro)
        && !/acrescentar um lote de/.test(noTeto.erro), noTeto.erro);
    conferir('…e a saída é subir de plano, com o que o plano de cima inclui',
      JSON.stringify(noTeto.saidas) === JSON.stringify(['plano'])
        && /plano de cima inclui 3/.test(noTeto.erro), noTeto.erro);

    /* NO ÚLTIMO DEGRAU NÃO HÁ PLANO ACIMA — e a frase não inventa um botão. */
    const ultimo = noPiso({ plano: 'avancado', capacidade: { professores: 20, alunos: 500 } }, 'professores', 20);
    conferir('no último degrau, a saída é falar com a proprietária — não um plano que não existe',
      ultimo.cabe === false && JSON.stringify(ultimo.saidas) === JSON.stringify(['conversa'])
        && /fale com o Sistema Lastro/i.test(ultimo.erro), ultimo.erro);

    /* E O PISO CHEIO COM TETO À VISTA: há lugar no plano dela, e só um lote resolve. */
    const avancado = noPiso({ plano: 'avancado', capacidade: { professores: 9, alunos: 120 } }, 'professores', 9);
    conferir('com lugar até ao teto do plano, um lote resolve — e é o lote que se oferece',
      avancado.cabe === false && avancado.tetoCheio === false
        && JSON.stringify(avancado.saidas) === JSON.stringify(['lote']) && /até 20 professor/.test(avancado.erro),
      avancado.erro);

    /* SEM CONTRATO NÃO SE INVENTA LIMITE. */
    conferir('sem contrato, nada é recusado — não há piso prometido',
      noPiso(null, 'professores', 50).cabe === true && noPiso(null, 'alunos', 500).cabe === true, null);
    conferir('…e um contrato sem plano também não trava',
      noPiso({ estado: 'ativa' }, 'alunos', 99).cabe === true, null);
    /* UM EIXO DESCONHECIDO NÃO DERRUBA A ROTA. */
    conferir('um eixo desconhecido não é uma recusa — é uma pergunta que não se faz',
      noPiso(basico, 'turmas', 99).cabe === true, null);
  }

  console.log('\nB. As rotas: um professor a mais é recusado, e o principal conta');
  {
    /* O BÁSICO INCLUI 1 PROFESSOR — e o principal é um. Logo, cadastrar o primeiro adicional é
     * recusado: é a tradução comercial de «o Básico é uma turma, um professor». */
    const kv = kvFalso({ 'bastidores/breu/comercial': CONTRATO('basico', 1, 10) });
    const env = envCom(kv);

    const primeiro = await pedir(env, '/api/bastidores/professor', 'POST',
      comSenha({ nome: 'Ana', sobrenome: 'Diag', senha: 'x1' }));
    conferir('no Básico com o principal, cadastrar um professor é recusado (409)',
      primeiro.status === 409 && primeiro.dados.ok === false, primeiro);
    conferir('…e a recusa chega à tela com a frase que nomeia as saídas',
      /piso contratado está cheio/i.test(primeiro.dados.erro || '')
        && /duas saídas/i.test(primeiro.dados.erro || ''), primeiro.dados.erro);
    /* NADA FOI ESCRITO: a recusa acontece antes, e o KV fica como estava. */
    conferir('…e não houve escrita nenhuma: a lista do KV continua vazia',
      (await kv.get('bastidores/breu/professores')) === null, await kv.get('bastidores/breu/professores'));

    /* COMPRAR UM LOTE LIBERTA — sem tocar nos dados, que é o critério (viii) do §L9b. */
    await kv.put('bastidores/breu/comercial', CONTRATO('basico', 4, 10));
    const depoisDoLote = await pedir(env, '/api/bastidores/professor', 'POST',
      comSenha({ nome: 'Ana', sobrenome: 'Diag', senha: 'x1' }));
    conferir('acrescentar um lote liberta o cadastro, sem tocar nos dados',
      depoisDoLote.status === 201, depoisDoLote.status);
    const lista = JSON.parse((await kv.get('bastidores/breu/professores')) || '[]');
    conferir('…e o professor entrou na lista', lista.length === 1 && lista[0].slug === 'ana-diag', lista);

    /* O DESLIGADO NÃO OCUPA LUGAR: fica no registo (proveniência), mas não conta para o piso.
     * O contrato é de DOIS professores (o principal + um lote) e há um desligado na lista: se ele
     * contasse, o piso estava cheio e o cadastro seria recusado. Ele passa — e é isso que se mede. */
    const kv2 = kvFalso({
      'bastidores/breu/comercial': CONTRATO('basico', 2, 10),
      'bastidores/breu/professores': JSON.stringify([
        { nome: 'Ana Diag', slug: 'ana-diag', sal: 's', hash: 'h', desligado_em: '2026-11-01' },
      ]),
    });
    const env2 = envCom(kv2);
    const comDesligado = await pedir(env2, '/api/bastidores/professor', 'POST',
      comSenha({ nome: 'Bia', sobrenome: 'Nova', senha: 'x2' }));
    conferir('um professor desligado não ocupa lugar no piso', comDesligado.status === 201, comDesligado.status);

    /* E A REACTIVAÇÃO DO MESMO NOME TAMBÉM PASSA, com um lugar livre: ela não é uma pessoa nova,
     * e o registo do desligamento não é uma colisão (a rota substitui-o e limpa o desligamento).
     * Numa bancada própria porque a de cima já encheu o piso com o cadastro anterior. */
    const kv3 = kvFalso({
      'bastidores/breu/comercial': CONTRATO('basico', 2, 10),
      'bastidores/breu/professores': JSON.stringify([
        { nome: 'Ana Diag', slug: 'ana-diag', sal: 's', hash: 'h', desligado_em: '2026-11-01' },
      ]),
    });
    const volta = await pedir(envCom(kv3), '/api/bastidores/professor', 'POST',
      comSenha({ nome: 'Ana', sobrenome: 'Diag', senha: 'x3' }));
    conferir('…e o desligado pode voltar — a reactivação não colide consigo',
      volta.status === 201 || volta.status === 200, volta.status);
  }

  console.log('\nC. As rotas: a aluna conta pelo CADASTRO, e a repetição responde primeiro');
  {
    const dez = Array.from({ length: 10 }, (_, i) => 'aluna' + i);
    const kv = kvFalso({
      'bastidores/breu/comercial': CONTRATO('basico', 1, 10),
      'bastidores/breu/alunas': JSON.stringify(dez),
    });
    const env = envCom(kv);
    const maisUma = await pedir(env, '/api/bastidores/aluna', 'POST', comSenha({ apelido: 'nova' }));
    conferir('com o cadastro de alunas no piso, mais uma é recusada (409)',
      maisUma.status === 409 && /aluna/.test(maisUma.dados.erro || ''), maisUma);
    conferir('…e a recusa do eixo das alunas fala de alunas, não de professores',
      /aluna\(s\)/.test(maisUma.dados.erro || '') && !/professor/.test(maisUma.dados.erro || ''),
      maisUma.dados.erro);
    /* A REPETIÇÃO TEM UMA MENSAGEM MAIS ESPECÍFICA — e ela vem primeiro. */
    const repetida = await pedir(env, '/api/bastidores/aluna', 'POST', comSenha({ apelido: 'aluna3' }));
    conferir('a aluna que já existe responde pela repetição, e não pelo piso',
      repetida.status === 409 && /já existe uma aluna com este apelido/.test(repetida.dados.erro || ''),
      repetida.dados.erro);
    /* COM UM LUGAR LIVRE, ENTRA. */
    await kv.put('bastidores/breu/comercial', CONTRATO('basico', 1, 11));
    const comLugar = await pedir(env, '/api/bastidores/aluna', 'POST', comSenha({ apelido: 'nova' }));
    conferir('com um lugar no piso, a aluna entra', comLugar.status === 201, comLugar.status);
  }

  console.log('\nD. O que a trava NÃO faz: sem contrato, edição, e o que já existe');
  {
    /* SEM CONTRATO: a escola anterior à camada comercial continua a cadastrar. */
    const kv = kvFalso({});
    const env = envCom(kv);
    const semContrato = await pedir(env, '/api/bastidores/professor', 'POST',
      comSenha({ nome: 'Ana', sobrenome: 'Diag', senha: 'x1' }));
    conferir('sem contrato, o cadastro segue — não se inventa um limite que ninguém contratou',
      semContrato.status === 201, semContrato.status);

    /* A EDIÇÃO NÃO É CADASTRO: a rota do `editar` sai antes da trava. */
    const kv2 = kvFalso({
      'bastidores/breu/comercial': CONTRATO('basico', 1, 10),
      'bastidores/breu/professores': JSON.stringify([{ nome: 'Ana Diag', slug: 'ana-diag', sal: 's', hash: 'h' }]),
    });
    const env2 = envCom(kv2);
    const editar = await pedir(env2, '/api/bastidores/professor', 'POST',
      comSenha({ editar: 'ana-diag', nome: 'Ana', sobrenome: 'Diag', senha: 'nova' }));
    conferir('editar um professor que já existe passa, mesmo com o piso cheio',
      editar.status === 200, editar);
    /* E O QUE JÁ EXISTE NÃO É APAGADO PELA RECUSA — o critério (vii) do §L9b. */
    const aindaLa = JSON.parse(await kv2.get('bastidores/breu/professores'));
    conferir('…e nada foi removido da lista por causa de uma recusa', aindaLa.length === 1, aindaLa);

    /* A RECUSA É DO SERVIDOR, E NÃO DA TELA: sem a senha da direção, nem chega a ela. */
    const semSenha = await pedir(env2, '/api/bastidores/professor', 'POST', { nome: 'X', senha: 'y' });
    conferir('sem a senha da direção, a rota responde 401 antes de qualquer trava',
      semSenha.status === 401, semSenha.status);
  }

  console.log('\nE. O medidor ao lado do formulário — «9 de 9», antes do clique');
  {
    /* «Dizer "9 de 9" ao lado do formulário é a próxima peça.» A trava sem aviso é uma armadilha:
     * recusar é metade do trabalho, e a outra metade é dizer quantos lugares restam ANTES de a
     * pessoa escrever o nome. */
    const pagina = (contrato, profs, aluns) => bastidores.paginaProducao(
      'breu', {}, profs, aluns, 'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
      { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 }, null, null, [],
      new Set(), contrato === undefined ? null : { ok: true, contrato },
    );
    const { JSDOM } = require('jsdom');
    const PROFS = [{ nome: 'Ana Diag', slug: 'ana-diag', sal: 's', hash: 'h' }];

    /* COM LUGAR: a contagem e o que resta, sem alarme e sem aviso. */
    const comLugar = new JSDOM(pagina({ plano: 'avancado', capacidade: { professores: 9, alunos: 120 } },
      PROFS, ['abreu', 'vava'])).window.document;
    const medidorProfs = comLugar.getElementById('prof-piso');
    conferir('o formulário do professor diz quantos são e quantos cabem',
      medidorProfs && /2 de 9/.test(medidorProfs.textContent), medidorProfs && medidorProfs.textContent);
    conferir('…e diz até onde o plano vai, ao lado — a pergunta seguinte',
      /20/.test(medidorProfs.textContent), medidorProfs.textContent);
    conferir('…com o selo do estado, e não um alarme quando há lugar',
      /7 lugares/.test(medidorProfs.parentElement.parentElement.textContent)
        && comLugar.querySelector('#prof-piso ~ p .selo.discreto') !== null, null);
    /* SEM AVISO PREVENTIVO: o ruído ensina a ignorar o aviso. */
    conferir('…e nenhuma frase de recusa enquanto há lugar',
      comLugar.querySelector('[data-piso-recusa]') === null, null);
    /* E AS ALUNAS CONTAM PELO CADASTRO, no seu próprio formulário. */
    const medidorAlunas = comLugar.getElementById('aluna-piso');
    conferir('o formulário das alunas tem o seu medidor, com a sua contagem',
      medidorAlunas && /2 de 120/.test(medidorAlunas.textContent)
        && /500/.test(medidorAlunas.textContent), medidorAlunas && medidorAlunas.textContent);

    /* CHEIO: o selo muda, e a frase da recusa está À VISTA — a mesma que o servidor devolve. */
    const cheio = new JSDOM(pagina({ plano: 'avancado', capacidade: { professores: 1, alunos: 120 } },
      PROFS, ['abreu'])).window.document;
    const caixaCheia = cheio.getElementById('prof-piso');
    conferir('com o piso cheio, a contagem mostra que está cheio',
      caixaCheia && /2 de 1/.test(caixaCheia.textContent), caixaCheia && caixaCheia.textContent);
    conferir('…o selo passa a falha, e diz qual dos dois limites foi atingido',
      /piso cheio/.test(cheio.getElementById('prof-piso').parentElement.parentElement.textContent)
        && cheio.querySelector('#prof-piso ~ p .selo.falha') !== null, null);
    const recusa = cheio.querySelector('[data-piso-recusa]');
    conferir('…e a frase que explica as saídas está à vista, antes do clique',
      recusa && /duas saídas|acrescente um lote|subir de plano/i.test(recusa.textContent), recusa && recusa.textContent);
    /* A FRASE É A MESMA DO SERVIDOR: um objecto, duas bocas. */
    const dadosDoMedidor = comercial.medidorDoPiso({
      contrato: { plano: 'avancado', capacidade: { professores: 1, alunos: 120 } },
      eixo: 'professores', cadastrados: 2,
    });
    conferir('…e é literalmente a mesma frase que a rota devolve no 409',
      recusa && recusa.textContent === dadosDoMedidor.recusa, { naTela: recusa && recusa.textContent, noNucleo: dadosDoMedidor.recusa });

    /* SEM CONTRATO NÃO SE INVENTA LIMITE — nem um medidor a dizer «0 de 0». */
    const semContrato = pagina(null, PROFS, ['abreu']);
    conferir('sem contrato, não há medidor nenhum — nada a prometer',
      !/prof-piso/.test(semContrato) && !/aluna-piso/.test(semContrato), null);
    /* E O PRINCIPAL CONTA: sem ele, uma escola de 2 professores diria «1 de 2» e deixaria
     * cadastrar quem não cabe. */
    const semDono = new JSDOM(pagina({ plano: 'basico', capacidade: { professores: 1, alunos: 10 } },
      [], [])).window.document;
    conferir('o professor principal conta no medidor, como conta na trava',
      /1 de 1/.test(semDono.getElementById('prof-piso').textContent),
      semDono.getElementById('prof-piso').textContent);
    /* E O DESLIGADO NÃO — a mesma regra dos dois lados. */
    const comDesligado = new JSDOM(pagina({ plano: 'basico', capacidade: { professores: 2, alunos: 10 } },
      [{ nome: 'Ana Diag', slug: 'ana-diag', sal: 's', hash: 'h', desligado_em: '2026-11-01' }], []))
      .window.document;
    conferir('…e o desligado não ocupa lugar, também no medidor',
      /1 de 2/.test(comDesligado.getElementById('prof-piso').textContent),
      comDesligado.getElementById('prof-piso').textContent);
  }

  console.log('\nF. A palavra é «piso» — e o ecrã não diz «capacidade»');
  {
    /* A FRASE DA RECUSA É O QUE A ESCOLA LÊ. Ela não pode dizer «capacidade», que foi a palavra
     * que a proprietária corrigiu: «capacidade dá ideia de teto». */
    const erro = comercial.travaDoPiso({
      contrato: { plano: 'basico', capacidade: { professores: 1, alunos: 10 } },
      eixo: 'alunos', cadastrados: 10,
    }).erro;
    conferir('a recusa diz «piso» e não «capacidade»',
      /piso/.test(erro) && !/capacidade/i.test(erro), erro);
    conferir('…e não é a frase proibida — «o Básico não permite N professor»',
      !/não permite/i.test(erro), erro);
  }

  console.log('');
  if (ko) {
    console.log('FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + ok + ' asserção(ões).');
})();
