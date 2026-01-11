import { NextResponse } from 'next/server'
import { getPromocoes } from '@/lib/promocoes-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const promocoes = getPromocoes()
    return NextResponse.json({ promocoes })
  } catch (error) {
    console.error('Erro ao buscar promoções:', error)
    return NextResponse.json({ promocoes: [] }, { status: 500 })
  }
}
