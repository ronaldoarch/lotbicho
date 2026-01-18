import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cotacoes/especiais
 * 
 * Retorna cotações especiais (com foguinho) filtradas por modalidade, extração ou promoção
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const modalidadeId = searchParams.get('modalidadeId')
    const extracaoId = searchParams.get('extracaoId')
    const promocaoId = searchParams.get('promocaoId')

    const where: any = {
      active: true,
      isSpecial: true,
    }

    // Se modalidadeId fornecido, buscar por ID ou null (para cotações gerais)
    if (modalidadeId) {
      const modalidadeIdNum = parseInt(modalidadeId)
      where.OR = [
        { modalidadeId: modalidadeIdNum },
        { modalidadeId: null }, // Cotações sem modalidade específica (aplicam a todas)
      ]
    } else {
      // Se não especificou modalidade, buscar todas as cotações especiais
      // (pode ter modalidadeId ou não)
    }

    if (extracaoId) {
      const extracaoIdNum = parseInt(extracaoId)
      if (where.OR) {
        // Se já tem OR, adicionar condição de extração
        where.AND = [
          { OR: where.OR },
          {
            OR: [
              { extracaoId: extracaoIdNum },
              { extracaoId: null }, // Cotações sem extração específica
            ],
          },
        ]
        delete where.OR
      } else {
        where.OR = [
          { extracaoId: extracaoIdNum },
          { extracaoId: null },
        ]
      }
    }

    if (promocaoId) {
      const promocaoIdNum = parseInt(promocaoId)
      if (where.AND) {
        where.AND.push({
          OR: [
            { promocaoId: promocaoIdNum },
            { promocaoId: null },
          ],
        })
      } else if (where.OR) {
        where.AND = [
          { OR: where.OR },
          {
            OR: [
              { promocaoId: promocaoIdNum },
              { promocaoId: null },
            ],
          },
        ]
        delete where.OR
      } else {
        where.OR = [
          { promocaoId: promocaoIdNum },
          { promocaoId: null },
        ]
      }
    }

    const cotacoes = await prisma.cotacao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ cotacoes })
  } catch (error) {
    console.error('Erro ao buscar cotações especiais:', error)
    return NextResponse.json({ error: 'Erro ao buscar cotações especiais' }, { status: 500 })
  }
}
