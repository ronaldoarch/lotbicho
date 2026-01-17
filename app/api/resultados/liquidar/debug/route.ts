import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buscarResultadosParaLiquidacao, mapearCodigoLoteria } from '@/lib/bichocerto-parser'
import { getHorarioRealApuracao } from '@/data/horarios-reais-apuracao'
import { extracoes } from '@/data/extracoes'

/**
 * GET /api/resultados/liquidar/debug
 * 
 * Endpoint de diagnóstico para entender por que apostas não estão sendo liquidadas
 */
export async function GET() {
  try {
    const apostasPendentes = await prisma.aposta.findMany({
      where: { status: 'pendente' },
      take: 10, // Limitar a 10 para não sobrecarregar
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            saldo: true,
          },
        },
      },
    })

    const diagnosticos = []

    for (const aposta of apostasPendentes) {
      const diagnostico: any = {
        apostaId: aposta.id,
        loteria: aposta.loteria,
        horario: aposta.horario,
        dataConcurso: aposta.dataConcurso?.toISOString().split('T')[0],
        modalidade: aposta.modalidade,
        createdAt: aposta.createdAt.toISOString(),
        problemas: [],
        informacoes: [],
      }

      // 1. Verificar extração
      let extracao = null
      let loteriaNome = aposta.loteria
      if (aposta.loteria && /^\d+$/.test(aposta.loteria)) {
        const extracaoId = parseInt(aposta.loteria)
        extracao = extracoes.find((e: any) => e.id === extracaoId)
        if (extracao) {
          loteriaNome = extracao.name
          diagnostico.informacoes.push(`Extração encontrada: ${extracao.name} (ID: ${extracao.id})`)
          diagnostico.informacoes.push(`Horário interno: ${extracao.time || 'N/A'} | Close: ${extracao.closeTime || 'N/A'}`)
        } else {
          diagnostico.problemas.push(`Extração ID ${aposta.loteria} não encontrada`)
        }
      }

      // 2. Verificar horário real de apuração
      if (extracao && loteriaNome && aposta.horario) {
        try {
          const horarioReal = getHorarioRealApuracao(loteriaNome, aposta.horario)
          if (horarioReal) {
            diagnostico.informacoes.push(`Horário real de apuração: ${horarioReal.startTimeReal} - ${horarioReal.closeTimeReal}`)
            
            // Verificar se já passou
            const agora = new Date()
            const agoraBrasiliaStr = agora.toLocaleString('en-US', { 
              timeZone: 'America/Sao_Paulo',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
            const [dataPart, horaPart] = agoraBrasiliaStr.split(', ')
            const [mes, dia, ano] = dataPart.split('/')
            const [horaAtual, minutoAtual] = horaPart.split(':')
            const agoraBrasilia = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), parseInt(horaAtual), parseInt(minutoAtual))
            
            const [horas, minutos] = horarioReal.startTimeReal.split(':').map(Number)
            const dataConcurso = aposta.dataConcurso || new Date()
            const dataConcursoBrasiliaStr = dataConcurso.toLocaleString('en-US', { 
              timeZone: 'America/Sao_Paulo',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })
            const [mesConc, diaConc, anoConc] = dataConcursoBrasiliaStr.split('/')
            const hoje = new Date(agoraBrasilia.getFullYear(), agoraBrasilia.getMonth(), agoraBrasilia.getDate())
            const dataConcursoSemHora = new Date(parseInt(anoConc), parseInt(mesConc) - 1, parseInt(diaConc))
            
            if (dataConcursoSemHora.getTime() === hoje.getTime()) {
              const dataApuracaoInicial = new Date(parseInt(anoConc), parseInt(mesConc) - 1, parseInt(diaConc), horas, minutos, 0)
              const jaPassou = agoraBrasilia >= dataApuracaoInicial
              
              if (!jaPassou) {
                diagnostico.problemas.push(`Ainda não passou o horário de apuração inicial (${horarioReal.startTimeReal})`)
                diagnostico.informacoes.push(`Horário atual: ${agoraBrasilia.toLocaleTimeString('pt-BR')} | Horário apuração: ${dataApuracaoInicial.toLocaleTimeString('pt-BR')}`)
              } else {
                diagnostico.informacoes.push(`✅ Já passou o horário de apuração inicial`)
              }
            } else if (dataConcursoSemHora.getTime() < hoje.getTime()) {
              diagnostico.informacoes.push(`✅ Data do concurso é passado, pode liquidar`)
            } else {
              diagnostico.problemas.push(`Data do concurso é futuro`)
            }
          } else {
            diagnostico.problemas.push(`Horário real de apuração não encontrado para ${loteriaNome} ${aposta.horario}`)
          }
        } catch (error) {
          diagnostico.problemas.push(`Erro ao buscar horário real: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      // 3. Verificar se há resultados disponíveis
      if (aposta.dataConcurso && loteriaNome) {
        const dataStr = aposta.dataConcurso.toISOString().split('T')[0]
        const codigoLoteria = mapearCodigoLoteria(aposta.loteria)
        
        if (codigoLoteria) {
          diagnostico.informacoes.push(`Código loteria para busca: ${codigoLoteria}`)
          
          try {
            const BICHOCERTO_PHPSESSID = process.env.BICHOCERTO_PHPSESSID
            const resultado = await buscarResultadosParaLiquidacao(codigoLoteria, dataStr, BICHOCERTO_PHPSESSID)
            
            if (resultado.erro) {
              diagnostico.problemas.push(`Erro ao buscar resultados: ${resultado.erro}`)
            } else {
              const totalResultados = Object.values(resultado.resultadosPorHorario).flat().length
              const horariosDisponiveis = Object.keys(resultado.resultadosPorHorario)
              
              diagnostico.informacoes.push(`Resultados encontrados: ${totalResultados} resultado(s) em ${horariosDisponiveis.length} horário(s)`)
              diagnostico.informacoes.push(`Horários disponíveis: ${horariosDisponiveis.join(', ')}`)
              
              if (horariosDisponiveis.length === 0) {
                diagnostico.problemas.push(`Nenhum resultado disponível para ${codigoLoteria} em ${dataStr}`)
              } else {
                // Verificar se há resultado para o horário da aposta
                const horarioAposta = aposta.horario?.trim() || ''
                const temResultadoParaHorario = horariosDisponiveis.some(h => {
                  const hLower = h.toLowerCase().trim()
                  const apostaLower = horarioAposta.toLowerCase().trim()
                  return hLower.includes(apostaLower) || apostaLower.includes(hLower)
                })
                
                if (!temResultadoParaHorario && horarioAposta) {
                  diagnostico.problemas.push(`Nenhum resultado encontrado para o horário da aposta (${horarioAposta})`)
                  diagnostico.informacoes.push(`Horários disponíveis: ${horariosDisponiveis.join(', ')}`)
                } else if (temResultadoParaHorario) {
                  diagnostico.informacoes.push(`✅ Resultado encontrado para o horário da aposta`)
                  
                  // Verificar se tem 7 posições
                  const resultadosDoHorario = horariosDisponiveis
                    .filter(h => {
                      const hLower = h.toLowerCase().trim()
                      const apostaLower = horarioAposta.toLowerCase().trim()
                      return hLower.includes(apostaLower) || apostaLower.includes(hLower)
                    })
                    .flatMap(h => resultado.resultadosPorHorario[h] || [])
                  
                  if (resultadosDoHorario.length < 7) {
                    diagnostico.problemas.push(`Resultado incompleto: apenas ${resultadosDoHorario.length} posição(ões) (necessário: 7)`)
                  } else {
                    diagnostico.informacoes.push(`✅ Resultado completo: ${resultadosDoHorario.length} posições`)
                  }
                }
              }
            }
          } catch (error) {
            diagnostico.problemas.push(`Erro ao buscar resultados: ${error instanceof Error ? error.message : String(error)}`)
          }
        } else {
          diagnostico.problemas.push(`Não foi possível mapear código da loteria para ${aposta.loteria}`)
        }
      }

      diagnosticos.push(diagnostico)
    }

    return NextResponse.json({
      totalApostasPendentes: apostasPendentes.length,
      diagnosticos,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no diagnóstico:', error)
    return NextResponse.json(
      {
        error: 'Erro ao executar diagnóstico',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
