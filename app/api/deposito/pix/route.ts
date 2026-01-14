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

    const { valor, document } = await req.json()

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // CPF é obrigatório pela API do Receba Online
    if (!document) {
      return NextResponse.json({ error: 'CPF é obrigatório para realizar depósito' }, { status: 400 })
    }

    // Platform ID é obrigatório - deve estar nas variáveis de ambiente
    const platformId = process.env.RECEBA_PLATFORM_ID
    if (!platformId) {
      console.error('RECEBA_PLATFORM_ID não configurado nas variáveis de ambiente')
      return NextResponse.json(
        { error: 'Configuração da plataforma não encontrada. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    // API Key é obrigatória - deve estar nas variáveis de ambiente
    const apiKey = process.env.RECEBA_API_KEY
    if (!apiKey) {
      console.error('RECEBA_API_KEY não configurado nas variáveis de ambiente')
      return NextResponse.json(
        { error: 'Configuração da API não encontrada. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    // Criar pagamento PIX via Receba Online
    // Documentação: https://docs.receba.online/
    // Endpoint: POST /api/v1/transaction/pix/cashin
    const pixPayload = {
      name: user.nome,
      email: user.email,
      phone: user.telefone || '00000000000', // Telefone obrigatório
      description: `Depósito - ${user.nome}`,
      document: document.replace(/\D/g, ''), // Remove formatação do CPF
      amount: Number(valor), // Valor com ponto como separador decimal
      platform: platformId,
      reference: `deposito_${user.id}_${Date.now()}`, // Identificador único
      extra: JSON.stringify({ userId: user.id }), // Campo adicional para webhook
    }

    // Criar pagamento PIX via Receba Online
    // Passar a API key explicitamente para garantir que está sendo usada
    const pixResponse = await recebaCreatePix({ apiKey }, pixPayload)

    // A resposta da API retorna: { transaction: [{ qr_code, qr_code_image, id, status, ... }] }
    const transaction = pixResponse.transaction?.[0]

    if (!transaction) {
      console.error('Resposta do Receba Online:', pixResponse)
      return NextResponse.json({ error: 'Resposta inválida da API' }, { status: 500 })
    }

    const qrCodeText = transaction.qr_code
    const qrCodeImage = transaction.qr_code_image // Base64 da imagem
    const transactionId = transaction.id

    if (!qrCodeText) {
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
        referenciaExterna: transactionId,
        descricao: `Depósito PIX - Aguardando pagamento`,
      },
    })

    return NextResponse.json({
      qrCode: qrCodeImage, // Imagem base64 do QR code
      qrCodeText, // Texto do QR code para copiar e colar
      transactionId,
      valor,
      status: transaction.status,
      // A API não retorna expiresAt, mas podemos usar uma estimativa padrão
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    })
  } catch (error: any) {
    console.error('Erro ao criar pagamento PIX:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pagamento PIX' },
      { status: 500 }
    )
  }
}
