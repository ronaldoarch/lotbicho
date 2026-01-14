/**
 * Helper para buscar e formatar informações de extrações
 */

export interface Extracao {
  id: number
  name: string
  estado?: string
  realCloseTime?: string
  closeTime: string
  time: string
  active: boolean
  max: number
  days: string
}

let extracoesCache: Extracao[] | null = null

/**
 * Busca todas as extrações (com cache)
 */
export async function getExtracoes(): Promise<Extracao[]> {
  if (extracoesCache) {
    return extracoesCache
  }

  try {
    const res = await fetch('/api/admin/extracoes', { cache: 'no-store' })
    const data = await res.json()
    const extracoes = data?.extracoes || []
    extracoesCache = extracoes
    return extracoes
  } catch (error) {
    console.error('Erro ao buscar extrações:', error)
    return []
  }
}

/**
 * Busca uma extração pelo ID
 */
export async function getExtracaoById(id: string | number | null | undefined): Promise<Extracao | null> {
  if (!id) return null
  
  const extracoes = await getExtracoes()
  const extracaoId = typeof id === 'string' ? parseInt(id, 10) : id
  return extracoes.find((e) => e.id === extracaoId) || null
}

/**
 * Formata a exibição da extração com nome e horário
 */
export function formatarExtracaoHorario(extracao: Extracao | null): string {
  if (!extracao) return '—'
  
  const horario = extracao.realCloseTime || extracao.closeTime || extracao.time || ''
  return `${extracao.name} ${horario ? `• ${horario}` : ''}`.trim()
}

/**
 * Formata a exibição da extração apenas com nome
 */
export function formatarExtracaoNome(extracao: Extracao | null): string {
  return extracao?.name || '—'
}

/**
 * Formata apenas o horário da extração
 */
export function formatarExtracaoHorarioApenas(extracao: Extracao | null): string {
  if (!extracao) return '—'
  return extracao.realCloseTime || extracao.closeTime || extracao.time || '—'
}
