import { NextRequest, NextResponse } from 'next/server'
import { getAllStories, addStory, updateStory, deleteStory } from '@/lib/stories-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stories = getAllStories()
  return NextResponse.json({ stories, total: stories.length })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newStory = addStory(body)
    return NextResponse.json({ story: newStory, message: 'Story criado com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar story' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = updateStory(body.id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Story não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ story: updated, message: 'Story atualizado com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar story' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    const deleted = deleteStory(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Story não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Story deletado com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar story' }, { status: 500 })
  }
}
