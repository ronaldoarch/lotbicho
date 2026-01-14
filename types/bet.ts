export interface Animal {
  id: number
  name: string
  slug: string
  group: number
}

export interface Modality {
  id: number
  name: string
  value: string
  hasLink?: boolean
  active?: boolean
}

export interface SpecialQuotation {
  id: number
  name: string
  value: string
  time: string
}

export interface Position {
  id: string
  label: string
  value: string
}

export interface Location {
  id: string
  name: string
  flag?: string
}

export interface BetStep {
  step: number
  title: string
  completed: boolean
}

export interface BetData {
  modality: string | null
  modalityName?: string | null
  animalBets: number[][] // lista de palpites de animais (cada palpite é um array de IDs)
  numberBets: string[] // lista de palpites numéricos (para modalidades como Milhar, Centena, Dezena)
  position: string | null
  customPosition: boolean
  customPositionValue?: string
  amount: number
  divisionType: 'all' | 'each'
  useBonus: boolean
  bonusAmount: number
  location: string | null
  instant: boolean
  specialTime: string | null
}
