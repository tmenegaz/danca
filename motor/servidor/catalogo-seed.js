'use strict';

/**
 * catalogo-seed.js — o catálogo INICIAL de turmas e vocabulário técnico do balé.
 *
 * Fonte de conteúdo do cadastro administrativo (turmas, vocabulário e a relação
 * turma↔termo). É DADO de partida, não norma: o que aqui se registra é o ponto de
 * partida pedido pela pesquisadora, fundamentado na progressão da RAD (Royal Academy
 * of Dance) e na terminologia das tradições RAD/britânica, francesa e Vaganova/russa
 * — NÃO é uma equivalência oficial entre escolas, nem um programa integral reproduzido.
 *
 * A regra da metodologia (P-16 — «declarada, nunca deduzida») vale aqui em dobro:
 * quando uma diferença de nomenclatura entre tradições não tem fonte confirmada, o
 * termo é marcado como «compartilhado» (ou fica com `observacoes` registrando a
 * dúvida) — nunca se inventa uma equivalência.
 *
 * O catálogo é IDEMPOTENTE no carregamento: só entram os registros cujo `id` (o slug
 * do nome) ainda não existe. Carregar duas vezes não duplica.
 */

/**
 * As turmas — nome local de exibição + a referência pedagógica SUGERIDA (não oficial).
 * `ordem` reorganiza a exibição sem mudar a identidade (`id` = slug do nome).
 */
const TURMAS = [
  { nome: 'Balé Nível 1', ordem: 1, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Grade 1', descricao: '', ativo: true },
  { nome: 'Balé Nível 2', ordem: 2, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Grade 2', descricao: '', ativo: true },
  { nome: 'Balé Nível 3', ordem: 3, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Grade 3', descricao: '', ativo: true },
  { nome: 'Balé Nível 4', ordem: 4, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Grade 4', descricao: '', ativo: true },
  { nome: 'Balé Nível 5', ordem: 5, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Grade 5', descricao: '', ativo: true },
  { nome: 'Balé Nível 6', ordem: 6, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Grade 6', descricao: '', ativo: true },
  { nome: 'Balé Nível 7', ordem: 7, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Grade 7', descricao: '', ativo: true },
  { nome: 'Balé Nível 8', ordem: 8, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Grade 8', descricao: '', ativo: true },
  { nome: 'Balé Vocacional — Foundation', ordem: 9, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Vocational Foundation', descricao: '', ativo: true },
  { nome: 'Balé Vocacional — Intermediate', ordem: 10, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Vocational Intermediate', descricao: '', ativo: true },
  { nome: 'Balé Vocacional — Advanced Foundation', ordem: 11, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Vocational Advanced Foundation', descricao: '', ativo: true },
  { nome: 'Balé Vocacional — Advanced 1', ordem: 12, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Vocational Advanced 1', descricao: '', ativo: true },
  { nome: 'Balé Vocacional — Advanced 2', ordem: 13, programaReferencia: 'RAD (referência sugerida)', nivelReferencia: 'Vocational Advanced 2', descricao: '', ativo: true },
];

/**
 * As categorias do vocabulário — do pedido (§4), reduzidas ao conjunto que organiza o
 * conteúdo de partida: passo (fundamentos e ações), posicao, direcao, ligacao, salto, giro.
 * Não se classifica todo termo como «passo»: posição, direção e família são distintas.
 */
const CATEGORIAS = {
  passo: 'Passos e ações fundamentais',
  posicao: 'Posições (pés, perna, corpo, braços)',
  direcao: 'Direções e orientações',
  ligacao: 'Passos de ligação e deslocamento',
  salto: 'Saltos e allegro',
  giro: 'Giros e finalizações',
};

/**
 * A tradição de referência. `compartilhada` = o termo é comum às tradições sem que
 * se afirme uma equivalência normativa entre elas.
 */
const TRADICOES = ['compartilhada', 'RAD', 'francesa', 'Vaganova'];

/**
 * O vocabulário inicial. `tradicao` é «compartilhada» por padrão; quando a diferença
 * entre escolas está REGISTRADA (tabela D do pedido), ela entra em `observacoes` sem
 * afirmar a qual escola cada uso pertence (a menos que a fonte o delimite). O `id` é
 * derivado do termo no carregamento — não se declara aqui, para nunca divergir do slug.
 */
const TERMOS = [
  // --- A. Passos e ações fundamentais ---------------------------------------
  { termo: 'Plié', categoria: 'passo', tradicao: 'compartilhada', alternativos: ['Demi-plié', 'Grand plié'] },
  { termo: 'Relevé', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Elevação para meia-ponta ou ponta, conforme o contexto.' },
  { termo: 'Élevé', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Elevação sem a preparação em plié característica do relevé.' },
  { termo: 'Battement tendu', categoria: 'passo', tradicao: 'compartilhada', alternativos: ['Tendu'] },
  { termo: 'Battement dégagé', categoria: 'passo', tradicao: 'compartilhada', alternativos: ['Dégagé'], observacoes: 'Dégagé, battement glissé e battement tendu jeté nomeiam ações semelhantes em tradições distintas; não tratar como sinônimos perfeitos.' },
  { termo: 'Battement glissé', categoria: 'passo', tradicao: 'francesa', observacoes: 'Termo frequente na terminologia francesa.' },
  { termo: 'Battement tendu jeté', categoria: 'passo', tradicao: 'Vaganova', observacoes: 'Termo frequente na tradição russa/Vaganova.' },
  { termo: 'Battement jeté', categoria: 'passo', tradicao: 'RAD', observacoes: 'Termo utilizado em vocabulários RAD.' },
  { termo: 'Rond de jambe à terre', categoria: 'passo', tradicao: 'compartilhada', alternativos: ['Rond de jambe no chão'] },
  { termo: 'Rond de jambe en l’air', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Círculo da perna no ar.' },
  { termo: 'Battement fondu', categoria: 'passo', tradicao: 'compartilhada', alternativos: ['Fondu'], observacoes: 'O nome mais comum é «battement fondu» (ou «fondu»), não «fondue».' },
  { termo: 'Battement frappé', categoria: 'passo', tradicao: 'compartilhada', alternativos: ['Frappé'] },
  { termo: 'Petit battement', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Pequeno batimento da perna de trabalho.' },
  { termo: 'Grand battement', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Grande batimento da perna de trabalho.' },
  { termo: 'Développé', categoria: 'passo', tradicao: 'compartilhada', alternativos: ['Développé devant', 'Développé à la seconde', 'Développé derrière'] },
  { termo: 'Enveloppé', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Movimento de recolher a perna, em contexto específico.' },
  { termo: 'Retiré', categoria: 'posicao', tradicao: 'compartilhada', descricao: 'Posição da perna recolhida.' },
  { termo: 'Passé', categoria: 'passo', tradicao: 'compartilhada', observacoes: 'Ação de passagem; o uso e a distinção em relação a retiré variam entre tradições.' },
  { termo: 'Attitude', categoria: 'posicao', tradicao: 'compartilhada', alternativos: ['Attitude devant', 'Attitude derrière'] },
  { termo: 'Arabesque', categoria: 'posicao', tradicao: 'compartilhada', descricao: 'Diferentes posições de arabesque.' },
  { termo: 'Port de bras', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Organização e passagem dos braços.' },
  { termo: 'Temps lié', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Transferência de peso ligada.' },
  { termo: 'Battement soutenu', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Sustentação e fechamento ou passagem coordenada.' },
  { termo: 'Pas de cheval', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Movimento de recolher e estender a perna.' },
  { termo: 'Fouetté', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Família de ações de chicoteamento ou mudança de orientação.' },
  { termo: 'Développé relevé', categoria: 'passo', tradicao: 'compartilhada', descricao: 'Desenvolvimento da perna combinado com elevação.' },

  // --- B. Posições (pés, perna, corpo, braços) -----------------------------
  { termo: 'Première position', categoria: 'posicao', tradicao: 'compartilhada' },
  { termo: 'Deuxième position', categoria: 'posicao', tradicao: 'compartilhada' },
  { termo: 'Troisième position', categoria: 'posicao', tradicao: 'compartilhada' },
  { termo: 'Quatrième position', categoria: 'posicao', tradicao: 'compartilhada', observacoes: 'Os nomes e a execução das posições dos braços variam entre métodos; não supor que «quarta posição» significa a mesma configuração em todos os vocabulários.' },
  { termo: 'Cinquième position', categoria: 'posicao', tradicao: 'compartilhada' },
  { termo: 'Sur le cou-de-pied', categoria: 'posicao', tradicao: 'compartilhada', alternativos: ['Cou-de-pied devant', 'Cou-de-pied derrière'], observacoes: 'Distinguir as formas devant e derrière e registrar a descrição usada pela escola.' },
  { termo: 'Écarté', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Também é uma posição/direção do corpo, não apenas um passo.' },
  { termo: 'Croisé', categoria: 'direcao', tradicao: 'compartilhada' },
  { termo: 'Effacé', categoria: 'direcao', tradicao: 'compartilhada' },
  { termo: 'En face', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Corpo voltado de frente.' },
  { termo: 'Épaulement', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Orientação da cabeça e do olhar associada às posições do corpo.' },

  // --- C. Direções e termos de execução ------------------------------------
  { termo: 'À la seconde', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Direção lateral.' },
  { termo: 'En dehors', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Para fora.' },
  { termo: 'En dedans', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Para dentro.' },
  { termo: 'Devant', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'À frente.' },
  { termo: 'Derrière', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Atrás.' },
  { termo: 'En avant', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Para a frente.' },
  { termo: 'En arrière', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Para trás.' },
  { termo: 'En croix', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Em cruz: frente, lado, atrás e lado.' },
  { termo: 'Dessus', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Relação entre pernas.' },
  { termo: 'Dessous', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Relação entre pernas.' },
  { termo: 'En tournant', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Em rotação.' },
  { termo: 'À terre', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'No chão.' },
  { termo: 'En l’air', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'No ar.' },
  { termo: 'Demi-pointe', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Altura ou condição de meia-ponta.' },
  { termo: 'Sur les pointes', categoria: 'direcao', tradicao: 'compartilhada', descricao: 'Altura ou condição de ponta.' },

  // --- C. Saltos -----------------------------------------------------------
  { termo: 'Sauté', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Changement', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Échappé sauté', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Temps levé', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Assemblé', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Jeté', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Sissonne', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Soubresaut', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Entrechat', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Brisé', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Cabriole', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Ballonné', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Ballotté', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Emboîté', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Grand jeté', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Grand assemblé', categoria: 'salto', tradicao: 'compartilhada' },
  { termo: 'Saut de chat', categoria: 'salto', tradicao: 'compartilhada' },

  // --- C. Passos de ligação e deslocamento ---------------------------------
  { termo: 'Coupé', categoria: 'ligacao', tradicao: 'compartilhada', observacoes: 'O uso de coupé varia entre tradições; em certos contextos prefere-se outra descrição da passagem.' },
  { termo: 'Tombé', categoria: 'ligacao', tradicao: 'compartilhada' },
  { termo: 'Glissade', categoria: 'ligacao', tradicao: 'compartilhada' },
  { termo: 'Chassé', categoria: 'ligacao', tradicao: 'compartilhada' },
  { termo: 'Pas de bourrée', categoria: 'ligacao', tradicao: 'compartilhada' },
  { termo: 'Couru', categoria: 'ligacao', tradicao: 'compartilhada' },
  { termo: 'Pas de basque', categoria: 'ligacao', tradicao: 'compartilhada' },
  { termo: 'Failli', categoria: 'ligacao', tradicao: 'compartilhada' },
  { termo: 'Balancé', categoria: 'ligacao', tradicao: 'compartilhada' },

  // --- C. Giros e finalizações ---------------------------------------------
  { termo: 'Chaîné', categoria: 'giro', tradicao: 'compartilhada' },
  { termo: 'Déboulé', categoria: 'giro', tradicao: 'compartilhada' },
  { termo: 'Piqué turn', categoria: 'giro', tradicao: 'compartilhada', alternativos: ['Piqué'] },
  { termo: 'Pirouette en dehors', categoria: 'giro', tradicao: 'compartilhada' },
  { termo: 'Pirouette en dedans', categoria: 'giro', tradicao: 'compartilhada' },
  { termo: 'Fouetté en tournant', categoria: 'giro', tradicao: 'compartilhada' },
];

/** As associações iniciais turma↔termo (exemplos do pedido §6 — NÃO são progressão oficial). */
const RELACOES = [
  { turma: 'Balé Nível 1', termo: 'Plié' },
  { turma: 'Balé Nível 1', termo: 'Battement tendu' },
  { turma: 'Balé Nível 1', termo: 'Grand battement' },
  { turma: 'Balé Nível 1', termo: 'Battement fondu' },
  { turma: 'Balé Nível 2', termo: 'Plié' },
  { turma: 'Balé Nível 2', termo: 'Battement tendu' },
  { turma: 'Balé Nível 2', termo: 'Grand battement' },
  { turma: 'Balé Nível 2', termo: 'Battement fondu' },
  { turma: 'Balé Nível 2', termo: 'Rond de jambe à terre' },
];

module.exports = { TURMAS, TERMOS, RELACOES, CATEGORIAS, TRADICOES };
