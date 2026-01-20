/**
 * Script para testar a nova fórmula com multiplicação por posições
 */

import {
  calcularGrupo,
  calcularPremioUnidade,
  buscarOdd,
  type ModalityType,
} from '../lib/bet-rules-engine'

function testarNovaFormula() {
  console.log('🧪 Testando nova fórmula com multiplicação por posições...\n')

  const modalidade: ModalityType = 'GRUPO'
  const pos_from = 1
  const pos_to = 5
  const valorPorPalpite = 10.0
  const qtdPosicoes = pos_to - pos_from + 1

  const calculation = calcularGrupo(modalidade, 1, pos_from, pos_to, valorPorPalpite)
  const odd = buscarOdd(modalidade, pos_from, pos_to, 'Grupo')
  const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)

  console.log('📊 Nova fórmula:')
  console.log(`   Prêmio = Acertos × (Odd × Valor_Unitário) × Posições`)
  console.log()
  console.log('🎯 Cenário 1: Acerta apenas 1 dos 4 palpites')
  console.log(`   Prêmio = 1 × (${odd} × R$ ${calculation.unitValue.toFixed(2)}) × ${qtdPosicoes}`)
  const premio1Palpite = 1 * premioUnidade * qtdPosicoes
  console.log(`   Prêmio = 1 × R$ ${premioUnidade.toFixed(2)} × ${qtdPosicoes}`)
  console.log(`   Prêmio = R$ ${premio1Palpite.toFixed(2)} ✅`)
  console.log()

  console.log('🎯 Cenário 2: Acerta todos os 4 palpites')
  console.log(`   Prêmio = 4 × (${odd} × R$ ${calculation.unitValue.toFixed(2)}) × ${qtdPosicoes}`)
  const premio4Palpites = 4 * premioUnidade * qtdPosicoes
  console.log(`   Prêmio = 4 × R$ ${premioUnidade.toFixed(2)} × ${qtdPosicoes}`)
  console.log(`   Prêmio = R$ ${premio4Palpites.toFixed(2)}`)
  console.log()
  console.log(`   ⚠️  Observação: Com a nova fórmula, acertar todos os 4 palpites`)
  console.log(`      resultaria em R$ ${premio4Palpites.toFixed(2)}, não em R$ 144,00`)
  console.log()
}

testarNovaFormula()
