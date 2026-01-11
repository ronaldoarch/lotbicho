import { NextResponse } from 'next/server'
import { getConfiguracoes } from '@/lib/configuracoes-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const configuracoes = getConfiguracoes()
    return NextResponse.json({ configuracoes })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ configuracoes: null }, { status: 500 })
  }
}
