/**
 * Motor de Regras do Backend - Jogo do Bicho
 * 
 * Implementação completa das regras conforme manual-regras-backend.md
 */

import { ANIMALS } from '@/data/animals'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type ModalityType =
  | 'GRUPO'
  | 'DUPLA_GRUPO'
  | 'TERNO_GRUPO'
  | 'QUADRA_GRUPO'
  | 'DEZENA'
  | 'CENTENA'
  | 'MILHAR'
  | 'DEZENA_INVERTIDA'
  | 'CENTENA_INVERTIDA'
  | 'MILHAR_INVERTIDA'
  | 'MILHAR_CENTENA'
  | 'PASSE'
  | 'PASSE_VAI_E_VEM'

export type DivisionType = 'all' | 'each'

export interface PositionRange {
  pos_from: number // 1-indexed
  pos_to: number // 1-indexed
}

export interface BetCalculation {
  combinations: number
  positions: number
  units: number
  unitValue: number
}

export interface PrizeCalculation {
  hits: number
  prizePerUnit: number
  totalPrize: number
}

export interface InstantResult {
  prizes: number[] // Lista de milhares (índice 0 = 1º prêmio)
  groups: number[] // Lista de grupos correspondentes
}

// ============================================================================
// TABELA DE GRUPOS E DEZENAS
// ============================================================================

/**
 * Converte uma dezena (00-99) para o grupo correspondente (1-25).
 * 
 * Cada grupo = 4 dezenas consecutivas
 * Grupo 25 termina em 00 (inclui 97, 98, 99, 00)
 */
export function dezenaParaGrupo(dezena: number): number {
  if (dezena === 0) {
    return 25 // 00 pertence ao grupo 25 (Vaca)
  }
  return Math.floor((dezena - 1) / 4) + 1
}

/**
 * Extrai a dezena de um milhar e retorna o grupo.
 */
export function milharParaGrupo(milhar: number): number {
  const dezena = milhar % 100 // Últimos 2 dígitos
  return dezenaParaGrupo(dezena)
}

/**
 * Converte uma lista de milhares em grupos para um intervalo de posições.
 */
export function gruposNoResultado(
  resultadosMilhar: number[],
  pos_from: number,
  pos_to: number
): number[] {
  const grupos: number[] = []
  for (let i = pos_from - 1; i < pos_to && i < resultadosMilhar.length; i++) {
    grupos.push(milharParaGrupo(resultadosMilhar[i]))
  }
  return grupos
}

/**
 * Retorna as dezenas de um grupo (1-25).
 */
export function grupoParaDezenas(grupo: number): number[] {
  if (grupo < 1 || grupo > 25) {
    throw new Error(`Grupo inválido: ${grupo}`)
  }
  
  if (grupo === 25) {
    return [97, 98, 99, 0] // 00 = 0
  }
  
  const start = (grupo - 1) * 4 + 1
  return [start, start + 1, start + 2, start + 3]
}

// ============================================================================
// PERMUTAÇÕES DISTINTAS (PARA MODALIDADES INVERTIDAS)
// ============================================================================

/**
 * Conta quantas permutações distintas existem para um número.
 */
export function contarPermutacoesDistintas(numero: string): number {
  const digits = numero.split('')
  const seen = new Set<string>()
  
  function permute(arr: string[], start: number) {
    if (start === arr.length) {
      seen.add(arr.join(''))
      return
    }
    
    const used = new Set<string>()
    for (let i = start; i < arr.length; i++) {
      if (used.has(arr[i])) continue
      used.add(arr[i])
      
      // Swap
      const temp = arr[start]
      arr[start] = arr[i]
      arr[i] = temp
      
      permute(arr, start + 1)
      
      // Swap back
      arr[i] = arr[start]
      arr[start] = temp
    }
  }
  
  permute([...digits], 0)
  return seen.size
}

/**
 * Gera todas as permutações distintas de um número.
 */
export function gerarPermutacoesDistintas(numero: string): string[] {
  const digits = numero.split('')
  const seen = new Set<string>()
  
  function permute(arr: string[], start: number) {
    if (start === arr.length) {
      seen.add(arr.join(''))
      return
    }
    
    const used = new Set<string>()
    for (let i = start; i < arr.length; i++) {
      if (used.has(arr[i])) continue
      used.add(arr[i])
      
      const temp = arr[start]
      arr[start] = arr[i]
      arr[i] = temp
      
      permute(arr, start + 1)
      
      arr[i] = arr[start]
      arr[start] = temp
    }
  }
  
  permute([...digits], 0)
  return Array.from(seen).sort()
}

// ============================================================================
// CÁLCULO DE UNIDADES E VALORES
// ============================================================================

/**
 * Calcula o número de unidades de aposta.
 */
export function calcularUnidades(
  qtdCombinacoes: number,
  pos_from: number,
  pos_to: number
): number {
  const qtdPosicoes = pos_to - pos_from + 1
  return qtdCombinacoes * qtdPosicoes
}

/**
 * Calcula o valor unitário de uma aposta.
 */
export function calcularValorUnitario(
  valorPorPalpite: number,
  unidades: number
): number {
  if (unidades === 0) {
    return 0
  }
  return valorPorPalpite / unidades
}

/**
 * Calcula o valor por palpite baseado no tipo de divisão.
 */
export function calcularValorPorPalpite(
  valorDigitado: number,
  qtdPalpites: number,
  divisaoTipo: DivisionType
): number {
  if (divisaoTipo === 'each') {
    return valorDigitado
  } else {
    if (qtdPalpites === 0) {
      return 0
    }
    return valorDigitado / qtdPalpites
  }
}

/**
 * Calcula o valor total da aposta baseado no tipo de divisão.
 * - "each": valor digitado é por palpite, então total = valor * qtd_palpites
 * - "all": valor digitado é o total, então total = valor
 */
export function calcularValorTotalAposta(
  valorDigitado: number,
  qtdPalpites: number,
  divisaoTipo: DivisionType
): number {
  if (divisaoTipo === 'each') {
    return valorDigitado * qtdPalpites
  } else {
    return valorDigitado
  }
}

// ============================================================================
// CÁLCULO POR MODALIDADE
// ============================================================================

/**
 * Calcula unidades e valor unitário para modalidades de número (normal ou invertida).
 */
export function calcularNumero(
  modalidade: ModalityType,
  numero: string,
  pos_from: number,
  pos_to: number,
  valorPalpite: number
): BetCalculation {
  const qtdPosicoes = pos_to - pos_from + 1
  const invertida = modalidade.includes('INVERTIDA')
  
  let combinations = 1
  if (invertida) {
    combinations = contarPermutacoesDistintas(numero)
  }
  
  const units = combinations * qtdPosicoes
  const unitValue = calcularValorUnitario(valorPalpite, units)
  
  return {
    combinations,
    positions: qtdPosicoes,
    units,
    unitValue,
  }
}

/**
 * Calcula unidades e valor para modalidades de grupo.
 */
export function calcularGrupo(
  modalidade: ModalityType,
  qtdGruposPalpite: number,
  pos_from: number,
  pos_to: number,
  valorPalpite: number
): BetCalculation {
  const qtdPosicoes = pos_to - pos_from + 1
  
  // Validar quantidade de grupos
  const expectedGroups = getExpectedGroups(modalidade)
  if (expectedGroups > 0 && qtdGruposPalpite !== expectedGroups) {
    throw new Error(
      `Quantidade de grupos inválida: esperado ${expectedGroups}, recebido ${qtdGruposPalpite}`
    )
  }
  
  const combinations = 1 // Simples (não combinado)
  const units = combinations * qtdPosicoes
  const unitValue = calcularValorUnitario(valorPalpite, units)
  
  return {
    combinations,
    positions: qtdPosicoes,
    units,
    unitValue,
  }
}

function getExpectedGroups(modalidade: ModalityType): number {
  switch (modalidade) {
    case 'GRUPO':
      return 1
    case 'DUPLA_GRUPO':
      return 2
    case 'TERNO_GRUPO':
      return 3
    case 'QUADRA_GRUPO':
      return 4
    default:
      return 0 // Não é modalidade de grupo ou não tem validação
  }
}

// ============================================================================
// TABELA DE ODDS (MULTIPLICADORES)
// ============================================================================

/**
 * Busca a odd (multiplicador) de uma modalidade para um intervalo de posições.
 * 
 * NOTA: Estes valores são exemplos. Devem ser configurados conforme regras da banca.
 */
export function buscarOdd(
  modalidade: ModalityType,
  pos_from: number,
  pos_to: number
): number {
  const posKey = `${pos_from}-${pos_to}`
  
  // Tabela de odds por modalidade e intervalo
  const oddsTable: Record<string, Record<string, number>> = {
    DEZENA: {
      '1-1': 60,
      '1-3': 60,
      '1-5': 60,
      '1-7': 60,
    },
    CENTENA: {
      '1-1': 600,
      '1-3': 600,
      '1-5': 600,
      '1-7': 600,
    },
    MILHAR: {
      '1-1': 5000,
      '1-3': 5000,
      '1-5': 5000,
    },
    MILHAR_INVERTIDA: {
      '1-1': 200,
      '1-3': 200,
      '1-5': 200,
    },
    CENTENA_INVERTIDA: {
      '1-1': 600,
      '1-3': 600,
      '1-5': 600,
      '1-7': 600,
    },
    DEZENA_INVERTIDA: {
      '1-1': 60,
      '1-3': 60,
      '1-5': 60,
      '1-7': 60,
    },
    GRUPO: {
      '1-1': 18,
      '1-3': 18,
      '1-5': 18,
      '1-7': 18,
    },
    DUPLA_GRUPO: {
      '1-1': 180,
      '1-3': 180,
      '1-5': 180,
      '1-7': 180,
    },
    TERNO_GRUPO: {
      '1-1': 1800,
      '1-3': 1800,
      '1-5': 1800,
      '1-7': 1800,
    },
    QUADRA_GRUPO: {
      '1-1': 5000,
      '1-3': 5000,
      '1-5': 5000,
      '1-7': 5000,
    },
    PASSE: {
      '1-2': 300, // Fixo 1º-2º
    },
    PASSE_VAI_E_VEM: {
      '1-2': 150, // Fixo 1º-2º
    },
    MILHAR_CENTENA: {
      '1-1': 3300, // Valor combinado
      '1-3': 3300,
      '1-5': 3300,
    },
  }
  
  const modalidadeOdds = oddsTable[modalidade]
  if (!modalidadeOdds) {
    throw new Error(`Modalidade não encontrada: ${modalidade}`)
  }
  
  // Para passe, sempre usar 1-2
  if (modalidade === 'PASSE' || modalidade === 'PASSE_VAI_E_VEM') {
    return modalidadeOdds['1-2'] || 0
  }
  
  return modalidadeOdds[posKey] || modalidadeOdds['1-5'] || 0
}

/**
 * Calcula o prêmio por unidade.
 */
export function calcularPremioUnidade(odd: number, valorUnitario: number): number {
  return odd * valorUnitario
}

/**
 * Calcula o prêmio total de um palpite.
 */
export function calcularPremioPalpite(
  acertos: number,
  premioUnidade: number
): number {
  return acertos * premioUnidade
}

// ============================================================================
// CONFERÊNCIA DE RESULTADOS
// ============================================================================

/**
 * Confere um palpite de número (dezena, centena, milhar) contra resultado.
 */
export function conferirNumero(
  resultado: number[],
  numeroApostado: string,
  modalidade: ModalityType,
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  const invertida = modalidade.includes('INVERTIDA')
  let combinations: string[] = [numeroApostado]
  
  if (invertida) {
    combinations = gerarPermutacoesDistintas(numeroApostado)
  }
  
  let hits = 0
  const numeroDigits = numeroApostado.length
  
  for (let pos = pos_from - 1; pos < pos_to && pos < resultado.length; pos++) {
    const premio = resultado[pos]
    const premioStr = premio.toString().padStart(4, '0')
    
    // Extrair os últimos N dígitos conforme modalidade
    let premioRelevante: string
    if (numeroDigits === 2) {
      premioRelevante = premioStr.slice(-2) // Dezena
    } else if (numeroDigits === 3) {
      premioRelevante = premioStr.slice(-3) // Centena
    } else {
      premioRelevante = premioStr // Milhar
    }
    
    // Verificar se alguma combinação bate
    if (combinations.includes(premioRelevante)) {
      hits++
    }
  }
  
  return {
    hits,
    prizePerUnit: 0, // Será calculado depois
    totalPrize: 0, // Será calculado depois
  }
}

/**
 * Confere um palpite de grupo simples.
 */
export function conferirGrupoSimples(
  resultado: number[],
  grupoApostado: number,
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  const grupos = gruposNoResultado(resultado, pos_from, pos_to)
  const hits = grupos.includes(grupoApostado) ? 1 : 0
  
  return {
    hits,
    prizePerUnit: 0,
    totalPrize: 0,
  }
}

/**
 * Confere um palpite de dupla de grupo.
 */
export function conferirDuplaGrupo(
  resultado: number[],
  gruposApostados: number[],
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  if (gruposApostados.length !== 2) {
    throw new Error('Dupla de grupo deve ter exatamente 2 grupos')
  }
  
  const grupos = gruposNoResultado(resultado, pos_from, pos_to)
  const gruposSet = new Set(grupos)
  
  const grupo1Presente = gruposSet.has(gruposApostados[0])
  const grupo2Presente = gruposSet.has(gruposApostados[1])
  
  const hits = grupo1Presente && grupo2Presente ? 1 : 0
  
  return {
    hits,
    prizePerUnit: 0,
    totalPrize: 0,
  }
}

/**
 * Confere um palpite de terno de grupo.
 */
export function conferirTernoGrupo(
  resultado: number[],
  gruposApostados: number[],
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  if (gruposApostados.length !== 3) {
    throw new Error('Terno de grupo deve ter exatamente 3 grupos')
  }
  
  const grupos = gruposNoResultado(resultado, pos_from, pos_to)
  const gruposSet = new Set(grupos)
  
  const todosPresentes = gruposApostados.every((g) => gruposSet.has(g))
  const hits = todosPresentes ? 1 : 0
  
  return {
    hits,
    prizePerUnit: 0,
    totalPrize: 0,
  }
}

/**
 * Confere um palpite de quadra de grupo.
 */
export function conferirQuadraGrupo(
  resultado: number[],
  gruposApostados: number[],
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  if (gruposApostados.length !== 4) {
    throw new Error('Quadra de grupo deve ter exatamente 4 grupos')
  }
  
  const grupos = gruposNoResultado(resultado, pos_from, pos_to)
  const gruposSet = new Set(grupos)
  
  const todosPresentes = gruposApostados.every((g) => gruposSet.has(g))
  const hits = todosPresentes ? 1 : 0
  
  return {
    hits,
    prizePerUnit: 0,
    totalPrize: 0,
  }
}

/**
 * Confere um palpite de passe (1º → 2º).
 */
export function conferirPasse(
  resultado: number[],
  grupo1: number,
  grupo2: number,
  vaiEVem: boolean = false
): PrizeCalculation {
  if (resultado.length < 2) {
    return { hits: 0, prizePerUnit: 0, totalPrize: 0 }
  }
  
  const grupo1Resultado = milharParaGrupo(resultado[0])
  const grupo2Resultado = milharParaGrupo(resultado[1])
  
  let hits = 0
  
  if (vaiEVem) {
    // Aceita ambas as ordens
    if (
      (grupo1Resultado === grupo1 && grupo2Resultado === grupo2) ||
      (grupo1Resultado === grupo2 && grupo2Resultado === grupo1)
    ) {
      hits = 1
    }
  } else {
    // Ordem exata
    if (grupo1Resultado === grupo1 && grupo2Resultado === grupo2) {
      hits = 1
    }
  }
  
  return {
    hits,
    prizePerUnit: 0,
    totalPrize: 0,
  }
}

// ============================================================================
// SORTEIO INSTANTÂNEO
// ============================================================================

/**
 * Gera um resultado instantâneo (lista de milhares sorteadas).
 */
export function gerarResultadoInstantaneo(qtdPremios: number = 7): InstantResult {
  const prizes: number[] = []
  
  for (let i = 0; i < qtdPremios; i++) {
    // Gera número aleatório de 0000 a 9999
    const milhar = Math.floor(Math.random() * 10000)
    prizes.push(milhar)
  }
  
  const groups = prizes.map((milhar) => milharParaGrupo(milhar))
  
  return {
    prizes,
    groups,
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE CONFERÊNCIA
// ============================================================================

/**
 * Confere um palpite completo contra um resultado.
 */
export function conferirPalpite(
  resultado: InstantResult,
  modalidade: ModalityType,
  palpite: {
    grupos?: number[]
    numero?: string
  },
  pos_from: number,
  pos_to: number,
  valorPorPalpite: number,
  divisaoTipo: DivisionType
): {
  calculation: BetCalculation
  prize: PrizeCalculation
  totalPrize: number
} {
  let calculation: BetCalculation
  let prize: PrizeCalculation
  
  // Calcular unidades e valor unitário
  if (modalidade.includes('GRUPO')) {
    const qtdGrupos = palpite.grupos?.length || 0
    calculation = calcularGrupo(modalidade, qtdGrupos, pos_from, pos_to, valorPorPalpite)
    
    // Conferir resultado
    if (modalidade === 'GRUPO') {
      prize = conferirGrupoSimples(resultado.prizes, palpite.grupos![0], pos_from, pos_to)
    } else if (modalidade === 'DUPLA_GRUPO') {
      prize = conferirDuplaGrupo(resultado.prizes, palpite.grupos!, pos_from, pos_to)
    } else if (modalidade === 'TERNO_GRUPO') {
      prize = conferirTernoGrupo(resultado.prizes, palpite.grupos!, pos_from, pos_to)
    } else if (modalidade === 'QUADRA_GRUPO') {
      prize = conferirQuadraGrupo(resultado.prizes, palpite.grupos!, pos_from, pos_to)
    } else {
      throw new Error(`Modalidade de grupo não suportada: ${modalidade}`)
    }
  } else if (modalidade === 'PASSE' || modalidade === 'PASSE_VAI_E_VEM') {
    if (!palpite.grupos || palpite.grupos.length !== 2) {
      throw new Error('Passe requer exatamente 2 grupos')
    }
    calculation = {
      combinations: 1,
      positions: 1, // Fixo 1º-2º
      units: 1,
      unitValue: valorPorPalpite,
    }
    prize = conferirPasse(
      resultado.prizes,
      palpite.grupos[0],
      palpite.grupos[1],
      modalidade === 'PASSE_VAI_E_VEM'
    )
  } else {
    // Modalidade de número
    if (!palpite.numero) {
      throw new Error('Modalidade de número requer um número')
    }
    calculation = calcularNumero(modalidade, palpite.numero, pos_from, pos_to, valorPorPalpite)
    prize = conferirNumero(resultado.prizes, palpite.numero, modalidade, pos_from, pos_to)
  }
  
  // Buscar odd e calcular prêmio
  const odd = buscarOdd(modalidade, pos_from, pos_to)
  const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)
  const totalPrize = calcularPremioPalpite(prize.hits, premioUnidade)
  
  return {
    calculation,
    prize: {
      ...prize,
      prizePerUnit: premioUnidade,
      totalPrize,
    },
    totalPrize,
  }
}
