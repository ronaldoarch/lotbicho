import { NextRequest, NextResponse } from 'next/server'
import { ResultadosResponse, ResultadoItem } from '@/types/resultados'
import { toIsoDate } from '@/lib/resultados-helpers'

const RAW_SOURCE =
  process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'
const SOURCE_ROOT = RAW_SOURCE.replace(/\/api\/resultados$/, '')

const UF_NAME_MAP: Record<string, string> = {
  RJ: 'Rio de Janeiro',
  SP: 'São Paulo',
  BA: 'Bahia',
  PB: 'Paraíba',
  GO: 'Goiás',
  DF: 'Distrito Federal',
  CE: 'Ceará',
  MG: 'Minas Gerais',
  PR: 'Paraná',
  SC: 'Santa Catarina',
  RS: 'Rio Grande do Sul',
  BR: 'Nacional',
}

const LOTERIA_UF_MAP: Record<string, string> = {
  'pt rio de janeiro': 'RJ',
  'pt-rio de janeiro': 'RJ',
  'pt rio': 'RJ',
  'pt-rio': 'RJ',
  'mpt-rio': 'RJ',
  'mpt rio': 'RJ',
  'pt-sp/bandeirantes': 'SP',
  'pt sp': 'SP',
  'pt-sp': 'SP',
  'pt sp bandeirantes': 'SP',
  bandeirantes: 'SP',
  'pt bahia': 'BA',
  'pt-ba': 'BA',
  'maluca bahia': 'BA',
  'pt paraiba/lotep': 'PB',
  'pt paraiba': 'PB',
  'pt paraíba': 'PB',
  'pt-pb': 'PB',
  lotep: 'PB',
  'pt goias': 'GO',
  'pt goiás': 'GO',
  'look goias': 'GO',
  'look goiás': 'GO',
  look: 'GO',
  'pt ceara': 'CE',
  'pt ceará': 'CE',
  lotece: 'CE',
  'pt minas gerais': 'MG',
  'pt minas': 'MG',
  'pt parana': 'PR',
  'pt paraná': 'PR',
  'pt santa catarina': 'SC',
  'pt rio grande do sul': 'RS',
  'pt rs': 'RS',
  'loteria nacional': 'BR',
  nacional: 'BR',
  'loteria federal': 'BR',
  federal: 'BR',
  'para todos': 'BR',
}

const EXTRACAO_UF_MAP: Record<string, string> = {
  lotece: 'CE',
  lotep: 'PB',
  look: 'GO',
  'para todos': 'BR',
  'pt rio': 'RJ',
  nacional: 'BR',
  'pt bahia': 'BA',
  federal: 'BR',
  'pt sp': 'SP',
  'pt sp (band)': 'SP',
}

const UF_ALIASES: Record<string, string> = {
  rj: 'RJ',
  'rio de janeiro': 'RJ',
  'pt rio': 'RJ',
  'pt-rio': 'RJ',
  'pt rio de janeiro': 'RJ',
  sp: 'SP',
  'sao paulo': 'SP',
  'são paulo': 'SP',
  'pt sp': 'SP',
  'pt-sp': 'SP',
  bandeirantes: 'SP',
  ba: 'BA',
  bahia: 'BA',
  'pt bahia': 'BA',
  'pt-ba': 'BA',
  go: 'GO',
  goias: 'GO',
  'goiás': 'GO',
  look: 'GO',
  'look goias': 'GO',
  'look goiás': 'GO',
  pb: 'PB',
  paraiba: 'PB',
  'paraíba': 'PB',
  lotep: 'PB',
  'pt paraiba': 'PB',
  ce: 'CE',
  ceara: 'CE',
  'ceará': 'CE',
  lotece: 'CE',
  mg: 'MG',
  minas: 'MG',
  pr: 'PR',
  parana: 'PR',
  'paraná': 'PR',
  sc: 'SC',
  'santa catarina': 'SC',
  rs: 'RS',
  'rio grande do sul': 'RS',
  df: 'DF',
  brasilia: 'DF',
  'brasília': 'DF',
  'distrito federal': 'DF',
  federal: 'BR',
  nacional: 'BR',
  'loteria federal': 'BR',
  'para todos': 'BR',
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function resolveUF(location?: string | null) {
  if (!location) return undefined
  const key = normalizeText(location)
  return UF_ALIASES[key] ?? (key.length === 2 ? key.toUpperCase() : undefined)
}

function buildUrl(uf?: string) {
  if (uf) return `${SOURCE_ROOT}/api/resultados/estado/${uf}`
  return `${SOURCE_ROOT}/api/resultados`
}

function inferUfFromName(name?: string | null) {
  if (!name) return undefined
  const key = normalizeText(name)
  return (
    UF_ALIASES[key] ||
    LOTERIA_UF_MAP[key] ||
    EXTRACAO_UF_MAP[key] ||
    (key.length === 2 ? key.toUpperCase() : undefined)
  )
}

function normalizeResults(raw: any[]): ResultadoItem[] {
  return raw.map((r: any, idx: number) => {
    const estado =
      r.estado || inferUfFromName(r.estado) || inferUfFromName(r.loteria) || inferUfFromName(r.local) || undefined
    const locationResolved = UF_NAME_MAP[estado || ''] || r.local || r.estado || r.cidade || r.uf || ''
    const dateValue = r.data || r.date || r.dia || r.data_extração || r.dataExtracao || ''

    return {
      position: r.position || r.premio || r.colocacao || `${idx + 1}°`,
      milhar: r.milhar || r.numero || r.milharNumero || r.valor || '',
      grupo: r.grupo || r.grupoNumero || '',
      animal: r.animal || r.nomeAnimal || '',
      drawTime: r.horario || r.drawTime || r.concurso || '',
      horario: r.horario || undefined,
      loteria: r.loteria || r.nomeLoteria || r.concurso || r.horario || '',
      location: locationResolved,
      date: dateValue,
      dataExtracao: dateValue,
      estado,
      posicao: r.posicao || (r.colocacao && parseInt(String(r.colocacao).replace(/\D/g, ''), 10)) || undefined,
      colocacao: r.colocacao || r.position || r.premio || `${idx + 1}°`,
      timestamp: r.timestamp || r.createdAt || r.updatedAt || undefined,
      fonte: r.fonte || r.origem || undefined,
      urlOrigem: r.url_origem || r.urlOrigem || r.link || undefined,
    }
  })
}

function orderByPosition(items: ResultadoItem[]) {
  const getOrder = (value?: string, pos?: number) => {
    if (typeof pos === 'number' && !Number.isNaN(pos)) return pos
    if (!value) return Number.MAX_SAFE_INTEGER
    const match = value.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
  }
  return [...items].sort((a, b) => getOrder(a.position, a.posicao) - getOrder(b.position, b.posicao))
}

function matchesDateFilter(value: string | undefined, filter: string) {
  if (!filter) return true
  if (!value) return false

  const isoValue = toIsoDate(value)
  const isoFilter = toIsoDate(filter)

  const dayMonth = (v: string) => {
    const m = v.match(/(\d{2})\/(\d{2})/)
    return m ? `${m[1]}/${m[2]}` : undefined
  }
  const dmValue = dayMonth(value)
  const dmFilter = dayMonth(isoFilter)

  return (
    isoValue === isoFilter ||
    isoValue.startsWith(isoFilter) ||
    isoFilter.startsWith(isoValue) ||
    (!!dmValue && !!dmFilter && dmValue === dmFilter)
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateFilter = searchParams.get('date')
  const locationFilter = searchParams.get('location')
  const uf = resolveUF(locationFilter)

  const fetchWithTimeout = async (url: string, timeoutMs = 15000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { cache: 'no-store', signal: controller.signal })
    } finally {
      clearTimeout(id)
    }
  }

  try {
    // Nova fonte principal: resultados organizados
    const res = await fetchWithTimeout(`${SOURCE_ROOT}/api/resultados/organizados`)
    if (!res.ok) throw new Error(`Upstream status ${res.status}`)

    const data = await res.json()
    const organizados = data?.organizados || {}

    let results: ResultadoItem[] = []
    let totalTabelas = 0
    let totalHorarios = 0
    
    Object.entries(organizados).forEach(([tabela, horarios]) => {
      totalTabelas++
      const horariosObj = horarios as Record<string, any[]>
      const horariosCount = Object.keys(horariosObj).length
      totalHorarios += horariosCount
      
      // Log para debug: mostrar quantos horários cada extração tem
      if (horariosCount > 0) {
        console.log(`📊 Extração "${tabela}": ${horariosCount} horário(s) - ${Object.keys(horariosObj).join(', ')}`)
      }
      
      Object.entries(horariosObj).forEach(([horario, lista]) => {
        const arr = (lista || []).map((item: any, idx: number) => {
          const estado =
            item.estado || inferUfFromName(item.estado) || inferUfFromName(tabela) || inferUfFromName(item.local)
          const locationResolved = UF_NAME_MAP[estado || ''] || tabela || item.local || ''
          const dateValue = item.data_extracao || item.dataExtracao || item.data || item.date || ''
          return {
            position: item.colocacao || `${item.posicao || idx + 1}°`,
            posicao:
              item.posicao || (item.colocacao && parseInt(String(item.colocacao).replace(/\D/g, ''), 10)) || idx + 1,
            milhar: item.numero || item.milhar || '',
            grupo: item.grupo || '',
            animal: item.animal || '',
            drawTime: horario,
            horario,
            loteria: tabela,
            location: locationResolved,
            date: dateValue,
            dataExtracao: dateValue,
            estado,
            timestamp: item.timestamp || undefined,
            fonte: item.fonte || item.origem || undefined,
            urlOrigem: item.url_origem || item.urlOrigem || item.link || undefined,
          } as ResultadoItem
        })
        results = results.concat(arr)
      })
    })
    
    console.log(`📈 Total processado: ${totalTabelas} extrações, ${totalHorarios} horários, ${results.length} resultados`)

    // Filtro por data (usa dataExtracao/data_extracao)
    // IMPORTANTE: Se não houver filtro de data, retornar TODOS os resultados disponíveis
    // Isso é necessário para a liquidação poder processar apostas de qualquer data
    if (dateFilter) {
      results = results.filter((r) => matchesDateFilter(r.dataExtracao || r.date, dateFilter))
    }
    // Filtro por UF ou nome
    // IMPORTANTE: Se não houver filtro de localização, retornar TODOS os resultados
    // Isso garante que a liquidação tenha acesso a todos os resultados de todas as extrações
    if (uf) {
      results = results.filter((r) => (r.estado || '').toUpperCase() === uf)
    } else if (locationFilter) {
      const lf = normalizeText(locationFilter)
      results = results.filter((r) => normalizeText(r.location || '').includes(lf))
    }

    // Ordenar e limitar em 7 posições por sorteio
    const grouped: Record<string, ResultadoItem[]> = {}
    results.forEach((r) => {
      const key = `${r.loteria || ''}|${r.drawTime || ''}|${r.date || ''}`
      grouped[key] = grouped[key] || []
      grouped[key].push(r)
    })
    results = Object.values(grouped)
      .map((arr) => orderByPosition(arr).slice(0, 7))
      .flat()
    
    // Log final: mostrar quantos grupos únicos foram criados
    const gruposUnicos = new Set(Object.keys(grouped))
    console.log(`✅ Resultados finais: ${gruposUnicos.size} grupos únicos (loteria|horário|data), ${results.length} resultados totais`)
    
    // Log de grupos únicos para debug
    if (gruposUnicos.size > 0 && gruposUnicos.size <= 20) {
      console.log(`   Grupos: ${Array.from(gruposUnicos).join(' | ')}`)
    }

    const payload: ResultadosResponse = {
      results,
      updatedAt: data?.ultima_verificacao || data?.updatedAt || new Date().toISOString(),
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
