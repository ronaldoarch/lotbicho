import { NextResponse } from 'next/server'
import { ApiResponse, LotteriesByRegion, Lottery } from '@/types/api'
import { LOCATIONS, SPECIAL_TIMES } from '@/data/modalities'

export const dynamic = 'force-dynamic'

// Dados de loterias simulados baseados na estrutura original
const lotteries: LotteriesByRegion = {
  Especiais: [
    {
      id: 'instantanea-1',
      name: 'INSTANTANEA',
      uf: 'BR',
      bonusPercent: 0,
      status: 'active',
      closingTime: '23:59:00',
    },
    {
      id: 'federal-1',
      name: 'FEDERAL 19h',
      uf: 'BR',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
  ],
  'Lot Bicho': [
    {
      id: 'ponto-madrugada',
      name: 'PONTO-MADRUGADA 02h',
      uf: 'PO',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'ponto-galo',
      name: 'PONTO-GALO 05h',
      uf: 'PO',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'ponto-manha',
      name: 'PONTO-MANHÃ 09h',
      uf: 'PO',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'ponto-meio-dia',
      name: 'PONTO-MEIO-DIA 12h',
      uf: 'PO',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'ponto-tarde',
      name: 'PONTO-TARDE 15h',
      uf: 'PO',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'ponto-noite',
      name: 'PONTO-NOITE 18h',
      uf: 'PO',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
  ],
  'Rio de Janeiro': [
    {
      id: 'ptv-rio',
      name: 'PTV-RIO 16h20',
      uf: 'RJ',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'ptm-rio',
      name: 'PTM-RIO 11h20',
      uf: 'RJ',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'pt-rio',
      name: 'PT-RIO 14h20',
      uf: 'RJ',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
  ],
  'São Paulo': [
    {
      id: 'pt-sp-10h',
      name: 'PT-SP 10h',
      uf: 'SP',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'pt-sp-13h',
      name: 'PT-SP 13h',
      uf: 'SP',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
  ],
  'Distrito Federal': [
    {
      id: 'lbr-10h',
      name: 'LBR 10h',
      uf: 'DF',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'lbr-15h',
      name: 'LBR 15h',
      uf: 'DF',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
  ],
  Goiás: [
    {
      id: 'look-11h20',
      name: 'LOOK 11h20',
      uf: 'GO',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
    {
      id: 'look-14h20',
      name: 'LOOK 14h20',
      uf: 'GO',
      bonusPercent: 0,
      status: 'active',
      closingTime: null,
    },
  ],
}

export async function GET() {
  try {
    const response: ApiResponse<LotteriesByRegion> = {
      type: 'success',
      message: 'Listagem de loterias obtidas com sucesso.',
      data: lotteries,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching lotteries:', error)
    const response: ApiResponse<null> = {
      type: 'error',
      message: 'Erro ao buscar loterias',
    }
    return NextResponse.json(response, { status: 500 })
  }
}
