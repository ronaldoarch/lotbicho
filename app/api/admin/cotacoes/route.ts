import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cotacoes = await prisma.cotacao.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ cotacoes, total: cotacoes.length })
  } catch (error) {
    console.error('Erro ao buscar cotações:', error)
    return NextResponse.json({ error: 'Erro ao buscar cotações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newCotacao = await prisma.cotacao.create({
      data: {
        name: body.name || null,
        value: body.value || null,
        modalidadeId: body.modalidadeId || null,
        extracaoId: body.extracaoId || null,
        promocaoId: body.promocaoId || null,
        isSpecial: body.isSpecial || false,
        active: body.active !== undefined ? body.active : true,
      },
    })
    return NextResponse.json({ cotacao: newCotacao, message: 'Cotação criada com sucesso' })
  } catch (error) {
    console.error('Erro ao criar cotação:', error)
    return NextResponse.json({ error: 'Erro ao criar cotação' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updatedCotacao = await prisma.cotacao.update({
      where: { id: body.id },
      data: {
        name: body.name,
        value: body.value,
        modalidadeId: body.modalidadeId,
        extracaoId: body.extracaoId,
        promocaoId: body.promocaoId,
        isSpecial: body.isSpecial,
        active: body.active,
      },
    })
    return NextResponse.json({ cotacao: updatedCotacao, message: 'Cotação atualizada com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar cotação:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cotação' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.cotacao.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Cotação deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar cotação:', error)
    return NextResponse.json({ error: 'Erro ao deletar cotação' }, { status: 500 })
  }
}
