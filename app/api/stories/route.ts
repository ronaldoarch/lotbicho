import { NextResponse } from 'next/server'
import { getStories } from '@/lib/stories-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stories = await getStories()
    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Erro ao buscar stories:', error)
    return NextResponse.json({ stories: [] }, { status: 500 })
  }
}
