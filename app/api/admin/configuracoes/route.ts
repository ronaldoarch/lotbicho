import { NextRequest, NextResponse } from 'next/server'
import { getConfiguracoes, updateConfiguracoes } from '@/lib/configuracoes-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const configuracoes = await getConfiguracoes()
  return NextResponse.json({ configuracoes })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const configuracoes = await updateConfiguracoes(body)
    return NextResponse.json({ configuracoes, message: 'Configurações atualizadas com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 })
  }
}
