import { ResultadoItem } from '@/types/resultados'

export interface GroupedResults {
  drawTime: string
  rows: ResultadoItem[]
  dateLabel: string
  locationLabel: string
}

export const getDefaultDateISO = () => new Date().toISOString().split('T')[0]

export function toIsoDate(value?: string) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`

  const parsed = new Date(value)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]

  return value
}

export function formatDateLabel(value?: string) {
  if (!value) return ''
  const iso = toIsoDate(value)
  const parsed = new Date(iso)
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('pt-BR')
  }
  return value
}

function matchesDate(resultDate?: string, selectedDate?: string) {
  if (!selectedDate) return true
  if (!resultDate) return true

  const isoResult = toIsoDate(resultDate)
  const isoFilter = toIsoDate(selectedDate)

  return (
    isoResult.startsWith(isoFilter) ||
    isoFilter.startsWith(isoResult) ||
    resultDate.includes(selectedDate) ||
    isoResult.includes(selectedDate)
  )
}

function sortByPosition(items: ResultadoItem[]) {
  const getOrder = (value?: string) => {
    if (!value) return Number.MAX_SAFE_INTEGER
    const match = value.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
  }

  return [...items].sort((a, b) => getOrder(a.position) - getOrder(b.position))
}

function extractTimeValue(label: string) {
  const normalized = label.toLowerCase()
  const match = normalized.match(/(\d{1,2})h(\d{2})/) || normalized.match(/(\d{1,2}):(\d{2})/)
  if (match) {
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    return hours * 60 + minutes
  }
  return Number.MAX_SAFE_INTEGER
}

export function groupResultsByDrawTime(
  results: ResultadoItem[],
  location: string,
  selectedDate: string
): GroupedResults[] {
  const locationLc = (location || '').toLowerCase()
  const groups = new Map<string, ResultadoItem[]>()

  results.forEach((item) => {
    const locationMatch = !locationLc || (item.location || '').toLowerCase().includes(locationLc)
    const dateMatch = matchesDate(item.date, selectedDate)
    if (!locationMatch || !dateMatch) return

    const key = item.drawTime?.trim() || 'Resultado'
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  })

  return Array.from(groups.entries())
    .map(([drawTime, rows]) => ({
      drawTime,
      rows: sortByPosition(rows),
      dateLabel: formatDateLabel(rows[0]?.date || selectedDate),
      locationLabel: location,
    }))
    .sort((a, b) => extractTimeValue(a.drawTime) - extractTimeValue(b.drawTime))
}
