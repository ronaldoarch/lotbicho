/**
 * Script para corrigir prêmios 6º e 7º que foram salvos incorretamente
 * 
 * Este script:
 * 1. Busca todas as apostas liquidadas com resultadoOficial
 * 2. Identifica apostas de LOTEP e LOTECE
 * 3. Recalcula os prêmios 6º e 7º corretamente
 * 4. Recalcula a conferência e prêmio total se necessário
 * 5. Ajusta saldo do usuário se o prêmio mudou
 * 6. Atualiza os detalhes da aposta com os valores corretos
 */

import { PrismaClient } from '@prisma/client'
import { 
  calcular6Premio, 
  calcular7Premio, 
  milharParaGrupo,
  conferirPalpite,
  calcularValorPorPalpite,
  type ModalityType,
  type InstantResult
} from '../lib/bet-rules-engine'
import { parsePosition } from '../lib/position-parser'
import { ANIMALS } from '../data/animals'

const prisma = new PrismaClient()

async function corrigirPremios() {
  console.log('🔧 Iniciando correção de prêmios 6º e 7º...\n')

  try {
    // Buscar todas as apostas (vamos filtrar por resultadoOficial depois)
    const apostas = await prisma.aposta.findMany({
      select: {
        id: true,
        detalhes: true,
        loteria: true,
        usuarioId: true,
        status: true,
        modalidade: true,
        retornoPrevisto: true,
      },
    })

    console.log(`📊 Total de apostas encontradas: ${apostas.length}`)

    let corrigidas = 0
    let semResultado = 0
    let semPremios = 0
    let naoLotepLotece = 0
    let premiosRecalculados = 0
    let saldosAjustados = 0

    for (const aposta of apostas) {
      const detalhes = aposta.detalhes as any

      // Verificar se tem resultadoOficial
      if (!detalhes?.resultadoOficial) {
        semResultado++
        continue
      }

      const resultadoOficial = detalhes.resultadoOficial
      const prizes = resultadoOficial.prizes

      // Verificar se tem prêmios
      if (!prizes || !Array.isArray(prizes) || prizes.length === 0) {
        semPremios++
        continue
      }

      // Verificar se é LOTEP ou LOTECE
      const loteriaNome = aposta.loteria?.toLowerCase() || ''
      const isLotepOuLotece = loteriaNome.includes('lotep') || loteriaNome.includes('lotece')

      if (!isLotepOuLotece) {
        naoLotepLotece++
        continue
      }

      // Precisamos ter pelo menos 5 prêmios para calcular
      if (prizes.length < 5) {
        continue
      }

      // Pegar os 5 primeiros prêmios
      const cincoPrimeiros = prizes.slice(0, 5).map((p: any) => {
        if (typeof p === 'number') return p
        if (typeof p === 'string') return parseInt(p.replace(/\D/g, '').padStart(4, '0'), 10)
        return 0
      }).filter((p: number) => p > 0)

      if (cincoPrimeiros.length < 5) {
        continue
      }

      // Recalcular 6º e 7º prêmio
      const premio6Correto = calcular6Premio(cincoPrimeiros)
      const premio7Correto = calcular7Premio(cincoPrimeiros)

      // Verificar se os valores atuais estão incorretos
      const premio6Atual = prizes[5]
      const premio7Atual = prizes[6]

      const premio6AtualNum = typeof premio6Atual === 'number' 
        ? premio6Atual 
        : parseInt(String(premio6Atual).replace(/\D/g, ''), 10)

      const premio7AtualNum = typeof premio7Atual === 'number' 
        ? premio7Atual 
        : parseInt(String(premio7Atual).replace(/\D/g, ''), 10)

      // Verificar se precisa corrigir
      const precisaCorrigir6 = premio6AtualNum !== premio6Correto
      const precisaCorrigir7 = premio7AtualNum !== premio7Correto

      if (precisaCorrigir6 || precisaCorrigir7) {
        console.log(`\n🔧 Corrigindo aposta ${aposta.id} (${aposta.loteria})`)
        console.log(`   Prêmios atuais: 6º=${premio6AtualNum}, 7º=${premio7AtualNum}`)
        console.log(`   Prêmios corretos: 6º=${premio6Correto}, 7º=${premio7Correto}`)

        // Criar novo array de prêmios com valores corrigidos
        const novosPremios = [...prizes.slice(0, 5)] // Manter apenas os 5 primeiros
        novosPremios.push(premio6Correto) // Adicionar 6º calculado
        novosPremios.push(premio7Correto) // Adicionar 7º calculado
        // Limitar a 7 prêmios
        const premiosLimitados = novosPremios.slice(0, 7)

        // Recalcular grupos
        const novosGroups = premiosLimitados.map((milhar: number) => milharParaGrupo(milhar))

        // Criar novo resultado oficial
        const novoResultadoOficial: InstantResult = {
          prizes: premiosLimitados,
          groups: novosGroups,
        }

        // Buscar dados do betData para recalcular prêmio se necessário
        const betData = detalhes?.betData
        let novoPremioTotal = detalhes?.premioTotal || 0
        let precisaRecalcularPremio = false

        if (betData) {
          // Mapeamento de modalidades
          const modalityMap: Record<string, ModalityType> = {
            'Grupo': 'GRUPO',
            'Dupla de Grupo': 'DUPLA_GRUPO',
            'Terno de Grupo': 'TERNO_GRUPO',
            'Quadra de Grupo': 'QUADRA_GRUPO',
            'Quina de Grupo': 'QUINA_GRUPO',
            'Dezena': 'DEZENA',
            'Centena': 'CENTENA',
            'Milhar': 'MILHAR',
            'Dezena Invertida': 'DEZENA_INVERTIDA',
            'Centena Invertida': 'CENTENA_INVERTIDA',
            'Milhar Invertida': 'MILHAR_INVERTIDA',
            'Milhar/Centena': 'MILHAR_CENTENA',
            'Passe vai': 'PASSE',
            'Passe vai e vem': 'PASSE_VAI_E_VEM',
          }

          const modalityName = betData.modalityName || aposta.modalidade || ''
          const modalityType = modalityMap[modalityName] || 'GRUPO'

          const { pos_from, pos_to } = parsePosition(betData.position)
          
          const numberBets = betData.numberBets || []
          const animalBets = betData.animalBets || []
          const qtdPalpites = animalBets.length || numberBets.length || 0

          if (qtdPalpites > 0) {
            const valorPorPalpite = calcularValorPorPalpite(
              betData.amount,
              qtdPalpites,
              betData.divisionType || 'all'
            )

            // Recalcular prêmio total com o novo resultado
            let premioTotalRecalculado = 0

            if (numberBets.length > 0) {
              // Modalidades numéricas
              for (const numero of numberBets) {
                const conferencia = conferirPalpite(
                  novoResultadoOficial,
                  modalityType,
                  { numero },
                  pos_from,
                  pos_to,
                  valorPorPalpite,
                  betData.divisionType || 'all',
                  modalityName
                )
                premioTotalRecalculado += conferencia.totalPrize
              }
            } else if (animalBets.length > 0) {
              // Modalidades de grupo
              for (const animalBet of animalBets) {
                const grupos = animalBet.map((animalId: number) => {
                  const animal = ANIMALS.find((a) => a.id === animalId)
                  return animal?.group || 0
                }).filter((g: number) => g > 0)

                if (grupos.length > 0) {
                  const conferencia = conferirPalpite(
                    novoResultadoOficial,
                    modalityType,
                    { grupos },
                    pos_from,
                    pos_to,
                    valorPorPalpite,
                    betData.divisionType || 'all',
                    modalityName
                  )
                  premioTotalRecalculado += conferencia.totalPrize
                }
              }
            }

            novoPremioTotal = premioTotalRecalculado
            precisaRecalcularPremio = Math.abs(novoPremioTotal - (detalhes?.premioTotal || 0)) > 0.01

            if (precisaRecalcularPremio) {
              console.log(`   💰 Prêmio atual: R$ ${(detalhes?.premioTotal || 0).toFixed(2)}`)
              console.log(`   💰 Prêmio recalculado: R$ ${novoPremioTotal.toFixed(2)}`)
            }
          }
        }

        // Atualizar detalhes
        const novosDetalhes = {
          ...detalhes,
          resultadoOficial: novoResultadoOficial,
          premioTotal: novoPremioTotal,
        }

        // Atualizar aposta e ajustar saldo se necessário
        await prisma.$transaction(async (tx) => {
          const premioAnterior = detalhes?.premioTotal || 0
          const diferencaPremio = novoPremioTotal - premioAnterior

          // Atualizar aposta
          await tx.aposta.update({
            where: { id: aposta.id },
            data: {
              detalhes: novosDetalhes,
              retornoPrevisto: novoPremioTotal,
              // Atualizar status se necessário
              status: novoPremioTotal > 0 ? 'liquidado' : 'perdida',
            },
          })

          // Ajustar saldo do usuário se o prêmio mudou
          if (precisaRecalcularPremio && Math.abs(diferencaPremio) > 0.01) {
            const usuario = await tx.usuario.findUnique({
              where: { id: aposta.usuarioId },
              select: { saldo: true },
            })

            if (usuario) {
              const novoSaldo = usuario.saldo + diferencaPremio

              await tx.usuario.update({
                where: { id: aposta.usuarioId },
                data: {
                  saldo: novoSaldo,
                },
              })

              console.log(`   💰 Saldo ajustado: ${diferencaPremio > 0 ? '+' : ''}R$ ${diferencaPremio.toFixed(2)}`)
              console.log(`   💰 Novo saldo: R$ ${novoSaldo.toFixed(2)}`)
              saldosAjustados++
            }
          }
        })

        if (precisaRecalcularPremio) {
          premiosRecalculados++
        }

        console.log(`   ✅ Aposta ${aposta.id} corrigida com sucesso!`)
        corrigidas++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO DA CORREÇÃO')
    console.log('='.repeat(50))
    console.log(`Total de apostas processadas: ${apostas.length}`)
    console.log(`Apostas corrigidas: ${corrigidas}`)
    console.log(`Prêmios recalculados: ${premiosRecalculados}`)
    console.log(`Saldos ajustados: ${saldosAjustados}`)
    console.log(`Sem resultado oficial: ${semResultado}`)
    console.log(`Sem prêmios: ${semPremios}`)
    console.log(`Não são LOTEP/LOTECE: ${naoLotepLotece}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ Erro ao corrigir prêmios:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar script
corrigirPremios()
  .then(() => {
    console.log('\n✅ Correção concluída com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
