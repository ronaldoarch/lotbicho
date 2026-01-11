// Tipos para as respostas da API

export interface ApiResponse<T> {
  type: 'success' | 'error'
  message?: string
  data?: T
}

export interface Quotation {
  id: string
  modality: string
  position: number
  quotation: string
  subQuotations?: {
    milhar?: number
    centena?: number
  } | null
  catalogLotteryId: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  catalogLottery: {
    name: string
  } | null
}

export interface Lottery {
  id: string
  name: string
  uf: string
  bonusPercent: number
  status: 'active' | 'closed'
  closingTime: string | null
}

export interface LotteriesByRegion {
  Especiais?: Lottery[]
  'Rio de Janeiro'?: Lottery[]
  'São Paulo'?: Lottery[]
  Bahia?: Lottery[]
  'Distrito Federal'?: Lottery[]
  Goiás?: Lottery[]
  'Minas Gerais'?: Lottery[]
  'Lot Bicho'?: Lottery[]
  Paraíba?: Lottery[]
  [key: string]: Lottery[] | undefined
}

export interface SystemVersion {
  version: string
  services: {
    deposit: {
      enabled: boolean
      message: string
    }
    withdrawal: {
      enabled: boolean
      message: string
    }
    registration: {
      enabled: boolean
      message: string
      service: string
    }
    chatbot: {
      enabled: boolean
      message: string
    }
    turnstile: {
      enabled: boolean
      message: string
    }
    scratch: {
      enabled: boolean
      message: string
    }
  }
  serverTime: string
}

export interface Result {
  id: string
  lotteryId: string
  lotteryName: string
  date: string
  drawTime: string
  numbers: string[]
  animals: string[]
  [key: string]: any
}
