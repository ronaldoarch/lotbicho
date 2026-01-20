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
  | 'QUINA_GRUPO'
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
    case 'QUINA_GRUPO':
      return 5
    default:
      return 0 // Não é modalidade de grupo ou não tem validação
  }
}

// ============================================================================
// TABELA DE ODDS (MULTIPLICADORES)
// ============================================================================

/**
 * Busca a cotação dinâmica de uma modalidade a partir do nome.
 * Retorna o multiplicador extraído da string de cotação (ex: "1x R$ 16.00" -> 16).
 */
export function buscarCotacaoDinamica(modalityName: string): number | null {
  try {
    // Importar MODALITIES (funciona tanto no cliente quanto no servidor)
    const { MODALITIES } = require('@/data/modalities')
    const modality = MODALITIES.find((m: any) => m.name === modalityName)
    
    if (!modality || !modality.value) {
      return null
    }

    // Extrair o número da string "1x R$ 16.00" -> 16
    // O formato é "1x R$ VALOR" onde VALOR é o multiplicador
    // Extrair o valor após "R$" ou o último número grande encontrado
    const rMatch = modality.value.match(/R\$\s*(\d+(?:\.\d+)?)/)
    if (rMatch) {
      return parseFloat(rMatch[1])
    }
    
    // Fallback: procurar por números maiores que 10 (provavelmente o multiplicador)
    const numbers = modality.value.match(/(\d+(?:\.\d+)?)/g)
    if (numbers && numbers.length > 0) {
      // Pegar o maior número encontrado (geralmente é o multiplicador)
      const maxNumber = Math.max(...numbers.map((n: string) => parseFloat(n)))
      if (maxNumber >= 10) {
        return maxNumber
      }
    }

    return null
  } catch (error) {
    // Em caso de erro, retorna null para usar a tabela fixa como fallback
    return null
  }
}

/**
 * Busca a odd (multiplicador) de uma modalidade para um intervalo de posições.
 * 
 * Primeiro tenta buscar a cotação dinâmica, se não encontrar, usa a tabela fixa.
 * 
 * NOTA: Estes valores são exemplos. Devem ser configurados conforme regras da banca.
 */
export function buscarOdd(
  modalidade: ModalityType,
  pos_from: number,
  pos_to: number,
  modalityName?: string
): number {
  // Tentar buscar cotação dinâmica primeiro
  if (modalityName) {
    const cotacaoDinamica = buscarCotacaoDinamica(modalityName)
    if (cotacaoDinamica !== null) {
      return cotacaoDinamica
    }
  }
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
    QUINA_GRUPO: {
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
 * Confere um palpite de quina de grupo.
 */
export function conferirQuinaGrupo(
  resultado: number[],
  gruposApostados: number[],
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  if (gruposApostados.length !== 5) {
    throw new Error('Quina de grupo deve ter exatamente 5 grupos')
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
// CÁLCULO DE PRÊMIOS ADICIONAIS (LOTEP e LOTECE)
// ============================================================================

/**
 * Calcula o 6º prêmio somando os 5 primeiros prêmios.
 * Regra: Soma dos 5 primeiros, pega os últimos 4 dígitos.
 * 
 * @param premios Array com pelo menos 5 prêmios
 * @returns 6º prêmio (4 dígitos: 0000-9999)
 */
export function calcular6Premio(premios: number[]): number {
  if (premios.length < 5) {
    throw new Error('Precisa de pelo menos 5 prêmios para calcular o 6º')
  }
  
  // Soma os 5 primeiros prêmios
  const soma = premios[0] + premios[1] + premios[2] + premios[3] + premios[4]
  
  // Pega últimos 4 dígitos (módulo 10000)
  return soma % 10000
}

/**
 * Calcula o 7º prêmio multiplicando o 1º pelo 2º.
 * Regra: Multiplica 1º × 2º, remove 3 últimos dígitos, pega os 3 do meio.
 * 
 * @param premios Array com pelo menos 2 prêmios
 * @returns 7º prêmio (3 dígitos: 000-999)
 */
export function calcular7Premio(premios: number[]): number {
  if (premios.length < 2) {
    throw new Error('Precisa de pelo menos 2 prêmios para calcular o 7º')
  }
  
  // Multiplica 1º × 2º
  const multiplicacao = premios[0] * premios[1]
  
  // Divide por 1000 (remove 3 últimos dígitos)
  const dividido = Math.floor(multiplicacao / 1000)
  
  // Pega módulo 1000 (pega 3 dígitos do meio)
  return dividido % 1000
}

/**
 * Calcula prêmios adicionais (6º e 7º) a partir dos primeiros prêmios.
 * Usado para LOTEP e LOTECE que têm até 10 prêmios.
 * 
 * @param premios Array com os primeiros prêmios sorteados (pelo menos 5)
 * @param qtdPremiosDesejados Quantidade total de prêmios desejados (6, 7, 8, 9 ou 10)
 * @returns Array completo com prêmios sorteados + calculados
 */
export function calcularPremiosAdicionais(
  premios: number[],
  qtdPremiosDesejados: number = 7
): number[] {
  if (premios.length < 5) {
    throw new Error('Precisa de pelo menos 5 prêmios sorteados para calcular prêmios adicionais')
  }
  
  const resultado = [...premios] // Copia os prêmios sorteados
  
  // 6º prêmio: Soma dos 5 primeiros
  if (qtdPremiosDesejados >= 6) {
    resultado.push(calcular6Premio(premios))
  }
  
  // 7º prêmio: Multiplicação 1º × 2º
  if (qtdPremiosDesejados >= 7) {
    resultado.push(calcular7Premio(premios))
  }
  
  // TODO: Implementar regras para 8º, 9º e 10º prêmios quando necessário
  // Para LOTEP e LOTECE que têm 10 prêmios, confirmar regras específicas
  
  return resultado
}

// ============================================================================

/**
 * Gera um resultado instantâneo (lista de milhares sorteadas).
 * Para LOTEP e LOTECE (qtdPremios >= 6), calcula os prêmios 6º e 7º automaticamente.
 */
export function gerarResultadoInstantaneo(qtdPremios: number = 7): InstantResult {
  // Para até 5 prêmios, gera todos aleatoriamente
  // Para 6 ou mais, gera os 5 primeiros e calcula os demais
  const qtdSorteados = qtdPremios <= 5 ? qtdPremios : 5
  const prizes: number[] = []
  
  for (let i = 0; i < qtdSorteados; i++) {
    // Gera número aleatório de 0000 a 9999
    const milhar = Math.floor(Math.random() * 10000)
    prizes.push(milhar)
  }
  
  // Se precisar de mais prêmios (LOTEP/LOTECE), calcula os adicionais
  if (qtdPremios > 5) {
    const premiosCompletos = calcularPremiosAdicionais(prizes, qtdPremios)
    prizes.length = 0 // Limpa array
    prizes.push(...premiosCompletos) // Adiciona prêmios completos
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
 * 
 * Lógica de Premiação:
 * 1. Calcula unidades e valor unitário baseado na modalidade e posições
 * 2. Confere quantos acertos o palpite teve contra o resultado oficial
 * 3. Busca a odd (multiplicador) - tenta cotação dinâmica primeiro, depois tabela fixa
 * 4. Calcula prêmio por unidade = odd × valor unitário
 * 5. Calcula prêmio total = acertos × prêmio por unidade
 * 
 * @param modalityName - Nome da modalidade (ex: "Dupla de Grupo") para buscar cotação dinâmica
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
  divisaoTipo: DivisionType,
  modalityName?: string
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
    } else if (modalidade === 'QUINA_GRUPO') {
      prize = conferirQuinaGrupo(resultado.prizes, palpite.grupos!, pos_from, pos_to)
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
  // Tenta usar cotação dinâmica se modalityName fornecido, senão usa tabela fixa
  const odd = buscarOdd(modalidade, pos_from, pos_to, modalityName)
  const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)
  
  // Calcular quantidade de posições
  const qtdPosicoes = pos_to - pos_from + 1
  
  // Multiplicar pela quantidade de posições no final
  const totalPrize = calcularPremioPalpite(prize.hits, premioUnidade) * qtdPosicoes
  
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
