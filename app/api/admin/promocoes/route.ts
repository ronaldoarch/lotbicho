import { NextRequest, NextResponse } from 'next/server'
import { getAllPromocoes, addPromocao, updatePromocao, deletePromocao } from '@/lib/promocoes-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const promocoes = getAllPromocoes()
  return NextResponse.json({ promocoes, total: promocoes.length })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newPromocao = addPromocao(body)
    return NextResponse.json({ promocao: newPromocao, message: 'Promoção criada com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar promoção' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = updatePromocao(body.id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ promocao: updated, message: 'Promoção atualizada com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar promoção' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    const deleted = deletePromocao(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Promoção deletada com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar promoção' }, { status: 500 })
  }
}
