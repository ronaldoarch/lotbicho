import { NextRequest, NextResponse } from 'next/server'
import {
  getTemas,
  getTema,
  getTemaAtivo,
  createTema,
  updateTema,
  deleteTema,
  setTemaAtivo,
} from '@/lib/temas-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ativo = searchParams.get('ativo')

    if (id) {
      const tema = await getTema(id)
      if (!tema) {
        return NextResponse.json({ error: 'Tema não encontrado' }, { status: 404 })
      }
      return NextResponse.json({ tema })
    }

    if (ativo === 'true') {
      const tema = await getTemaAtivo()
      return NextResponse.json({ tema })
    }

    const temas = await getTemas()
    return NextResponse.json({ temas })
  } catch (error) {
    console.error('Erro ao buscar temas:', error)
    return NextResponse.json({ error: 'Erro ao buscar temas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cores } = body

    if (!nome || !cores) {
      return NextResponse.json({ error: 'Nome e cores são obrigatórios' }, { status: 400 })
    }

    const novoTema = await createTema({
      nome,
      cores,
      ativo: false,
    })

    return NextResponse.json({ tema: novoTema }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar tema:', error)
    return NextResponse.json({ error: 'Erro ao criar tema' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const temaAtualizado = await updateTema(id, updates)
    if (!temaAtualizado) {
      return NextResponse.json({ error: 'Tema não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ tema: temaAtualizado })
  } catch (error) {
    console.error('Erro ao atualizar tema:', error)
    return NextResponse.json({ error: 'Erro ao atualizar tema' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    await deleteTema(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar tema:', error)
    return NextResponse.json({ error: 'Erro ao deletar tema' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, acao } = body

    if (!id || !acao) {
      return NextResponse.json({ error: 'ID e ação são obrigatórios' }, { status: 400 })
    }

    if (acao === 'ativar') {
      const tema = await setTemaAtivo(id)
      if (!tema) {
        return NextResponse.json({ error: 'Tema não encontrado' }, { status: 404 })
      }
      return NextResponse.json({ tema })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao ativar tema:', error)
    return NextResponse.json({ error: 'Erro ao ativar tema' }, { status: 500 })
  }
}
