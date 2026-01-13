import { NextRequest, NextResponse } from 'next/server'
import { ResultadosResponse, ResultadoItem } from '@/types/resultados'
import { SAMPLE_RESULTS } from '@/data/results'
import { toIsoDate } from '@/lib/resultados-helpers'

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
      const lf = locationFilter.toLowerCase()
      results = results.filter((r) => (r.location || '').toLowerCase().includes(lf))
    }

    const payload: ResultadosResponse = {
      results: results.length ? results : normalizeResults(SAMPLE_RESULTS),
      updatedAt: data?.updatedAt || new Date().toISOString(),
    }

    return NextResponse.json(payload, { status: 200, headers: { 'Cache-Control': 'no-cache' } })
  } catch (error) {
    console.error('Erro ao buscar resultados externos:', error)
    const payload: ResultadosResponse = {
      results: normalizeResults(SAMPLE_RESULTS),
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(payload, { status: 200 })
  }
}
