import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/resultados/liquidar/status
 * 
 * Endpoint para verificar status da liquidação e diagnosticar problemas
 */
export async function GET() {
  try {
    // Contar apostas por status
    const pendentes = await prisma.aposta.count({
      where: { status: 'pendente' },
    })
    
    const pendentesMinusculo = await prisma.aposta.count({
      where: { status: 'PENDENTE' },
    })
    
    const liquidadas = await prisma.aposta.count({
      where: { status: 'liquidado' },
    })
    
    const perdidas = await prisma.aposta.count({
      where: { status: 'perdida' },
    })
    
    // Buscar algumas apostas pendentes para exemplo
    const exemplosPendentes = await prisma.aposta.findMany({
      where: { status: 'pendente' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        loteria: true,
        horario: true,
        dataConcurso: true,
        modalidade: true,
        status: true,
        createdAt: true,
      },
    })
    
    // Buscar algumas apostas com status diferente para verificar
    const exemplosOutrosStatus = await prisma.aposta.findMany({
      where: {
        status: {
          not: 'pendente',
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    })
    
    // Verificar valores únicos de status no banco
    const statusUnicos = await prisma.aposta.findMany({
      select: {
        status: true,
      },
      distinct: ['status'],
    })
    
    return NextResponse.json({
      contadores: {
        pendentes: pendentes,
        pendentesMinusculo: pendentesMinusculo,
        liquidadas: liquidadas,
        perdidas: perdidas,
        total: pendentes + liquidadas + perdidas,
      },
      statusUnicos: statusUnicos.map(s => s.status),
      exemplosPendentes,
      exemplosOutrosStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json(
      {
        error: 'Erro ao verificar status',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
