import { NextResponse } from 'next/server'
import { getModalidades } from '@/lib/modalidades-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const modalidades = await getModalidades()
    return NextResponse.json({ modalidades, total: modalidades.length })
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error)
    return NextResponse.json({ error: 'Erro ao buscar modalidades' }, { status: 500 })
  }
}
