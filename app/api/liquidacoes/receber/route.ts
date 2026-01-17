import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Endpoint para receber liquidações de bot externo
 * POST /api/liquidacoes/receber
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      aposta_id_externo,
      aposta_id_bot,
      status,
      valor_ganho,
      resultado,
      timestamp,
      detalhes,
    } = body

    // Validar campos obrigatórios
    if (!aposta_id_externo || !status) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Campos obrigatórios ausentes: aposta_id_externo e status são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Buscar aposta no banco pelo ID externo ou ID interno
    const apostaId = parseInt(aposta_id_externo, 10)
    if (isNaN(apostaId)) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'aposta_id_externo deve ser um número válido',
        },
        { status: 400 }
      )
    }

    const aposta = await prisma.aposta.findUnique({
      where: { id: apostaId },
      include: { usuario: true },
    })

    if (!aposta) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: `Aposta não encontrada: ${aposta_id_externo}`,
        },
        { status: 404 }
      )
    }

    // Verificar se já foi liquidada
    if (aposta.status === 'liquidado' || aposta.status === 'perdida') {
      console.log(`⚠️ Aposta ${aposta.id} já foi liquidada anteriormente (status: ${aposta.status})`)
      return NextResponse.json({
        sucesso: true,
        mensagem: 'Aposta já foi liquidada anteriormente',
        aposta_id: aposta.id,
        status_atual: aposta.status,
      })
    }

    const valorGanho = parseFloat(String(valor_ganho || 0))
    const statusFinal = status === 'ganhou' ? 'liquidado' : 'perdida'

    // Atualizar aposta e saldo do usuário em transação
    await prisma.$transaction(async (tx) => {
      // Atualizar aposta
      await tx.aposta.update({
        where: { id: aposta.id },
        data: {
          status: statusFinal,
          retornoPrevisto: valorGanho,
          detalhes: {
            ...((aposta.detalhes as any) || {}),
            resultadoOficial: resultado || {},
            premioTotal: valorGanho,
            liquidadoEm: timestamp || new Date().toISOString(),
            aposta_id_bot: aposta_id_bot || null,
            detalhes_bot: detalhes || {},
            liquidado_por: 'bot_externo',
          },
        },
      })

      // Se ganhou, creditar no saldo do usuário
      if (statusFinal === 'liquidado' && valorGanho > 0) {
        await tx.usuario.update({
          where: { id: aposta.usuarioId },
          data: {
            saldo: {
              increment: valorGanho,
            },
          },
        })

        // Criar transação de ganho
        await tx.transacao.create({
          data: {
            usuarioId: aposta.usuarioId,
            tipo: 'ganho',
            valor: valorGanho,
            status: 'pago',
            descricao: `Ganho na aposta #${aposta.id} - ${resultado?.numero || ''} ${resultado?.animal || ''}`,
            referenciaExterna: `bot-${aposta_id_bot || 'N/A'}`,
          },
        })

        console.log(`✅ Prêmio creditado: R$ ${valorGanho.toFixed(2)} para usuário ${aposta.usuarioId}`)
      }
    })

    console.log(`✅ Liquidação processada: Aposta ${aposta.id} - Status: ${statusFinal} - Valor: R$ ${valorGanho.toFixed(2)}`)

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Liquidação processada com sucesso',
      aposta_id: aposta.id,
      status: statusFinal,
      valor_ganho: valorGanho,
    })
  } catch (error) {
    console.error('Erro ao receber liquidação:', error)
    return NextResponse.json(
      {
        sucesso: false,
        erro: 'Erro ao processar liquidação',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/liquidacoes/receber - Verificar status do endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/liquidacoes/receber',
    metodo: 'POST',
    descricao: 'Endpoint para receber liquidações de bot externo',
    campos_obrigatorios: ['aposta_id_externo', 'status'],
    campos_opcionais: ['aposta_id_bot', 'valor_ganho', 'resultado', 'timestamp', 'detalhes'],
    exemplo: {
      aposta_id_externo: '123',
      aposta_id_bot: '456',
      status: 'ganhou',
      valor_ganho: 180.0,
      resultado: {
        numero: '1234',
        animal: 'Cavalo',
        posicao: 1,
      },
      timestamp: '2026-01-16T11:35:00Z',
      detalhes: {
        tipo_aposta: 'grupo',
        multiplicador: 18.0,
      },
    },
  })
}
