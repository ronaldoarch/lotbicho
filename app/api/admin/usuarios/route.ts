import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        saldo: true,
        bonus: true,
        bonusBloqueado: true,
        ativo: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ usuarios, total: usuarios.length })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json({ usuarios: [], total: 0, error: 'Erro ao listar usuários' }, { status: 500 })
  }
}
