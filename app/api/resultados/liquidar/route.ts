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

    // Buscar resultados usando a API interna (que usa /api/resultados/organizados)
    // Isso é mais rápido e confiável do que chamar a API externa diretamente
    let resultadosData
    let lastError: Error | null = null
    
    try {
      console.log(`🔄 Buscando resultados via API interna...`)
      
      // Usar a API interna que já está funcionando na página de resultados
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000')
      
      // Buscar TODOS os resultados sem filtros de data/localização
      // A liquidação precisa de todos os resultados disponíveis para poder liquidar apostas de qualquer extração/horário
      const resultadosResponse = await fetch(
        `${baseUrl}/api/resultados`,
        { 
          cache: 'no-store',
          signal: AbortSignal.timeout(30000) // 30 segundos timeout
        }
      )

      if (!resultadosResponse.ok) {
        throw new Error(`Erro ao buscar resultados: ${resultadosResponse.status}`)
      }
      
      resultadosData = await resultadosResponse.json()
      console.log(`✅ Resultados obtidos com sucesso via API interna`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`❌ Erro ao buscar resultados via API interna:`, error)
      
      // Fallback: tentar API externa diretamente se a interna falhar
      console.log(`🔄 Tentando API externa como fallback...`)
      try {
        const RAW_SOURCE = process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'
        const SOURCE_ROOT = RAW_SOURCE.replace(/\/api\/resultados$/, '')
        
        const fallbackResponse = await fetch(
          `${SOURCE_ROOT}/api/resultados/organizados`,
          { 
            cache: 'no-store',
            signal: AbortSignal.timeout(30000)
          }
        )
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          // Converter formato organizados para formato esperado
          const organizados = fallbackData?.organizados || {}
          let results: any[] = []
          Object.entries(organizados).forEach(([tabela, horarios]) => {
            Object.entries(horarios as Record<string, any[]>).forEach(([horario, lista]) => {
              const arr = (lista || []).map((item: any, idx: number) => ({
                position: item.colocacao || `${item.posicao || idx + 1}°`,
                milhar: item.numero || item.milhar || '',
                loteria: tabela,
                horario,
                date: item.data_extracao || item.dataExtracao || item.data || item.date || '',
                dataExtracao: item.data_extracao || item.dataExtracao || item.data || item.date || '',
              }))
              results = results.concat(arr)
            })
          })
          resultadosData = { results }
          console.log(`✅ Resultados obtidos via API externa (fallback)`)
        } else {
          throw new Error(`Fallback também falhou: ${fallbackResponse.status}`)
        }
      } catch (fallbackError) {
        console.error(`❌ Fallback também falhou:`, fallbackError)
        return NextResponse.json({
          error: 'Erro ao buscar resultados oficiais',
          message: lastError?.name === 'TimeoutError' 
            ? 'A API de resultados demorou muito para responder.'
            : `Erro ao buscar resultados: ${lastError?.message || 'Erro desconhecido'}`,
          processadas: 0,
          liquidadas: 0,
          premioTotal: 0,
        }, { status: 504 })
      }
    }

    const resultados: ResultadoItem[] = resultadosData.results || resultadosData.resultados || []

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
      Dezena: 'DEZENA',
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
              const palavrasSignificativas = ['bandeirantes', 'lotep', 'lotece', 'look', 'nacional', 'federal', 'maluquinha', 'maluca']
              const temPalavraSignificativa = palavrasSignificativas.some(palavra => 
                nomeLower.includes(palavra) && rLoteriaNormalizada.includes(palavra)
              )
              if (temPalavraSignificativa) return true
              
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
          
          // Se encontramos extração, buscar horário real de apuração
          if (extracaoParaHorario && loteriaNome && aposta.horario && aposta.horario !== 'null') {
            try {
              const horarioExtracao = aposta.horario.trim()
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
              if (`${ano}-${mes}-${dia}` === dataAposta) return true
            }
            
            // Comparação reversa (ano-mês-dia vs dia/mês/ano)
            const matchISO = dataResultado.match(/(\d{4})-(\d{2})-(\d{2})/)
            if (matchISO) {
              const [_, ano, mes, dia] = matchISO
              if (`${dia}/${mes}/${ano}` === dataApostaFormatada) return true
            }
            
            return false
          })
          console.log(`   - Após filtro de data "${dataAposta}" (ou "${dataApostaFormatada}"): ${resultadosFiltrados.length} resultados (antes: ${antes})`)
          
          // Debug: mostrar exemplos de datas dos resultados
          if (resultadosFiltrados.length === 0 && antes > 0) {
            const exemplosDatas = Array.from(new Set(resultados.slice(0, 5).map(r => r.date || r.dataExtracao).filter(Boolean)))
            console.log(`   - Exemplos de datas disponíveis: ${exemplosDatas.join(', ')}`)
          }
        }

        console.log(`\n🔍 Processando aposta ${aposta.id}:`)
        console.log(`   - Loteria da aposta: "${aposta.loteria}"`)
        console.log(`   - Horário da aposta: "${aposta.horario}"`)
        console.log(`   - Data da aposta: ${aposta.dataConcurso?.toISOString().split('T')[0]}`)
        console.log(`   - Resultados antes do filtro: ${resultados.length}`)
        console.log(`   - Resultados após filtro: ${resultadosFiltrados.length}`)
        
        // Verificar se já passou o horário de apuração
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
          const horarioApuracao = extracao?.closeTime || 'N/A'
          console.log(`   ⏰ Ainda não passou o horário de apuração (${horarioApuracao})`)
          console.log(`   ⏸️  Pulando aposta ${aposta.id} - aguardando apuração`)
          continue
        }
        
        if (resultadosFiltrados.length === 0) {
          console.log(`   ❌ Nenhum resultado encontrado para aposta ${aposta.id}`)
          console.log(`   💡 Verifique se loteria/horário/data estão corretos`)
          continue
        }

        // IMPORTANTE: Agrupar resultados por horário para garantir que pegamos apenas os prêmios do horário correto
        // O problema anterior era que estava misturando prêmios de diferentes horários
        const resultadosPorHorario = new Map<string, ResultadoItem[]>()
        
        resultadosFiltrados.forEach((r) => {
          if (r.position && r.milhar) {
            const horarioKey = r.horario || r.drawTime || 'sem-horario'
            if (!resultadosPorHorario.has(horarioKey)) {
              resultadosPorHorario.set(horarioKey, [])
            }
            resultadosPorHorario.get(horarioKey)!.push(r)
          }
        })
        
        // Selecionar o horário que corresponde melhor à aposta
        let horarioSelecionado: string | null = null
        let resultadosDoHorario: ResultadoItem[] = []
        
        // Coletar todos os horários possíveis para match (incluindo horários reais de apuração)
        const horariosParaMatch: string[] = []
        if (horarioAposta && horarioAposta !== 'null') {
          horariosParaMatch.push(horarioAposta.trim())
        }
        
        // Adicionar horários reais de apuração se disponíveis
        // Buscar extração novamente se necessário (pode estar fora do escopo anterior)
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
        
        if (extracaoParaHorarioNovo && loteriaNome && aposta.horario && aposta.horario !== 'null') {
          try {
            const horarioExtracao = aposta.horario.trim()
            const horarioReal = getHorarioRealApuracao(loteriaNome, horarioExtracao)
            if (horarioReal) {
              horariosParaMatch.push(horarioReal.startTimeReal)
              horariosParaMatch.push(horarioReal.closeTimeReal)
            }
          } catch (error) {
            // Ignorar erro
          }
        }
        
        // Tentar encontrar o melhor match entre os horários disponíveis
        for (const horarioParaMatch of horariosParaMatch) {
          const horarioNormalizado = horarioParaMatch.toLowerCase()
          
          // Buscar match exato primeiro
          for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
            const horarioKeyLower = horarioKey.toLowerCase()
            
            // Match exato
            if (horarioKeyLower === horarioNormalizado) {
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
              break
            }
            
            // Match por início (ex: "18:20" matcha "18:20:00")
            if (horarioKeyLower.startsWith(horarioNormalizado) || horarioNormalizado.startsWith(horarioKeyLower)) {
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
              break
            }
          }
          
          if (resultadosDoHorario.length > 0) break
        }
        
        // Se ainda não encontrou, tentar match por hora apenas
        if (resultadosDoHorario.length === 0 && horariosParaMatch.length > 0) {
          const horarioNormalizado = horariosParaMatch[0].toLowerCase()
          const horaAposta = horarioNormalizado.split(':')[0] || horarioNormalizado.split('h')[0] || horarioNormalizado
          
          for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
            const horarioKeyLower = horarioKey.toLowerCase()
            const horaKey = horarioKeyLower.split(':')[0] || horarioKeyLower.split('h')[0] || horarioKeyLower
            if (horaAposta === horaKey) {
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
              break
            }
          }
        }
        
        // Se não encontrou por horário da aposta, usar o horário com mais resultados
        if (resultadosDoHorario.length === 0) {
          let maxResultados = 0
          for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
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
          .slice(0, 7) // Limitar a 7 prêmios

        if (resultadosOrdenados.length === 0) {
          console.log(`   ❌ Nenhum resultado válido encontrado para aposta ${aposta.id} no horário "${horarioSelecionado}"`)
          continue
        }
        
        console.log(`   📊 Prêmios selecionados do horário "${horarioSelecionado}":`)
        resultadosOrdenados.forEach((r, idx) => {
          console.log(`      ${idx + 1}º: ${r.milhar} (posição: ${r.position})`)
        })

        // Converter para lista de milhares (formato esperado pelo motor)
        const milhares = resultadosOrdenados.map((r) => {
          const milharStr = (r.milhar || '0000').replace(/\D/g, '') // Remove não-dígitos
          return parseInt(milharStr.padStart(4, '0').slice(-4)) // Garante 4 dígitos
        })

        // Usar função correta para converter milhares em grupos
        const grupos = milhares.map((m) => milharParaGrupo(m))

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

        // Processar modalidades numéricas
        if (numberBets.length > 0) {
          for (const numero of numberBets) {
            const palpiteData: { numero: string } = { numero }

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

            premioTotalAposta += conferencia.totalPrize
          }
        } else {
          // Processar modalidades de grupo
          for (const animalBet of animalBets) {
            const gruposApostados = animalBet.map((animalId) => {
              const animal = ANIMALS.find((a) => a.id === animalId)
              if (!animal) {
                throw new Error(`Animal não encontrado: ${animalId}`)
              }
              return animal.group
            })

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

            premioTotalAposta += conferencia.totalPrize
          }
        }

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
