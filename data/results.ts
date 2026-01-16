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

// Dados de fallback por localização/horário para quando a API externa não responder.
// Usado também em modo mock nas tabelas.
export const SAMPLE_RESULTS: ResultData[] = [
  // Rio de Janeiro - manhã
  { position: '1°', milhar: '7938', grupo: '10', animal: 'Coelho', drawTime: 'PT-RIO 11h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '2°', milhar: '0941', grupo: '11', animal: 'Cavalo', drawTime: 'PT-RIO 11h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '3°', milhar: '0141', grupo: '11', animal: 'Cavalo', drawTime: 'PT-RIO 11h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '4°', milhar: '4752', grupo: '13', animal: 'Galo', drawTime: 'PT-RIO 11h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '5°', milhar: '3354', grupo: '14', animal: 'Gato', drawTime: 'PT-RIO 11h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '6°', milhar: '7126', grupo: '07', animal: 'Carneiro', drawTime: 'PT-RIO 11h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '7°', milhar: '0469', grupo: '18', animal: 'Porco', drawTime: 'PT-RIO 11h20', location: 'Rio de Janeiro', date: '2026-01-13' },

  // Rio de Janeiro - tarde
  { position: '1°', milhar: '5832', grupo: '09', animal: 'Cobra', drawTime: 'PT-RIO 16h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '2°', milhar: '1204', grupo: '01', animal: 'Avestruz', drawTime: 'PT-RIO 16h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '3°', milhar: '9021', grupo: '06', animal: 'Cabra', drawTime: 'PT-RIO 16h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '4°', milhar: '7754', grupo: '14', animal: 'Gato', drawTime: 'PT-RIO 16h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '5°', milhar: '4419', grupo: '05', animal: 'Cachorro', drawTime: 'PT-RIO 16h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '6°', milhar: '6233', grupo: '09', animal: 'Cobra', drawTime: 'PT-RIO 16h20', location: 'Rio de Janeiro', date: '2026-01-13' },
  { position: '7°', milhar: '3608', grupo: '02', animal: 'Águia', drawTime: 'PT-RIO 16h20', location: 'Rio de Janeiro', date: '2026-01-13' },

  // São Paulo - manhã
  { position: '1°', milhar: '1820', grupo: '05', animal: 'Cachorro', drawTime: 'PT-SP 10h00', location: 'São Paulo', date: '2026-01-13' },
  { position: '2°', milhar: '9012', grupo: '03', animal: 'Burro', drawTime: 'PT-SP 10h00', location: 'São Paulo', date: '2026-01-13' },
  { position: '3°', milhar: '4411', grupo: '11', animal: 'Cavalo', drawTime: 'PT-SP 10h00', location: 'São Paulo', date: '2026-01-13' },
  { position: '4°', milhar: '7733', grupo: '19', animal: 'Pavão', drawTime: 'PT-SP 10h00', location: 'São Paulo', date: '2026-01-13' },
  { position: '5°', milhar: '5507', grupo: '02', animal: 'Águia', drawTime: 'PT-SP 10h00', location: 'São Paulo', date: '2026-01-13' },
  { position: '6°', milhar: '6325', grupo: '07', animal: 'Carneiro', drawTime: 'PT-SP 10h00', location: 'São Paulo', date: '2026-01-13' },
  { position: '7°', milhar: '3109', grupo: '09', animal: 'Cobra', drawTime: 'PT-SP 10h00', location: 'São Paulo', date: '2026-01-13' },

  // São Paulo - tarde
  { position: '1°', milhar: '9901', grupo: '25', animal: 'Vaca', drawTime: 'PT-SP 15h15', location: 'São Paulo', date: '2026-01-13' },
  { position: '2°', milhar: '2214', grupo: '06', animal: 'Cabra', drawTime: 'PT-SP 15h15', location: 'São Paulo', date: '2026-01-13' },
  { position: '3°', milhar: '5587', grupo: '22', animal: 'Tigre', drawTime: 'PT-SP 15h15', location: 'São Paulo', date: '2026-01-13' },
  { position: '4°', milhar: '6701', grupo: '18', animal: 'Porco', drawTime: 'PT-SP 15h15', location: 'São Paulo', date: '2026-01-13' },
  { position: '5°', milhar: '7405', grupo: '02', animal: 'Águia', drawTime: 'PT-SP 15h15', location: 'São Paulo', date: '2026-01-13' },
  { position: '6°', milhar: '8552', grupo: '13', animal: 'Galo', drawTime: 'PT-SP 15h15', location: 'São Paulo', date: '2026-01-13' },
  { position: '7°', milhar: '1244', grupo: '11', animal: 'Cavalo', drawTime: 'PT-SP 15h15', location: 'São Paulo', date: '2026-01-13' },

  // Bahia - meio-dia
  { position: '1°', milhar: '3310', grupo: '08', animal: 'Camelo', drawTime: 'PT-BA 12h20', location: 'Bahia', date: '2026-01-13' },
  { position: '2°', milhar: '2207', grupo: '07', animal: 'Carneiro', drawTime: 'PT-BA 12h20', location: 'Bahia', date: '2026-01-13' },
  { position: '3°', milhar: '4490', grupo: '23', animal: 'Urso', drawTime: 'PT-BA 12h20', location: 'Bahia', date: '2026-01-13' },
  { position: '4°', milhar: '5125', grupo: '19', animal: 'Pavão', drawTime: 'PT-BA 12h20', location: 'Bahia', date: '2026-01-13' },
  { position: '5°', milhar: '6021', grupo: '06', animal: 'Cabra', drawTime: 'PT-BA 12h20', location: 'Bahia', date: '2026-01-13' },
  { position: '6°', milhar: '7730', grupo: '08', animal: 'Camelo', drawTime: 'PT-BA 12h20', location: 'Bahia', date: '2026-01-13' },
  { position: '7°', milhar: '9455', grupo: '14', animal: 'Gato', drawTime: 'PT-BA 12h20', location: 'Bahia', date: '2026-01-13' },
]

export const LOCATIONS: Location[] = [
  { id: 'rj', name: 'Rio de Janeiro', flag: '🏖️' },
  { id: 'sp', name: 'São Paulo', flag: '🏙️' },
  { id: 'ba', name: 'Bahia', flag: '🌴' },
  { id: 'pb', name: 'Paraíba', flag: '🌅' },
  { id: 'ce', name: 'Ceará', flag: '🌊' },
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
