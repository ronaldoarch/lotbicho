import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  gerarResultadoInstantaneo,
  conferirPalpite,
  calcularValorPorPalpite,
  calcularValorTotalAposta,
  type ModalityType,
} from '@/lib/bet-rules-engine'
import { parsePosition } from '@/lib/position-parser'
import { ANIMALS } from '@/data/animals'

export async function GET() {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const apostas = await prisma.aposta.findMany({
      where: { usuarioId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, nome: user.nome },
      apostas,
      total: apostas.length,
    })
  } catch (error) {
    console.error('Erro ao buscar apostas', error)
    return NextResponse.json({ error: 'Erro ao carregar apostas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      concurso,
      loteria,
      estado,
      horario,
      dataConcurso,
      modalidade,
      aposta,
      valor,
      retornoPrevisto,
      status,
      detalhes,
      useBonus,
    } = body || {}

    if (!valor || Number.isNaN(Number(valor))) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    const valorDigitado = Number(valor)
    const useBonusFlag = Boolean(useBonus)
    const isInstant = detalhes && typeof detalhes === 'object' && 'betData' in detalhes && (detalhes as any).betData?.instant === true

    // Calcular valor total da aposta baseado na divisão
    let valorTotalAposta = valorDigitado
    if (detalhes && typeof detalhes === 'object' && 'betData' in detalhes) {
      const betData = (detalhes as any).betData as {
        animalBets?: number[][]
        numberBets?: string[]
        divisionType?: 'all' | 'each'
      }
      const qtdPalpites = betData.animalBets?.length || betData.numberBets?.length || 0
      const divisionType = betData.divisionType || 'all'
      valorTotalAposta = calcularValorTotalAposta(valorDigitado, qtdPalpites, divisionType)
    }

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({ where: { id: user.id } })
      if (!usuario) throw new Error('Usuário não encontrado')

      const bonusDisponivel = useBonusFlag && usuario.bonus > 0 ? usuario.bonus : 0
      const saldoDisponivel = usuario.saldo
      const totalDisponivel = saldoDisponivel + bonusDisponivel

      if (valorTotalAposta > totalDisponivel) {
        throw new Error('Saldo insuficiente')
      }

      // Debita primeiro do saldo, depois do bônus (se permitido)
      let debitarBonus = 0
      let debitarSaldo = Math.min(saldoDisponivel, valorTotalAposta)
      const restante = valorTotalAposta - debitarSaldo
      if (restante > 0) {
        if (bonusDisponivel <= 0) throw new Error('Saldo insuficiente (bônus indisponível)')
        debitarBonus = restante
      }

      let premioTotal = 0
      let resultadoInstantaneo = null

      // Processar aposta instantânea
      if (isInstant && detalhes && typeof detalhes === 'object' && 'betData' in detalhes) {
        const betData = (detalhes as any).betData as {
          modality: string | null
          modalityName?: string | null
          animalBets: number[][]
          position: string | null
          amount: number
          divisionType: 'all' | 'each'
        }

        // Mapear nome da modalidade para tipo
        const modalityMap: Record<string, ModalityType> = {
          'Grupo': 'GRUPO',
          'Dupla de Grupo': 'DUPLA_GRUPO',
          'Terno de Grupo': 'TERNO_GRUPO',
          'Quadra de Grupo': 'QUADRA_GRUPO',
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

        const modalityType = modalityMap[betData.modalityName || ''] || 'GRUPO'

        // Parsear posição usando função helper
        const { pos_from, pos_to } = parsePosition(betData.position)

        // Gerar resultado instantâneo
        resultadoInstantaneo = gerarResultadoInstantaneo(Math.max(pos_to, 7))

        // Calcular valor por palpite
        const numberBets = (detalhes as any).numberBets || []
        const qtdPalpites = betData.animalBets.length || numberBets.length || 0
        const valorPorPalpite = calcularValorPorPalpite(
          betData.amount,
          qtdPalpites,
          betData.divisionType
        )

        // Conferir cada palpite
        if (numberBets.length > 0) {
          // Modalidades numéricas
          for (const numero of numberBets) {
            const palpiteData: { numero: string } = { numero }
            
            const conferencia = conferirPalpite(
              resultadoInstantaneo,
              modalityType,
              palpiteData,
              pos_from,
              pos_to,
              valorPorPalpite,
              betData.divisionType,
              betData.modalityName || undefined
            )

            premioTotal += conferencia.totalPrize
          }
        } else {
          // Modalidades de grupo
          for (const animalBet of betData.animalBets) {
            const grupos = animalBet.map((animalId) => {
              // Encontrar o grupo do animal
              const animal = ANIMALS.find((a) => a.id === animalId)
              if (!animal) {
                throw new Error(`Animal não encontrado: ${animalId}`)
              }
              return animal.group
            })

            const palpiteData: { grupos: number[] } = { grupos }

            const conferencia = conferirPalpite(
              resultadoInstantaneo,
              modalityType,
              palpiteData,
              pos_from,
              pos_to,
              valorPorPalpite,
              betData.divisionType,
              betData.modalityName || undefined
            )

            premioTotal += conferencia.totalPrize
          }
        }

        // Atualizar saldo: debita aposta e credita prêmio
        const saldoFinal = usuario.saldo - debitarSaldo + premioTotal
        const bonusFinal = usuario.bonus - debitarBonus

        await tx.usuario.update({
          where: { id: user.id },
          data: {
            saldo: saldoFinal,
            bonus: bonusFinal,
            rolloverAtual: usuario.rolloverAtual + valorTotalAposta,
          },
        })
      } else {
        // Aposta normal (não instantânea)
        await tx.usuario.update({
          where: { id: user.id },
          data: {
            saldo: usuario.saldo - debitarSaldo,
            bonus: usuario.bonus - debitarBonus,
            rolloverAtual: usuario.rolloverAtual + valorTotalAposta,
          },
        })
      }

      const created = await tx.aposta.create({
        data: {
          usuarioId: user.id,
          concurso: concurso || null,
          loteria: loteria || null,
          estado: estado || null,
          horario: horario || null,
          dataConcurso: dataConcurso ? new Date(dataConcurso) : null,
          modalidade: modalidade || null,
          aposta: aposta || null,
          valor: valorTotalAposta,
          retornoPrevisto: premioTotal > 0 ? premioTotal : (retornoPrevisto ? Number(retornoPrevisto) : 0),
          status: isInstant ? 'liquidado' : (status || 'pendente'),
          detalhes: {
            ...(detalhes && typeof detalhes === 'object' ? detalhes : {}),
            resultadoInstantaneo: resultadoInstantaneo,
            premioTotal,
            valorDigitado,
            valorTotalAposta,
          },
        },
      })

      return { ...created, resultadoInstantaneo, premioTotal }
    })

    return NextResponse.json({ aposta: result }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar aposta', error)
    const message = (error as Error).message || 'Erro ao criar aposta'
    const statusCode = message.includes('Saldo insuficiente') ? 400 : 500
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
