import { NextResponse } from 'next/server'
import { getModalidades } from '@/lib/modalidades-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Busca as modalidades do store compartilhado e filtra apenas as ativas
    const allModalidades = await getModalidades()
    const activeModalidades = allModalidades.filter((m) => m.active !== false)
    return NextResponse.json({ modalidades: activeModalidades })
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error)
    return NextResponse.json({ modalidades: [] }, { status: 500 })
  }
}
