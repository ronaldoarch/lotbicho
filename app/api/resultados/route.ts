import { NextRequest, NextResponse } from 'next/server'
import { ResultadosResponse, ResultadoItem } from '@/types/resultados'
import { toIsoDate } from '@/lib/resultados-helpers'

const LOCATION_MAP: Record<string, string[]> = {
  'rio de janeiro': ['pt rio', 'pt-rio', 'pt-rio 9h20', 'pt-rio 11h20', 'rio de janeiro', 'rj'],
  'sao paulo': ['pt sp', 'pt-sp', 'pt sao paulo', 'pt são paulo', 'sao paulo', 'sp'],
  bahia: ['pt bahia', 'pt-ba', 'ptba', 'bahia', 'ba'],
  goias: ['look', 'look goias', 'look goiás', 'goias', 'goiás', 'go'],
  'distrito federal': ['df', 'distrito federal', 'brasilia', 'brasília'],
  brasilia: ['df', 'distrito federal', 'brasilia', 'brasília'],
  nacional: ['nacional'],
  federal: ['federal', 'loteria federal'],
  'para todos': ['para todos', 'para-todos'],
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const SOURCE_URL = process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'

function normalizeResults(raw: any[]): ResultadoItem[] {
  return raw.map((r: any, idx: number) => ({
    position: r.position || r.premio || `${idx + 1}°`,
    milhar: r.milhar || r.numero || r.milharNumero || r.valor || '',
    grupo: r.grupo || r.grupoNumero || '',
    animal: r.animal || r.nomeAnimal || '',
    drawTime: r.horario || r.drawTime || r.concurso || '',
    location: r.local || r.estado || r.cidade || r.uf || '',
    date: r.data || r.date || r.dia || '',
  }))
}

function matchesDateFilter(value: string | undefined, filter: string) {
  if (!filter) return true
  if (!value) return false

  const isoValue = toIsoDate(value)
  const isoFilter = toIsoDate(filter)

  return (
    value.includes(filter) ||
    isoValue.startsWith(isoFilter) ||
    isoFilter.startsWith(isoValue) ||
    value.includes(isoFilter)
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateFilter = searchParams.get('date')
  const locationFilter = searchParams.get('location')

  try {
    const res = await fetch(SOURCE_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Upstream status ${res.status}`)
    const data = await res.json()
    const rawResults = data?.resultados ?? data?.results ?? []
    let results = normalizeResults(rawResults)

    if (dateFilter) {
      results = results.filter((r) => matchesDateFilter(r.date, dateFilter))
    }
    if (locationFilter) {
      const lf = normalizeText(locationFilter)
      const aliases = LOCATION_MAP[lf] ?? [lf]
      results = results
        .filter((r) => {
          const combined = normalizeText(`${r.location || ''} ${r.drawTime || ''}`)
          return aliases.some((alias) => combined.includes(alias))
        })
        .map((r) => ({
          ...r,
          location: r.location || locationFilter,
        }))
    }

    const payload: ResultadosResponse = {
      results,
      updatedAt: data?.updatedAt || new Date().toISOString(),
    }

    return NextResponse.json(payload, { status: 200, headers: { 'Cache-Control': 'no-cache' } })
  } catch (error) {
    console.error('Erro ao buscar resultados externos:', error)
    return NextResponse.json(
      {
        results: [],
        updatedAt: new Date().toISOString(),
        error: 'Falha ao buscar resultados externos',
      } satisfies ResultadosResponse & { error: string },
      { status: 502 }
    )
  }
}
