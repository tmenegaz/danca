#!/usr/bin/env node
'use strict';

/**
 * provar-aparencia.js — a aparência é da ESCOLA, e a decisão fica guardada.
 *
 * Por que existe (18/10/2026). A decisão **C15** — «de quem é a preferência de aparência?» —
 * foi tomada: **é da escola**. Isto tira a escolha do navegador e põe-na no servidor, e um
 * servidor que guarda e serve um valor tem três coisas para provar, e nenhuma delas é
 * visual:
 *
 *   1. o valor GUARDADO manda — o `<html>` de toda página servida sai com `data-modo` e com
 *      `data-modo-fonte="escola"`, e o `nav.js` não o desfaz (isso prova-se no
 *      `provar-tema.js`; aqui prova-se que o atributo CHEGA);
 *   2. o portão é o da DIREÇÃO — a senha da escola ou a do professor principal, e mais
 *      nenhuma. É o mesmo portão da Produção, e é por isso que o controlo mora lá: quem
 *      entra é quem pode decidir a aparência de todos;
 *   3. o valor INVÁLIDO não entra, e a AUSÊNCIA não inventa: sem nada guardado, a escola é
 *      `clara`. Uma preferência que cai num valor arbitrário é pior do que não ter nenhuma.
 *
 * Sem dependências: o KV é um Map com `get`/`put` de mentira, e as vistas são geradas pelo
 * próprio `bastidores.js`. É o motor a responder — não uma cópia do que se espera dele.
 *
 *   node experimentos/provar-aparencia.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const { comAparencia, modoDaEscola } = require(path.join(raiz, 'motor/servidor/producao.js'));

let passou = 0;
let falhou = 0;

function provar(nome, obtido, esperado) {
  const igual = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (igual) {
    passou++;
    console.log('ok     ' + nome);
  } else {
    falhou++;
    console.log('FALHOU ' + nome);
    console.log('  obtido:   ' + JSON.stringify(obtido));
    console.log('  esperado: ' + JSON.stringify(esperado));
  }
}

/** Um KV de mentira, do tamanho do que o `bastidores.js` usa: `get`, `put`, `delete`, `list`. */
function criarKV() {
  const dados = new Map();
  return {
    dados,
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); return null; },
    async delete(chave) { dados.delete(chave); return null; },
    async list(opcoes) {
      const prefixo = (opcoes && opcoes.prefix) || '';
      const chaves = [...dados.keys()].filter((k) => k.startsWith(prefixo)).sort();
      return { keys: chaves.map((name) => ({ name })), list_complete: true };
    },
  };
}

const AMBIENTE = {
  ESCOLA_SLUG: 'fita',
  ESCOLA_HABILITADA: 'sim',
  FUSO: 'America/Sao_Paulo',
  SENHA_ADMIN: 'senha-da-escola',
  SENHA_PROFESSOR: 'senha-do-dono',
  PROFESSOR_NOME: 'Tiago Menegaz',
};

function pedido(caminho, metodo, corpo) {
  const init = { method: metodo || 'GET', headers: { origin: 'https://fita.tmenegaz77.workers.dev' } };
  if (corpo) {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(corpo);
  }
  return new Request('https://fita.tmenegaz77.workers.dev' + caminho, init);
}

async function api(kv, caminho, metodo, corpo) {
  const env = Object.assign({ PADD_KV: kv }, AMBIENTE);
  const r = await bastidores.fetch(pedido(caminho, metodo, corpo), env, {});
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (e) { json = null; }
  return { status: r.status, json, texto };
}

(async () => {
  // --------------------------------------------------------------------------
  // 1. A AUSÊNCIA NÃO INVENTA — e o GET é público, porque o modo já vai no HTML
  // --------------------------------------------------------------------------
  {
    const kv = criarKV();
    const r = await api(kv, '/api/bastidores/aparencia');
    provar('sem nada guardado, o GET responde ok', r.json && r.json.ok, true);
    provar('…e a escola é clara por padrão', r.json && r.json.modo, 'clara');
    provar('…e diz quais modos existem', r.json && r.json.modos, ['clara', 'noturna']);
  }

  // --------------------------------------------------------------------------
  // 2. O PORTÃO É O DA DIREÇÃO
  // --------------------------------------------------------------------------
  {
    const kv = criarKV();
    const semSenha = await api(kv, '/api/bastidores/aparencia', 'POST', { modo: 'noturna' });
    provar('gravar sem senha é recusado', semSenha.status, 401);
    provar('…e não grava nada', kv.dados.size, 0);

    const errada = await api(kv, '/api/bastidores/aparencia', 'POST', { modo: 'noturna', senhaDirecao: 'chute' });
    provar('gravar com senha errada é recusado', errada.status, 401);
    provar('…e continua sem gravar', kv.dados.size, 0);

    // A senha do PROFESSOR PRINCIPAL abre: ela é a segunda metade do portão da direção.
    const doDono = await api(kv, '/api/bastidores/aparencia', 'POST',
      { modo: 'noturna', senhaDirecao: 'senha-do-dono' });
    provar('o professor principal pode escolher a aparência', doDono.status, 200);
    provar('…e o valor fica guardado', (await api(kv, '/api/bastidores/aparencia')).json.modo, 'noturna');
  }

  // --------------------------------------------------------------------------
  // 3. O VALOR INVÁLIDO NÃO ENTRA
  // --------------------------------------------------------------------------
  {
    const kv = criarKV();
    const invalido = await api(kv, '/api/bastidores/aparencia', 'POST',
      { modo: 'sepia', senhaDirecao: 'senha-da-escola' });
    provar('um modo que não existe é recusado', invalido.status, 400);
    provar('…e o erro diz quais existem', /clara/.test(invalido.json && invalido.json.erro), true);
    provar('…e nada foi guardado', kv.dados.size, 0);

    const vazio = await api(kv, '/api/bastidores/aparencia', 'POST',
      { modo: '', senhaDirecao: 'senha-da-escola' });
    provar('modo vazio também é recusado', vazio.status, 400);
  }

  // --------------------------------------------------------------------------
  // 4. A SENHA DA ESCOLA GRAVA, E O QUE SE GUARDA É O NOME DO MODO
  //
  // O valor guardado tem de ser o NOME (`clara`/`noturna`), e não um hex: quando o catálogo
  // das doze paletas existir, é este campo que ganha a família, e o que se lê dele continua a
  // ser uma palavra. Guardar cor agora fecharia a porta que a C15 abriu.
  // --------------------------------------------------------------------------
  {
    const kv = criarKV();
    const ok = await api(kv, '/api/bastidores/aparencia', 'POST',
      { modo: 'noturna', senhaDirecao: 'senha-da-escola' });
    provar('a senha da escola grava', ok.status, 200);
    const guardado = JSON.parse(kv.dados.get('bastidores/fita/aparencia'));
    provar('…sob a chave da escola', kv.dados.has('bastidores/fita/aparencia'), true);
    provar('…e o que se guarda é o NOME do modo', guardado.modo, 'noturna');
    provar('…sem guardar a senha de quem mudou', Object.prototype.hasOwnProperty.call(guardado, 'senha'), false);
    provar('…com a hora da mudança', /^\d{4}-\d{2}-\d{2}T/.test(guardado.em), true);

    const voltar = await api(kv, '/api/bastidores/aparencia', 'POST',
      { modo: 'clara', senhaDirecao: 'senha-da-escola' });
    provar('e volta para clara', voltar.status, 200);
    provar('…lendo de volta', (await api(kv, '/api/bastidores/aparencia')).json.modo, 'clara');
  }

  // --------------------------------------------------------------------------
  // 5. AS VISTAS SAEM COM O MODO DA ESCOLA
  //
  // O que se mede é o `<html>`: o atributo tem de estar lá ANTES de a página pintar, e o
  // `data-modo-fonte` tem de dizer que a decisão é da escola — é ele que faz o `nav.js`
  // não aplicar por cima a memória de um navegador usado antes.
  // --------------------------------------------------------------------------
  {
    const kv = criarKV();
    await api(kv, '/api/bastidores/aparencia', 'POST', { modo: 'noturna', senhaDirecao: 'senha-da-escola' });
    const env = Object.assign({ PADD_KV: kv }, AMBIENTE);

    for (const vista of ['/bastidores/producao', '/bastidores/estudio']) {
      const r = await bastidores.fetch(pedido(vista), env, {});
      const html = await r.text();
      provar(vista + ' sai em noturna', /<html[^>]*data-modo="noturna"/.test(html), true);
      provar(vista + ' diz de quem é a decisão', /data-modo-fonte="escola"/.test(html), true);
      provar(vista + ' não tem anti-flash por localStorage', html.includes('localStorage.getItem'), false);
    }

    const padrao = criarKV();
    const r = await bastidores.fetch(pedido('/bastidores/producao'), Object.assign({ PADD_KV: padrao }, AMBIENTE), {});
    provar('sem nada guardado, a vista sai em clara',
      /<html[^>]*data-modo="clara"/.test(await r.text()), true);
  }

  // --------------------------------------------------------------------------
  // 5b. A PONTE LÊ O MESMO VALOR QUE A VISTA GRAVA
  //
  // Esta asserção existe por um erro REAL, apanhado só no ar (18/10/2026): `aparenciaDaEscola`
  // foi escrita e usada dentro do `bastidores.js`, mas **não exportada**. O `provar-aparencia`
  // passou na mesma — porque provava a rota (que está dentro do módulo) e a injeção (que não
  // precisa dela) —, e o Worker devolveu **500** em TODOS os assets: a ponte chamava `undefined`.
  // Uma prova que não exercita o caminho por onde o valor SAI não prova a saída.
  // --------------------------------------------------------------------------
  {
    const kv = criarKV();
    const env = Object.assign({ PADD_KV: kv, ESCOLA_SLUG: 'fita' }, AMBIENTE);
    provar('a ponte sabe ler o modo da escola', await modoDaEscola(env), 'clara');

    await api(kv, '/api/bastidores/aparencia', 'POST', { modo: 'noturna', senhaDirecao: 'senha-da-escola' });
    provar('…e lê o MESMO valor que a vista gravou', await modoDaEscola(env), 'noturna');

    provar('sem KV (servidor de desenvolvimento) não inventa: clara',
      await modoDaEscola({ ESCOLA_SLUG: 'fita' }), 'clara');
    provar('sem escola também não inventa', await modoDaEscola({ PADD_KV: kv }), 'clara');
  }

  // --------------------------------------------------------------------------
  // 6. A PONTE DE PRODUÇÃO — TUDO O QUE A ESCOLA SERVE
  //
  // A aparência não pode valer só para os Bastidores: quem abre o pacote do ciclo, o guia, a
  // anamnese ou o plano de ensino tem de ver a mesma pele. A injeção é cirúrgica — só o
  // atributo —, e não pode tocar em nada que não seja HTML.
  // --------------------------------------------------------------------------
  {
    const corpo = (html) => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'content-length': String(html.length) } });

    const posto = await comAparencia(corpo('<!doctype html><html lang="pt-BR"><head><title>a</title></head></html>'), 'noturna');
    const html = await posto.text();
    provar('a ponte põe o modo no <html>', /<html[^>]*data-modo="noturna"/.test(html), true);
    provar('…e a fonte', /data-modo-fonte="escola"/.test(html), true);
    provar('…sem duplicar o atributo', (html.match(/data-modo=/g) || []).length, 1);
    provar('…e sem mentir sobre o tamanho', posto.headers.get('content-length'), null);

    // Uma página que JÁ trazia um modo (servida por outra camada) não fica com dois.
    const jaTinha = await comAparencia(corpo('<html data-modo="clara" data-modo-fonte="escola"><body>x</body></html>'), 'noturna');
    const htmlJa = await jaTinha.text();
    provar('o modo antigo é REPOSTO, não duplicado', (htmlJa.match(/data-modo=/g) || []).length, 1);
    provar('…e vale o novo', /data-modo="noturna"/.test(htmlJa), true);

    // O que não é HTML passa intacto: a folha, o PDF, o JS.
    const css = new Response('body{color:red}', { headers: { 'content-type': 'text/css' } });
    const mesmo = await comAparencia(css, 'noturna');
    provar('o CSS não é tocado', await mesmo.text(), 'body{color:red}');

    const semModo = await comAparencia(corpo('<html><body>x</body></html>'), 'clara');
    provar('clara também se publica (não é ausência)', /data-modo="clara"/.test(await semModo.text()), true);
  }

  console.log('\nprovar-aparencia: ' + passou + ' de ' + (passou + falhou) + ' passaram');
  process.exit(falhou ? 1 : 0);
})().catch((e) => {
  console.error('provar-aparencia quebrou: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
