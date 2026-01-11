import { NextRequest, NextResponse } from 'next/server'
import { getAllBanners, addBanner, updateBanner, deleteBanner } from '@/lib/banners-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const banners = getAllBanners()
  return NextResponse.json({ banners, total: banners.length })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newBanner = addBanner(body)
    return NextResponse.json({ banner: newBanner, message: 'Banner criado com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar banner' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = updateBanner(body.id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ banner: updated, message: 'Banner atualizado com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar banner' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    const deleted = deleteBanner(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Banner deletado com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar banner' }, { status: 500 })
  }
}
