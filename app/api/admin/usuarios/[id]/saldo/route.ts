import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Endpoint para adicionar saldo a um usuário
 * POST /api/admin/usuarios/[id]/saldo
 * Body: { valor: number, descricao?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'ID do usuário inválido' }, { status: 400 })
    }

    const { valor, descricao } = await req.json()

    if (!valor || isNaN(valor) || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // Verificar se o usuário existe
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, email: true, saldo: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Adicionar saldo e criar transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar saldo
      const updatedUser = await tx.usuario.update({
        where: { id: userId },
        data: {
          saldo: { increment: valor },
        },
        select: { id: true, nome: true, saldo: true },
      })

      // Criar registro de transação
      const transacao = await tx.transacao.create({
        data: {
          usuarioId: userId,
          tipo: 'deposito',
          status: 'pago',
          valor,
          descricao: descricao || `Depósito manual via admin`,
        },
      })

      return { updatedUser, transacao }
    })

    return NextResponse.json({
      success: true,
      message: `Saldo adicionado com sucesso`,
      usuario: {
        id: result.updatedUser.id,
        nome: result.updatedUser.nome,
        saldoAnterior: user.saldo,
        saldoNovo: result.updatedUser.saldo,
        valorAdicionado: valor,
      },
      transacao: {
        id: result.transacao.id,
        valor: result.transacao.valor,
        descricao: result.transacao.descricao,
      },
    })
  } catch (error: any) {
    console.error('Erro ao adicionar saldo:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao adicionar saldo' },
      { status: 500 }
    )
  }
}
