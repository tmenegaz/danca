'use strict';

/**
 * provar-barra-e-caminho.js — A BARRA DO SISTEMA: o caminho, a repetição e o lugar do Bastidores.
 *
 * QUATRO DEFEITOS, MEDIDOS EM PRODUÇÃO EM 23/10/2026, E O QUE ESTA PROVA GUARDA:
 *
 *   1. **`/variante/true`.** A lista da notação abria `/bale-nivel-2-teste-2/true` — um 404 com
 *      o nome da variável dentro. `documentosDaTurma()` devolvia `true`/`false` para `plano`,
 *      `referencias` e `notacao`, e isso funcionava enquanto o único consumidor era um `if`.
 *      Quando as listas passaram a construir `href` com esse valor, o booleano foi direto para
 *      o endereço.
 *   2. **O caminho escrito três vezes.** `<span class="doc-atual">` mora entre a marca e o ☰ —
 *      que é exactamente o intervalo que `extrasDaBarra()` lê para não perder o bloco da
 *      Produção. Cada passagem lia o caminho como se fosse da página, e voltava a escrevê-lo ao
 *      lado do novo: a montagem, a varredura final e a ponte davam TRÊS.
 *   3. **O Bastidores a andar.** Ele fica depois do caminho, dentro de um contêiner que cresce.
 *      Com «Notação» encostava a um sítio, com «Referências Bibliográficas» a outro.
 *   4. **Dois menus laterais.** Os Bastidores passaram a ter a coluna do sistema E a sua
 *      (`<nav class="lateral">`), lado a lado.
 *
 * E O QUE MUDOU DEPOIS (23/10/2026, o mesmo dia, mais tarde): a coluna deixou de ser suprimida
 * no DESENHO e passou a ser suprimida no CSS, acima dos 1140. Suprimi-la no desenho custava a
 * folha do telemóvel — dentro da Produção o ☰ abria só o Bastidores.
 *
 * E O QUE MUDOU DE PROPÓSITO: o caminho passou a ter três degraus — `Ciclos · Referências ·
 * Referências Bibliográficas` —, com o degrau do meio LIGADO à lista de onde o documento veio.
 * É o lastro: quem entrou no documento por ela sabe por onde voltar.
 *
 *   node experimentos/provar-barra-e-caminho.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const nav = require(path.join(raiz, 'motor/nucleo/nav.js'));
const montagem = require(path.join(raiz, 'tools/montar-publicacao.js'));

const provas = [];
function provar(titulo, condicao, detalhe) {
  provas.push({ titulo, ok: !!condicao, detalhe });
  console.log('  ' + (condicao ? 'ok    ' : 'FALHOU') + ' ' + titulo +
    (condicao ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* O MENU DA FORMA NOVA, grupo a grupo, e o Bastidores na barra. Não é o da `batata` (que ainda
 * não tem turmas, e por isso não tem coluna): é a forma que a escola tem no dia em que ganha a
 * primeira turma.
 *
 * SEM DESTINO DIRECTO (24/10/2026). A coluna tinha um `tipo: 'link'` «Aulas» no topo, e a mesma
 * lista aparecia outra vez dentro da Área do Professor. A do topo saiu: dois itens para a mesma
 * página não são um atalho, são uma ambiguidade. O contrato continua a admitir `tipo: 'link'`
 * (`desenharColuna` desenha-o, e `grupoAtual` dá-lhe precedência) — mas a forma de hoje não o
 * usa, e a prova passou a medir a forma de hoje. */
const MENU = {
  versao: 2,
  coluna: [
    /* «REFERÊNCIAS» SAIU DO GRUPO (26/10/2026). O caminho até ao documento é o plano do ciclo,
       e a marca é «Planos». A forma de hoje tem um item no grupo — e a prova mede a forma de
       hoje, como já fazia com o `tipo: 'link'` que saiu em 24/10/2026. */
    { tipo: 'menu', rotulo: 'Ciclos', itens: [
      { rotulo: 'Planos', href: '/ciclos/planos/' },
    ] },
    { tipo: 'menu', rotulo: 'Área do Professor', itens: [
      { rotulo: 'Anamnese do aluno', href: '/area-do-professor/anamnese/' },
      { rotulo: 'Plano de ensino', href: '/area-do-professor/plano-de-ensino/' },
      { rotulo: 'Plano de Observação', href: '/area-do-professor/plano-de-observacao/' },
      { rotulo: 'Aulas', href: '/aulas/' },
    ] },
  ],
  barra: [{ tipo: 'menu', rotulo: 'Bastidores', itens: [
    { rotulo: 'Estúdio de Dança', href: '/bastidores/estudio' },
    { rotulo: 'Produção', href: '/bastidores/estudio' },
  ] }],
};

/** O texto do caminho, sem marcação — é o que a pessoa lê. */
const lerCaminho = (html) => ((html.match(/<span class="doc-atual">[\s\S]*?<\/span>/) || [''])[0]
  .replace(/<[^>]+>/g, '|').replace(/\|+/g, '|'));

console.log('\n1 · O que a montagem devolve por documento é NOME DE FICHEIRO, nunca booleano');
/* A PASTA É DE MENTIRA, e é o ponto: o defeito não estava nos ficheiros da escola, estava no
   TIPO do valor que a função devolvia. Uma pasta temporária com os três documentos basta para
   o provar, e não toca em escola nenhuma do repositório. */
{
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pacote-'));
  for (const f of ['plano.html', 'referencias.html', 'notacao.html',
    'glossario-benesh.html', 'ciclo-01-x.pdf']) fs.writeFileSync(path.join(temp, f), '<p>x</p>');
  const d = montagem.documentosDaTurma(temp);
  const booleanos = Object.entries(d).filter(([, v]) => typeof v !== 'string');
  provar('nenhum valor é booleano', booleanos.length === 0, booleanos);
  provar('…e cada um é o ficheiro que existe, ou a string vazia',
    d.plano === 'plano.html' && d.notacao === 'notacao.html'
    && d.glossario === 'glossario-benesh.html' && d.pdf === 'ciclo-01-x.pdf', d);
  /* O DEFEITO, NA FORMA EM QUE ELE APARECEU. Um `href` montado com `true` é `/x/true` — e é
     este o valor que a lista da notação servia. */
  provar('o href que a lista monta com este valor não é /variante/true',
    '/' + 'bale-nivel-2-teste-2' + '/' + d.notacao === '/bale-nivel-2-teste-2/notacao.html',
    '/' + 'bale-nivel-2-teste-2' + '/' + d.notacao);

  const vazio = fs.mkdtempSync(path.join(os.tmpdir(), 'pacote-vazio-'));
  const dv = montagem.documentosDaTurma(vazio);
  provar('uma pasta sem documentos devolve strings vazias (e não `false`)',
    Object.values(dv).every((v) => v === ''), dv);
  fs.rmSync(temp, { recursive: true, force: true });
  fs.rmSync(vazio, { recursive: true, force: true });
}

console.log('\n2 · O caminho é escrito UMA vez, por muitas passagens que a página leve');
{
  /* A PÁGINA COMO A PRODUÇÃO A SERVE HOJE: com o caminho JÁ escrito dentro do intervalo entre
     a marca e o ☰ — é esse o estado em que cada passagem o lia e o repetia. */
  const pagina = '<html><body>'
    + '<nav class="topnav"><a class="marca" href="/"><svg></svg></a>'
    + '<span class="doc-atual"><small>Área do Professor</small>Notação</span>'
    + '<button class="hamburger"></button>'
    + '<details class="menu"><summary>Bastidores</summary></details></nav>'
    + '<main><h1>Notação</h1></main></body></html>';

  const uma = nav.aplicar(pagina, MENU, '/bale-nivel-2-teste-2/notacao');
  const quantos = (h) => (String(h).match(/class="doc-atual"/g) || []).length;
  provar('depois de UMA passagem há um caminho', quantos(uma) === 1, quantos(uma));
  let h = pagina;
  for (let i = 0; i < 4; i++) h = nav.aplicar(h, MENU, '/bale-nivel-2-teste-2/notacao');
  provar('depois de QUATRO passagens continua a haver um', quantos(h) === 1, quantos(h));
  provar('…e nenhuma delas deixou a coluna a dobrar',
    (String(h).match(/class="coluna[ "]/g) || []).length === 1,
    (String(h).match(/class="coluna[ "]/g) || []).length);
  /* O BLOCO DA PÁGINA NÃO SE PERDE ao retirar o caminho: é a razão de o `extrasDaBarra` existir,
     e o `s5-sessao` da Produção vive no mesmo intervalo. */
  const comS5 = pagina.replace('<span class="doc-atual"><small>Área do Professor</small>Notação</span>',
    '<span class="s5-sessao">Produção · Alunas</span>');
  const depois = nav.aplicar(comS5, MENU, '/bastidores/estudio');
  provar('o bloco da página (a S5 da Produção) sobrevive à passagem',
    /s5-sessao/.test(depois) && /Produção · Alunas/.test(depois), (depois || '').slice(0, 80));
}

console.log('\n3 · O caminho diz de onde se veio, e o degrau do meio leva de volta');
{
  const naLista = nav.caminhoDaPagina(MENU.coluna, '/aulas/', 'Aulas');
  provar('na lista: «Área do Professor · Aulas», dois degraus',
    lerCaminho(naLista) === '|Área do Professor|Aulas|', lerCaminho(naLista));
  provar('…e o degrau do meio não existe (não se liga a si própria)',
    !/<a /.test(naLista), naLista);

  const noDocumento = nav.caminhoDaPagina(MENU.coluna, '/bale-nivel-2-teste-2/notacao', 'Notação em Benesh');
  provar('no documento: «Área do Professor · Aulas · Notação em Benesh», três degraus',
    lerCaminho(noDocumento) === '|Área do Professor|Aulas|Notação em Benesh|', lerCaminho(noDocumento));
  provar('…e o degrau do meio é uma LIGAÇÃO para a lista',
    /<a href="\/aulas\/">Aulas<\/a>/.test(noDocumento), noDocumento);
  provar('…e o último degrau é o documento, a negrito',
    /<b>Notação em Benesh<\/b>/.test(noDocumento), noDocumento);

  const noGlossario = nav.caminhoDaPagina(MENU.coluna,
    '/bale-nivel-2-teste-2/glossario-benesh', 'Glossário do código Benesh');
  provar('o Glossário também volta pelo percurso «Área do Professor · Aulas»',
    lerCaminho(noGlossario) === '|Área do Professor|Aulas|Glossário do código Benesh|'
      && /<a href="\/aulas\/">Aulas<\/a>/.test(noGlossario), noGlossario);
  /* O WORKER RESPONDE A `/x/referencias.html` COM UM 307 PARA `/x/referencias`, e a ponte vê o
     caminho já sem extensão. As duas formas têm de dar o mesmo caminho.
     E O DEGRAU DO MEIO É «PLANOS» (26/10/2026): a lista de referências deixou de existir, e o
     caminho até ao documento é o plano do ciclo. Quem está nas referências não saiu de Planos. */
  const comHtml = nav.caminhoDaPagina(MENU.coluna, '/bale-nivel-2-teste-2/referencias.html', 'Referências Bibliográficas');
  const semHtml = nav.caminhoDaPagina(MENU.coluna, '/bale-nivel-2-teste-2/referencias', 'Referências Bibliográficas');
  provar('com e sem `.html` o caminho é o mesmo', comHtml === semHtml, { comHtml, semHtml });
  provar('…e em ambas o caminho diz «Ciclos · Planos · Referências Bibliográficas»',
    lerCaminho(comHtml) === '|Ciclos|Planos|Referências Bibliográficas|', lerCaminho(comHtml));
  provar('…e o degrau do meio leva à lista de PLANOS',
    /href="\/ciclos\/planos\/">Planos<\/a>/.test(comHtml), comHtml);
  provar('…e já não existe degrau nenhum a apontar para a lista de referências',
    !/ciclos\/referencias/.test(comHtml), comHtml);

  /* O CAMINHO DE UMA AULA LEVA TRÊS DEGRAUS, E O DO MEIO É A LISTA DE AULAS (24/10/2026). Antes
     dizia «Aulas · Aula 01» — dois, porque o grupo e a lista tinham o mesmo nome e o desenho
     cortava o repetido. Com a lista dentro da Área do Professor, os degraus diferem e o caminho
     passa a dizer de onde se veio: o grupo, a lista (ligada), o documento. */
  const aula = nav.caminhoDaPagina(MENU.coluna, '/bale-nivel-2-teste-2/aula-01', 'Aula 01');
  provar('o caminho de uma aula é «Área do Professor · Aulas · Aula 01»',
    lerCaminho(aula) === '|Área do Professor|Aulas|Aula 01|', lerCaminho(aula));
  provar('…e o degrau do meio é a ligação para a lista', /<a href="\/aulas\/">Aulas<\/a>/.test(aula), aula);

  /* O PLANO DO CICLO É O CASO MAIS DELICADO: o `<h1>` diz «Plano do Ciclo 01», e a lista é
     «Planos». Quem abre o plano pelo cartão da lista tem de poder voltar a ela. */
  const plano = nav.caminhoDaPagina(MENU.coluna, '/bale-nivel-2-teste-2/plano', 'Plano do Ciclo 01');
  provar('o plano do ciclo leva de volta à lista de planos',
    /href="\/ciclos\/planos\/"/.test(plano), plano);
}

console.log('\n4 · O Bastidores encosta à direita, e não anda com o texto');
{
  /* A MEDIDA É DE CSS, e o que se pode medir sem browser é a REGRA: ela existe, vale só quando
     há coluna, e é ela que fixa a lista à direita. A geometria em si mede-se no
     `provar-navegacao`, com o puppeteer, quando a escola tiver turmas. */
  const css = fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8');
  /* A REGRA É DA FORMA, E NÃO DA COLUNA. Ela já foi `body:has(> .coluna)`, e isso partia-a nos
     Bastidores — onde a coluna do sistema não se desenha, mas a barra é a mesma: o Bastidores
     saltava para o lado da marca só naquela página. A forma é do desenho, e é o desenho que a
     declara (`data-menu="coluna"` no `<nav>`). */
  provar('a lista da barra encosta à direita no menu de destinos',
    /\.topnav\[data-menu="coluna"\] \.nav-links\s*\{\s*justify-content:\s*flex-end;?\s*\}/.test(css), true);
  provar('…e a regra não vale na barra de hoje (que não declara a forma)',
    !/^\.topnav \.nav-links\s*\{[^}]*justify-content:\s*flex-end/m.test(css), true);
  provar('…e no painel do celular a lista volta a alinhar à esquerda',
    /\.topnav\.aberto \.nav-links \{[^}]*justify-content:\s*flex-start/.test(css), true);
  /* O SUBMENU DO «BASTIDORES» ERA ENGOLIDO PELA MARGEM DIREITA (26/10/2026). Ele abria a partir
     da ESQUERDA do menu (`left: 0`) com 300px de largura fixa — e o menu está na ponta direita.
     Medido no browser a 1280 e a 1440, em cinco páginas: o painel terminava 185px FORA da
     janela. Como a barra é `position: fixed`, o que transborda não gera rolagem: é CORTADO.
     «Estúdio de Dan…» e, por baixo, só «Produção».

     A regra é de simetria — o submenu cresce para o lado onde há espaço. Aqui mede-se a REGRA
     (sem browser); a geometria mede-se no `provar-painel-do-ato`, que abre o menu a sério. */
  provar('o submenu encosta à direita quando o menu encosta à direita',
    /\.topnav\[data-menu="coluna"\] \.nav-links \.submenu\s*\{\s*left:\s*auto;\s*right:\s*0;?\s*\}/.test(css), true);
  provar('…e o `left: 0` do desenho base continua, para a barra que não declara a forma',
    /\.topnav \.submenu \{[^}]*left: 0/.test(css), true);
  /* O ATRIBUTO É ESCRITO PELO DESENHO — sem ele a regra acima não pega em página nenhuma. */
  const barra = nav.desenhar(MENU, '/aulas/', { extras: '', titulo: 'Aulas' });
  provar('o desenho declara a forma na barra',
    /<nav class="topnav" data-menu="coluna"/.test(barra), (barra || '').slice(0, 60));
}

console.log('\n5 · Os Bastidores têm a coluna, e continuam a não ter dois menus laterais');
{
  /* A REGRA INVERTEU-SE DE PROPÓSITO (23/10/2026), e o porquê é o telemóvel: abaixo dos 1140 a
     lista da barra não se mostra, e quem navega é a folha. Sem coluna, a folha não existia — e a
     pesquisadora abria o ☰ dentro da Produção e só tinha o Bastidores. A coluna passa a ser
     desenhada em TODO o lado; o duplo no computador resolve-se no CSS. */
  const nosBastidores = nav.desenhar(MENU, '/bastidores/estudio', { extras: '', titulo: 'Produção' });
  provar('a página dos Bastidores RECEBE a coluna do sistema — é ela que o ☰ abre no telemóvel',
    /class="coluna[ "]/.test(nosBastidores), (nosBastidores || '').slice(0, 60));
  provar('…e a barra continua lá, com o Bastidores',
    /class="topnav"/.test(nosBastidores) && /Bastidores/.test(nosBastidores), (nosBastidores || '').slice(0, 60));
  /* UM VÉU, E NÃO DOIS. Ele nasce com a coluna; se nascesse também na página, ficavam dois
     `pointer-events` sobrepostos e o toque-fora deixava de ser um só. */
  provar('…com um véu só (o que nasce com a coluna)',
    (nosBastidores.match(/class="veu"/g) || []).length === 1,
    (nosBastidores.match(/class="veu"/g) || []).length);
  provar('a página de trabalho continua a ter a coluna',
    /class="coluna[ "]/.test(nav.desenhar(MENU, '/aulas/', { extras: '', titulo: 'Aulas' })), true);

  /* O DUPLO NO COMPUTADOR É DO CSS, e a regra tem de existir: onde a página tem a sua própria
     coluna, a do sistema sai de cena acima dos 1140 — com o afastamento do `body` e o `left` da
     barra, senão ficava uma faixa de 248px vazia à esquerda.
     O SELETOR É DESCENDENTE. Com `> .lateral` ele não pegava em nada (a `lateral` vive dentro do
     `.corpo`), e o sintoma era silencioso: duas colunas e 248px de margem. */
  const folhaCss = fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8');
  provar('o CSS esconde a coluna do sistema onde há `lateral`',
    /body:has\(\.lateral\) > \.coluna \{ display: none; \}/.test(folhaCss), 'regra ausente');
  /* A BARRA COMEÇA DEPOIS DA COLUNA DA PRODUÇÃO (13/11/2026). Ela começava a 0 enquanto a
     `lateral` média 176px e nascia abaixo da barra; agora a `lateral` é a coluna de 248px e vai
     de cima a baixo, por isso a barra cede os 248px — a MESMA moldura do Sistema Lastro. O que
     continua proibido é a faixa vazia: o `body` não paga os 248px, porque a coluna os ocupa. */
  provar('…e o corpo não paga a faixa (a coluna a ocupa), com a barra a começar depois dela',
    /body:has\(\.lateral\) \{ padding-left: 0; \}/.test(folhaCss)
    && /body:has\(\.lateral\) \.topnav \{ left: 248px; \}/.test(folhaCss), 'regra ausente');

  const bastidores = fs.readFileSync(path.join(raiz, 'motor/servidor/bastidores.js'), 'utf8');
  provar('a lateral da Produção tem um caminho de volta ao sistema',
    /class="lateral-voltar" href="\/">/.test(bastidores), true);
}

console.log('\n6 · A folha leva o Bastidores, e o computador não o duplica');
{
  const html = nav.desenhar(MENU, '/aulas/', { extras: '', titulo: 'Aulas' });
  const folha = (html.match(/<aside class="coluna[^"]*"[\s\S]*?<\/aside>/) || [''])[0];
  provar('o Bastidores está dentro da folha', /Bastidores/.test(folha), folha.length);
  /* O ÚLTIMO BLOCO É O DE FORA. A comparação era com `coluna-direto`, e deixou de medir nada no
     dia em que a coluna ficou sem destinos directos: `lastIndexOf` devolveria `-1` para os dois
     lados e a asserção passava por omissão — a armadilha de sempre, uma prova que não mede nada
     e por isso não falha. Compara-se com o último GRUPO, que existe sempre. */
  /* A MEDIDA É «NÃO HÁ NENHUM GRUPO DE TRABALHO DEPOIS DELE», e não uma comparação de
     `lastIndexOf` de nomes de classe: o bloco de fora traz DUAS (`coluna-fora coluna-grupo`), e
     a segunda ocorrência de «coluna-grupo» está dentro do próprio bloco de fora — comparar as
     posições dos dois nomes media a ordem em que eles estão escritos no atributo, não a ordem
     dos blocos na página. O `class="coluna-grupo"` exacto só casa o grupo comum. */
  provar('…depois da coluna, no fim (é o último bloco)',
    folha.lastIndexOf('coluna-fora') > folha.lastIndexOf('class="coluna-grupo"'),
    { fora: folha.lastIndexOf('coluna-fora'), ultimoGrupo: folha.lastIndexOf('class="coluna-grupo"') });
  provar('…e marcado como bloco de fora (é o que o CSS separa e esconde na coluna)',
    /class="coluna-fora coluna-grupo"/.test(folha), (folha.match(/class="coluna-[a-z-]+[^"]*"/g) || []).join(' '));
  provar('…com os dois destinos dele', (folha.match(/\/bastidores\//g) || []).length === 2,
    (folha.match(/\/bastidores\//g) || []).length);

  /* NA COLUNA DO COMPUTADOR ELE NÃO APARECE — lá está na barra. O CSS é que decide, e a regra
     tem de existir: sem ela o mesmo destino ficaria em dois sítios, e o da coluna é o errado. */
  const css = fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8');
  provar('na coluna do computador o bloco de fora está escondido',
    /\.coluna \.coluna-fora \{ display: none; \}/.test(css), true);
  provar('…e na folha ele tem o filete que o separa do trabalho de sala',
    /\.coluna \.coluna-fora \{[^}]*border-top:/.test(css), true);
}

console.log('\n7 · O título é o do `<h1>` da PÁGINA, e não o que está num comentário');
{
  /* O DEFEITO, REPRODUZIDO. O `lancamento.html` tem, dentro do `<style>`, um comentário que
     explica o `--header-height` — e o comentário diz «punha o `<h1>` DEBAIXO da barra fixa». A
     busca era uma expressão regular sobre o documento inteiro: encontrava aquele `<h1>` e
     levava tudo até ao `</h1>` verdadeiro. O caminho da barra saía a dizer «DEBAIXO da barra
     fixa. *\/ padding: var(--header-height) 20px 40px; } h1 {» — em produção, no celular. */
  const pagina = '<!DOCTYPE html><html><head><style>\n'
    + '  main { padding: var(--header-height) 20px 40px; }\n'
    + '  /* O `--header-height` é publicado pelo script; sem ele o <h1> ficava DEBAIXO da barra. */\n'
    + '  h1 { color: red; }\n'
    + '</style></head><body><h1>Lançamento de aula — formulário eletrônico</h1></body></html>';
  const titulo = nav.tituloDaPagina(pagina);
  provar('o `<h1>` dentro do `<style>` não é o título da página',
    !/DEBAIXO|header-height|padding/.test(titulo), titulo);
  provar('…e o título é o `<h1>` do corpo', titulo === 'Lançamento de aula', titulo);

  /* O MESMO DEFEITO, UMA CAMADA AO LADO (06/11/2026): o `<h1>` escrito num COMENTÁRIO. O
     `lancamento.html` ganhou um comentário a explicar que o cabeçalho deixou de ser «um `<h1>`
     SOLTO» — e a busca, que varria o documento inteiro, achou AQUELE `<h1>` e levou tudo até ao
     `</h1>` verdadeiro. A barra dizia, em produção, no celular dela: «` SOLTO (06/11/2026). Até
     hoje esta página trazia um `<div class="titulo-fixo">` com um `<h1>` nu…». */
  const comComentario = '<!DOCTYPE html><html><body>'
    + '<!-- O CABEÇALHO É O DA CASA, E NÃO UM `<h1>` SOLTO (06/11/2026).\n'
    + '     Até hoje esta página trazia um `<div class="titulo-fixo">` com um `<h1>` nu. -->\n'
    + '<header class="doc"><h1>Lançamento de aula — formulário eletrônico</h1></header>'
    + '</body></html>';
  const tComentario = nav.tituloDaPagina(comComentario);
  provar('o `<h1>` escrito num COMENTÁRIO não é o título da página',
    !/SOLTO|Até hoje|titulo-fixo/.test(tComentario), tComentario);
  provar('…e o título continua a ser o `<h1>` do corpo',
    tComentario === 'Lançamento de aula', tComentario);

  /* O NOME, E NÃO O NOME E A SUA EXPLICAÇÃO. O `<h1>` de um documento do pacote costuma trazer
     as duas separadas por travessão, e a barra é um caminho, não uma ficha. */
  for (const [bruto, nome] of [
    ['Lançamento de aula — formulário eletrônico', 'Lançamento de aula'],
    ['Plano do Ciclo 01 — batata', 'Plano do Ciclo 01'],
    /* O NOME CURTO DO DOCUMENTO DA AULA (04/11/2026): ele passou a chamar-se «Plano para a Aula
     * 01 — …», porque o documento é um plano e a barra dizia só «Aula 01», que se confundia com a
     * listagem das aulas. O corte no travessão continua a valer — o degrau é um nome, não uma
     * ficha. */
    ['Plano para a Aula 01 — reconhecer o apoio e alinhar o eixo vertical', 'Plano para a Aula 01'],
    ['Referências Bibliográficas', 'Referências Bibliográficas'],
    ['Notação em Benesh', 'Notação em Benesh'],
  ]) {
    const t = nav.tituloDaPagina('<h1>' + bruto + '</h1>');
    provar('«' + bruto.slice(0, 34) + '…» fica «' + nome + '»', t === nome, t);
  }
  /* A PÁGINA REAL, e é a que estava quebrada: um `lancamento.html` de um pacote em disco. Ele é
     DESCOBERTO, e não mais apontado à `batata` — a `batata` foi expurgada, e a asserção passou a
     falhar por «ausente» em vez de medir. Uma guarda que aponta para uma escola que já não existe
     não guarda nada; a que procura a primeira que existe mede o ficheiro de hoje. */
  const pacotes = fs.existsSync(path.join(raiz, 'professores'))
    ? fs.readdirSync(path.join(raiz, 'professores'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => {
        const ciclos = path.join(raiz, 'professores', d.name, 'ciclos');
        if (!fs.existsSync(ciclos)) return [];
        return fs.readdirSync(ciclos, { withFileTypes: true })
          .filter((c) => c.isDirectory() && /^ciclo-\d{2}-/.test(c.name))
          .map((c) => path.join(ciclos, c.name, 'lancamento.html'));
      })
      .filter((arquivo) => fs.existsSync(arquivo))
    : [];
  if (pacotes.length) {
    const medidas = pacotes.map((arquivo) => ({
      arquivo: path.relative(raiz, arquivo),
      titulo: nav.tituloDaPagina(fs.readFileSync(arquivo, 'utf8')),
    }));
    const tortas = medidas.filter((m) => m.titulo !== 'Lançamento de aula');
    provar('em TODOS os `lancamento.html` de verdade o título é «Lançamento de aula»',
      tortas.length === 0, tortas.slice(0, 3));
  } else {
    provar('há um `lancamento.html` de pacote para ser medido', false, 'nenhum');
  }
}

const falhou = provas.filter((p) => !p.ok).length;
console.log('\nprovar-barra-e-caminho: ' + (provas.length - falhou) + ' de ' + provas.length + ' passaram');
process.exit(falhou ? 1 : 0);
