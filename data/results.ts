import { Location } from '@/types/bet'

export interface ResultData {
  position: string
  milhar: string
  grupo: string
  animal: string
  drawTime?: string
  location?: string
  date?: string
}

export const SAMPLE_RESULTS: ResultData[] = [
  { position: '1°', milhar: '7938', grupo: '10', animal: 'Coelho', drawTime: 'PT-RIO 9h20', location: 'Rio de Janeiro', date: '13/01/2026' },
  { position: '2°', milhar: '0941', grupo: '11', animal: 'Cavalo', drawTime: 'PT-RIO 9h20', location: 'Rio de Janeiro', date: '13/01/2026' },
  { position: '3°', milhar: '0141', grupo: '11', animal: 'Cavalo', drawTime: 'PT-RIO 9h20', location: 'Rio de Janeiro', date: '13/01/2026' },
  { position: '4°', milhar: '4752', grupo: '13', animal: 'Galo', drawTime: 'PT-RIO 9h20', location: 'Rio de Janeiro', date: '13/01/2026' },
  { position: '5°', milhar: '3354', grupo: '14', animal: 'Gato', drawTime: 'PT-RIO 9h20', location: 'Rio de Janeiro', date: '13/01/2026' },
  { position: '6°', milhar: '7126', grupo: '07', animal: 'Carneiro', drawTime: 'PT-RIO 9h20', location: 'Rio de Janeiro', date: '13/01/2026' },
  { position: '7°', milhar: '0469', grupo: '18', animal: 'Porco', drawTime: 'PT-RIO 9h20', location: 'Rio de Janeiro', date: '13/01/2026' },
]

export const LOCATIONS: Location[] = [
  { id: 'rj', name: 'Rio de Janeiro', flag: '🏖️' },
  { id: 'sp', name: 'São Paulo', flag: '🏙️' },
  { id: 'bh', name: 'Belo Horizonte', flag: '⛰️' },
  { id: 'bsb', name: 'Brasília', flag: '🏛️' },
  { id: 'go', name: 'Goiás', flag: '🌾' },
  { id: 'df', name: 'Distrito Federal', flag: '🏛️' },
]

export const DRAW_TIMES = [
  'PT-RIO 9h20',
  'PONTO-NOITE 18h',
  'PONTO-MEIO-DIA 12h',
  'PONTO-TARDE 15h',
  'PONTO-CORUJA 22h',
  'PONTO-MADRUGADA',
]
