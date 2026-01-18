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

    if (modalidadeId) {
      where.modalidadeId = parseInt(modalidadeId)
    }

    if (extracaoId) {
      where.extracaoId = parseInt(extracaoId)
    }

    if (promocaoId) {
      where.promocaoId = parseInt(promocaoId)
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
