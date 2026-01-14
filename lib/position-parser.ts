/**
 * Função helper para parsear posições de aposta.
 * Converte strings como "1st", "1-3", "1-5", "1-7" em pos_from e pos_to numéricos.
 */

export interface ParsedPosition {
  pos_from: number
  pos_to: number
}

/**
 * Parseia uma string de posição para pos_from e pos_to.
 * 
 * @param position - String da posição (ex: "1st", "1-3", "1-5", "1-7")
 * @param defaultPos - Posição padrão caso não seja fornecida (padrão: 1)
 * @returns Objeto com pos_from e pos_to
 */
export function parsePosition(position: string | null | undefined, defaultPos: number = 1): ParsedPosition {
  if (!position) {
    return { pos_from: defaultPos, pos_to: defaultPos }
  }

  // Caso especial: "1st" = 1º prêmio apenas
  if (position === '1st' || position.toLowerCase() === '1º') {
    return { pos_from: 1, pos_to: 1 }
  }

  // Caso de intervalo: "1-3", "1-5", "1-7"
  if (position.includes('-')) {
    const parts = position.split('-').map((p) => {
      // Remove caracteres não numéricos (ex: "1º" -> "1")
      const numStr = p.replace(/\D/g, '')
      return parseInt(numStr, 10) || defaultPos
    })

    if (parts.length >= 2) {
      const pos_from = Math.max(1, parts[0])
      const pos_to = Math.max(pos_from, parts[1])
      return { pos_from, pos_to }
    }
  }

  // Caso de número único (ex: "1", "3")
  const numStr = position.replace(/\D/g, '')
  const num = parseInt(numStr, 10) || defaultPos
  return { pos_from: num, pos_to: num }
}

/**
 * Valida se uma posição é válida para uma modalidade específica.
 * 
 * @param modality - Tipo da modalidade
 * @param pos_from - Posição inicial
 * @param pos_to - Posição final
 * @returns true se válido, false caso contrário
 */
export function validarPosicaoParaModalidade(
  modality: string,
  pos_from: number,
  pos_to: number
): boolean {
  // Validações básicas
  if (pos_from < 1 || pos_to < 1 || pos_from > pos_to) {
    return false
  }

  // Milhar e Milhar Invertida: máximo até 5º prêmio
  if (modality.includes('MILHAR') && pos_to > 5) {
    return false
  }

  // Passe: sempre 1º-2º
  if (modality.includes('PASSE') && (pos_from !== 1 || pos_to !== 2)) {
    return false
  }

  // Outras modalidades podem ir até 7º prêmio
  if (pos_to > 7) {
    return false
  }

  return true
}

/**
 * Formata posição para exibição.
 * 
 * @param pos_from - Posição inicial
 * @param pos_to - Posição final
 * @returns String formatada (ex: "1º", "1º ao 3º", "1º ao 5º")
 */
export function formatarPosicao(pos_from: number, pos_to: number): string {
  if (pos_from === pos_to) {
    return `${pos_from}º`
  }
  return `${pos_from}º ao ${pos_to}º`
}
