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

// Configurar timeout maior para operações longas
export const maxDuration = 120 // 120 segundos (2 minutos) para processar muitas apostas
export const dynamic = 'force-dynamic'

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

    // Buscar resultados oficiais (com timeout maior e retry)
    let resultadosResponse
    let resultadosData
    const maxRetries = 2
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} de buscar resultados oficiais...`)
        resultadosResponse = await fetch(
          `${process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'}`,
          { 
            cache: 'no-store',
            signal: AbortSignal.timeout(60000) // 60 segundos timeout por tentativa
          }
        )

        if (!resultadosResponse.ok) {
          throw new Error(`Erro ao buscar resultados oficiais: ${resultadosResponse.status}`)
        }
        
        resultadosData = await resultadosResponse.json()
        console.log(`✅ Resultados obtidos com sucesso na tentativa ${attempt}`)
        break // Sucesso, sair do loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (error instanceof Error && error.name === 'TimeoutError') {
          console.error(`⏱️ Timeout na tentativa ${attempt}/${maxRetries}`)
          if (attempt < maxRetries) {
            console.log(`🔄 Aguardando 2 segundos antes da próxima tentativa...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
        } else {
          console.error(`❌ Erro na tentativa ${attempt}:`, error)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
        }
      }
    }
    
    // Se todas as tentativas falharam
    if (!resultadosData) {
      console.error('❌ Falha ao buscar resultados após todas as tentativas')
      return NextResponse.json({
        error: 'Erro ao buscar resultados oficiais',
        message: lastError?.name === 'TimeoutError' 
          ? 'A API de resultados demorou muito para responder após múltiplas tentativas.'
          : `Erro ao buscar resultados: ${lastError?.message || 'Erro desconhecido'}`,
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
      }, { status: 504 })
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
        let loteriaNome = aposta.loteria
        let usarFiltroLoteria = true
        
        if (aposta.loteria && /^\d+$/.test(aposta.loteria)) {
          // É um ID numérico, buscar diretamente do banco de dados
          try {
            const extracaoId = parseInt(aposta.loteria)
            const extracao = await prisma.extracao.findUnique({
              where: { id: extracaoId },
              select: { name: true },
            })
            if (extracao?.name) {
              loteriaNome = extracao.name
              console.log(`   - Loteria ID ${aposta.loteria} → Nome: "${loteriaNome}"`)
            } else {
              console.log(`   - Extração ID ${aposta.loteria} não encontrada no banco`)
              console.log(`   - ⚠️ Pulando filtro de loteria (extração não encontrada)`)
              usarFiltroLoteria = false
            }
          } catch (error) {
            console.log(`   - Erro ao buscar extração por ID: ${error}`)
            usarFiltroLoteria = false
          }
        }

        let resultadosFiltrados = resultados

        // Só filtrar por loteria se tiver nome válido e a extração foi encontrada
        if (usarFiltroLoteria && loteriaNome) {
          const loteriaLower = loteriaNome.toLowerCase().trim()
          const antes = resultadosFiltrados.length
          resultadosFiltrados = resultadosFiltrados.filter((r) => {
            const rLoteria = (r.loteria?.toLowerCase() || '').trim()
            // Verificar se o nome da loteria contém ou é contido pela loteria da aposta
            // Também verificar se algum dos nomes contém palavras-chave comuns
            const match = rLoteria.includes(loteriaLower) || 
                         loteriaLower.includes(rLoteria) ||
                         // Fallback: verificar se ambos contêm palavras-chave similares
                         (loteriaLower.length > 2 && rLoteria.length > 2 && 
                          (loteriaLower.split(' ').some(p => rLoteria.includes(p)) ||
                           rLoteria.split(' ').some(p => loteriaLower.includes(p))))
            return match
          })
          console.log(`   - Após filtro de loteria "${loteriaNome}": ${resultadosFiltrados.length} resultados (antes: ${antes})`)
          
          // Se não encontrou resultados, mostrar exemplos para debug
          if (resultadosFiltrados.length === 0 && antes > 0) {
            const exemplos = [...new Set(resultados.slice(0, 10).map(r => r.loteria).filter(Boolean))]
            console.log(`   - Exemplos de loterias disponíveis: ${exemplos.join(', ')}`)
            console.log(`   - ⚠️ Tentando liquidar sem filtro de loteria...`)
            // Se não encontrou com filtro, tentar sem filtro de loteria
            resultadosFiltrados = resultados
          }
        } else {
          console.log(`   - Pulando filtro de loteria (extração não encontrada ou inválida)`)
        }

        // Só filtrar por horário se houver horário definido e não for null
        if (aposta.horario && aposta.horario !== 'null' && resultadosFiltrados.length > 0) {
          const horarioAposta = aposta.horario.trim()
          const antes = resultadosFiltrados.length
          resultadosFiltrados = resultadosFiltrados.filter((r) => {
            const rHorario = r.horario?.trim() || ''
            // Comparação flexível de horário (pode ser "15:03" ou "15:03:00")
            return rHorario === horarioAposta || 
                   rHorario.startsWith(horarioAposta) || 
                   horarioAposta.startsWith(rHorario)
          })
          console.log(`   - Após filtro de horário "${horarioAposta}": ${resultadosFiltrados.length} resultados (antes: ${antes})`)
        } else if (!aposta.horario || aposta.horario === 'null') {
          console.log(`   - Pulando filtro de horário (horário não definido ou null)`)
        }

        if (aposta.dataConcurso && resultadosFiltrados.length > 0) {
          const dataAposta = aposta.dataConcurso.toISOString().split('T')[0]
          const antes = resultadosFiltrados.length
          resultadosFiltrados = resultadosFiltrados.filter((r) => {
            if (!r.date && !r.dataExtracao) return false
            const dataResultado = (r.date || r.dataExtracao)?.split('T')[0]
            return dataResultado === dataAposta
          })
          console.log(`   - Após filtro de data "${dataAposta}": ${resultadosFiltrados.length} resultados (antes: ${antes})`)
        }

        console.log(`\n🔍 Processando aposta ${aposta.id}:`)
        console.log(`   - Loteria da aposta: "${aposta.loteria}"`)
        console.log(`   - Horário da aposta: "${aposta.horario}"`)
        console.log(`   - Data da aposta: ${aposta.dataConcurso?.toISOString().split('T')[0]}`)
        console.log(`   - Resultados antes do filtro: ${resultados.length}`)
        console.log(`   - Resultados após filtro: ${resultadosFiltrados.length}`)
        
        if (resultadosFiltrados.length === 0) {
          console.log(`   ❌ Nenhum resultado encontrado para aposta ${aposta.id}`)
          console.log(`   💡 Verifique se loteria/horário/data estão corretos`)
          continue
        }

        // Converter resultados para formato do motor de regras
        // Ordenar por posição (1º, 2º, 3º, etc.)
        const resultadosOrdenados = resultadosFiltrados
          .filter((r) => r.position && r.milhar)
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
          console.log(`Nenhum resultado válido encontrado para aposta ${aposta.id}`)
          continue
        }

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
