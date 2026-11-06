'use strict';

/**
 * ler-dados.js — o Worker DECIFRA o `-dados.json` do pacote para quem se autentica.
 *
 * POR QUE EXISTE. O pacote é PÚBLICO (é o site da escola) e ele carrega o lançamento por aluna:
 * por isso a cópia do `-dados.json` vai CIFRADA, e por isso quem a abre precisa da chave. Até
 * 15/10/2026 quem a abria era o NAVEGADOR, com a chave que a professora digitava — a mesma chave
 * que a página `danca` exibia uma única vez na criação da escola, para a pesquisadora arquivar num
 * arquivo local. O dono do produto apontou o absurdo: *«pra mim, como usuário, isso já deveria ser
 * automático»*. Ele está certo, e a saída é esta: a chave fica DENTRO do Worker (é ele quem cifra,
 * no «Guardar» do PO), e é ele quem decifra — a chave nunca chega a uma pessoa.
 *
 * O QUE ISSO MUDA NO FLUXO. O navegador deixa de conhecer a chave: ele manda a SENHA DA PESSOA (a
 * que ela já sabe, e que o Worker já confere nos Bastidores) e recebe o TEXTO EM CLARO. A senha
 * passa a ser só AUTENTICAÇÃO — não é mais a chave, e por isso TROCAR A SENHA NÃO INVALIDA NADA:
 * o que está cifrado continua abrindo, porque quem o abre é o Worker, com a chave estável dele.
 *
 * O TETO DO RUNTIME, DE NOVO. O WebCrypto do workerd recusa PBKDF2 acima de 100.000 iterações —
 * o defeito que impediu a cópia cifrada de nascer (`cifrar-envelope.js`). Aqui ele reaparece do
 * outro lado: abrir um envelope cifrado pelo CLI LOCAL (2e6, herdado do PageCrypt) também falha.
 * Não há plano B honesto (não se baixa a contagem de um arquivo já cifrado), então a falha é
 * DECLARADA com a instrução do que fazer — regenerar o pacote, que sai com a contagem do Worker.
 */

const Cifra = require('../../tools/lib-cifra.js');
// A REGRA DO NOME DE DADOS É A DO NÚCLEO — uma definição só (06/11/2026). Havia aqui uma cópia
// que aceitava um único segmento de variante: ela recusava `ciclo-01-calango-bale-nivel-1-teste-1-
// dados.json`, e o «Abrir» do formulário ficava sem abrir o ciclo — com a senha certa.
const { partesDoCaminhoDeDados } = require('../nucleo/lancamento.js');

/**
 * Monta o leitor. Sem chave, sem leitor de asset ou sem conferência de senha, devolve `null` — e a
 * rota responde que o recurso não está disponível, em vez de falhar de um jeito obscuro.
 *
 *   senhaCripto — o segredo `SENHA_CRIPTO` do Worker (a chave; nunca sai daqui);
 *   lerAsset    — `(caminho) => Promise<{corpo}|null>`, a leitura do pacote publicado;
 *   senhaOk     — `(senha) => Promise<boolean>`, a conferência da senha de quem pede.
 */
function criarLeitorDeDados({ senhaCripto, lerAsset, senhaOk }) {
  if (!senhaCripto || typeof lerAsset !== 'function' || typeof senhaOk !== 'function') return null;

  return async function lerDados({ arquivo, senha }) {
    const nome = String(arquivo || '').trim();
    // O CAMINHO VEM DO CLIENTE — então ele é conferido, e não confiado: só o `-dados.json` de um
    // ciclo deste pacote, e só dentro de UMA pasta. Sem isto, uma travessia de caminho (`../`)
    // leria outro arquivo do ASSETS e o devolveria em claro a quem tem uma senha de professor.
    const partes = partesDoCaminhoDeDados(nome);
    if (!partes) {
      return { ok: false, erro: 'arquivo de dados inválido: ' + (nome || '(vazio)') };
    }
    if (!(await senhaOk(senha))) {
      return { ok: false, erro: 'senha não reconhecida' };
    }
    /* O ARQUIVO ESTÁ DENTRO DO PACOTE, E A RAIZ NÃO O TEM (06/11/2026). Desde que o
     * `assets.directory` passou a ser a `publicacao/<escola>/` — montada com um subdirectório
     * por turma —, o `-dados.json` vive em `<pacote>/`, e esta leitura o procurava na raiz.
     * Respondia «o pacote não tem …» para um ficheiro publicado e legível, e a página contava
     * isso como «a senha foi recusada»: ela procurou a senha errada durante uma tarde.
     *
     * A ordem: o caminho que o cliente declarou, e, se ele não declarou pasta, o nome na raiz.
     * O segundo degrau não afrouxa nada — a raiz é o único lugar que o modelo antigo (um Worker
     * por pacote) conhecia, e ali o nome sozinho é o caminho inteiro. */
    let asset = partes.pasta ? await lerAsset(partes.pasta + '/' + partes.nome) : null;
    if (!asset || !asset.corpo) asset = await lerAsset(partes.nome);
    if (!asset || !asset.corpo) {
      return { ok: false, erro: 'o pacote não tem ' + nome };
    }
    const texto = new TextDecoder().decode(asset.corpo);
    let bruto;
    try {
      bruto = JSON.parse(texto);
    } catch (e) {
      return { ok: false, erro: 'o ' + nome + ' não é JSON válido' };
    }
    // Sem cifra, o texto É o dado: devolver em claro é o mesmo que o navegador faria ao abri-lo.
    if (!bruto || !bruto._cifrado) return { ok: true, texto };
    try {
      return { ok: true, texto: await Cifra.decifrar(bruto._cifrado, senhaCripto) };
    } catch (e) {
      const motivo = (e && e.message) || String(e);
      const acima = /iteration counts above/i.test(motivo);
      return {
        ok: false,
        erro: acima
          ? 'o pacote foi cifrado com mais iterações do que este ambiente aceita — regenere o '
            + 'pacote (o gerador usa a contagem do Worker)'
          : 'não consegui abrir ' + nome + ': ' + motivo,
      };
    }
  };
}

module.exports = { criarLeitorDeDados };
