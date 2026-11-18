/**
 * cadastro-da-escola.js — O QUE UM CADASTRO DE ESCOLA TEM DE TER (25/11/2026).
 *
 * A DECISÃO DELA, com as palavras dela: no cadastro da escola «a gente vai ter o nome da escola,
 * o CNPJ da escola, o e-mail da escola e o telefone da escola»; e do professor principal «o nome
 * completo do professor, o CPF do professor, o e-mail e o telefone do professor» — e «ele já vai
 * cadastrar aqui qual é a habilidade que ele tem».
 *
 * PORQUE ESTE MÓDULO EXISTE, E NÃO UMA VALIDAÇÃO DENTRO DA ROTA. A mesma forma é pedida em DOIS
 * sítios — a página do proprietário (`danca.padd.com.br`) e a página pública
 * (`lastro.padd.com.br`) —, e as duas criam a MESMA escola. Duas validações para o mesmo cadastro
 * divergem no dia em que a primeira mudar, e o sintoma seria uma escola que nasce por uma porta e
 * não pela outra. A regra é uma; as portas são duas.
 *
 * O QUE ELE **NÃO** FAZ: não lê, não grava, não chama a rede. Recebe o que veio e devolve o que se
 * conclui — como o `perfil-do-professor.js` ao lado, e pela mesma razão: a prova mede a regra sem
 * precisar de um Worker.
 *
 * CPF E CNPJ NÃO SE GUARDAM EM ÍNDICE VERSIONADO. A verificação 7 do `check-indices.js` proíbe os
 * campos `email`, `telefone` e afins nos índices do acervo, e com razão: o repositório é público
 * para quem tem o token, e o índice é derivado dele. O cadastro vive no KV — ver `raiz.js`.
 */

/** Só os dígitos — é assim que CPF e CNPJ são comparados e guardados. */
function soDigitos(valor) {
  return String(valor == null ? '' : valor).replace(/\D+/g, '');
}

/**
 * O CPF: onze dígitos, e a conferência é de FORMA, não de dígito verificador.
 *
 * A ESCOLHA, declarada: o protótipo não valida o dígito verificador. Validá-lo impediria o teste
 * com um número inventado — e o que se está a testar aqui é o cadastro, não a Receita. O que a
 * regra impede é o erro de digitação (dez ou doze dígitos, letras, máscara colada duas vezes),
 * que é o erro que acontece. Um CPF bem formado e falso passa; isso está dito, e não é silêncio.
 */
/**
 * O CPF: onze dígitos, e a mesma disciplina do CNPJ — forma, não verificador.
 *
 * O `de` ENTROU A 18/11/2026, quando o CPF passou a ser pedido também à ALUNA («ele é outra pessoa,
 * ele tem outro CPF»). Sem ele, a resposta de um erro no cadastro da aluna dizia «CPF do professor»
 * — e uma mensagem que nomeia a pessoa errada manda corrigir o campo errado. O valor por omissão é
 * o de sempre, para os chamadores antigos não mudarem.
 */
function normalizarCpf(valor, { de = 'CPF do professor' } = {}) {
  const bruto = String(valor == null ? '' : valor).trim();
  if (!bruto) return { ok: false, erro: 'informe o ' + de };
  const digitos = soDigitos(bruto);
  if (digitos.length !== 11) {
    return { ok: false, erro: 'o ' + de + ' tem de ter 11 dígitos (vieram ' + digitos.length + ')' };
  }
  if (/^(\d)\1{10}$/.test(digitos)) {
    return { ok: false, erro: 'o ' + de + ' não pode ser um número repetido' };
  }
  return { ok: true, valor: digitos };
}

/**
 * O CNPJ: catorze dígitos. Mesma disciplina do CPF, e mesma declaração: forma, não verificador.
 *
 * VEM ANTES DO CPF na ordem das mensagens — a escola é o que se está a criar, e um erro no
 * cadastro dela não deve aparecer depois de a pessoa preencher o do professor.
 */
function normalizarCnpj(valor) {
  const bruto = String(valor == null ? '' : valor).trim();
  if (!bruto) return { ok: false, erro: 'informe o CNPJ da escola' };
  const digitos = soDigitos(bruto);
  if (digitos.length !== 14) {
    return { ok: false, erro: 'o CNPJ da escola tem de ter 14 dígitos (vieram ' + digitos.length + ')' };
  }
  if (/^(\d)\1{13}$/.test(digitos)) {
    return { ok: false, erro: 'o CNPJ da escola não pode ser um número repetido' };
  }
  return { ok: true, valor: digitos };
}

/**
 * O E-MAIL — e ele é o ENDEREÇO DE ENTREGA da mensagem de boas-vindas, não um campo decorativo.
 *
 * A conferência é deliberadamente modesta: uma `@` com algo de cada lado e um ponto no domínio.
 * Um validador mais severo recusa endereços válidos (subdomínios, `+`, domínios novos) e o custo
 * desse engano é a pessoa não receber a chave de entrada. O que ele pega é o que acontece: espaço,
 * duas `@`, domínio sem ponto, e o ponto final do copiar-e-colar.
 */
function normalizarEmail(valor, { de = 'e-mail' } = {}) {
  const bruto = String(valor == null ? '' : valor).trim().replace(/[.,;]+$/, '');
  if (!bruto) return { ok: false, erro: 'informe o ' + de };
  if (/\s/.test(bruto)) return { ok: false, erro: 'o ' + de + ' não pode ter espaços' };
  const partes = bruto.split('@');
  if (partes.length !== 2 || !partes[0] || !partes[1]) {
    return { ok: false, erro: 'o ' + de + ' precisa de uma @ entre o nome e o domínio' };
  }
  if (!/\.[a-z]{2,}$/i.test(partes[1])) {
    return { ok: false, erro: 'o ' + de + ' está sem um domínio válido (ex.: escola@padd.com.br)' };
  }
  return { ok: true, valor: bruto.toLowerCase() };
}

/**
 * O TELEFONE — guardado como a pessoa escreveu, comparado como número.
 *
 * NÃO SE NORMALIZA A FORMA. O telefone de uma escola é lido por gente (o consultor liga para ele),
 * e «(51) 99999-0000» lê-se melhor do que «51999990000». O que se exige é o MÍNIMO de dígitos: dez,
 * que é um fixo com DDD. Menos do que isso é um número incompleto — e um telefone incompleto no
 * cadastro é a mesma coisa que não ter telefone.
 */
function normalizarTelefone(valor, { de = 'telefone' } = {}) {
  const bruto = String(valor == null ? '' : valor).trim();
  if (!bruto) return { ok: false, erro: 'informe o ' + de };
  const digitos = soDigitos(bruto);
  if (digitos.length < 10) {
    return { ok: false, erro: 'o ' + de + ' precisa de DDD e número (10 dígitos no mínimo)' };
  }
  if (digitos.length > 13) {
    return { ok: false, erro: 'o ' + de + ' tem dígitos a mais (máximo 13, com o país)' };
  }
  return { ok: true, valor: bruto };
}

/** O nome de uma pessoa ou de uma escola: existe, e tem duas letras que sejam letras. */
function normalizarNome(valor, { de = 'nome', minimo = 2 } = {}) {
  const bruto = String(valor == null ? '' : valor).trim().replace(/\s+/g, ' ');
  if (!bruto) return { ok: false, erro: 'informe o ' + de };
  if (bruto.replace(/[^\p{L}]/gu, '').length < minimo) {
    return { ok: false, erro: 'o ' + de + ' precisa de pelo menos ' + minimo + ' letras' };
  }
  return { ok: true, valor: bruto };
}

/**
 * O CADASTRO INTEIRO — e a ordem das perguntas é a ordem das mensagens.
 *
 * O caminho do professor é um só dos dois, e é o mesmo que o formulário já tinha: um professor
 * NOVO (que traz nome, CPF, e-mail, telefone e habilidade) ou um que JÁ EXISTE (que já tem tudo
 * isso guardado, e só precisa de ser escolhido). Exigir o CPF de quem já está no sistema seria
 * pedir de novo o que o sistema sabe — e é exactamente o defeito que a validação de 15/10/2026
 * tinha, a pedir o nome de um professor que já existia.
 *
 * `modalidades` são os ids do catálogo (`biblioteca/modalidades/modalidades.json`). A habilidade é
 * declarada por QUEM ENTRA — a decisão dela: «agora ele é que vai determinar nesse cadastro». A
 * lista de ids válidos chega por parâmetro, e não por `require`: este módulo não conhece o
 * catálogo, e quem o conhece passa-o.
 */
const ROTULO_DO_CAMPO = {
  cnpj: 'o CNPJ da escola',
  escolaEmail: 'o e-mail da escola',
  escolaTelefone: 'o telefone da escola',
  professorNomeCompleto: 'o nome completo do professor',
  cpf: 'o CPF do professor',
  professorEmail: 'o e-mail do professor',
  professorTelefone: 'o telefone do professor',
  modalidade: 'a habilidade do professor',
};

function validarCadastro(pedido, { modalidadesValidas = [], exigirDadosDaEscola = false } = {}) {
  const p = pedido || {};
  const erros = [];
  const cadastro = {};

  // ── a escola ────────────────────────────────────────────────────────────────
  const nome = normalizarNome(p.nome || p.escolaNome, { de: 'nome da escola' });
  if (!nome.ok) erros.push(nome.erro);
  else cadastro.escolaNome = nome.valor;

  /* O CADASTRO DA ESCOLA PODE SER EXIGIDO OU NÃO, e quem decide é a porta. A página PÚBLICA
   * pede-o — é ela que recolhe os dados de quem se está a registar. A página do PROPRIETÁRIO já
   * criava escolas sem ele (e as escolas de teste dela não têm CNPJ nenhum), e passar a exigi-lo
   * lá fecharia a porta a quem só quer provar o sistema. O campo vazio continua a ser guardado
   * como vazio, e não como zero: «não declarado» não é «inválido». */
  const exigir = exigirDadosDaEscola === true;
  const guardar = (chave, resultado) => {
    if (resultado.ok) { cadastro[chave] = resultado.valor; return true; }
    erros.push(resultado.erro);
    return false;
  };

  if (exigir || String(p.cnpj || '').trim()) guardar('cnpj', normalizarCnpj(p.cnpj));
  if (exigir || String(p.escolaEmail || '').trim()) {
    guardar('escolaEmail', normalizarEmail(p.escolaEmail, { de: 'e-mail da escola' }));
  }
  if (exigir || String(p.escolaTelefone || '').trim()) {
    guardar('escolaTelefone', normalizarTelefone(p.escolaTelefone, { de: 'telefone da escola' }));
  }

  // ── o professor ─────────────────────────────────────────────────────────────
  const existente = String(p.professorExistente || '').trim();
  cadastro.professorExistente = existente;

  if (!existente) {
    const completo = normalizarNome(
      p.professorNomeCompleto || [p.professorNome, p.professorSobrenome].filter(Boolean).join(' '),
      { de: 'nome completo do professor' });
    if (!completo.ok) erros.push(completo.erro);
    else cadastro.professorNomeCompleto = completo.valor;

    guardar('cpf', normalizarCpf(p.cpf));
    guardar('professorEmail', normalizarEmail(p.professorEmail, { de: 'e-mail do professor' }));
    guardar('professorTelefone', normalizarTelefone(p.professorTelefone, { de: 'telefone do professor' }));

    /* A HABILIDADE É OBRIGATÓRIA, e é uma escolha DENTRO do catálogo. Um id fora dele produziria
     * um perfil que nenhuma tela sabe ler — e o erro apareceria meses depois, na primeira turma
     * que precisasse daquela modalidade. A validação é aqui, com a lista que veio de quem conhece
     * o catálogo. Lista vazia (catálogo ilegível) NÃO bloqueia: nesse caso não há como conferir, e
     * recusar por falta de informação é pior do que aceitar o que veio. */
    const habilidade = String(p.modalidade || p.habilidade || '').trim();
    if (!habilidade) erros.push('escolha ' + ROTULO_DO_CAMPO.modalidade);
    else if (modalidadesValidas.length && modalidadesValidas.indexOf(habilidade) === -1) {
      erros.push('a habilidade «' + habilidade + '» não está no catálogo de modalidades');
    } else cadastro.modalidade = habilidade;
  }

  if (erros.length) return { ok: false, erros, erro: erros[0] };
  return { ok: true, cadastro, modo: existente ? 'existente' : 'novo' };
}

/** Os e-mails a que a mensagem de boas-vindas vai — sem repetir o mesmo endereço. */
function destinatarios(cadastro) {
  const vistos = new Set();
  const lista = [];
  for (const bruto of [cadastro && cadastro.professorEmail, cadastro && cadastro.escolaEmail]) {
    const email = String(bruto || '').trim().toLowerCase();
    if (!email || vistos.has(email)) continue;
    vistos.add(email);
    lista.push(email);
  }
  return lista;
}

module.exports = {
  soDigitos,
  normalizarCpf,
  normalizarCnpj,
  normalizarEmail,
  normalizarTelefone,
  normalizarNome,
  validarCadastro,
  destinatarios,
  ROTULO_DO_CAMPO,
};
