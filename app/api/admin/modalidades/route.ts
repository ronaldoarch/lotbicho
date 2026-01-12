import { NextRequest, NextResponse } from 'next/server'
import { getModalidades, updateModalidade } from '@/lib/modalidades-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const modalidades = await getModalidades()
  return NextResponse.json({ modalidades, total: modalidades.length })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = await updateModalidade(body.id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Modalidade não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ modalidade: updated, message: 'Modalidade atualizada com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar modalidade' }, { status: 500 })
  }
}
