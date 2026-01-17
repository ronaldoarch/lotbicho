# 🛠️ Guia de Implementação: Soluções de Liquidação

**Última atualização:** 15 de Janeiro de 2026

Este guia fornece instruções passo a passo para implementar as soluções de liquidação em outros sistemas.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Solução 1: Normalização de Horários](#solução-1-normalização-de-horários)
3. [Solução 2: Verificação de Horário de Apuração](#solução-2-verificação-de-horário-de-apuração)
4. [Estrutura de Dados Necessária](#estrutura-de-dados-necessária)
5. [Exemplos Completos](#exemplos-completos)
6. [Testes](#testes)

---

## 🎯 Pré-requisitos

Antes de começar, você precisa ter:

1. **Lista de extrações/loterias** com:
   - ID único
   - Nome da loteria
   - Horário interno (`time`)
   - Horário de fechamento (`closeTime`)
   - Status ativo (`active`)

2. **Mapeamento de horários reais de apuração** com:
   - Nome da loteria
   - Horário interno
   - Horário inicial real (`startTimeReal`)
   - Horário final real (`closeTimeReal`)
   - Dias sem sorteio (`diasSemSorteio`)

3. **API ou função para buscar resultados** que retorna:
   - Nome da loteria
   - Horário do resultado
   - Data do resultado
   - Prêmios (milhares)

---

## 🔧 Solução 1: Normalização de Horários

### Objetivo
Normalizar horários dos resultados da API externa para os horários internos do sistema, garantindo que resultados sejam associados corretamente às apostas.

### Passo 1: Criar Estrutura de Dados

**1.1. Criar arquivo de horários reais de apuração**

```typescript
// data/horarios-reais-apuracao.ts (ou equivalente)

export interface HorarioRealApuracao {
  name: string           // Nome da loteria (ex: "PT RIO", "LOOK")
  time: string           // Horário interno (ex: "09:20", "20:15")
  startTimeReal: string  // Horário inicial real (ex: "09:00")
  closeTimeReal: string  // Horário final real (ex: "09:30")
  diasSemSorteio?: number[] // Dias sem sorteio [0=Domingo, 1=Segunda, ..., 6=Sábado]
}

export const HORARIOS_REAIS_APURACAO: HorarioRealApuracao[] = [
  {
    name: 'PT RIO',
    time: '09:20',
    startTimeReal: '09:00',
    closeTimeReal: '09:30',
    diasSemSorteio: [0, 6] // Sem sorteio domingo e sábado
  },
  {
    name: 'PT SP',
    time: '20:15',
    startTimeReal: '20:30',
    closeTimeReal: '21:00',
    diasSemSorteio: [0, 3, 5, 6] // Sem sorteio domingo, quarta, sexta e sábado
  },
  {
    name: 'LOOK',
    time: '10:00',
    startTimeReal: '10:00',
    closeTimeReal: '10:30',
    diasSemSorteio: []
  },
  // ... adicionar todas as extrações
]

/**
 * Busca o horário real de apuração para uma loteria
 */
export function getHorarioRealApuracao(
  name: string,
  time: string
): HorarioRealApuracao | null {
  return HORARIOS_REAIS_APURACAO.find(
    h => h.name.toUpperCase() === name.toUpperCase().trim() &&
         h.time === time.trim()
  ) || null
}
```

**1.2. Criar arquivo de extrações (se ainda não existir)**

```typescript
// data/extracoes.ts (ou equivalente)

export interface Extracao {
  id: number
  name: string
  time: string           // Horário interno
  closeTime?: string     // Horário de fechamento
  active: boolean
  // ... outros campos
}

export const extracoes: Extracao[] = [
  { id: 1, name: 'PT RIO', time: '09:20', closeTime: '09:20', active: true },
  { id: 2, name: 'PT SP', time: '20:15', closeTime: '20:15', active: true },
  { id: 3, name: 'LOOK', time: '10:00', closeTime: '10:00', active: true },
  // ... adicionar todas as extrações
]
```

### Passo 2: Implementar Função de Normalização

**2.1. Criar função `normalizarHorarioResultado()`**

```typescript
// app/api/resultados/route.ts (ou equivalente)

import { extracoes } from '@/data/extracoes'
import { getHorarioRealApuracao } from '@/data/horarios-reais-apuracao'

/**
 * Normaliza o horário do resultado para o horário correto de fechamento da extração
 * 
 * @param loteriaNome Nome da loteria (ex: "PT SP", "LOOK", "LOTECE")
 * @param horarioResultado Horário que veio do resultado (ex: "20:40", "10:40")
 * @returns Horário normalizado para fechamento (ex: "20:15", "10:00") ou o horário original se não encontrar
 */
function normalizarHorarioResultado(
  loteriaNome: string,
  horarioResultado: string
): string {
  // Validação básica
  if (!loteriaNome || !horarioResultado) {
    return horarioResultado
  }
  
  // Normalizar nome da loteria
  const nomeNormalizado = loteriaNome.toUpperCase().trim()
  
  // Normalizar horário do resultado (formato HH:MM)
  const horarioNormalizado = horarioResultado
    .replace(/[h:]/g, ':')  // Substituir "h" por ":"
    .replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => {
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
    })
  
  // Converter para minutos para comparação
  const [horaResultado, minutoResultado] = horarioNormalizado.split(':').map(Number)
  
  if (isNaN(horaResultado) || isNaN(minutoResultado)) {
    return horarioResultado // Retorna original se inválido
  }
  
  const minutosResultado = horaResultado * 60 + minutoResultado
  
  // Buscar todas as extrações com esse nome
  const extracoesComMesmoNome = extracoes.filter(
    e => e.name.toUpperCase() === nomeNormalizado && e.active
  )
  
  if (extracoesComMesmoNome.length === 0) {
    return horarioResultado // Retorna original se não encontrar extração
  }
  
  let melhorMatch: { extracao: Extracao, diferenca: number } | null = null
  
  // Para cada extração, verificar se o horário do resultado corresponde ao horário real
  for (const extracao of extracoesComMesmoNome) {
    // Buscar horário real de apuração
    const horarioReal = getHorarioRealApuracao(extracao.name, extracao.time)
    
    if (horarioReal) {
      // Verificar match exato com closeTimeReal (horário quando o resultado deve estar disponível)
      const [horaFim, minutoFim] = horarioReal.closeTimeReal.split(':').map(Number)
      const minutosFim = horaFim * 60 + minutoFim
      
      // Match exato com closeTimeReal
      if (minutosResultado === minutosFim) {
        return extracao.time // Retorna horário interno normalizado
      }
      
      // Verificar se está dentro do intervalo de apuração
      const [horaInicio, minutoInicio] = horarioReal.startTimeReal.split(':').map(Number)
      const minutosInicio = horaInicio * 60 + minutoInicio
      
      if (minutosResultado >= minutosInicio && minutosResultado <= minutosFim) {
        // Calcular diferença para escolher o melhor match se houver múltiplos
        const diferenca = Math.abs(minutosResultado - minutosFim)
        if (!melhorMatch || diferenca < melhorMatch.diferenca) {
          melhorMatch = { extracao, diferenca }
        }
      }
    }
  }
  
  // Se encontrou match dentro do intervalo, retornar o melhor
  if (melhorMatch) {
    return melhorMatch.extracao.time
  }
  
  // Fallback: verificar match aproximado com horário interno (dentro de 30 minutos)
  for (const extracao of extracoesComMesmoNome) {
    const [horaExtracao, minutoExtracao] = extracao.time.split(':').map(Number)
    if (isNaN(horaExtracao) || isNaN(minutoExtracao)) continue
    
    const minutosExtracao = horaExtracao * 60 + minutoExtracao
    const diferenca = Math.abs(minutosResultado - minutosExtracao)
    
    if (diferenca <= 30) {
      return extracao.time
    }
  }
  
  // Se não encontrou match, retornar horário original
  return horarioResultado
}
```

### Passo 3: Aplicar Normalização na API de Resultados

**3.1. Aplicar normalização ao processar resultados**

```typescript
// app/api/resultados/route.ts (ou equivalente)

export async function GET(request: Request) {
  // ... buscar resultados da API externa ...
  
  const resultadosExternos = await buscarResultadosExternos()
  
  const resultadosNormalizados = resultadosExternos.map((resultado: any) => {
    // Normalizar horário do resultado
    const horarioNormalizado = normalizarHorarioResultado(
      resultado.loteria || resultado.tabela,
      resultado.horario || resultado.horarioResultado
    )
    
    return {
      ...resultado,
      horario: horarioNormalizado,      // Horário normalizado
      drawTime: horarioNormalizado,      // Mesmo horário normalizado
      horarioOriginal: resultado.horario // Manter original para referência
    }
  })
  
  return Response.json({ resultados: resultadosNormalizados })
}
```

**3.2. Exemplo de uso em loop de processamento**

```typescript
// Se você processa resultados em um loop (ex: organizados por tabela/horário)

Object.entries(organizados).forEach(([tabela, horarios]) => {
  Object.entries(horarios as Record<string, any[]>).forEach(([horario, lista]) => {
    // Normalizar horário do resultado
    const horarioNormalizado = normalizarHorarioResultado(tabela, horario)
    
    const resultadosNormalizados = lista.map((item: any) => ({
      ...item,
      horario: horarioNormalizado,
      drawTime: horarioNormalizado,
      horarioOriginal: horario
    }))
    
    // ... processar resultados normalizados ...
  })
})
```

### Passo 4: Testar Normalização

```typescript
// Testes unitários

describe('normalizarHorarioResultado', () => {
  test('deve normalizar horário de PT SP corretamente', () => {
    // Resultado vem com horário 20:40 (horário real de apuração)
    // Deve normalizar para 20:15 (horário interno)
    const resultado = normalizarHorarioResultado('PT SP', '20:40')
    expect(resultado).toBe('20:15')
  })
  
  test('deve normalizar horário de LOOK corretamente', () => {
    // Resultado vem com horário 10:30 (horário real de apuração)
    // Deve normalizar para 10:00 (horário interno)
    const resultado = normalizarHorarioResultado('LOOK', '10:30')
    expect(resultado).toBe('10:00')
  })
  
  test('deve retornar original se não encontrar match', () => {
    const resultado = normalizarHorarioResultado('LOTERIA_INEXISTENTE', '15:00')
    expect(resultado).toBe('15:00')
  })
})
```

---

## 🔧 Solução 2: Verificação de Horário de Apuração

### Objetivo
Verificar se já passou o horário de apuração antes de liquidar apostas, evitando liquidações prematuras.

### Passo 1: Criar Função Auxiliar para Verificar Dia da Semana

**1.1. Adicionar função `temSorteioNoDia()`**

```typescript
// data/horarios-reais-apuracao.ts (ou equivalente)

/**
 * Verifica se um dia da semana tem sorteio para uma extração específica
 * 
 * @param horarioReal Horário real de apuração
 * @param diaSemana Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
 * @returns true se tem sorteio, false caso contrário
 */
export function temSorteioNoDia(
  horarioReal: HorarioRealApuracao | null,
  diaSemana: number
): boolean {
  if (!horarioReal) {
    return true // Se não encontrou horário, assume que tem sorteio (comportamento antigo)
  }
  
  if (!horarioReal.diasSemSorteio || horarioReal.diasSemSorteio.length === 0) {
    return true // Todos os dias têm sorteio
  }
  
  return !horarioReal.diasSemSorteio.includes(diaSemana)
}
```

### Passo 2: Implementar Função de Verificação

**2.1. Criar função `jaPassouHorarioApuracao()`**

```typescript
// app/api/resultados/liquidar/route.ts (ou equivalente)

import { extracoes } from '@/data/extracoes'
import { getHorarioRealApuracao, temSorteioNoDia } from '@/data/horarios-reais-apuracao'

/**
 * Verifica se já passou o horário de apuração para uma extração
 * 
 * IMPORTANTE: Esta função usa os horários REAIS de apuração,
 * não os horários internos do sistema.
 * 
 * @param extracaoId ID da extração (loteria)
 * @param dataConcurso Data do concurso da aposta
 * @param horarioAposta Horário da aposta (opcional, para encontrar a extração correta)
 * @param loteriaNome Nome da loteria (opcional, para buscar horário real)
 * @returns true se já passou o horário de apuração, false caso contrário
 */
function jaPassouHorarioApuracao(
  extracaoId: number | string | null,
  dataConcurso: Date | null,
  horarioAposta: string | null = null,
  loteriaNome: string | null = null
): boolean {
  // Validação básica
  if (!extracaoId || !dataConcurso) {
    console.log('⚠️ Verificação de horário: sem extração ou data, permitindo liquidação')
    return true // Permite liquidar se não tem dados suficientes
  }
  
  // Buscar extração por ID
  let extracao = extracoes.find(e => e.id === Number(extracaoId))
  
  // Se não encontrou por ID ou há múltiplas extrações com mesmo nome, tentar pelo horário
  if (!extracao || (horarioAposta && extracoes.filter(e => e.id === Number(extracaoId)).length > 1)) {
    const extracoesComMesmoId = extracoes.filter(e => e.id === Number(extracaoId))
    
    if (extracoesComMesmoId.length > 1 && horarioAposta) {
      // Normalizar horário da aposta
      const horarioNormalizado = horarioAposta
        .replace(/[h:]/g, ':')
        .replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => {
          return `${h.padStart(2, '0')}:${m}`
        })
      
      // Buscar extração cujo horário está mais próximo do horário da aposta
      extracao = extracoesComMesmoId.find(e => {
        const horarioExtracao = e.time || e.closeTime || ''
        return horarioExtracao === horarioNormalizado || 
               horarioExtracao.startsWith(horarioNormalizado.substring(0, 2))
      }) || extracoesComMesmoId[0]
    } else {
      extracao = extracoesComMesmoId[0] || extracao
    }
  }
  
  if (!extracao) {
    console.log('⚠️ Verificação de horário: extração não encontrada, permitindo liquidação')
    return true
  }
  
  // Buscar horário REAL de apuração
  const nomeExtracao = loteriaNome || extracao.name || ''
  const horarioExtracao = horarioAposta || extracao.time || extracao.closeTime || ''
  
  let horarioReal = null
  let startTimeParaUsar = extracao.closeTime || extracao.time || ''
  let closeTimeParaUsar = extracao.closeTime || extracao.time || ''
  
  if (nomeExtracao && horarioExtracao) {
    try {
      horarioReal = getHorarioRealApuracao(nomeExtracao, horarioExtracao)
      
      if (horarioReal) {
        // IMPORTANTE: Usar startTimeReal para permitir tentar liquidar a partir do horário inicial
        // O resultado pode começar a sair a partir de startTimeReal
        startTimeParaUsar = horarioReal.startTimeReal || horarioReal.closeTimeReal
        closeTimeParaUsar = horarioReal.closeTimeReal
        
        console.log(`📅 Usando horário REAL de apuração: ${horarioReal.name} ${horarioReal.time}`)
        console.log(`   Início: ${startTimeParaUsar} | Fim: ${closeTimeParaUsar}`)
        
        // Verificar se o dia da semana tem sorteio
        const diaSemana = dataConcurso.getDay() // 0=Domingo, 1=Segunda, ..., 6=Sábado
        if (!temSorteioNoDia(horarioReal, diaSemana)) {
          const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
          console.log(`🚫 ${diasSemana[diaSemana]} não tem sorteio para ${horarioReal.name} ${horarioReal.time}`)
          return false // Não pode liquidar se não tem sorteio neste dia
        }
      } else {
        console.log(`⚠️ Horário real não encontrado para ${nomeExtracao} ${horarioExtracao}, usando horário interno`)
      }
    } catch (error) {
      console.log(`⚠️ Erro ao buscar horário real: ${error}, usando horário interno`)
    }
  }
  
  if (!startTimeParaUsar) {
    console.log('⚠️ Verificação de horário: sem startTime disponível, permitindo liquidação')
    return true
  }
  
  // Parsear horário inicial de apuração (formato HH:MM)
  const [horas, minutos] = startTimeParaUsar.split(':').map(Number)
  
  if (isNaN(horas) || isNaN(minutos)) {
    console.log(`⚠️ Verificação de horário: startTime inválido "${startTimeParaUsar}", permitindo liquidação`)
    return true
  }
  
  // IMPORTANTE: Usar horário de Brasília (GMT-3) para comparação
  // Obter horário atual em Brasília
  const agoraUTC = new Date()
  const agoraBrasiliaStr = agoraUTC.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Converter string "MM/DD/YYYY, HH:MM:SS" para Date
  const [dataPart, horaPart] = agoraBrasiliaStr.split(', ')
  const [mes, dia, ano] = dataPart.split('/')
  const [horaAtual, minutoAtual, segundoAtual] = horaPart.split(':')
  const agora = new Date(
    parseInt(ano),
    parseInt(mes) - 1,
    parseInt(dia),
    parseInt(horaAtual),
    parseInt(minutoAtual),
    parseInt(segundoAtual)
  )
  
  // Obter data do concurso em horário de Brasília
  const dataConcursoBrasiliaStr = dataConcurso.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [mesConc, diaConc, anoConc] = dataConcursoBrasiliaStr.split('/')
  
  // Criar data/hora INICIAL de apuração no dia do concurso usando horário de Brasília
  const dataApuracaoInicial = new Date(
    parseInt(anoConc),
    parseInt(mesConc) - 1,
    parseInt(diaConc),
    horas,
    minutos,
    0
  )
  
  // Criar datas para comparação de dia (sem hora) em horário de Brasília
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const dataConcursoSemHora = new Date(
    parseInt(anoConc),
    parseInt(mesConc) - 1,
    parseInt(diaConc)
  )
  
  // Se for hoje, usar hora atual; se for passado, já pode liquidar; se for futuro, não pode
  if (dataConcursoSemHora.getTime() === hoje.getTime()) {
    // Mesmo dia: verificar se já passou o horário INICIAL
    const jaPassouHorarioInicial = agora >= dataApuracaoInicial
    
    const horaApuracaoInicial = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
    const horaAtualStr = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}:${agora.getSeconds().toString().padStart(2, '0')}`
    
    const fonteHorario = horarioReal ? '(horário real)' : '(interno)'
    console.log(`⏰ Verificação de horário: ${extracao.name} (ID ${extracaoId})`)
    console.log(`   startTime: ${startTimeParaUsar} | closeTime: ${closeTimeParaUsar} ${fonteHorario}`)
    console.log(`   Data apuração inicial: ${dataConcursoSemHora.toLocaleDateString('pt-BR')} ${horaApuracaoInicial}`)
    console.log(`   Agora: ${agora.toLocaleDateString('pt-BR')} ${horaAtualStr}`)
    console.log(`   ${jaPassouHorarioInicial ? '✅ Já pode tentar liquidar' : '⏸️  Ainda não passou o horário inicial'}`)
    
    return jaPassouHorarioInicial
  } else if (dataConcursoSemHora.getTime() < hoje.getTime()) {
    // Dia passado: já pode liquidar
    console.log('✅ Verificação de horário: data do concurso é passado, permitindo liquidação')
    return true
  } else {
    // Dia futuro: não pode liquidar ainda
    console.log('⏸️  Verificação de horário: data do concurso é futuro, bloqueando liquidação')
    return false
  }
}
```

### Passo 3: Usar Verificação na Liquidação

**3.1. Aplicar verificação antes de liquidar cada aposta**

```typescript
// app/api/resultados/liquidar/route.ts (ou equivalente)

export async function POST(request: Request) {
  // ... buscar apostas pendentes ...
  
  const apostasPendentes = await buscarApostasPendentes()
  
  for (const aposta of apostasPendentes) {
    // Verificar se já passou o horário de apuração
    const extracaoId = aposta.loteria ? Number(aposta.loteria) : null
    const horarioAposta = aposta.horario && aposta.horario !== 'null' ? aposta.horario : null
    const loteriaNome = aposta.loteriaNome || null
    
    const podeLiquidar = jaPassouHorarioApuracao(
      extracaoId,
      aposta.dataConcurso,
      horarioAposta,
      loteriaNome
    )
    
    if (!podeLiquidar) {
      console.log(`⏸️  Pulando aposta ${aposta.id} - aguardando apuração`)
      continue // Pular esta aposta
    }
    
    // ... continuar com liquidação ...
  }
}
```

### Passo 4: Testar Verificação

```typescript
// Testes unitários

describe('jaPassouHorarioApuracao', () => {
  test('deve permitir liquidar se já passou o horário', () => {
    const dataConcurso = new Date('2026-01-15')
    const agora = new Date('2026-01-15T10:00:00') // 10:00
    
    // Mock do Date para retornar horário específico
    jest.spyOn(global, 'Date').mockImplementation(() => agora as any)
    
    // PT RIO com horário 09:20, startTimeReal 09:00
    // Se agora é 10:00, já passou
    const resultado = jaPassouHorarioApuracao(1, dataConcurso, '09:20', 'PT RIO')
    expect(resultado).toBe(true)
  })
  
  test('deve bloquear se ainda não passou o horário', () => {
    const dataConcurso = new Date('2026-01-15')
    const agora = new Date('2026-01-15T08:00:00') // 08:00
    
    jest.spyOn(global, 'Date').mockImplementation(() => agora as any)
    
    // PT RIO com horário 09:20, startTimeReal 09:00
    // Se agora é 08:00, ainda não passou
    const resultado = jaPassouHorarioApuracao(1, dataConcurso, '09:20', 'PT RIO')
    expect(resultado).toBe(false)
  })
  
  test('deve bloquear se não tem sorteio no dia', () => {
    const dataConcurso = new Date('2026-01-18') // Domingo (dia 0)
    const agora = new Date('2026-01-18T10:00:00')
    
    jest.spyOn(global, 'Date').mockImplementation(() => agora as any)
    
    // PT RIO não tem sorteio no domingo
    const resultado = jaPassouHorarioApuracao(1, dataConcurso, '09:20', 'PT RIO')
    expect(resultado).toBe(false)
  })
  
  test('deve permitir liquidar se é dia passado', () => {
    const dataConcurso = new Date('2026-01-14') // Ontem
    const agora = new Date('2026-01-15T10:00:00') // Hoje
    
    jest.spyOn(global, 'Date').mockImplementation(() => agora as any)
    
    const resultado = jaPassouHorarioApuracao(1, dataConcurso, '09:20', 'PT RIO')
    expect(resultado).toBe(true)
  })
  
  test('deve bloquear se é dia futuro', () => {
    const dataConcurso = new Date('2026-01-16') // Amanhã
    const agora = new Date('2026-01-15T10:00:00') // Hoje
    
    jest.spyOn(global, 'Date').mockImplementation(() => agora as any)
    
    const resultado = jaPassouHorarioApuracao(1, dataConcurso, '09:20', 'PT RIO')
    expect(resultado).toBe(false)
  })
})
```

---

## 📊 Estrutura de Dados Necessária

### 1. Interface de Extração

```typescript
interface Extracao {
  id: number
  name: string              // Nome da loteria (ex: "PT RIO", "LOOK")
  time: string              // Horário interno (ex: "09:20", "20:15")
  closeTime?: string         // Horário de fechamento (opcional)
  active: boolean            // Se está ativa
  // ... outros campos
}
```

### 2. Interface de Horário Real

```typescript
interface HorarioRealApuracao {
  name: string               // Nome da loteria
  time: string               // Horário interno
  startTimeReal: string      // Horário inicial real (ex: "09:00")
  closeTimeReal: string      // Horário final real (ex: "09:30")
  diasSemSorteio?: number[]  // Dias sem sorteio [0=Domingo, ..., 6=Sábado]
}
```

### 3. Interface de Resultado

```typescript
interface ResultadoItem {
  loteria: string            // Nome da loteria
  horario: string            // Horário normalizado
  drawTime: string           // Horário normalizado (mesmo que horario)
  horarioOriginal?: string   // Horário original (opcional, para referência)
  date: string               // Data do resultado
  position: number           // Posição do prêmio
  milhar: number             // Milhar sorteado
  // ... outros campos
}
```

### 4. Interface de Aposta

```typescript
interface Aposta {
  id: number
  loteria: string | number   // ID ou nome da loteria
  horario: string | null     // Horário da aposta
  dataConcurso: Date | null  // Data do concurso
  // ... outros campos
}
```

---

## 📝 Exemplos Completos

### Exemplo 1: Normalização de Horário PT SP

```typescript
// Cenário: Resultado vem com horário "20:40" (horário real de apuração)
// Objetivo: Normalizar para "20:15" (horário interno)

const resultadoOriginal = {
  loteria: 'PT SP',
  horario: '20:40',
  milhar: 1234,
  position: 1
}

const horarioNormalizado = normalizarHorarioResultado(
  resultadoOriginal.loteria,
  resultadoOriginal.horario
)
// horarioNormalizado = "20:15"

const resultadoNormalizado = {
  ...resultadoOriginal,
  horario: horarioNormalizado,
  drawTime: horarioNormalizado,
  horarioOriginal: resultadoOriginal.horario
}
```

### Exemplo 2: Verificação de Horário Antes de Liquidar

```typescript
// Cenário: Aposta de PT RIO às 09:20 no dia 15/01/2026
// Objetivo: Verificar se já passou o horário de apuração antes de liquidar

const aposta = {
  id: 123,
  loteria: '1', // ID da PT RIO
  horario: '09:20',
  dataConcurso: new Date('2026-01-15')
}

// Verificar se pode liquidar
const podeLiquidar = jaPassouHorarioApuracao(
  aposta.loteria,
  aposta.dataConcurso,
  aposta.horario,
  'PT RIO'
)

if (!podeLiquidar) {
  console.log('⏸️  Aguardando apuração...')
  return
}

// Continuar com liquidação...
```

---

## ✅ Checklist de Implementação

### Solução 1: Normalização de Horários

- [ ] Criar arquivo `horarios-reais-apuracao.ts` com estrutura de dados
- [ ] Criar arquivo `extracoes.ts` com lista de extrações (se não existir)
- [ ] Implementar função `getHorarioRealApuracao()`
- [ ] Implementar função `normalizarHorarioResultado()`
- [ ] Aplicar normalização na API de resultados
- [ ] Testar normalização com diferentes loterias
- [ ] Verificar se horários estão sendo normalizados corretamente

### Solução 2: Verificação de Horário de Apuração

- [ ] Implementar função `temSorteioNoDia()`
- [ ] Implementar função `jaPassouHorarioApuracao()`
- [ ] Aplicar verificação antes de liquidar cada aposta
- [ ] Testar verificação com diferentes cenários:
  - [ ] Horário já passou
  - [ ] Horário ainda não passou
  - [ ] Dia sem sorteio
  - [ ] Dia passado
  - [ ] Dia futuro
- [ ] Verificar logs de debug estão funcionando

---

## 🔗 Referências

- **Documento de Soluções:** `/docs/SOLUCOES_LIQUIDACAO.md`
- **Status de Implementação:** `/docs/STATUS_IMPLEMENTACAO_LIQUIDACAO.md`
- **Código de Referência:** 
  - `/app/api/resultados/route.ts` (normalização)
  - `/app/api/resultados/liquidar/route.ts` (verificação)
  - `/data/horarios-reais-apuracao.ts` (estrutura de dados)

---

**Última atualização:** 15 de Janeiro de 2026
