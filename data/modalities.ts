import { Modality, SpecialQuotation, Position, Location } from '@/types/bet'

export const MODALITIES: Modality[] = [
  // Coluna Esquerda (ordem do original)
  { id: 1, name: 'Grupo', value: '1x R$ 18.00', hasLink: false },
  { id: 2, name: 'Dupla de Grupo', value: '1x R$ 16.00', hasLink: false },
  { id: 3, name: 'Terno de Grupo', value: '1x R$ 150.00', hasLink: false },
  { id: 4, name: 'Quadra de Grupo', value: '1x R$ 1000.00', hasLink: false },
  { id: 5, name: 'Quina de Grupo', value: '1x R$ 5000.00', hasLink: false },
  { id: 6, name: 'Duque de Dezena', value: '1x R$ 300.00', hasLink: false },
  { id: 7, name: 'Terno de Dezena', value: '1x R$ 5000.00', hasLink: false },
  { id: 8, name: 'Passe vai', value: '1x R$ 90.00', hasLink: false },
  
  // Coluna Direita (ordem do original)
  { id: 9, name: 'Milhar', value: '1x R$ 6000.00', hasLink: true },
  { id: 10, name: 'Milhar/Centena', value: '1x R$ 3300.00', hasLink: false },
  { id: 11, name: 'Centena', value: '1x R$ 600.00', hasLink: false },
  { id: 12, name: 'Dezena', value: '1x R$ 60.00', hasLink: false },
  { id: 13, name: 'Milhar Invertida', value: '1x R$ 6000.00', hasLink: false },
  { id: 14, name: 'Centena Invertida', value: '1x R$ 600.00', hasLink: false },
  { id: 15, name: 'Dezena Invertida', value: '1x R$ 60.00', hasLink: false },
  { id: 16, name: 'Passe vai e vem', value: '1x R$ 90.00', hasLink: false },
]

export const SPECIAL_QUOTATIONS: SpecialQuotation[] = [
  { id: 1, name: 'PONTO-NOITE 18h', value: '1x R$ 7000.00', time: '18h' },
  { id: 2, name: 'PONTO-MEIO-DIA 12h', value: '1x R$ 7000.00', time: '12h' },
  { id: 3, name: 'PONTO-TARDE 15h', value: '1x R$ 7000.00', time: '15h' },
  { id: 4, name: 'PONTO-CORUJA 22h', value: '1x R$ 7000.00', time: '22h' },
  { id: 5, name: 'PONTO-MADRUGADA', value: '1x R$ 7000.00', time: 'madrugada' },
]

export const POSITIONS: Position[] = [
  { id: '1st', label: '1º Prêmio', value: '1st' },
  { id: '1-3', label: '1º ao 3º', value: '1-3' },
  { id: '1-5', label: '1º ao 5º', value: '1-5' },
  { id: '1-7', label: '1º ao 7º', value: '1-7' },
]

export const LOCATIONS: Location[] = [
  { id: 'brasil', name: 'Brasil Lot Bicho', flag: '🇧🇷' },
  { id: 'df', name: 'Distrito Federal', flag: '🏛️' },
  { id: 'goias', name: 'Goiás', flag: '🌾' },
]

export const SPECIAL_TIMES = [
  { id: 'coruja', name: 'PONTO-CORUJA 22h', time: '22h' },
]
