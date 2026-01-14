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
    
    // Validar telefone - deve ter pelo menos 10 dígitos
    const phoneClean = (user.telefone || '').replace(/\D/g, '')
    if (phoneClean.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido. Por favor, atualize seu telefone no perfil.' },
        { status: 400 }
      )
    }

    // Validar CPF - deve ter 11 dígitos
    const documentClean = document.replace(/\D/g, '')
    if (documentClean.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido. Digite um CPF válido com 11 dígitos.' },
        { status: 400 }
      )
    }

    const pixPayload = {
      name: user.nome.trim(),
      email: user.email.trim().toLowerCase(),
      phone: phoneClean,
      description: `Depósito - ${user.nome}`.substring(0, 255), // Limitar tamanho
      document: documentClean,
      amount: Number(valor.toFixed(2)), // Garantir 2 casas decimais
      platform: platformId,
      reference: `deposito_${user.id}_${Date.now()}`.substring(0, 50), // Max 50 caracteres
      extra: JSON.stringify({ userId: user.id }).substring(0, 255), // Max 255 caracteres
    }

    // Log do payload (sem dados sensíveis) para debug
    console.log('Criando PIX cashin:', {
      name: pixPayload.name,
      email: pixPayload.email,
      phone: pixPayload.phone ? '***' : 'missing',
      document: pixPayload.document ? '***' : 'missing',
      amount: pixPayload.amount,
      platform: pixPayload.platform ? '***' : 'missing',
      reference: pixPayload.reference,
    })

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
    
    // Tratar erros específicos da API Receba Online
    const errorMessage = error.message || ''
    
    // Erro 422 - Validação
    if (errorMessage.includes('422')) {
      try {
        const errorBody = JSON.parse(errorMessage.match(/\{.*\}/)?.[0] || '{}')
        const errorCode = errorBody.error
        const apiMessage = errorBody.message || errorBody.error || 'Erro de validação'
        
        // Mapear códigos de erro conhecidos para mensagens amigáveis
        const errorMessages: Record<number, string> = {
          10: 'Plataforma inválida. Verifique a configuração da plataforma.',
          11: 'Configuração de PIX não encontrada. Entre em contato com o suporte.',
          13: 'Transação para CNPJ não permitida. Use CPF.',
          14: 'Transação não permitida para menores de idade.',
          15: 'Documento na lista de bloqueio.',
          17: 'Documento inválido.',
          18: 'Status do CNPJ inválido.',
          23: 'Valor mínimo não atingido.',
          25: 'Transação duplicada. Aguarde alguns segundos e tente novamente.',
          26: 'Chave PIX inválida.',
          27: 'Documento inválido.',
          28: 'Chave PIX não pertence ao documento informado.',
          29: 'Não autorizado a acessar este recurso.',
          30: 'Tipo de chave PIX inválido.',
          34: 'Operação não permitida. Verifique se sua conta está habilitada para depósitos PIX ou entre em contato com o suporte técnico.',
        }
        
        const friendlyMessage = errorMessages[errorCode] || apiMessage
        
        return NextResponse.json(
          { error: friendlyMessage, errorCode, originalMessage: apiMessage },
          { status: 422 }
        )
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Erro ao processar resposta da API. Tente novamente ou entre em contato com o suporte.' },
          { status: 422 }
        )
      }
    }
    
    // Erro 401 - Não autenticado
    if (errorMessage.includes('401') || errorMessage.includes('Unauthenticated')) {
      return NextResponse.json(
        { error: 'Erro de autenticação. Verifique se a API key está configurada corretamente.' },
        { status: 401 }
      )
    }
    
    // Erro 404 - Endpoint não encontrado
    if (errorMessage.includes('404')) {
      return NextResponse.json(
        { error: 'Endpoint não encontrado. Verifique a configuração da API.' },
        { status: 404 }
      )
    }
    
    // Erro genérico
    return NextResponse.json(
      { error: errorMessage || 'Erro ao criar pagamento PIX. Tente novamente ou entre em contato com o suporte.' },
      { status: 500 }
    )
  }
}
