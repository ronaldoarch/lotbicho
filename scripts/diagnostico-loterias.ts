/**
 * Script de diagnóstico para verificar como as loterias estão salvas no banco
 */

import { PrismaClient } from '@prisma/client'
import { extracoes } from '../data/extracoes'

const prisma = new PrismaClient()

/**
 * Obtém o nome da loteria a partir do ID ou nome
 */
function getNomeLoteria(loteria: string | null | undefined): string {
  if (!loteria) return 'SEM_LOTERIA'
  
  const loteriaStr = String(loteria).trim()
  
  // Se é um ID numérico, buscar da lista de extrações
  if (/^\d+$/.test(loteriaStr)) {
    const extracaoId = parseInt(loteriaStr, 10)
    const extracao = extracoes.find((e: any) => e.id === extracaoId)
    if (extracao) {
      return `${extracao.name} (ID: ${extracaoId})`
    }
  }
  
  return loteriaStr
}

async function diagnosticarLoterias() {
  console.log('🔍 Diagnosticando loterias no banco de dados...\n')

  try {
    // Buscar todas as apostas com resultado oficial
    const apostas = await prisma.aposta.findMany({
      where: {
        detalhes: {
          path: ['resultadoOficial'],
          not: null,
        },
      },
      select: {
        id: true,
        loteria: true,
        detalhes: true,
        status: true,
      },
    })

    console.log(`📊 Total de apostas com resultado oficial: ${apostas.length}\n`)

    // Agrupar por loteria
    const loteriasMap = new Map<string, {
      count: number
      exemplos: Array<{ id: number; loteria: string | null; prizes?: number[] }>
    }>()

    for (const aposta of apostas) {
      const detalhes = aposta.detalhes as any
      const resultadoOficial = detalhes?.resultadoOficial
      const prizes = resultadoOficial?.prizes || []

      const loteriaNome = getNomeLoteria(aposta.loteria)
      
      if (!loteriasMap.has(loteriaNome)) {
        loteriasMap.set(loteriaNome, {
          count: 0,
          exemplos: [],
        })
      }

      const entry = loteriasMap.get(loteriaNome)!
      entry.count++
      
      if (entry.exemplos.length < 3) {
        entry.exemplos.push({
          id: aposta.id,
          loteria: loteriaNome,
          prizes: prizes.slice(0, 7),
        })
      }
    }

    console.log('📋 LOTERIAS ENCONTRADAS:')
    console.log('='.repeat(80))
    
    const loteriasOrdenadas = Array.from(loteriasMap.entries())
      .sort((a, b) => b[1].count - a[1].count)

    for (const [loteria, data] of loteriasOrdenadas) {
      const loteriaLower = loteria.toLowerCase()
      const isLotep = loteriaLower.includes('lotep') || 
                     loteriaLower.includes('paraiba') || 
                     loteriaLower.includes('paraíba') ||
                     loteriaLower === 'pb'
      const isLotece = loteriaLower.includes('lotece') || 
                      loteriaLower.includes('ceara') || 
                      loteriaLower.includes('ceará') ||
                      loteriaLower === 'ce' ||
                      loteriaLower === 'lce'
      
      const flag = isLotep ? '🎯 LOTEP' : isLotece ? '🎯 LOTECE' : ''
      
      console.log(`\n${flag} ${loteria} (${data.count} apostas)`)
      
      // Mostrar exemplos
      for (const exemplo of data.exemplos) {
        const prizesStr = exemplo.prizes 
          ? exemplo.prizes.map((p: number) => String(p).padStart(4, '0')).join(', ')
          : 'Sem prêmios'
        console.log(`   Aposta #${exemplo.id}: [${prizesStr}]`)
      }
    }

    // Verificar especificamente por LOTEP/LOTECE
    console.log('\n' + '='.repeat(80))
    console.log('🔎 VERIFICAÇÃO ESPECÍFICA LOTEP/LOTECE')
    console.log('='.repeat(80))

    let lotepEncontradas = 0
    let loteceEncontradas = 0
    let lotepComPremios = 0
    let loteceComPremios = 0

    for (const aposta of apostas) {
      const loteria = (aposta.loteria || '').toLowerCase()
      const detalhes = aposta.detalhes as any
      const resultadoOficial = detalhes?.resultadoOficial
      const prizes = resultadoOficial?.prizes || []

      if (loteria.includes('lotep') || loteria.includes('paraiba') || loteria.includes('paraíba') || loteria === 'pb') {
        lotepEncontradas++
        if (prizes.length >= 5) {
          lotepComPremios++
          console.log(`\n🎯 LOTEP encontrada: Aposta #${aposta.id}`)
          console.log(`   Loteria: ${aposta.loteria}`)
          console.log(`   Prêmios: ${prizes.slice(0, 7).map((p: any) => String(p).padStart(4, '0')).join(', ')}`)
        }
      }

      if (loteria.includes('lotece') || loteria.includes('ceara') || loteria.includes('ceará') || loteria === 'ce' || loteria === 'lce') {
        loteceEncontradas++
        if (prizes.length >= 5) {
          loteceComPremios++
          console.log(`\n🎯 LOTECE encontrada: Aposta #${aposta.id}`)
          console.log(`   Loteria: ${aposta.loteria}`)
          console.log(`   Prêmios: ${prizes.slice(0, 7).map((p: any) => String(p).padStart(4, '0')).join(', ')}`)
        }
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMO LOTEP/LOTECE')
    console.log('='.repeat(80))
    console.log(`LOTEP encontradas: ${lotepEncontradas}`)
    console.log(`LOTEP com 5+ prêmios: ${lotepComPremios}`)
    console.log(`LOTECE encontradas: ${loteceEncontradas}`)
    console.log(`LOTECE com 5+ prêmios: ${loteceComPremios}`)
    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ Erro ao diagnosticar:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar script
diagnosticarLoterias()
  .then(() => {
    console.log('\n✅ Diagnóstico concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
