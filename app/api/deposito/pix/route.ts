import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recebaCreatePix } from '@/lib/receba-client'

export const dynamic = 'force-dynamic'

/**
 * Cria um pagamento PIX via Receba Online e retorna o QR code
 */
export async function POST(req: NextRequest) {
  try {
    const session = cookies().get('lotbicho_session')?.value
    const payload = parseSessionToken(session)

    if (!payload) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { id: true, nome: true, email: true, telefone: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { valor } = await req.json()

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // Criar pagamento PIX via Receba Online
    // Ajuste o payload conforme a documentação oficial do Receba Online
    const pixPayload = {
      amount: valor,
      description: `Depósito - ${user.nome}`,
      customer: {
        name: user.nome,
        email: user.email,
        phone: user.telefone || undefined,
      },
      externalId: `deposito_${user.id}_${Date.now()}`,
      // Webhook URL para notificações de pagamento
      webhookUrl: `${process.env.COOLIFY_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/receba`,
      metadata: {
        userId: user.id,
        email: user.email,
      },
    }

    const pixResponse = await recebaCreatePix({}, pixPayload)

    // A resposta do Receba Online deve conter o QR code e outros dados
    // Ajuste conforme a estrutura real da resposta da API
    const qrCode = pixResponse.qrCode || pixResponse.qrcode || pixResponse.pixQrCode
    const qrCodeText = pixResponse.qrCodeText || pixResponse.pixCopyPaste || pixResponse.emvqrcps
    const transactionId = pixResponse.id || pixResponse.transactionId || pixResponse.externalId

    if (!qrCode && !qrCodeText) {
      console.error('Resposta do Receba Online:', pixResponse)
      return NextResponse.json({ error: 'QR code não retornado pela API' }, { status: 500 })
    }

    // Criar registro da transação pendente
    await prisma.transacao.create({
      data: {
        usuarioId: user.id,
        tipo: 'deposito',
        status: 'pendente',
        valor,
        referenciaExterna: transactionId || pixPayload.externalId,
        descricao: `Depósito PIX - Aguardando pagamento`,
      },
    })

    return NextResponse.json({
      qrCode,
      qrCodeText,
      transactionId: transactionId || pixPayload.externalId,
      valor,
      expiresAt: pixResponse.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    })
  } catch (error: any) {
    console.error('Erro ao criar pagamento PIX:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pagamento PIX' },
      { status: 500 }
    )
  }
}
