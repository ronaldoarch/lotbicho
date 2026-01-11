import { NextResponse } from 'next/server'
import { getBanners } from '@/lib/banners-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const banners = getBanners()
    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Erro ao buscar banners:', error)
    return NextResponse.json({ banners: [] }, { status: 500 })
  }
}
