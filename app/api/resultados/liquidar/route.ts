import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  conferirPalpite,
  calcularValorPorPalpite,
  milharParaGrupo,
  type ModalityType,
  type InstantResult,
} from '@/lib/bet-rules-engine'
import { parsePosition } from '@/lib/position-parser'
import { ANIMALS } from '@/data/animals'
import { ResultadoItem } from '@/types/resultados'
import { extracoes } from '@/data/extracoes'
import { getHorarioRealApuracao, temSorteioNoDia } from '@/data/horarios-reais-apuracao'
import { buscarResultadosParaLiquidacao, mapearCodigoLoteria, LOTERIA_CODE_MAP } from '@/lib/bichocerto-parser'

// Configurar timeout maior para operações longas
export const maxDuration = 120 // 120 segundos (2 minutos) para processar muitas apostas
export const dynamic = 'force-dynamic'

/**
 * Verifica se já passou o horário de apuração para uma extração
 * 
 * IMPORTANTE: Esta função usa os horários REAIS de apuração do bichocerto.com,
 * não os horários internos do sistema. Os horários internos são mantidos para
 * exibição e fechamento de apostas, mas a liquidação usa os horários reais.
 * 
 * @param extracaoId ID da extração (loteria)
 * @param dataConcurso Data do concurso da aposta
 * @param horarioAposta Horário da aposta (opcional, para encontrar a extração correta)
 * @param loteriaNome Nome da loteria (opcional, para buscar horário real)
 * @returns true se já passou o horário de apuração, false caso contrário
 */
function jaPassouHorarioApuracao(
  extracaoId: number | string | null, 
  dataConcurso: Date | null,
  horarioAposta: string | null = null,
  loteriaNome: string | null = null
): boolean {
  if (!extracaoId || !dataConcurso) {
    // Se não tem extração ou data, não pode verificar - permite liquidar (comportamento antigo)
    console.log(`   ⚠️ Verificação de horário: sem extração ou data, permitindo liquidação`)
    return true
  }

  // Tentar encontrar a extração correta
  // Se houver múltiplas extrações com o mesmo nome, usar o horário para identificar a correta
  let extracao = extracoes.find(e => e.id === Number(extracaoId))
  
  // Se não encontrou por ID ou há múltiplas extrações com mesmo nome, tentar pelo horário
  if (!extracao || (horarioAposta && extracoes.filter(e => e.id === Number(extracaoId)).length > 1)) {
    // Buscar todas as extrações com esse ID/nome
    const extracoesComMesmoId = extracoes.filter(e => e.id === Number(extracaoId))
    
    if (extracoesComMesmoId.length > 1 && horarioAposta) {
      // Tentar encontrar pela correspondência de horário
      // Normalizar horário da aposta (pode ser "20:11", "20h11", etc)
      const horarioNormalizado = horarioAposta.replace(/[h:]/g, ':').replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => {
        return `${h.padStart(2, '0')}:${m}`
      })
      
      // Buscar extração cujo horário está mais próximo do horário da aposta
      extracao = extracoesComMesmoId.find(e => {
        const horarioExtracao = e.time || e.closeTime || ''
        return horarioExtracao === horarioNormalizado || 
               horarioExtracao.startsWith(horarioNormalizado.substring(0, 2))
      }) || extracoesComMesmoId[0] // Fallback para primeira se não encontrar
      
      console.log(`   🔍 Múltiplas extrações encontradas (${extracoesComMesmoId.length}), usando horário "${horarioAposta}" para identificar`)
    } else {
      extracao = extracoesComMesmoId[0] || extracao
    }
  }
  
  // IMPORTANTE: Tentar buscar horário REAL de apuração do bichocerto.com
  // Usar nome da extração e horário para encontrar o horário real
  const nomeExtracao = loteriaNome || extracao?.name || ''
  const horarioExtracao = horarioAposta || extracao?.time || extracao?.closeTime || ''
  
  let horarioReal = null
  let startTimeParaUsar = extracao?.closeTime || '' // Fallback para horário interno
  let closeTimeParaUsar = extracao?.closeTime || '' // Para logs
  
  if (nomeExtracao && horarioExtracao) {
    try {
      horarioReal = getHorarioRealApuracao(nomeExtracao, horarioExtracao)
      
      if (horarioReal) {
        // IMPORTANTE: Usar startTimeReal para permitir tentar liquidar a partir do horário inicial
        // O resultado pode começar a sair a partir de startTimeReal (ex: 17:00)
        // Mas só liquidamos quando encontrarmos o resultado correto
        startTimeParaUsar = horarioReal.startTimeReal || horarioReal.closeTimeReal
        closeTimeParaUsar = horarioReal.closeTimeReal
        console.log(`   📅 Usando horário REAL de apuração: ${horarioReal.name} ${horarioReal.time}`)
        console.log(`      Início: ${startTimeParaUsar} | Fim: ${closeTimeParaUsar} (bichocerto.com)`)
        
        // Verificar se o dia da semana tem sorteio
        const diaSemana = dataConcurso.getDay() // 0=Domingo, 1=Segunda, ..., 6=Sábado
        if (!temSorteioNoDia(horarioReal, diaSemana)) {
          const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
          console.log(`   🚫 ${diasSemana[diaSemana]} não tem sorteio para ${horarioReal.name} ${horarioReal.time}`)
          return false // Não pode liquidar se não tem sorteio neste dia
        }
      } else {
        console.log(`   ⚠️ Horário real não encontrado para ${nomeExtracao} ${horarioExtracao}, usando horário interno: ${startTimeParaUsar}`)
      }
    } catch (error) {
      // Se houver erro ao buscar horário real, usar horário interno como fallback
      console.log(`   ⚠️ Erro ao buscar horário real: ${error instanceof Error ? error.message : String(error)}, usando horário interno: ${startTimeParaUsar}`)
    }
  }
  
  if (!startTimeParaUsar) {
    // Se não encontrou horário real nem interno, permite liquidar
    console.log(`   ⚠️ Verificação de horário: sem startTime disponível, permitindo liquidação`)
    return true
  }

  // Parsear horário inicial de apuração (formato HH:MM)
  // IMPORTANTE: Verificamos se já passou o horário INICIAL, não o final
  // Isso permite tentar liquidar assim que o resultado pode começar a sair
  const [horas, minutos] = startTimeParaUsar.split(':').map(Number)
  
  if (isNaN(horas) || isNaN(minutos)) {
    console.log(`   ⚠️ Verificação de horário: startTime inválido "${startTimeParaUsar}", permitindo liquidação`)
    return true
  }
  
  // IMPORTANTE: Usar horário de Brasília (GMT-3) para comparação
  // O servidor pode estar em UTC, mas os horários das extrações são em horário de Brasília
  // Obter horário atual em Brasília
  const agoraUTC = new Date()
  const agoraBrasiliaStr = agoraUTC.toLocaleString('en-US', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  // Converter string "MM/DD/YYYY, HH:MM:SS" para Date
  const [dataPart, horaPart] = agoraBrasiliaStr.split(', ')
  const [mes, dia, ano] = dataPart.split('/')
  const [horaAtual, minutoAtual, segundoAtual] = horaPart.split(':')
  const agora = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), parseInt(horaAtual), parseInt(minutoAtual), parseInt(segundoAtual))
  
  // Obter data do concurso em horário de Brasília
  const dataConcursoBrasiliaStr = dataConcurso.toLocaleString('en-US', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [mesConc, diaConc, anoConc] = dataConcursoBrasiliaStr.split('/')
  
  // Criar data/hora INICIAL de apuração no dia do concurso usando horário de Brasília
  // IMPORTANTE: Verificamos se já passou o horário INICIAL (quando o resultado pode começar a sair)
  const dataApuracaoInicial = new Date(parseInt(anoConc), parseInt(mesConc) - 1, parseInt(diaConc), horas, minutos, 0)
  
  // Criar datas para comparação de dia (sem hora) em horário de Brasília
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const dataConcursoSemHora = new Date(parseInt(anoConc), parseInt(mesConc) - 1, parseInt(diaConc))
  
  // Se for hoje, usar hora atual; se for passado, já pode liquidar; se for futuro, não pode
  if (dataConcursoSemHora.getTime() === hoje.getTime()) {
    // Mesmo dia: verificar se já passou o horário INICIAL (quando o resultado pode começar a sair)
    const jaPassouHorarioInicial = agora >= dataApuracaoInicial
    
    // Formatar horários para log (horário de Brasília)
    const horaApuracaoInicial = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
    const horaAtualStr = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}:${agora.getSeconds().toString().padStart(2, '0')}`
    
    const fonteHorario = horarioReal ? '(bichocerto.com)' : '(interno)'
    console.log(`   ⏰ Verificação de horário: ${extracao?.name || nomeExtracao} (ID ${extracaoId}) - startTime: ${startTimeParaUsar} | closeTime: ${closeTimeParaUsar} ${fonteHorario}`)
    console.log(`      Data apuração inicial: ${dataConcursoSemHora.toLocaleDateString('pt-BR')} ${horaApuracaoInicial} (Brasília)`)
    console.log(`      Agora: ${agora.toLocaleDateString('pt-BR')} ${horaAtualStr} (Brasília)`)
    console.log(`      ${jaPassouHorarioInicial ? '✅ Já pode tentar liquidar (resultado pode estar disponível)' : '⏸️  Ainda não passou o horário inicial de apuração'}`)
    return jaPassouHorarioInicial
  } else if (dataConcursoSemHora.getTime() < hoje.getTime()) {
    // Dia passado: já pode liquidar
    console.log(`   ✅ Verificação de horário: data do concurso é passado, permitindo liquidação`)
    return true
  } else {
    // Dia futuro: não pode liquidar ainda
    console.log(`   ⏸️  Verificação de horário: data do concurso é futuro, bloqueando liquidação`)
    return false
  }
}

/**
 * GET /api/resultados/liquidar
 * 
 * Retorna estatísticas de apostas pendentes
 */
export async function GET() {
  try {
    const apostasPendentes = await prisma.aposta.count({
      where: { status: 'pendente' },
    })

    const apostasLiquidadas = await prisma.aposta.count({
      where: { status: 'liquidado' },
    })

    const apostasPerdidas = await prisma.aposta.count({
      where: { status: 'perdida' },
    })

    return NextResponse.json({
      pendentes: apostasPendentes,
      liquidadas: apostasLiquidadas,
      perdidas: apostasPerdidas,
      total: apostasPendentes + apostasLiquidadas + apostasPerdidas,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}

/**
 * Endpoint para liquidação automática de apostas pendentes
 * 
 * POST /api/resultados/liquidar
 * 
 * Body (opcional):
 * - loteria: filtrar por loteria específica
 * - dataConcurso: filtrar por data específica
 * - horario: filtrar por horário específico
 * - usarMonitor: se true, tenta usar sistema do monitor primeiro
 * 
 * Se não enviar parâmetros, processa todas as apostas pendentes
 * 
 * Estratégia:
 * 1. Se usarMonitor=true, tenta usar endpoint do monitor
 * 2. Se monitor não disponível ou falhar, usa implementação própria
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { loteria, dataConcurso, horario, usarMonitor = false } = body

    // Tentar usar sistema do monitor se solicitado
    if (usarMonitor) {
      try {
        const SOURCE_ROOT = (
          process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'
        ).replace(/\/api\/resultados$/, '')

        const monitorResponse = await fetch(`${SOURCE_ROOT}/api/resultados/liquidar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loteria, dataConcurso, horario }),
          cache: 'no-store',
        })

        if (monitorResponse.ok) {
          const monitorData = await monitorResponse.json()
          console.log('✅ Liquidação processada pelo monitor:', monitorData)
          return NextResponse.json({
            ...monitorData,
            fonte: 'monitor',
          })
        }
      } catch (monitorError) {
        console.log('⚠️ Monitor não disponível, usando implementação própria:', monitorError)
        // Continua com implementação própria
      }
    }

    // Buscar apostas pendentes
    const whereClause: any = {
      status: 'pendente',
    }

    if (loteria) whereClause.loteria = loteria
    if (dataConcurso) whereClause.dataConcurso = new Date(dataConcurso)
    if (horario) whereClause.horario = horario

    const apostasPendentes = await prisma.aposta.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: {
            id: true,
            saldo: true,
            bonus: true,
          },
        },
      },
    })

    console.log(`📊 Total de apostas pendentes encontradas: ${apostasPendentes.length}`)
    
    if (apostasPendentes.length === 0) {
      return NextResponse.json({
        message: 'Nenhuma aposta pendente encontrada',
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
      })
    }
    
    // Log das apostas encontradas para debug
    apostasPendentes.forEach((aposta, idx) => {
      console.log(`📋 Aposta ${idx + 1} (ID: ${aposta.id}):`)
      console.log(`   - Loteria: ${aposta.loteria || 'N/A'}`)
      console.log(`   - Horário: ${aposta.horario || 'N/A'}`)
      console.log(`   - Data Concurso: ${aposta.dataConcurso || 'N/A'}`)
      console.log(`   - Modalidade: ${aposta.modalidade || 'N/A'}`)
    })

    // NOVA IMPLEMENTAÇÃO: Buscar resultados diretamente do bichocerto.com por loteria/horário
    // Isso garante correspondência exata por horário para liquidação
    const USAR_BICHOCERTO_DIRETO = process.env.USAR_BICHOCERTO_DIRETO !== 'false'
    const BICHOCERTO_PHPSESSID = process.env.BICHOCERTO_PHPSESSID
    
    let resultados: ResultadoItem[] = []
    let lastError: Error | null = null
    
    if (USAR_BICHOCERTO_DIRETO) {
      console.log(`🌐 Buscando resultados diretamente do bichocerto.com para liquidação`)
      
      try {
        // Agrupar apostas por loteria/data para buscar resultados eficientemente
        const apostasPorLoteriaData = new Map<string, typeof apostasPendentes>()
        
        apostasPendentes.forEach((aposta) => {
          const dataStr = aposta.dataConcurso?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
          const codigoLoteria = mapearCodigoLoteria(aposta.loteria)
          
          if (codigoLoteria) {
            const key = `${codigoLoteria}|${dataStr}`
            if (!apostasPorLoteriaData.has(key)) {
              apostasPorLoteriaData.set(key, [])
            }
            apostasPorLoteriaData.get(key)!.push(aposta)
          }
        })
        
        console.log(`📊 Buscando resultados para ${apostasPorLoteriaData.size} combinação(ões) de loteria/data`)
        
        // Buscar resultados para cada combinação loteria/data
        const promessasResultados = Array.from(apostasPorLoteriaData.entries()).map(async ([key, apostas]) => {
          const [codigoLoteria, dataStr] = key.split('|')
          
          console.log(`🔍 Buscando resultados: ${codigoLoteria} - ${dataStr} (${apostas.length} aposta(s))`)
          
          const resultado = await buscarResultadosParaLiquidacao(codigoLoteria, dataStr, BICHOCERTO_PHPSESSID)
          
          if (resultado.erro) {
            console.log(`   ⚠️ Erro ao buscar ${codigoLoteria} ${dataStr}: ${resultado.erro}`)
            return []
          }
          
          // Converter resultados por horário para array plano
          const resultadosArray: ResultadoItem[] = []
          Object.entries(resultado.resultadosPorHorario).forEach(([horario, premios]) => {
            premios.forEach((premio) => {
              resultadosArray.push({
                ...premio,
                estado: LOTERIA_CODE_MAP[codigoLoteria]?.estado,
                location: LOTERIA_CODE_MAP[codigoLoteria]?.estado 
                  ? `Estado ${LOTERIA_CODE_MAP[codigoLoteria]?.estado}` 
                  : 'Nacional',
              } as ResultadoItem)
            })
          })
          
          console.log(`   ✅ ${codigoLoteria} ${dataStr}: ${Object.keys(resultado.resultadosPorHorario).length} horário(s), ${resultadosArray.length} resultado(s)`)
          
          return resultadosArray
        })
        
        const resultadosArrays = await Promise.all(promessasResultados)
        resultados = resultadosArrays.flat()
        
        console.log(`📊 Total de resultados obtidos para liquidação: ${resultados.length}`)
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`❌ Erro ao buscar resultados do bichocerto.com:`, error)
        
        // Fallback para API interna
        console.log(`🔄 Tentando API interna como fallback...`)
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                         (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000')
          
          const resultadosResponse = await fetch(`${baseUrl}/api/resultados`, { 
            cache: 'no-store',
            signal: AbortSignal.timeout(30000)
          })
          
          if (resultadosResponse.ok) {
            const resultadosData = await resultadosResponse.json()
            resultados = resultadosData.results || resultadosData.resultados || []
            console.log(`✅ Resultados obtidos via API interna (fallback): ${resultados.length}`)
          } else {
            throw new Error(`API interna também falhou: ${resultadosResponse.status}`)
          }
        } catch (fallbackError) {
          console.error(`❌ Fallback também falhou:`, fallbackError)
          return NextResponse.json({
            error: 'Erro ao buscar resultados oficiais',
            message: `Erro ao buscar resultados: ${lastError?.message || 'Erro desconhecido'}`,
            processadas: 0,
            liquidadas: 0,
            premioTotal: 0,
          }, { status: 504 })
        }
      }
    } else {
      // FALLBACK: Usar API interna/antiga
      console.log(`🔄 Buscando resultados via API interna...`)
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000')
        
        const resultadosResponse = await fetch(`${baseUrl}/api/resultados`, { 
          cache: 'no-store',
          signal: AbortSignal.timeout(30000)
        })
        
        if (!resultadosResponse.ok) {
          throw new Error(`Erro ao buscar resultados: ${resultadosResponse.status}`)
        }
        
        const resultadosData = await resultadosResponse.json()
        resultados = resultadosData.results || resultadosData.resultados || []
        console.log(`✅ Resultados obtidos via API interna: ${resultados.length}`)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`❌ Erro ao buscar resultados:`, error)
        return NextResponse.json({
          error: 'Erro ao buscar resultados oficiais',
          message: `Erro ao buscar resultados: ${lastError?.message || 'Erro desconhecido'}`,
          processadas: 0,
          liquidadas: 0,
          premioTotal: 0,
        }, { status: 504 })
      }
    }

    console.log(`📊 Total de resultados oficiais encontrados: ${resultados.length}`)
    if (resultados.length > 0) {
      console.log(`📋 Primeiros 3 resultados:`)
      resultados.slice(0, 3).forEach((r, idx) => {
        console.log(`   Resultado ${idx + 1}:`)
        console.log(`   - Loteria: ${r.loteria || 'N/A'}`)
        console.log(`   - Horário: ${r.horario || 'N/A'}`)
        console.log(`   - Data: ${r.date || r.dataExtracao || 'N/A'}`)
        console.log(`   - Posição: ${r.position || 'N/A'}`)
        console.log(`   - Milhar: ${r.milhar || 'N/A'}`)
      })
    }

    if (resultados.length === 0) {
      return NextResponse.json({
        message: 'Nenhum resultado oficial encontrado',
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
      })
    }

    // Mapear nome da modalidade para tipo
    const modalityMap: Record<string, ModalityType> = {
      Grupo: 'GRUPO',
      'Dupla de Grupo': 'DUPLA_GRUPO',
      'Terno de Grupo': 'TERNO_GRUPO',
      'Quadra de Grupo': 'QUADRA_GRUPO',
      'Quina de Grupo': 'QUINA_GRUPO',
      Dezena: 'DEZENA',
      'Duque de Dezena': 'DEZENA', // Usa mesma lógica de DEZENA por enquanto
      'Terno de Dezena': 'DEZENA', // Usa mesma lógica de DEZENA por enquanto
      Centena: 'CENTENA',
      Milhar: 'MILHAR',
      'Dezena Invertida': 'DEZENA_INVERTIDA',
      'Centena Invertida': 'CENTENA_INVERTIDA',
      'Milhar Invertida': 'MILHAR_INVERTIDA',
      'Milhar/Centena': 'MILHAR_CENTENA',
      'Passe vai': 'PASSE',
      'Passe vai e vem': 'PASSE_VAI_E_VEM',
    }

    let processadas = 0
    let liquidadas = 0
    let premioTotalGeral = 0

    // Processar cada aposta
    for (const aposta of apostasPendentes) {
      try {
        // Filtrar resultados por loteria/horário/data da aposta
        // Se loteria é um ID numérico, buscar o nome da extração primeiro
        // As extrações estão armazenadas como array estático em /api/admin/extracoes
        let loteriaNome = aposta.loteria
        let usarFiltroLoteria = true
        let nomesPossiveis: string[] = [] // Lista de nomes possíveis para match flexível
        
        if (aposta.loteria && /^\d+$/.test(aposta.loteria)) {
          // É um ID numérico, buscar da lista estática de extrações
          try {
            const { extracoes } = await import('@/data/extracoes')
            const extracaoId = parseInt(aposta.loteria)
            
            // Buscar extração da lista estática
            const extracao = extracoes.find((e: any) => e.id === extracaoId)
            
            if (extracao) {
              if (extracao.name && extracao.name !== '—') {
                loteriaNome = extracao.name
                
                // Criar lista de nomes possíveis para match flexível
                // A API externa pode retornar nomes com variações (maiúsculas/minúsculas, espaços, etc.)
                const nomeBase = extracao.name.toLowerCase().trim()
                nomesPossiveis = [
                  nomeBase,
                  extracao.name, // Nome original
                  nomeBase.replace(/\s+/g, ' '), // Normalizar espaços
                  nomeBase.replace(/\s+/g, '-'), // Com hífen
                  nomeBase.replace(/\s+/g, '/'), // Com barra
                ]
                
                // Adicionar variações comuns baseadas no nome
                // Baseado nos nomes REAIS que aparecem na API externa (bichocerto.com)
                // Analisando as imagens fornecidas, esses são os nomes exatos:
                
                if (nomeBase.includes('pt rio')) {
                  nomesPossiveis.push(
                    'pt rio de janeiro',  // Formato exato da API
                    'pt-rio', 
                    'pt-rio de janeiro', 
                    'mpt-rio', 
                    'mpt rio',
                    'maluquinha rj',  // Maluquinha RJ também aparece na API
                    'maluquinha rio de janeiro',
                    'maluquinha'  // Nome simples
                  )
                }
                if (nomeBase.includes('pt bahia')) {
                  nomesPossiveis.push(
                    'pt bahia',  // Formato exato da API
                    'pt-ba', 
                    'maluca bahia',  // Formato exato da API
                    'maluca ba',  // Formato exato da API
                    'maluquinha bahia',
                    'para todos bahia',  // Pode aparecer como "Para Todos Bahia"
                    'para-todos bahia'
                  )
                }
                if (nomeBase.includes('pt sp')) {
                  nomesPossiveis.push(
                    'pt-sp/bandeirantes',  // Formato exato da API (com barra)
                    'pt-sp bandeirantes',  // Formato alternativo
                    'pt sp bandeirantes', 
                    'pt-sp/bandeirantes',
                    'bandeirantes',  // Nome simples
                    'band',  // Abreviação
                    'pt sp (band)',
                    'pt-sp'
                  )
                }
                if (nomeBase.includes('look')) {
                  nomesPossiveis.push(
                    'look goiás',  // Formato exato da API
                    'look goias',
                    'look-go',  // Formato que aparece na API (com hífen)
                    'look goiás',  // Com acento
                    'look goias',  // Sem acento
                    'look'  // Nome simples
                  )
                }
                if (nomeBase.includes('lotep')) {
                  nomesPossiveis.push(
                    'pt paraiba/lotep',  // Formato exato da API (com barra)
                    'pt paraiba', 
                    'pt paraíba', 
                    'pt-pb',
                    'lotep',  // Nome simples que aparece
                    'pt paraiba/lotep'
                  )
                }
                if (nomeBase.includes('lotece')) {
                  nomesPossiveis.push(
                    'lotece',  // Nome simples que aparece na API
                    'pt ceara', 
                    'pt ceará',
                    'lotece (tarde 1)',  // Variações com horários
                    'lotece (tarde 2)',
                    'lotece (manhã)'
                  )
                }
                if (nomeBase.includes('nacional')) {
                  nomesPossiveis.push(
                    'loteria nacional',  // Formato completo
                    'nacional',  // Nome simples que aparece na API
                    'loteria nacional'
                  )
                }
                if (nomeBase.includes('federal')) {
                  nomesPossiveis.push(
                    'loteria federal',
                    'federal'  // Nome simples
                  )
                }
                if (nomeBase.includes('para todos')) {
                  nomesPossiveis.push(
                    'para todos',  // Nome simples
                    'para-todos',
                    'para todos bahia'
                  )
                }
                
                // Adicionar mapeamentos para extrações que aparecem na API mas podem não estar cadastradas
                // Essas são variações que podem aparecer nos resultados
                if (nomeBase.includes('boa sorte')) {
                  nomesPossiveis.push('boa sorte goiás', 'boa sorte')
                }
                if (nomeBase.includes('maluquinha')) {
                  nomesPossiveis.push('maluquinha rj', 'maluquinha rio de janeiro', 'maluquinha')
                }
                
                console.log(`   - Loteria ID ${aposta.loteria} → Nome: "${loteriaNome}" (ativa: ${extracao.active})`)
                console.log(`   - Nomes possíveis para match: ${nomesPossiveis.slice(0, 5).join(', ')}...`)
              } else {
                console.log(`   - Extração ID ${aposta.loteria} encontrada mas sem nome válido: "${extracao.name}"`)
                usarFiltroLoteria = false
              }
            } else {
              console.log(`   - Extração ID ${aposta.loteria} não encontrada na lista`)
              console.log(`   - ⚠️ Pulando filtro de loteria (extração não encontrada)`)
              usarFiltroLoteria = false
            }
          } catch (error) {
            console.log(`   - Erro ao buscar extração por ID: ${error}`)
            usarFiltroLoteria = false
          }
        } else {
          // Se já é um nome, criar lista de variações possíveis
          const nomeBase = (aposta.loteria || '').toLowerCase().trim()
          nomesPossiveis = [nomeBase, aposta.loteria || '']
        }

        let resultadosFiltrados = resultados

        // Só filtrar por loteria se tiver nome válido e a extração foi encontrada
        if (usarFiltroLoteria && loteriaNome && nomesPossiveis.length > 0) {
          const antes = resultadosFiltrados.length
          resultadosFiltrados = resultadosFiltrados.filter((r) => {
            const rLoteria = (r.loteria?.toLowerCase() || '').trim()
            
            // Verificar se o nome da loteria corresponde a algum dos nomes possíveis
            // Normalizar ambos os lados para comparação mais flexível
            const normalizar = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\//g, '/')
            const rLoteriaNormalizada = normalizar(rLoteria)
            
            const match = nomesPossiveis.some(nome => {
              const nomeLower = normalizar(nome)
              
              // Match exato
              if (rLoteriaNormalizada === nomeLower) return true
              
              // Match por inclusão (um contém o outro)
              if (rLoteriaNormalizada.includes(nomeLower) || nomeLower.includes(rLoteriaNormalizada)) return true
              
              // Match por palavras-chave principais (ex: "pt rio" em "pt rio de janeiro")
              const palavrasNome = nomeLower.split(/\s+|-|\//).filter(p => p.length > 2)
              const palavrasLoteria = rLoteriaNormalizada.split(/\s+|-|\//).filter(p => p.length > 2)
              
              // Se pelo menos 2 palavras-chave principais coincidem
              if (palavrasNome.length >= 2 && palavrasLoteria.length >= 2) {
                const palavrasComuns = palavrasNome.filter(p => palavrasLoteria.some(pl => pl.includes(p) || p.includes(pl)))
                if (palavrasComuns.length >= 2) return true
              }
              
              // Match por palavra-chave única se for significativa (ex: "bandeirantes", "lotep", "lotece")
              const palavrasSignificativas = ['bandeirantes', 'lotep', 'lotece', 'look', 'nacional', 'federal', 'maluquinha', 'maluca', 'rio', 'janeiro', 'bahia', 'paraiba', 'paraíba', 'ceara', 'ceará', 'goias', 'goiás', 'sp', 'são paulo', 'sao paulo']
              
              // Verificar se ambas as strings contêm a mesma palavra-chave significativa
              const temPalavraSignificativa = palavrasSignificativas.some(palavra => {
                const temNoNome = nomeLower.includes(palavra)
                const temNaLoteria = rLoteriaNormalizada.includes(palavra)
                return temNoNome && temNaLoteria
              })
              if (temPalavraSignificativa) return true
              
              // Match especial para LOOK: "look" matcha "look goiás"
              if (nomeLower === 'look' && rLoteriaNormalizada.includes('look')) return true
              
              // Match especial para FEDERAL: pode aparecer como "Loteria Federal" ou apenas "Federal"
              if (nomeLower === 'federal' && (rLoteriaNormalizada.includes('federal') || rLoteriaNormalizada.includes('loteria federal'))) return true
              
              return false
            })
            
            return match
          })
          console.log(`   - Após filtro de loteria "${loteriaNome}": ${resultadosFiltrados.length} resultados (antes: ${antes})`)
          
          // Se não encontrou resultados, mostrar exemplos para debug
          if (resultadosFiltrados.length === 0 && antes > 0) {
            const loteriasUnicas = Array.from(new Set(resultados.slice(0, 10).map(r => r.loteria).filter(Boolean) as string[]))
            console.log(`   - Exemplos de loterias disponíveis: ${loteriasUnicas.join(', ')}`)
            console.log(`   - Tentando match mais flexível...`)
            
            // Tentar match mais flexível: buscar por palavras-chave principais
            const palavrasChave = loteriaNome.toLowerCase().split(/\s+|-|\//).filter(p => p.length > 2)
            if (palavrasChave.length > 0) {
              resultadosFiltrados = resultados.filter((r) => {
                const rLoteria = (r.loteria?.toLowerCase() || '').trim()
                return palavrasChave.some(palavra => rLoteria.includes(palavra))
              })
              console.log(`   - Após match flexível por palavras-chave: ${resultadosFiltrados.length} resultados`)
            }
            
            // Se ainda não encontrou, tentar sem filtro de loteria
            if (resultadosFiltrados.length === 0) {
              console.log(`   - ⚠️ Tentando liquidar sem filtro de loteria...`)
              resultadosFiltrados = resultados
            }
          }
        } else {
          console.log(`   - Pulando filtro de loteria (extração não encontrada ou inválida)`)
        }

        // IMPORTANTE: Filtrar por horário usando o horário REAL de apuração se disponível
        // O horário da aposta pode ser diferente do horário do resultado (ex: aposta 16:45, resultado 17:00)
        if (resultadosFiltrados.length > 0) {
          const antes = resultadosFiltrados.length
          
          // Tentar encontrar horário real de apuração para usar no filtro
          let horarioParaFiltrar: string[] = []
          
          // Adicionar horário da aposta primeiro
          if (aposta.horario && aposta.horario !== 'null') {
            horarioParaFiltrar.push(aposta.horario.trim())
          }
          
          // Buscar extração para obter horário real de apuração
          let extracaoParaHorario = null
          if (aposta.loteria && /^\d+$/.test(aposta.loteria)) {
            try {
              const { extracoes } = await import('@/data/extracoes')
              const extracaoId = parseInt(aposta.loteria)
              extracaoParaHorario = extracoes.find((e: any) => e.id === extracaoId)
            } catch (error) {
              // Ignorar erro
            }
          }
          
          // Se não tem horário na aposta mas tem extração, usar horário da extração
          if (!aposta.horario || aposta.horario === 'null') {
            if (extracaoParaHorario) {
              if (extracaoParaHorario.time) {
                horarioParaFiltrar.push(extracaoParaHorario.time)
              }
              if (extracaoParaHorario.closeTime && extracaoParaHorario.closeTime !== extracaoParaHorario.time) {
                horarioParaFiltrar.push(extracaoParaHorario.closeTime)
              }
              console.log(`   ⚠️ Aposta sem horário, usando horário da extração: ${extracaoParaHorario.time || extracaoParaHorario.closeTime}`)
            }
          }
          
          // Se encontramos extração, buscar horário real de apuração
          if (extracaoParaHorario && loteriaNome) {
            const horarioParaBuscar = aposta.horario && aposta.horario !== 'null' 
              ? aposta.horario.trim() 
              : (extracaoParaHorario.time || extracaoParaHorario.closeTime || '')
            
            if (horarioParaBuscar) {
              try {
                const horarioExtracao = horarioParaBuscar.trim()
                const horarioReal = getHorarioRealApuracao(loteriaNome, horarioExtracao)
              
              if (horarioReal) {
                // Adicionar horário inicial e final de apuração para busca mais ampla
                horarioParaFiltrar.push(horarioReal.startTimeReal)
                horarioParaFiltrar.push(horarioReal.closeTimeReal)
                
                // Também adicionar variações do horário (ex: "17:00", "17h", "17")
                const [horaInicial] = horarioReal.startTimeReal.split(':')
                const [horaFinal] = horarioReal.closeTimeReal.split(':')
                horarioParaFiltrar.push(`${horaInicial}:00`, `${horaInicial}h`, horaInicial)
                horarioParaFiltrar.push(`${horaFinal}:00`, `${horaFinal}h`, horaFinal)
                
                console.log(`   📅 Usando horários reais para filtro: ${horarioReal.startTimeReal} - ${horarioReal.closeTimeReal}`)
              } else {
                // Se não encontrou horário real, usar horário da extração como fallback
                if (extracaoParaHorario.time) {
                  horarioParaFiltrar.push(extracaoParaHorario.time)
                }
                if (extracaoParaHorario.closeTime) {
                  horarioParaFiltrar.push(extracaoParaHorario.closeTime)
                }
              }
            } catch (error) {
              // Ignorar erro, usar apenas horário da aposta
            }
          }
          
          // Remover duplicatas e valores vazios
          horarioParaFiltrar = Array.from(new Set(horarioParaFiltrar.filter(h => h)))
          
          if (horarioParaFiltrar.length > 0) {
            resultadosFiltrados = resultadosFiltrados.filter((r) => {
              const rHorario = (r.horario?.trim() || '').toLowerCase()
              
              // Verificar se o horário do resultado corresponde a algum dos horários para filtrar
              return horarioParaFiltrar.some(horarioFiltro => {
                const horarioFiltroLower = horarioFiltro.toLowerCase()
                
                // Match exato
                if (rHorario === horarioFiltroLower) return true
                
                // Match por início (ex: "17:00" matcha "17:00:00")
                if (rHorario.startsWith(horarioFiltroLower) || horarioFiltroLower.startsWith(rHorario)) return true
                
                // Match por hora apenas (ex: "17:00" matcha "17h" ou "17")
                const rHora = rHorario.split(':')[0] || rHorario.split('h')[0] || rHorario
                const filtroHora = horarioFiltroLower.split(':')[0] || horarioFiltroLower.split('h')[0] || horarioFiltroLower
                if (rHora === filtroHora) return true
                
                return false
              })
            })
            console.log(`   - Após filtro de horário (${horarioParaFiltrar.join(', ')}): ${resultadosFiltrados.length} resultados (antes: ${antes})`)
          } else {
            console.log(`   - Pulando filtro de horário (nenhum horário disponível para filtrar)`)
          }
        } else if (!aposta.horario || aposta.horario === 'null') {
          console.log(`   - Pulando filtro de horário (horário não definido ou null)`)
        }

        if (aposta.dataConcurso && resultadosFiltrados.length > 0) {
          const dataAposta = aposta.dataConcurso.toISOString().split('T')[0]
          // Normalizar data da aposta para formato DD/MM/YYYY também
          const [anoAposta, mesAposta, diaAposta] = dataAposta.split('-')
          const dataApostaFormatada = `${diaAposta}/${mesAposta}/${anoAposta}`
          
          const antes = resultadosFiltrados.length
          resultadosFiltrados = resultadosFiltrados.filter((r) => {
            if (!r.date && !r.dataExtracao) return false
            
            const dataResultado = r.date || r.dataExtracao || ''
            
            // Tentar múltiplos formatos de comparação
            // Formato ISO: 2026-01-14
            const dataResultadoISO = dataResultado.split('T')[0]
            if (dataResultadoISO === dataAposta) return true
            
            // Formato brasileiro: 14/01/2026
            if (dataResultado === dataApostaFormatada) return true
            
            // Comparação parcial (apenas dia/mês/ano)
            const matchBR = dataResultado.match(/(\d{2})\/(\d{2})\/(\d{4})/)
            if (matchBR) {
              const [_, dia, mes, ano] = matchBR
              const dataResultadoISO = `${ano}-${mes}-${dia}`
              if (dataResultadoISO === dataAposta) return true
            }
            
            // Comparação reversa (ano-mês-dia vs dia/mês/ano)
            const matchISO = dataResultado.match(/(\d{4})-(\d{2})-(\d{2})/)
            if (matchISO) {
              const [_, ano, mes, dia] = matchISO
              const dataResultadoFormatada = `${dia}/${mes}/${ano}`
              if (dataResultadoFormatada === dataApostaFormatada) return true
            }
            
            return false
          })
          console.log(`   - Após filtro de data "${dataAposta}" (ou "${dataApostaFormatada}"): ${resultadosFiltrados.length} resultados (antes: ${antes})`)
          
          // Debug: mostrar exemplos de datas dos resultados
          if (resultadosFiltrados.length === 0 && antes > 0) {
            const exemplosDatas = Array.from(new Set(resultados.slice(0, 10).map(r => r.date || r.dataExtracao).filter(Boolean)))
            console.log(`   - Exemplos de datas disponíveis: ${exemplosDatas.join(', ')}`)
            console.log(`   - ⚠️ Nenhum resultado encontrado para data da aposta (${dataAposta})`)
          }
        } else if (!aposta.dataConcurso) {
          // Se não tem data na aposta, não filtrar por data (usar todos os resultados disponíveis)
          console.log(`   - Pulando filtro de data (aposta sem data definida)`)
        }

        console.log(`\n🔍 Processando aposta ${aposta.id}:`)
        console.log(`   - Loteria da aposta: "${aposta.loteria}"`)
        console.log(`   - Horário da aposta: "${aposta.horario}"`)
        console.log(`   - Data da aposta: ${aposta.dataConcurso?.toISOString().split('T')[0]}`)
        console.log(`   - Resultados antes do filtro: ${resultados.length}`)
        console.log(`   - Resultados após filtro: ${resultadosFiltrados.length}`)
        
        // Verificar se já passou o horário de apuração REAL (quando o resultado deve estar disponível)
        // IMPORTANTE: Só podemos liquidar quando o resultado aparecer na API (aba de resultados)
        // O resultado demora cerca de 2 minutos ou mais para chegar após o fechamento
        const extracaoId = aposta.loteria ? Number(aposta.loteria) : null
        const horarioAposta = aposta.horario && aposta.horario !== 'null' ? aposta.horario : null
        // Usar loteriaNome já declarado acima (linha 435), não redeclarar
        const podeLiquidar = jaPassouHorarioApuracao(extracaoId, aposta.dataConcurso, horarioAposta, loteriaNome || null)
        
        if (!podeLiquidar) {
          // Buscar extração correta para mostrar no log
          let extracao = extracoes.find(e => e.id === Number(extracaoId))
          if (!extracao && horarioAposta) {
            const extracoesComMesmoId = extracoes.filter(e => e.id === Number(extracaoId))
            if (extracoesComMesmoId.length > 1) {
              const horarioNormalizado = horarioAposta.replace(/[h:]/g, ':')
              extracao = extracoesComMesmoId.find(e => {
                const horarioExtracao = e.time || e.closeTime || ''
                return horarioExtracao === horarioNormalizado || 
                       horarioExtracao.startsWith(horarioNormalizado.substring(0, 2))
              }) || extracoesComMesmoId[0]
            }
          }
          
          // Buscar horário real de apuração para mostrar no log
          let horarioApuracaoReal = 'N/A'
          if (extracao) {
            try {
              const { getHorarioRealApuracao } = await import('@/data/horarios-reais-apuracao')
              const horarioReal = getHorarioRealApuracao(extracao.name, extracao.time)
              if (horarioReal) {
                horarioApuracaoReal = `${horarioReal.startTimeReal} - ${horarioReal.closeTimeReal} (real)`
              } else {
                horarioApuracaoReal = extracao.closeTime || 'N/A'
              }
            } catch (error) {
              horarioApuracaoReal = extracao.closeTime || 'N/A'
            }
          }
          
          console.log(`   ⏰ Ainda não passou o horário de apuração (${horarioApuracaoReal})`)
          console.log(`   ⏸️  Pulando aposta ${aposta.id} - aguardando resultado aparecer na API`)
          continue
        }
        
        // VALIDAÇÃO ADICIONAL: Verificar se o resultado realmente apareceu na API
        // Se não há resultados filtrados, significa que o resultado ainda não chegou na API
        if (resultadosFiltrados.length === 0) {
          console.log(`   ⏸️  Resultado ainda não apareceu na API para aposta ${aposta.id}`)
          console.log(`   💡 Aguardando resultado aparecer na aba de resultados (pode demorar 2+ minutos após fechamento)`)
          continue
        }
        
        if (resultadosFiltrados.length === 0) {
          console.log(`   ❌ Nenhum resultado encontrado para aposta ${aposta.id}`)
          console.log(`   💡 Verifique se loteria/horário/data estão corretos`)
          continue
        }

        // IMPORTANTE: Agora que os resultados já vêm normalizados com o horário correto de fechamento,
        // podemos simplificar muito a lógica de seleção. Basta fazer match direto com o horário da aposta.
        const resultadosPorHorario = new Map<string, ResultadoItem[]>()
        
        resultadosFiltrados.forEach((r) => {
          if (r.position && r.milhar) {
            // Usar horário normalizado (já vem correto do processamento de resultados)
            const horarioKey = r.horario || r.drawTime || 'sem-horario'
            if (!resultadosPorHorario.has(horarioKey)) {
              resultadosPorHorario.set(horarioKey, [])
            }
            resultadosPorHorario.get(horarioKey)!.push(r)
          }
        })
        
        // Selecionar o horário que corresponde à aposta
        let horarioSelecionado: string | null = null
        let resultadosDoHorario: ResultadoItem[] = []
        
        // Buscar extração para obter horário correto
        let extracaoParaHorarioNovo = null
        if (aposta.loteria && /^\d+$/.test(aposta.loteria)) {
          try {
            const { extracoes } = await import('@/data/extracoes')
            const extracaoId = parseInt(aposta.loteria)
            extracaoParaHorarioNovo = extracoes.find((e: any) => e.id === extracaoId)
          } catch (error) {
            // Ignorar erro
          }
        }
        
        // Coletar horários possíveis para match
        const horariosParaMatch: string[] = []
        if (horarioAposta && horarioAposta !== 'null') {
          horariosParaMatch.push(horarioAposta.trim())
        }
        
        // Se tem extração, adicionar horário interno (time) que é o que os resultados normalizados usam
        if (extracaoParaHorarioNovo) {
          if (extracaoParaHorarioNovo.time) {
            horariosParaMatch.push(extracaoParaHorarioNovo.time)
          }
          if (extracaoParaHorarioNovo.closeTime && extracaoParaHorarioNovo.closeTime !== extracaoParaHorarioNovo.time) {
            horariosParaMatch.push(extracaoParaHorarioNovo.closeTime)
          }
          
          // Se não tem horário na aposta, usar horário da extração como principal
          if (!horarioAposta || horarioAposta === 'null') {
            console.log(`   ⚠️ Aposta sem horário explícito, usando horário da extração: ${extracaoParaHorarioNovo.time || extracaoParaHorarioNovo.closeTime}`)
          }
        }
        
        console.log(`   🕐 Horários para match: [${horariosParaMatch.join(', ')}]`)
        console.log(`   📋 Horários disponíveis nos resultados:`)
        resultadosPorHorario.forEach((resultados, horario) => {
          console.log(`      - "${horario}": ${resultados.length} resultado(s)`)
        })
        
        // Converter Map para Array para compatibilidade com ES5
        const resultadosPorHorarioArray = Array.from(resultadosPorHorario.entries())
        
        // Fazer match direto com os horários possíveis
        // Como os resultados já vêm normalizados, o match deve ser mais simples
        for (const horarioParaMatch of horariosParaMatch) {
          const horarioNormalizado = horarioParaMatch.toLowerCase().trim()
          
          for (let i = 0; i < resultadosPorHorarioArray.length; i++) {
            const [horarioKey, resultados] = resultadosPorHorarioArray[i]
            const horarioKeyLower = horarioKey.toLowerCase().trim()
            
            // Match exato
            if (horarioKeyLower === horarioNormalizado) {
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
              console.log(`   ✅ Match exato encontrado: "${horarioKey}"`)
              break
            }
            
            // Match por início (ex: "20:15" matcha "20:15:00")
            if (horarioKeyLower.startsWith(horarioNormalizado) || horarioNormalizado.startsWith(horarioKeyLower)) {
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
              console.log(`   ✅ Match por início encontrado: "${horarioKey}" (procurando: "${horarioParaMatch}")`)
              break
            }
          }
          
          if (resultadosDoHorario.length > 0) break
        }
        
        // Se não encontrou match exato, tentar match aproximado (escolhendo o MAIS PRÓXIMO)
        if (resultadosDoHorario.length === 0 && horariosParaMatch.length > 0) {
          console.log(`   ⚠️ Nenhum match exato encontrado, tentando match aproximado...`)
          
          const extrairMinutos = (horario: string): number => {
            const match = horario.match(/(\d{1,2}):?(\d{2})/)
            if (match) {
              const horas = parseInt(match[1], 10)
              const minutos = parseInt(match[2], 10)
              return horas * 60 + minutos
            }
            return -1
          }
          
          // Se tem horário da aposta explícito, usar tolerância menor (5 minutos)
          // Caso contrário, usar tolerância maior (15 minutos)
          const temHorarioApostaExplicito = horarioAposta && horarioAposta !== 'null'
          const toleranciaMinutos = temHorarioApostaExplicito ? 5 : 15
          
          let melhorMatch: { horario: string; resultados: ResultadoItem[]; diferenca: number } | null = null
          
          // Priorizar o horário da aposta se existir
          const horariosPriorizados = temHorarioApostaExplicito 
            ? [horarioAposta.trim(), ...horariosParaMatch.filter(h => h !== horarioAposta.trim())]
            : horariosParaMatch
          
          for (const horarioParaMatch of horariosPriorizados) {
            const minutosParaMatch = extrairMinutos(horarioParaMatch)
            if (minutosParaMatch === -1) continue
            
            for (let i = 0; i < resultadosPorHorarioArray.length; i++) {
              const [horarioKey, resultados] = resultadosPorHorarioArray[i]
              const minutosKey = extrairMinutos(horarioKey)
              
              if (minutosKey !== -1) {
                const diferenca = Math.abs(minutosParaMatch - minutosKey)
                
                // Se está dentro da tolerância e é melhor que o match anterior
                if (diferenca <= toleranciaMinutos) {
                  if (!melhorMatch || diferenca < melhorMatch.diferenca) {
                    melhorMatch = {
                      horario: horarioKey,
                      resultados: resultados,
                      diferenca: diferenca
                    }
                  }
                }
              }
            }
          }
          
          if (melhorMatch) {
            horarioSelecionado = melhorMatch.horario
            resultadosDoHorario = melhorMatch.resultados
            console.log(`   ✅ Match aproximado encontrado: "${melhorMatch.horario}" (diferença: ${melhorMatch.diferenca} minutos, tolerância: ${toleranciaMinutos} min)`)
          } else {
            console.log(`   ❌ Nenhum match aproximado encontrado dentro da tolerância de ${toleranciaMinutos} minutos`)
          }
        }
        
        // Se ainda não encontrou e não tem horário na aposta, usar o horário mais recente
        if (resultadosDoHorario.length === 0 && (!horarioAposta || horarioAposta === 'null')) {
          // Usar o horário com mais resultados (geralmente é o mais recente)
          let maxResultados = 0
          for (let i = 0; i < resultadosPorHorarioArray.length; i++) {
            const [horarioKey, resultados] = resultadosPorHorarioArray[i]
            if (resultados.length > maxResultados) {
              maxResultados = resultados.length
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
            }
          }
        }
        
        console.log(`   🕐 Resultados agrupados por horário: ${resultadosPorHorario.size} horário(s) encontrado(s)`)
        resultadosPorHorario.forEach((resultados, horario) => {
          console.log(`      - Horário "${horario}": ${resultados.length} resultado(s)`)
        })
        console.log(`   ✅ Usando horário selecionado: "${horarioSelecionado}" com ${resultadosDoHorario.length} resultado(s)`)
        
        // VALIDAÇÃO CRÍTICA 1: Verificar se o resultado está completo antes de liquidar
        // O resultado deve ter pelo menos 7 posições (1º ao 7º) para ser considerado válido
        if (resultadosDoHorario.length < 7) {
          console.log(`   ⚠️ Resultado incompleto: apenas ${resultadosDoHorario.length} posição(ões) encontrada(s)`)
          console.log(`   ⏸️  Aguardando resultado completo (necessário: 7 posições) para aposta ${aposta.id}`)
          continue
        }
        
        // VALIDAÇÃO CRÍTICA 2: Verificar se o horário do resultado corresponde EXATAMENTE ao horário da aposta
        // Não podemos liquidar com horários diferentes - só com o horário correto
        if (horarioAposta && horarioAposta !== 'null' && horarioSelecionado) {
          // Normalizar ambos os horários para comparação
          const normalizarHorario = (h: string) => h.replace(/[h:]/g, ':').trim().toLowerCase()
          const horarioApostaNormalizado = normalizarHorario(horarioAposta)
          const horarioSelecionadoNormalizado = normalizarHorario(horarioSelecionado)
          
          // Verificar match exato ou por início (ex: "20:15" matcha "20:15:00")
          const matchExato = horarioApostaNormalizado === horarioSelecionadoNormalizado
          const matchPorInicio = horarioSelecionadoNormalizado.startsWith(horarioApostaNormalizado) || 
                                 horarioApostaNormalizado.startsWith(horarioSelecionadoNormalizado)
          
          // Se não houver match, buscar horário real de apuração para validar
          let horarioRealParaValidar: string | null = null
          if (extracaoParaHorarioNovo) {
            try {
              const { getHorarioRealApuracao } = await import('@/data/horarios-reais-apuracao')
              const horarioReal = getHorarioRealApuracao(extracaoParaHorarioNovo.name, extracaoParaHorarioNovo.time)
              if (horarioReal) {
                // O resultado deve estar dentro do intervalo de apuração (startTimeReal até closeTimeReal)
                horarioRealParaValidar = horarioReal.closeTimeReal
                console.log(`   📅 Horário real de apuração: ${horarioReal.startTimeReal} - ${horarioReal.closeTimeReal}`)
              }
            } catch (error) {
              // Ignorar erro
            }
          }
          
          // Se não houver match exato ou por início, verificar se está dentro do intervalo de apuração
          if (!matchExato && !matchPorInicio) {
            // Tentar extrair minutos de ambos os horários
            const extrairMinutos = (h: string): number => {
              const match = h.match(/(\d{1,2}):?(\d{2})/)
              if (match) {
                const horas = parseInt(match[1], 10)
                const minutos = parseInt(match[2], 10)
                return horas * 60 + minutos
              }
              return -1
            }
            
            const minutosAposta = extrairMinutos(horarioApostaNormalizado)
            const minutosSelecionado = extrairMinutos(horarioSelecionadoNormalizado)
            
            // Se a diferença for maior que a tolerância, não é o mesmo horário
            // Tolerância menor (5 min) se tem horário explícito na aposta, maior (15 min) caso contrário
            const toleranciaValidacao = 5 // Sempre usar tolerância menor na validação final
            if (minutosAposta !== -1 && minutosSelecionado !== -1) {
              const diferencaMinutos = Math.abs(minutosAposta - minutosSelecionado)
              
              if (diferencaMinutos > toleranciaValidacao) {
                console.log(`   ❌ Horário do resultado não corresponde ao horário da aposta`)
                console.log(`      Horário da aposta: "${horarioAposta}"`)
                console.log(`      Horário do resultado: "${horarioSelecionado}"`)
                console.log(`      Diferença: ${diferencaMinutos} minutos (tolerância: ${toleranciaValidacao} min)`)
                console.log(`   ⏸️  Não é possível liquidar com horário diferente - aguardando resultado correto`)
                continue
              } else {
                console.log(`   ✅ Diferença de horário aceitável (${diferencaMinutos} minutos) - aceitando`)
              }
            } else {
              console.log(`   ⚠️ Não foi possível comparar horários numericamente - aceitando`)
            }
          } else {
            console.log(`   ✅ Horário do resultado corresponde ao horário da aposta (${matchExato ? 'exato' : 'por início'})`)
          }
        }
        
        // Converter resultados para formato do motor de regras
        // Ordenar por posição (1º, 2º, 3º, etc.) APENAS do horário selecionado
        const resultadosOrdenados = resultadosDoHorario
          .sort((a, b) => {
            // Extrair número da posição (1º, 2º, etc.)
            const getPosNumber = (pos?: string): number => {
              if (!pos) return 999
              const match = pos.match(/(\d+)/)
              return match ? parseInt(match[1], 10) : 999
            }
            return getPosNumber(a.position) - getPosNumber(b.position)
          })

        if (resultadosOrdenados.length === 0) {
          console.log(`   ❌ Nenhum resultado válido encontrado para aposta ${aposta.id} no horário "${horarioSelecionado}"`)
          continue
        }
        
        // VALIDAÇÃO ADICIONAL: Verificar quais posições estão presentes ANTES de fazer slice
        const posicoesEncontradas = new Set<number>()
        resultadosOrdenados.forEach((r) => {
          const match = r.position?.match(/(\d+)/)
          if (match) {
            posicoesEncontradas.add(parseInt(match[1], 10))
          }
        })
        
        // Log detalhado das posições encontradas
        const posicoesArray = Array.from(posicoesEncontradas).sort((a, b) => a - b)
        console.log(`   📊 Posições encontradas nos resultados: [${posicoesArray.join(', ')}] (total: ${resultadosOrdenados.length} resultado(s))`)
        
        // Verificar se temos pelo menos as posições de 1º a 7º
        const posicoesNecessarias = [1, 2, 3, 4, 5, 6, 7]
        const temTodasPosicoes = posicoesNecessarias.every(pos => posicoesEncontradas.has(pos))
        
        if (!temTodasPosicoes) {
          const posicoesFaltando = posicoesNecessarias.filter(pos => !posicoesEncontradas.has(pos))
          console.log(`   ⚠️ Resultado incompleto: faltam posições ${posicoesFaltando.join(', ')}`)
          console.log(`   📋 Detalhes dos resultados encontrados:`)
          resultadosOrdenados.slice(0, 10).forEach((r, idx) => {
            console.log(`      ${idx + 1}. Posição: ${r.position || 'N/A'}, Milhar: ${r.milhar || 'N/A'}, Grupo: ${r.grupo || 'N/A'}`)
          })
          console.log(`   ⏸️  Aguardando resultado completo para aposta ${aposta.id}`)
          continue
        }
        
        // Se tem todas as posições, fazer slice para pegar apenas as 7 primeiras
        const resultadosParaLiquidacao = resultadosOrdenados.slice(0, 7)
        
        // VALIDAÇÃO FINAL: Verificar se o resultado corresponde à extração/horário/data
        // Esta validação é menos restritiva - se já passou pelos filtros anteriores (loteria, horário, data),
        // e temos todas as 7 posições, podemos liquidar
        if (loteriaNome && resultadosDoHorario.length > 0) {
          const loteriaResultado = resultadosDoHorario[0].loteria?.toLowerCase().trim() || ''
          const loteriaApostaNormalizada = loteriaNome.toLowerCase().trim()
          
          // Log para debug
          console.log(`   🔍 Validação de loteria:`)
          console.log(`      Loteria da aposta: "${loteriaNome}"`)
          console.log(`      Loteria do resultado: "${resultadosDoHorario[0].loteria}"`)
          
          // Verificar match flexível mas rigoroso
          const normalizar = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\//g, '/')
          const loteriaResultadoNormalizada = normalizar(loteriaResultado)
          const loteriaApostaNormalizadaFinal = normalizar(loteriaApostaNormalizada)
          
          // Verificar se há correspondência (exata ou por palavras-chave principais)
          const palavrasLoteriaResultado = loteriaResultadoNormalizada.split(/\s+|-|\//).filter(p => p.length > 2)
          const palavrasLoteriaAposta = loteriaApostaNormalizadaFinal.split(/\s+|-|\//).filter(p => p.length > 2)
          
          const palavrasComuns = palavrasLoteriaResultado.filter(p => 
            palavrasLoteriaAposta.some(pa => pa.includes(p) || p.includes(pa))
          )
          
          // Match exato
          const matchExato = loteriaResultadoNormalizada === loteriaApostaNormalizadaFinal
          
          // Match por inclusão (um contém o outro)
          const matchPorInclusao = loteriaResultadoNormalizada.includes(loteriaApostaNormalizadaFinal) || 
                                   loteriaApostaNormalizadaFinal.includes(loteriaResultadoNormalizada)
          
          // Match por palavras-chave significativas
          const palavrasSignificativas = ['nacional', 'federal', 'lotep', 'lotece', 'look', 'bandeirantes', 'maluquinha', 'maluca']
          const temPalavraSignificativa = palavrasSignificativas.some(palavra => {
            return loteriaResultadoNormalizada.includes(palavra) && loteriaApostaNormalizadaFinal.includes(palavra)
          })
          
          // Se passou pelos filtros anteriores (loteria, horário, data) e tem todas as posições,
          // mas não há correspondência clara, apenas logar mas não bloquear
          // (pode ser uma variação de nome que já foi filtrada anteriormente)
          if (!matchExato && !matchPorInclusao && palavrasComuns.length === 0 && !temPalavraSignificativa) {
            console.log(`   ⚠️ Atenção: Diferença entre loteria da aposta e resultado`)
            console.log(`      Mas como já passou pelos filtros anteriores, continuando com liquidação...`)
            // Não bloquear - os filtros anteriores já garantiram que é o resultado correto
          } else {
            console.log(`   ✅ Validação de loteria passou (match: ${matchExato ? 'exato' : matchPorInclusao ? 'inclusão' : palavrasComuns.length > 0 ? 'palavras-chave' : 'significativa'})`)
          }
        }
        
        console.log(`   📊 Prêmios selecionados do horário "${horarioSelecionado}":`)
        resultadosParaLiquidacao.forEach((r, idx) => {
          console.log(`      ${idx + 1}º: ${r.milhar} (posição: ${r.position}, grupo: ${r.grupo || 'N/A'})`)
        })

        // Converter para lista de milhares (formato esperado pelo motor)
        const milhares = resultadosParaLiquidacao.map((r) => {
          const milharStr = (r.milhar || '0000').replace(/\D/g, '') // Remove não-dígitos
          return parseInt(milharStr.padStart(4, '0').slice(-4)) // Garante 4 dígitos
        })

        // Usar função correta para converter milhares em grupos
        const grupos = milhares.map((m) => milharParaGrupo(m))

        console.log(`   🎯 Resultado oficial processado:`)
        console.log(`      Milhares: [${milhares.join(', ')}]`)
        console.log(`      Grupos: [${grupos.join(', ')}]`)

        const resultadoOficial: InstantResult = {
          prizes: milhares,
          groups: grupos,
        }

        // Extrair dados da aposta
        const detalhes = aposta.detalhes as any
        if (!detalhes || !detalhes.betData) {
          console.log(`Aposta ${aposta.id} não tem betData`)
          continue
        }

        const betData = detalhes.betData as {
          modality: string | null
          modalityName?: string | null
          animalBets?: number[][]
          numberBets?: string[]
          position: string | null
          amount: number
          divisionType: 'all' | 'each'
        }

        const modalityType = modalityMap[betData.modalityName || aposta.modalidade || ''] || 'GRUPO'

        // Parsear posição usando função helper
        const { pos_from, pos_to } = parsePosition(betData.position)

        // Calcular valor por palpite
        const numberBets = betData.numberBets || []
        const animalBets = betData.animalBets || []
        const qtdPalpites = animalBets.length || numberBets.length || 0
        
        if (qtdPalpites === 0) {
          console.log(`Aposta ${aposta.id} não tem palpites válidos`)
          continue
        }

        const valorPorPalpite = calcularValorPorPalpite(
          betData.amount,
          qtdPalpites,
          betData.divisionType
        )

        // Conferir cada palpite
        let premioTotalAposta = 0

        console.log(`   🎲 Conferindo palpites:`)
        console.log(`      Modalidade: ${betData.modalityName || aposta.modalidade}`)
        console.log(`      Tipo: ${modalityType}`)
        console.log(`      Posição: ${betData.position} (${pos_from}º ao ${pos_to}º)`)
        console.log(`      Valor por palpite: R$ ${valorPorPalpite.toFixed(2)}`)

        // Processar modalidades numéricas
        if (numberBets.length > 0) {
          console.log(`      Palpites numéricos: [${numberBets.join(', ')}]`)
          for (const numero of numberBets) {
            const palpiteData: { numero: string } = { numero }
            
            console.log(`      Conferindo número: ${numero}`)

            const conferencia = conferirPalpite(
              resultadoOficial,
              modalityType,
              palpiteData,
              pos_from,
              pos_to,
              valorPorPalpite,
              betData.divisionType,
              betData.modalityName || undefined
            )

            console.log(`         Resultado: R$ ${conferencia.totalPrize.toFixed(2)}`)
            premioTotalAposta += conferencia.totalPrize
          }
        } else {
          // Processar modalidades de grupo
          console.log(`      Palpites de grupo: ${animalBets.length} palpite(s)`)
          for (let idx = 0; idx < animalBets.length; idx++) {
            const animalBet = animalBets[idx]
            const gruposApostados = animalBet.map((animalId) => {
              const animal = ANIMALS.find((a) => a.id === animalId)
              if (!animal) {
                throw new Error(`Animal não encontrado: ${animalId}`)
              }
              return animal.group
            })

            console.log(`      Conferindo palpite ${idx + 1}: grupos [${gruposApostados.join(', ')}]`)

            const palpiteData: { grupos: number[] } = { grupos: gruposApostados }

            const conferencia = conferirPalpite(
              resultadoOficial,
              modalityType,
              palpiteData,
              pos_from,
              pos_to,
              valorPorPalpite,
              betData.divisionType,
              betData.modalityName || undefined
            )

            console.log(`         Resultado: R$ ${conferencia.totalPrize.toFixed(2)}`)
            premioTotalAposta += conferencia.totalPrize
          }
        }
        
        console.log(`   💰 Prêmio total da aposta: R$ ${premioTotalAposta.toFixed(2)}`)

        // Atualizar aposta e saldo do usuário
        if (premioTotalAposta > 0) {
          await prisma.$transaction(async (tx) => {
            // Atualizar aposta
            await tx.aposta.update({
              where: { id: aposta.id },
              data: {
                status: 'liquidado',
                retornoPrevisto: premioTotalAposta,
                detalhes: {
                  ...detalhes,
                  resultadoOficial: resultadoOficial,
                  premioTotal: premioTotalAposta,
                  liquidadoEm: new Date().toISOString(),
                },
              },
            })

            // Creditar prêmio no saldo do usuário
            await tx.usuario.update({
              where: { id: aposta.usuarioId },
              data: {
                saldo: {
                  increment: premioTotalAposta,
                },
              },
            })
          })

          liquidadas++
          premioTotalGeral += premioTotalAposta
        } else {
          // Marcar como não ganhou
          await prisma.aposta.update({
            where: { id: aposta.id },
            data: {
              status: 'perdida',
              detalhes: {
                ...detalhes,
                resultadoOficial: resultadoOficial,
                premioTotal: 0,
                liquidadoEm: new Date().toISOString(),
              },
            },
          })
        }

        processadas++
      } catch (error) {
        console.error(`Erro ao processar aposta ${aposta.id}:`, error)
        // Continua processando outras apostas
      }
    }

    return NextResponse.json({
      message: 'Liquidação concluída',
      processadas,
      liquidadas,
      premioTotal: premioTotalGeral,
      fonte: 'proprio',
    })
  } catch (error) {
    console.error('Erro ao liquidar apostas:', error)
    return NextResponse.json(
      {
        error: 'Erro ao liquidar apostas',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
