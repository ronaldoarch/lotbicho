/**
 * Horários reais de apuração do bichocerto.com
 * 
 * Este arquivo contém os horários reais de apuração conforme exibidos no site bichocerto.com.
 * Esses horários são usados APENAS para liquidação, mantendo nossos horários internos
 * para exibição e fechamento de apostas.
 * 
 * Estrutura:
 * - name: Nome da extração (deve corresponder ao nosso sistema)
 * - time: Horário da extração (formato HH:MM)
 * - closeTimeReal: Horário real de apuração (quando o resultado é divulgado)
 * - diasSemSorteio: Array com os dias da semana que NÃO têm sorteio (0=Domingo, 1=Segunda, ..., 6=Sábado)
 */

export interface HorarioRealApuracao {
  name: string
  time: string // Horário da extração no nosso sistema (ex: "09:20", "11:20")
  startTimeReal: string // Horário inicial quando o resultado pode começar a sair (ex: "17:00")
  closeTimeReal: string // Horário final quando o resultado deve estar disponível (ex: "18:00")
  diasSemSorteio?: number[] // Dias que NÃO têm sorteio (0=Domingo, 1=Segunda, ..., 6=Sábado)
}

/**
 * Mapeamento dos horários reais de apuração conforme bichocerto.com
 * 
 * IMPORTANTE: Os horários aqui são os horários REAIS de apuração (quando o resultado é divulgado),
 * não os horários de fechamento de apostas (realCloseTime).
 */
export const horariosReaisApuracao: HorarioRealApuracao[] = [
  // PT RIO DE JANEIRO
  // Mapeamento: nosso time -> horário real bichocerto.com
  // startTimeReal: quando o resultado pode começar a sair | closeTimeReal: quando deve estar disponível
  { name: 'PT RIO', time: '09:20', startTimeReal: '09:25', closeTimeReal: '10:00' }, // PPT-RJ 09:30 (nosso: 09:20) - De 09:25 às 10:00 (todos os dias)
  { name: 'PT RIO', time: '11:20', startTimeReal: '11:25', closeTimeReal: '12:00' }, // PTM-RJ 11:30 (nosso: 11:20) - De 11:25 às 12:00 (todos os dias)
  { name: 'PT RIO', time: '14:20', startTimeReal: '14:25', closeTimeReal: '15:00' }, // PT-RJ 14:30 (nosso: 14:20) - De 14:25 às 15:00 (todos os dias)
  { name: 'PT RIO', time: '16:20', startTimeReal: '16:25', closeTimeReal: '17:00' }, // PTV-RJ 16:30 (nosso: 16:20) - De 16:25 às 17:00 (todos os dias)
  { name: 'PT RIO', time: '18:20', startTimeReal: '18:25', closeTimeReal: '19:00', diasSemSorteio: [0, 2, 3, 4, 6] }, // PTN-RJ 18:30 (nosso: 18:20) - De 18:25 às 19:00 (alguns dias)
  { name: 'PT RIO', time: '21:20', startTimeReal: '21:30', closeTimeReal: '22:00', diasSemSorteio: [0] }, // COR-RJ 21:30 (nosso: 21:20) - De 21:30 às 22:00 (alguns dias)

  // LOOK GOIÁS
  { name: 'LOOK', time: '07:20', startTimeReal: '07:25', closeTimeReal: '08:00' }, // LOOK-GO 07:20 - De 07:25 às 08:00 (todos os dias)
  { name: 'LOOK', time: '09:20', startTimeReal: '09:25', closeTimeReal: '10:00' }, // LOOK-GO 09:20 - De 09:25 às 10:00 (todos os dias)
  { name: 'LOOK', time: '11:20', startTimeReal: '11:25', closeTimeReal: '12:00' }, // LOOK-GO 11:20 - De 11:25 às 12:00 (todos os dias)
  { name: 'LOOK', time: '14:20', startTimeReal: '14:25', closeTimeReal: '15:00' }, // LOOK-GO 14:20 - De 14:25 às 15:00 (todos os dias)
  { name: 'LOOK', time: '16:20', startTimeReal: '16:25', closeTimeReal: '17:00' }, // LOOK-GO 16:20 - De 16:25 às 17:00 (todos os dias)
  { name: 'LOOK', time: '18:20', startTimeReal: '18:25', closeTimeReal: '19:00' }, // LOOK-GO 18:20 - De 18:25 às 19:00 (todos os dias)
  { name: 'LOOK', time: '21:20', startTimeReal: '21:25', closeTimeReal: '22:00' }, // LOOK-GO 21:20 - De 21:25 às 22:00 (todos os dias)
  { name: 'LOOK', time: '23:20', startTimeReal: '23:25', closeTimeReal: '23:59' }, // LOOK-GO 23:20 - De 23:25 às 23:59 (todos os dias)

  // LOTERIA FEDERAL
  { name: 'FEDERAL', time: '20:00', startTimeReal: '20:00', closeTimeReal: '21:40', diasSemSorteio: [0, 1, 2, 4, 5] }, // Federal - De 20:00 às 21:40 (apenas Quarta e Sábado)

  // NACIONAL
  { name: 'NACIONAL', time: '02:00', startTimeReal: '02:00', closeTimeReal: '03:00' }, // Nacional 02h - De 02:00 às 03:00 (todos os dias)
  { name: 'NACIONAL', time: '08:00', startTimeReal: '08:00', closeTimeReal: '09:00' }, // Nacional 08h - De 08:00 às 09:00 (todos os dias)
  { name: 'NACIONAL', time: '10:00', startTimeReal: '10:00', closeTimeReal: '11:00' }, // Nacional 10h - De 10:00 às 11:00 (todos os dias)
  { name: 'NACIONAL', time: '12:00', startTimeReal: '12:00', closeTimeReal: '13:00' }, // Nacional 12h - De 12:00 às 13:00 (todos os dias)
  { name: 'NACIONAL', time: '15:00', startTimeReal: '15:00', closeTimeReal: '16:00' }, // Nacional 15h - De 15:00 às 16:00 (todos os dias)
  { name: 'NACIONAL', time: '17:00', startTimeReal: '17:00', closeTimeReal: '18:00' }, // Nacional 17h - De 17:00 às 18:00 (todos os dias)
  { name: 'NACIONAL', time: '21:00', startTimeReal: '21:00', closeTimeReal: '22:00' }, // Nacional 21h - De 21:00 às 22:00 (todos os dias)
  { name: 'NACIONAL', time: '23:00', startTimeReal: '23:00', closeTimeReal: '23:59' }, // Nacional 23h - De 23:00 às 23:59 (todos os dias)

  // PT-SP/BANDEIRANTES
  // Nota: Não temos extração com time 08:20, então não mapeamos
  { name: 'PT SP', time: '10:00', startTimeReal: '10:45', closeTimeReal: '11:00' }, // PT-SP 10:40 (nosso: 10:00) - De 10:45 às 11:00 (todos os dias)
  // Nota: Não temos extração com time 12:20, então não mapeamos
  { name: 'PT SP', time: '13:15', startTimeReal: '13:45', closeTimeReal: '14:00' }, // PT-SP 13:40 (nosso: 13:15) - De 13:45 às 14:00 (todos os dias)
  { name: 'PT SP (Band)', time: '15:15', startTimeReal: '15:35', closeTimeReal: '16:00' }, // BAND 15:30 (nosso: 15:15) - De 15:35 às 16:00 (todos os dias)
  { name: 'PT SP', time: '17:15', startTimeReal: '17:45', closeTimeReal: '18:00' }, // PT-SP 17:40 (nosso: 17:15) - De 17:45 às 18:00 (todos os dias)
  // Nota: Não temos extração com time 19:20, então não mapeamos
  // Nota: Não temos extração com time 20:40, então não mapeamos
  // Nota: Não temos extração com time 18:20, então não mapeamos

  // LOTECE
  { name: 'LOTECE', time: '11:00', startTimeReal: '11:00', closeTimeReal: '12:00', diasSemSorteio: [0] }, // Lotece (Manhã) 11h - De 11:00 às 12:00 (sem Domingo)
  { name: 'LOTECE', time: '14:00', startTimeReal: '14:00', closeTimeReal: '15:00', diasSemSorteio: [0] }, // Lotece (Tarde 1) 14h - De 14:00 às 15:00 (sem Domingo)
  { name: 'LOTECE', time: '15:40', startTimeReal: '15:30', closeTimeReal: '16:00', diasSemSorteio: [0] }, // Lotece (Tarde 2) 15h (nosso: 15:40) - De 15:30 às 16:00 (sem Domingo)
  { name: 'LOTECE', time: '19:40', startTimeReal: '19:00', closeTimeReal: '20:00', diasSemSorteio: [0] }, // Lotece (Noite) 19h (nosso: 19:40) - De 19:00 às 20:00 (sem Domingo)

  // PT PARAÍBA/LOTEP
  // Nota: Não temos extração com time 09:00, então não mapeamos
  { name: 'LOTEP', time: '10:45', startTimeReal: '10:40', closeTimeReal: '11:00' }, // Lotep 10:45 - De 10:40 às 11:00 (todos os dias)
  { name: 'LOTEP', time: '12:45', startTimeReal: '12:40', closeTimeReal: '13:00' }, // Lotep 12:45 - De 12:40 às 13:00 (todos os dias)
  { name: 'LOTEP', time: '15:45', startTimeReal: '15:40', closeTimeReal: '16:00', diasSemSorteio: [0] }, // Lotep 15:45 - De 15:40 às 16:00 (sem Domingo)
  { name: 'LOTEP', time: '18:05', startTimeReal: '18:40', closeTimeReal: '19:00', diasSemSorteio: [0] }, // Lotep 18:45 (nosso: 18:05) - De 18:40 às 19:00 (sem Domingo)
  // Nota: Não temos extração com time 20:00 para LOTEP, então não mapeamos

  // PT BAHIA
  { name: 'PT BAHIA', time: '10:20', startTimeReal: '10:30', closeTimeReal: '11:00' }, // PT Bahia 10h (nosso: 10:20) - De 10:30 às 11:00 (todos os dias)
  { name: 'PT BAHIA', time: '12:20', startTimeReal: '12:30', closeTimeReal: '13:00' }, // PT Bahia 12h (nosso: 12:20) - De 12:30 às 13:00 (todos os dias)
  { name: 'PT BAHIA', time: '15:20', startTimeReal: '15:30', closeTimeReal: '16:00' }, // PT Bahia 15h (nosso: 15:20) - De 15:30 às 16:00 (todos os dias)
  { name: 'PT BAHIA', time: '19:00', startTimeReal: '19:30', closeTimeReal: '20:00', diasSemSorteio: [0, 3, 6] }, // PT Bahia 19h - De 19:30 às 20:00 (sem Domingo, Quarta, Sábado)
  { name: 'PT BAHIA', time: '21:20', startTimeReal: '21:30', closeTimeReal: '22:00', diasSemSorteio: [0] }, // PT Bahia 21h (nosso: 21:20) - De 21:30 às 22:00 (sem Domingo)
  // Federal Bahia já está mapeado acima (id 32)
]

/**
 * Busca o horário real de apuração para uma extração específica
 * @param name Nome da extração (ex: "PT RIO", "LOOK", "NACIONAL")
 * @param time Horário da extração (ex: "09:30", "11:20")
 * @returns Horário real de apuração ou null se não encontrado
 */
export function getHorarioRealApuracao(name: string, time: string): HorarioRealApuracao | null {
  if (!name || !time) return null

  // Normalizar nome e horário para comparação
  const nameNormalizado = name.toUpperCase().trim()
  const timeNormalizado = time.replace(/[h:]/g, ':').replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => {
    return `${h.padStart(2, '0')}:${m}`
  })

  // Buscar correspondência exata primeiro
  let horario = horariosReaisApuracao.find(
    h => h.name.toUpperCase() === nameNormalizado && h.time === timeNormalizado
  )

  // Se não encontrou, tentar correspondência parcial por nome e horário aproximado
  if (!horario) {
    // Tentar encontrar por nome e horário aproximado (dentro de 30 minutos)
    const [horas, minutos] = timeNormalizado.split(':').map(Number)
    if (isNaN(horas) || isNaN(minutos)) return null
    
    const minutosTotais = horas * 60 + minutos

    horario = horariosReaisApuracao.find(h => {
      if (h.name.toUpperCase() !== nameNormalizado) return false
      
      const [hHoras, hMinutos] = h.time.split(':').map(Number)
      if (isNaN(hHoras) || isNaN(hMinutos)) return false
      
      const hMinutosTotais = hHoras * 60 + hMinutos
      
      // Aceitar diferença de até 30 minutos
      return Math.abs(minutosTotais - hMinutosTotais) <= 30
    })
  }

  return horario || null
}

/**
 * Verifica se um dia da semana tem sorteio para uma extração específica
 * @param horarioReal Horário real de apuração
 * @param diaSemana Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
 * @returns true se tem sorteio, false caso contrário
 */
export function temSorteioNoDia(horarioReal: HorarioRealApuracao | null, diaSemana: number): boolean {
  if (!horarioReal) return true // Se não encontrou horário, assume que tem sorteio (comportamento antigo)
  
  if (!horarioReal.diasSemSorteio || horarioReal.diasSemSorteio.length === 0) {
    return true // Todos os dias têm sorteio
  }
  
  return !horarioReal.diasSemSorteio.includes(diaSemana)
}
