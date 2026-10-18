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
const { comAparencia, aparenciaDoEnv } = require(path.join(raiz, 'motor/servidor/producao.js'));

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
    // A FAMÍLIA (18/10/2026). O GET diz as que EXISTEM — as que a folha desenha —, e não as
    // sete do catálogo: oferecer no seletor uma família sem hex daria uma escola pintada de
    // nada. Hoje são duas.
    provar('…e a família padrão é a Bordô de Cena', r.json && r.json.paleta, 'bordo');
    provar('…e a lista de famílias é a das que têm desenho',
      r.json && r.json.paletas.map((p) => p.id), ['bordo', 'cortina']);
    provar('…com nome legível, para o seletor não mostrar um id',
      r.json && r.json.paletas.map((p) => p.nome), ['Bordô de Cena', 'Cortina Turquesa']);
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
    provar('a ponte sabe ler a aparência da escola', await aparenciaDoEnv(env),
      { modo: 'clara', paleta: 'bordo' });

    await api(kv, '/api/bastidores/aparencia', 'POST',
      { modo: 'noturna', paleta: 'cortina', senhaDirecao: 'senha-da-escola' });
    provar('…e lê o MESMO par que a vista gravou', await aparenciaDoEnv(env),
      { modo: 'noturna', paleta: 'cortina' });

    provar('sem KV (servidor de desenvolvimento) não inventa',
      await aparenciaDoEnv({ ESCOLA_SLUG: 'fita' }), { modo: 'clara', paleta: 'bordo' });
    provar('sem escola também não inventa', await aparenciaDoEnv({ PADD_KV: kv }),
      { modo: 'clara', paleta: 'bordo' });
  }

  // --------------------------------------------------------------------------
  // 5c. AS DUAS FAMÍLIAS, E O QUE ACONTECE QUANDO UMA MENTE
  //
  // A FAMÍLIA É UM SEGUNDO EIXO, não um segundo valor do primeiro: o modo e a paleta são
  // independentes, e guardá-los num campo só obrigaria a enumerar o produto cartesiano à mão.
  // E um valor inválido é RECUSADO — não ignorado em silêncio: um `{paleta:'verde'}` que
  // respondesse `ok:true` faria a tela mostrar uma escolha que não ficou guardada.
  // --------------------------------------------------------------------------
  {
    const kv = criarKV();
    const gravarA = (corpo) => api(kv, '/api/bastidores/aparencia', 'POST',
      Object.assign({ senhaDirecao: 'senha-da-escola' }, corpo));

    const r1 = await gravarA({ paleta: 'cortina' });
    provar('gravar só a família é aceito', r1.status, 200);
    provar('…e o modo NÃO foi tocado (os eixos são independentes)',
      (await api(kv, '/api/bastidores/aparencia')).json.modo, 'clara');
    provar('…e a família ficou', (await api(kv, '/api/bastidores/aparencia')).json.paleta, 'cortina');

    const r2 = await gravarA({ modo: 'noturna' });
    provar('gravar só o modo é aceito', r2.status, 200);
    provar('…e a família continua a que estava', r2.json.paleta, 'cortina');
    provar('…e agora são noturna + cortina', { modo: r2.json.modo, paleta: r2.json.paleta },
      { modo: 'noturna', paleta: 'cortina' });

    const invalida = await gravarA({ paleta: 'verde' });
    provar('uma família que não existe é recusada', invalida.status, 400);
    provar('…e o erro diz quais existem', /cortina/.test(invalida.json && invalida.json.erro), true);
    provar('…e nada mudou', (await api(kv, '/api/bastidores/aparencia')).json.paleta, 'cortina');

    const vazio = await gravarA({});
    provar('pedido sem eixo nenhum é recusado', vazio.status, 400);
    provar('…e diz por quê', /modo|paleta/.test(vazio.json && vazio.json.erro), true);

    // O PAR INTEIRO GRAVA-SE SEM LER — e é o que fecha a janela de consistência do KV. Um
    // «ler-modificar-gravar» com pedidos parciais perde uma mudança quando duas chegam
    // próximas; foi medido no ar. O cliente manda os dois eixos, e o servidor grava o que
    // veio.
    const par = await gravarA({ modo: 'noturna', paleta: 'bordo' });
    provar('o par inteiro é aceito', par.status, 200);
    provar('…e grava exactamente o que veio',
      { modo: par.json.modo, paleta: par.json.paleta }, { modo: 'noturna', paleta: 'bordo' });
    const guardadoPar = JSON.parse(kv.dados.get('bastidores/fita/aparencia'));
    provar('…sem resíduo do valor anterior', guardadoPar.paleta, 'bordo');
  }

  // --------------------------------------------------------------------------
  // 5d. A VISTA PUBLICA A FAMÍLIA — sempre, mesmo quando é a padrão
  //
  // Uma página que não DIZ de que família é obriga toda a prova a tolerar duas formas de
  // dizer o mesmo. Escrito, o atributo é uma afirmação.
  // --------------------------------------------------------------------------
  {
    const kv = criarKV();
    const env = Object.assign({ PADD_KV: kv }, AMBIENTE);
    const lerHtml = async (caminho) => (await bastidores.fetch(pedido(caminho), env, {})).text();

    provar('sem nada guardado, a vista diz que é a Bordô de Cena',
      /data-paleta="bordo"/.test(await lerHtml('/bastidores/producao')), true);

    await api(kv, '/api/bastidores/aparencia', 'POST',
      { paleta: 'cortina', senhaDirecao: 'senha-da-escola' });
    const html = await lerHtml('/bastidores/producao');
    provar('a vista sai com a família escolhida', /data-paleta="cortina"/.test(html), true);
    provar('…e sem o atributo duplicado', (html.match(/data-paleta=/g) || []).length, 1);
    provar('…e a pílula da família em vigor vem marcada',
      /name="paleta" value="cortina" checked/.test(html), true);
    provar('…e a da Bordô, não',
      /name="paleta" value="bordo" checked/.test(html), false);
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

    // O PAR, e não o modo solto (18/10/2026): a ponte serve o pacote e a porta, e uma família
    // que valesse só nos Bastidores não seria «da escola».
    const posto = await comAparencia(corpo('<!doctype html><html lang="pt-BR"><head><title>a</title></head></html>'),
      { modo: 'noturna', paleta: 'cortina' });
    const html = await posto.text();
    provar('a ponte põe o modo no <html>', /<html[^>]*data-modo="noturna"/.test(html), true);
    provar('…e a família', /data-paleta="cortina"/.test(html), true);
    provar('…e a fonte', /data-modo-fonte="escola"/.test(html), true);
    provar('…sem duplicar o atributo do modo', (html.match(/data-modo=/g) || []).length, 1);
    provar('…nem o da família', (html.match(/data-paleta=/g) || []).length, 1);
    provar('…e sem mentir sobre o tamanho', posto.headers.get('content-length'), null);
    provar('…nem sobre a codificação', posto.headers.get('content-encoding'), null);

    // Uma página que JÁ trazia a aparência (servida por outra camada) não fica com dois.
    const jaTinha = await comAparencia(
      corpo('<html data-modo="clara" data-paleta="bordo" data-modo-fonte="escola"><body>x</body></html>'),
      { modo: 'noturna', paleta: 'cortina' });
    const htmlJa = await jaTinha.text();
    provar('o modo antigo é REPOSTO, não duplicado', (htmlJa.match(/data-modo=/g) || []).length, 1);
    provar('…e vale o novo', /data-modo="noturna"/.test(htmlJa), true);
    provar('a família antiga também é reposta', (htmlJa.match(/data-paleta=/g) || []).length, 1);
    provar('…e vale a nova', /data-paleta="cortina"/.test(htmlJa), true);

    // A FAMÍLIA PADRÃO SAI ESCRITA, e não fica em falta: ver a nota em `comAparencia`.
    const padrao = await comAparencia(corpo('<html><body>p</body></html>'), { modo: 'clara', paleta: 'bordo' });
    provar('a família padrão também se publica', /data-paleta="bordo"/.test(await padrao.text()), true);
    // Uma família que a folha não desenha NÃO se escreve.
    const inventada = await comAparencia(corpo('<html><body>p</body></html>'), { modo: 'clara', paleta: 'verde' });
    provar('uma família inexistente cai na padrão, em vez de jurar o que não há',
      /data-paleta="bordo"/.test(await inventada.text()), true);
    // Uma vista chamada SEM aparência não escreve `undefined` no atributo.
    const semNada = await comAparencia(corpo('<html><body>p</body></html>'), undefined);
    provar('sem aparência, a ponte usa o padrão (nunca um atributo vazio)',
      /data-paleta="bordo" data-modo-fonte="escola"/.test(await semNada.text()), true);

    // O que não é HTML passa intacto: a folha, o PDF, o JS.
    const css = new Response('body{color:red}', { headers: { 'content-type': 'text/css' } });
    const mesmo = await comAparencia(css, 'noturna');
    provar('o CSS não é tocado', await mesmo.text(), 'body{color:red}');

    const semModo = await comAparencia(corpo('<html><body>x</body></html>'), { modo: 'clara', paleta: 'bordo' });
    provar('clara também se publica (não é ausência)', /data-modo="clara"/.test(await semModo.text()), true);
  }

  console.log('\nprovar-aparencia: ' + passou + ' de ' + (passou + falhou) + ' passaram');
  process.exit(falhou ? 1 : 0);
})().catch((e) => {
  console.error('provar-aparencia quebrou: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
