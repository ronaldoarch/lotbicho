import { NextRequest, NextResponse } from 'next/server'
import { ResultadosResponse, ResultadoItem } from '@/types/resultados'
import { toIsoDate } from '@/lib/resultados-helpers'
import { extracoes } from '@/data/extracoes'
import { getHorarioRealApuracao } from '@/data/horarios-reais-apuracao'
import {
  buscarResultadosBichoCerto,
  converterParaFormatoSistema,
  LOTERIA_CODE_MAP,
} from '@/lib/bichocerto-parser'

/**
 * Normaliza o horário do resultado para o horário correto de fechamento da extração
 * Isso garante que os resultados sejam associados ao horário correto desde o início
 * 
 * Estratégia:
 * 1. Buscar todas as extrações com o mesmo nome
 * 2. Para cada extração, verificar se o horário do resultado corresponde ao horário real de apuração
 * 3. Se encontrar match, retornar o horário interno (time) da extração
 * 
 * @param loteriaNome Nome da loteria (ex: "PT SP", "LOOK", "LOTECE")
 * @param horarioResultado Horário que veio do resultado (ex: "20:40", "10:40")
 * @returns Horário normalizado para fechamento (ex: "20:15", "10:00") ou o horário original se não encontrar
 */
function normalizarHorarioResultado(loteriaNome: string, horarioResultado: string): string {
  if (!loteriaNome || !horarioResultado) return horarioResultado
  
  // Normalizar nome da loteria
  const nomeNormalizado = loteriaNome.toUpperCase().trim()
  
  // Normalizar horário do resultado
  const horarioNormalizado = horarioResultado.replace(/[h:]/g, ':').replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => {
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
  })
  
  const [horaResultado, minutoResultado] = horarioNormalizado.split(':').map(Number)
  if (isNaN(horaResultado) || isNaN(minutoResultado)) return horarioResultado
  
  const minutosResultado = horaResultado * 60 + minutoResultado
  
  // Buscar todas as extrações com esse nome
  const extracoesComMesmoNome = extracoes.filter(e => 
    e.name.toUpperCase() === nomeNormalizado && e.active
  )
  
  if (extracoesComMesmoNome.length === 0) {
    return horarioResultado // Retorna original se não encontrar extração
  }
  
  let melhorMatch: { extracao: typeof extracoes[0], diferenca: number } | null = null
  
  // Para cada extração, verificar se o horário do resultado corresponde ao horário real de apuração
  for (const extracao of extracoesComMesmoNome) {
    // Buscar horário real de apuração
    const horarioReal = getHorarioRealApuracao(extracao.name, extracao.time)
    
    if (horarioReal) {
      // Verificar match exato com closeTimeReal (horário quando o resultado deve estar disponível)
      const [horaFim, minutoFim] = horarioReal.closeTimeReal.split(':').map(Number)
      const minutosFim = horaFim * 60 + minutoFim
      
      // Match exato com closeTimeReal
      if (minutosResultado === minutosFim) {
        return extracao.time
      }
      
      // Verificar se está dentro do intervalo de apuração
      const [horaInicio, minutoInicio] = horarioReal.startTimeReal.split(':').map(Number)
      const minutosInicio = horaInicio * 60 + minutoInicio
      
      if (minutosResultado >= minutosInicio && minutosResultado <= minutosFim) {
        // Calcular diferença para escolher o melhor match se houver múltiplos
        const diferenca = Math.abs(minutosResultado - minutosFim)
        if (!melhorMatch || diferenca < melhorMatch.diferenca) {
          melhorMatch = { extracao, diferenca }
        }
      }
    }
  }
  
  // Se encontrou match dentro do intervalo, retornar o melhor
  if (melhorMatch) {
    return melhorMatch.extracao.time
  }
  
  // Fallback: verificar match aproximado com horário interno (dentro de 30 minutos)
  for (const extracao of extracoesComMesmoNome) {
    const [horaExtracao, minutoExtracao] = extracao.time.split(':').map(Number)
    if (isNaN(horaExtracao) || isNaN(minutoExtracao)) continue
    
    const minutosExtracao = horaExtracao * 60 + minutoExtracao
    const diferenca = Math.abs(minutosResultado - minutosExtracao)
    
    if (diferenca <= 30) {
      return extracao.time
    }
  }
  
  // Se não encontrou match, retornar horário original
  return horarioResultado
}

// NOVA IMPLEMENTAÇÃO: Usar endpoints diretos do bichocerto.com
// Desativada a API antiga - agora usamos parsing HTML direto
const USAR_BICHOCERTO_DIRETO = process.env.USAR_BICHOCERTO_DIRETO !== 'false' // Default: true
const BICHOCERTO_PHPSESSID = process.env.BICHOCERTO_PHPSESSID // Opcional: para acesso histórico

// API antiga (fallback se necessário)
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
  'pt paraiba/lotep': 'PB', // IMPORTANTE: Verificar antes de "lotep" para evitar confusão
  'pt paraiba': 'PB',
  'pt paraíba': 'PB',
  'pt-pb': 'PB',
  lotep: 'PB',
  'pt ceara': 'CE',
  'pt ceará': 'CE',
  'pt-ce': 'CE',
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
  
  // IMPORTANTE: Verificar EXTRACAO_UF_MAP primeiro para evitar confusão entre LOTEP e LOTECE
  // Exemplo: "PT Paraiba/Lotep" deve ser PB, não CE
  if (EXTRACAO_UF_MAP[key]) {
    return EXTRACAO_UF_MAP[key]
  }
  
  // Verificar se contém palavras-chave específicas (para casos como "PT Paraiba/Lotep")
  if (key.includes('lotep') || key.includes('paraiba') || key.includes('paraíba')) {
    return 'PB'
  }
  if (key.includes('lotece') || key.includes('ceara') || key.includes('ceará')) {
    return 'CE'
  }
  
  return (
    UF_ALIASES[key] ||
    LOTERIA_UF_MAP[key] ||
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

  const fetchWithTimeout = async (url: string, timeoutMs = 30000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { cache: 'no-store', signal: controller.signal })
    } catch (error) {
      // Se for erro de aborto (timeout), relançar com mensagem mais clara
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout ao buscar resultados: a API demorou mais de ${timeoutMs / 1000} segundos para responder`)
      }
      throw error
    } finally {
      clearTimeout(id)
    }
  }

  try {
    // NOVA IMPLEMENTAÇÃO: Usar endpoints diretos do bichocerto.com
    if (USAR_BICHOCERTO_DIRETO) {
      console.log(`🌐 Usando endpoints diretos do bichocerto.com`)
      
      const dataParaBuscar = dateFilter || new Date().toISOString().split('T')[0]
      const resultadosCombinados: ResultadoItem[] = []
      
      // Buscar resultados de todas as loterias principais
      const loteriasParaBuscar = ['ln', 'sp', 'ba', 'pb', 'bs', 'lce', 'lk', 'fd']
      
      console.log(`📅 Buscando resultados para data: ${dataParaBuscar}`)
      
      // Buscar resultados de cada loteria em paralelo
      const promessas = loteriasParaBuscar.map(async (codigo) => {
        try {
          console.log(`🔍 Buscando resultados de ${codigo} (${LOTERIA_CODE_MAP[codigo]?.nome || codigo})...`)
          
          const resultado = await buscarResultadosBichoCerto(
            codigo,
            dataParaBuscar,
            BICHOCERTO_PHPSESSID
          )
          
          if (resultado.erro) {
            console.log(`   ⚠️ Erro ao buscar ${codigo}: ${resultado.erro}`)
            return []
          }
          
          const formatados = converterParaFormatoSistema(resultado.dados, codigo, dataParaBuscar)
          console.log(`   ✅ ${codigo}: ${Object.keys(resultado.dados).length} extração(ões), ${formatados.length} resultado(s)`)
          
          return formatados
        } catch (error) {
          console.error(`   ❌ Erro ao buscar ${codigo}:`, error)
          return []
        }
      })
      
      const resultadosArrays = await Promise.all(promessas)
      resultadosArrays.forEach((arr) => {
        resultadosCombinados.push(...arr)
      })
      
      console.log(`📊 Total combinado: ${resultadosCombinados.length} resultados de ${loteriasParaBuscar.length} loterias`)
      
      // Processar resultados combinados
      let results: ResultadoItem[] = resultadosCombinados
      
      // VALIDAÇÃO DE SEGURANÇA: Garantir que todos os resultados correspondem à data solicitada
      // (mesmo que já tenham sido buscados pela data específica, validar novamente)
      if (dateFilter) {
        const antesFiltroData = results.length
        results = results.filter((r) => matchesDateFilter(r.dataExtracao || r.date, dateFilter))
        console.log(`📅 Validação de data "${dateFilter}": ${results.length} resultados (antes: ${antesFiltroData})`)
      } else {
        console.log(`📅 Sem filtro de data: mantendo todos os ${results.length} resultados`)
      }
      
      // Aplicar filtros de localização se necessário
      // IMPORTANTE: Se não há filtro, retornar TODOS os resultados (incluindo Nacional)
      if (uf) {
        // Filtrar por UF específica
        results = results.filter((r) => (r.estado || '').toUpperCase() === uf)
        console.log(`📍 Após filtro de UF "${uf}": ${results.length} resultados`)
      } else if (locationFilter) {
        // Filtrar por nome de localização (ex: "Nacional", "Rio de Janeiro")
        const lf = normalizeText(locationFilter)
        
        // Se filtro é "Nacional" ou "Brasil", incluir resultados BR
        if (lf.includes('nacional') || lf.includes('brasil') || lf.includes('federal') || lf.includes('para todos')) {
          results = results.filter((r) => {
            const estado = (r.estado || '').toUpperCase()
            const location = normalizeText(r.location || '')
            return estado === 'BR' || location.includes('nacional') || location.includes('brasil') || location.includes('federal')
          })
          console.log(`📍 Após filtro de localização "${locationFilter}" (Nacional): ${results.length} resultados`)
        } else {
          // Filtro normal por localização
          results = results.filter((r) => {
            const location = normalizeText(r.location || '')
            const estado = normalizeText(r.estado || '')
            return location.includes(lf) || estado.includes(lf)
          })
          console.log(`📍 Após filtro de localização "${locationFilter}": ${results.length} resultados`)
        }
      } else {
        // SEM FILTRO: Retornar TODOS os resultados (incluindo Nacional)
        console.log(`📍 Sem filtro de localização: mantendo todos os ${results.length} resultados`)
      }
      
      // Agrupar e ordenar
      const antesAgrupamento = results.length
      const grouped: Record<string, ResultadoItem[]> = {}
      results.forEach((r) => {
        const key = `${r.loteria || ''}|${r.drawTime || ''}|${r.date || r.dataExtracao || ''}`
        grouped[key] = grouped[key] || []
        grouped[key].push(r)
      })
      
      console.log(`📦 Agrupamento: ${antesAgrupamento} resultados → ${Object.keys(grouped).length} grupos únicos`)
      
      results = Object.values(grouped)
        .map((arr) => orderByPosition(arr).slice(0, 7))
        .flat()
      
      console.log(`✂️  Após limitar a 7 posições por grupo: ${results.length} resultados`)
      
      const payload: ResultadosResponse = {
        results,
        updatedAt: new Date().toISOString(),
      }
      
      return NextResponse.json(payload, { status: 200, headers: { 'Cache-Control': 'no-cache' } })
    }
    
    // FALLBACK: API antiga (se USAR_BICHOCERTO_DIRETO = false)
    console.log(`🔗 Usando API antiga: ${SOURCE_ROOT}/api/resultados/organizados`)
    const res = await fetchWithTimeout(`${SOURCE_ROOT}/api/resultados/organizados`, 30000)
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Erro desconhecido')
      console.error(`❌ Erro ao buscar resultados: HTTP ${res.status} - ${errorText.substring(0, 200)}`)
      throw new Error(`Upstream status ${res.status}: ${errorText.substring(0, 100)}`)
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      console.error(`❌ Resposta não é JSON. Content-Type: ${contentType}`)
      console.error(`❌ Primeiros 500 caracteres da resposta: ${text.substring(0, 500)}`)
      throw new Error(`Resposta não é JSON. Content-Type: ${contentType}`)
    }

    const data = await res.json()
    const organizados = data?.organizados || {}
    
    console.log(`📦 Dados recebidos: ${Object.keys(organizados).length} extração(ões) encontrada(s)`)
    console.log(`📊 Estatísticas da API: ${JSON.stringify(data?.estatisticas || {})}`)
    
    // Se não há dados organizados, tentar endpoint alternativo
    if (Object.keys(organizados).length === 0) {
      console.log(`⚠️ Nenhum dado em /organizados, tentando endpoint alternativo...`)
      try {
        const resAlt = await fetchWithTimeout(`${SOURCE_ROOT}/api/resultados`, 30000)
        if (resAlt.ok) {
          const dataAlt = await resAlt.json()
          console.log(`📦 Endpoint alternativo retornou: ${Array.isArray(dataAlt) ? dataAlt.length : 'dados'} resultados`)
        }
      } catch (altError) {
        console.error(`❌ Erro ao tentar endpoint alternativo:`, altError)
      }
    }

    let results: ResultadoItem[] = []
    let totalTabelas = 0
    let totalHorarios = 0
    let totalResultadosBrutos = 0
    
    Object.entries(organizados).forEach(([tabela, horarios]) => {
      totalTabelas++
      const horariosObj = horarios as Record<string, any[]>
      const horariosCount = Object.keys(horariosObj).length
      totalHorarios += horariosCount
      
      // Log para debug: mostrar quantos horários cada extração tem
      if (horariosCount > 0) {
        const totalNesteHorario = Object.values(horariosObj).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        totalResultadosBrutos += totalNesteHorario
        
        // Log especial para Nacional para debug
        const tabelaLower = tabela.toLowerCase()
        if (tabelaLower.includes('nacional') || tabelaLower.includes('federal') || tabelaLower.includes('para todos')) {
          console.log(`🇧🇷 EXTRAÇÃO NACIONAL ENCONTRADA: "${tabela}" - ${horariosCount} horário(s) - ${Object.keys(horariosObj).join(', ')} (${totalNesteHorario} resultados)`)
        } else {
          console.log(`📊 Extração "${tabela}": ${horariosCount} horário(s) - ${Object.keys(horariosObj).join(', ')} (${totalNesteHorario} resultados)`)
        }
      } else {
        // Log também quando não há horários (pode indicar problema)
        const tabelaLower = tabela.toLowerCase()
        if (tabelaLower.includes('nacional') || tabelaLower.includes('federal') || tabelaLower.includes('para todos')) {
          console.log(`⚠️ EXTRAÇÃO NACIONAL SEM HORÁRIOS: "${tabela}" - sem resultados disponíveis`)
        }
      }
      
      Object.entries(horariosObj).forEach(([horario, lista]) => {
        // Normalizar horário do resultado para o horário correto de fechamento
        const horarioNormalizado = normalizarHorarioResultado(tabela, horario)
        
        const arr = (lista || []).map((item: any, idx: number) => {
          // Melhorar inferência de estado para Nacional
          let estado = item.estado || inferUfFromName(item.estado) || inferUfFromName(tabela) || inferUfFromName(item.local)
          
          // Se a tabela contém "nacional", "federal" ou "para todos", forçar BR
          const tabelaLower = tabela.toLowerCase()
          if (tabelaLower.includes('nacional') || tabelaLower.includes('federal') || tabelaLower.includes('para todos')) {
            estado = 'BR'
          }
          
          // Se o estado inferido não for BR mas a tabela indica Nacional, usar BR
          if (estado && estado !== 'BR' && (tabelaLower.includes('nacional') || tabelaLower.includes('federal'))) {
            console.log(`   🔄 Corrigindo estado de "${estado}" para "BR" para extração "${tabela}"`)
            estado = 'BR'
          }
          
          const locationResolved = UF_NAME_MAP[estado || ''] || tabela || item.local || ''
          const dateValue = item.data_extracao || item.dataExtracao || item.data || item.date || ''
          
          // Log especial para Nacional
          if (idx === 0 && (tabelaLower.includes('nacional') || tabelaLower.includes('federal') || estado === 'BR')) {
            console.log(`   🇧🇷 Processando resultado Nacional: tabela="${tabela}", estado="${estado}", location="${locationResolved}"`)
          }
          
          return {
            position: item.colocacao || `${item.posicao || idx + 1}°`,
            posicao:
              item.posicao || (item.colocacao && parseInt(String(item.colocacao).replace(/\D/g, ''), 10)) || idx + 1,
            milhar: item.numero || item.milhar || '',
            grupo: item.grupo || '',
            animal: item.animal || '',
            drawTime: horarioNormalizado, // Usar horário normalizado
            horario: horarioNormalizado, // Usar horário normalizado
            loteria: tabela,
            location: locationResolved,
            date: dateValue,
            dataExtracao: dateValue,
            estado,
            timestamp: item.timestamp || undefined,
            fonte: item.fonte || item.origem || undefined,
            urlOrigem: item.url_origem || item.urlOrigem || item.link || undefined,
            horarioOriginal: horario, // Manter horário original para referência
          } as ResultadoItem & { horarioOriginal?: string }
        })
        results = results.concat(arr)
      })
    })
    
    console.log(`📈 Total processado: ${totalTabelas} extrações, ${totalHorarios} horários, ${totalResultadosBrutos} resultados brutos, ${results.length} resultados processados`)
    console.log(`🔍 Filtros aplicados: dateFilter="${dateFilter || 'nenhum'}", locationFilter="${locationFilter || 'nenhum'}", uf="${uf || 'nenhum'}"`)

    // Filtro por data (usa dataExtracao/data_extracao)
    // IMPORTANTE: Se não houver filtro de data, retornar TODOS os resultados disponíveis
    // Isso é necessário para a liquidação poder processar apostas de qualquer data
    const antesFiltroData = results.length
    if (dateFilter) {
      results = results.filter((r) => matchesDateFilter(r.dataExtracao || r.date, dateFilter))
      console.log(`📅 Após filtro de data "${dateFilter}": ${results.length} resultados (antes: ${antesFiltroData})`)
    } else {
      console.log(`📅 Sem filtro de data: mantendo todos os ${results.length} resultados`)
    }
    
    // Filtro por UF ou nome
    // IMPORTANTE: Se não houver filtro de localização, retornar TODOS os resultados
    // Isso garante que a liquidação tenha acesso a todos os resultados de todas as extrações
    const antesFiltroLocalizacao = results.length
    if (uf) {
      results = results.filter((r) => (r.estado || '').toUpperCase() === uf)
      console.log(`📍 Após filtro de UF "${uf}": ${results.length} resultados (antes: ${antesFiltroLocalizacao})`)
    } else if (locationFilter) {
      const lf = normalizeText(locationFilter)
      results = results.filter((r) => normalizeText(r.location || '').includes(lf))
      console.log(`📍 Após filtro de localização "${locationFilter}": ${results.length} resultados (antes: ${antesFiltroLocalizacao})`)
    } else {
      console.log(`📍 Sem filtro de localização: mantendo todos os ${results.length} resultados`)
    }

    // Ordenar e limitar em 7 posições por sorteio
    const antesAgrupamento = results.length
    const grouped: Record<string, ResultadoItem[]> = {}
    results.forEach((r) => {
      const key = `${r.loteria || ''}|${r.drawTime || ''}|${r.date || r.dataExtracao || ''}`
      grouped[key] = grouped[key] || []
      grouped[key].push(r)
    })
    
    console.log(`📦 Agrupamento: ${antesAgrupamento} resultados → ${Object.keys(grouped).length} grupos únicos`)
    
    // Mostrar alguns exemplos de grupos para debug
    const gruposExemplos = Object.entries(grouped).slice(0, 5)
    gruposExemplos.forEach(([key, arr]) => {
      console.log(`   - Grupo "${key}": ${arr.length} resultados`)
    })
    
    results = Object.values(grouped)
      .map((arr) => orderByPosition(arr).slice(0, 7))
      .flat()
    
    console.log(`✂️  Após limitar a 7 posições por grupo: ${results.length} resultados (antes: ${antesAgrupamento})`)
    
    // Log final: mostrar quantos grupos únicos foram criados
    const gruposUnicos = new Set(Object.keys(grouped))
    console.log(`✅ Resultados finais: ${gruposUnicos.size} grupos únicos (loteria|horário|data), ${results.length} resultados totais`)
    
    // Log de grupos únicos para debug
    if (gruposUnicos.size > 0 && gruposUnicos.size <= 20) {
      console.log(`   Grupos: ${Array.from(gruposUnicos).join(' | ')}`)
    } else if (gruposUnicos.size > 20) {
      console.log(`   Grupos (primeiros 10): ${Array.from(gruposUnicos).slice(0, 10).join(' | ')}...`)
    }

    const payload: ResultadosResponse = {
      results,
      updatedAt: data?.ultima_verificacao || data?.updatedAt || new Date().toISOString(),
    }

    return NextResponse.json(payload, { status: 200, headers: { 'Cache-Control': 'no-cache' } })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isTimeout = errorMessage.includes('Timeout') || errorMessage.includes('aborted') || errorMessage.includes('AbortError')
    
    console.error('Erro ao buscar resultados externos:', errorMessage)
    
    // Se for timeout, retornar erro específico
    if (isTimeout) {
      return NextResponse.json(
        {
          results: [],
          updatedAt: new Date().toISOString(),
          error: 'Timeout ao buscar resultados externos',
          message: 'A API de resultados demorou muito para responder. Tente novamente em alguns instantes.',
        } satisfies ResultadosResponse & { error: string; message: string },
        { status: 504 } // Gateway Timeout
      )
    }
    
    return NextResponse.json(
      {
        results: [],
        updatedAt: new Date().toISOString(),
        error: 'Falha ao buscar resultados externos',
        message: errorMessage,
      } satisfies ResultadosResponse & { error: string; message: string },
      { status: 502 }
    )
  }
}
