/**
 * Script para verificar cálculo de prêmio quando acerta apenas 1 de 4 palpites
 * 
 * Cenário:
 * - 4 palpites de Grupo
 * - Valor total: R$ 40,00
 * - Divisão: "all" (total dividido entre os palpites)
 * - Valor por palpite: R$ 10,00
 * - Se acertar apenas 1 palpite, quanto ganha?
 */

import {
  calcularGrupo,
  calcularPremioUnidade,
  calcularValorPorPalpite,
  buscarOdd,
  type ModalityType,
} from '../lib/bet-rules-engine'

function verificarPremioParcial() {
  console.log('🔍 Verificando prêmio quando acerta apenas 1 de 4 palpites...\n')

  // Dados da aposta
  const modalidade: ModalityType = 'GRUPO'
  const pos_from = 1
  const pos_to = 5
  const qtdPalpites = 4
  const valorTotal = 40.0
  const divisaoTipo: 'all' | 'each' = 'all' // Valor dividido entre os palpites

  console.log('📊 Dados da aposta:')
  console.log(`   Modalidade: ${modalidade}`)
  console.log(`   Posição: ${pos_from}º ao ${pos_to}º`)
  console.log(`   Quantidade de palpites: ${qtdPalpites}`)
  console.log(`   Valor total: R$ ${valorTotal.toFixed(2)}`)
  console.log(`   Tipo de divisão: ${divisaoTipo}`)
  console.log()

  // Calcular valor por palpite
  const valorPorPalpite = calcularValorPorPalpite(valorTotal, qtdPalpites, divisaoTipo)
  console.log('💰 Divisão do valor:')
  console.log(`   Valor por palpite: R$ ${valorPorPalpite.toFixed(2)}`)
  console.log(`   (R$ ${valorTotal.toFixed(2)} ÷ ${qtdPalpites} = R$ ${valorPorPalpite.toFixed(2)})`)
  console.log()

  // Calcular unidades para um palpite de grupo
  const qtdGruposPorPalpite = 1
  const calculation = calcularGrupo(modalidade, qtdGruposPorPalpite, pos_from, pos_to, valorPorPalpite)

  console.log('📐 Cálculo de unidades (por palpite):')
  console.log(`   Unidades: ${calculation.units}`)
  console.log(`   Valor unitário: R$ ${calculation.unitValue.toFixed(2)}`)
  console.log()

  // Buscar odd
  const odd = buscarOdd(modalidade, pos_from, pos_to, 'Grupo')
  console.log(`💰 Cotação (Odd): ${odd}x`)
  console.log()

  // Calcular prêmio por unidade
  const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)
  console.log('💵 Prêmio por unidade:')
  console.log(`   ${odd} × R$ ${calculation.unitValue.toFixed(2)} = R$ ${premioUnidade.toFixed(2)}`)
  console.log()

  // CENÁRIO 1: Acerta apenas 1 palpite
  console.log('='.repeat(60))
  console.log('🎯 CENÁRIO 1: Acerta apenas 1 dos 4 palpites')
  console.log('='.repeat(60))
  console.log()

  const acertosPalpite1 = 1 // Assumindo 1 acerto no palpite que acertou
  const premioPalpite1 = acertosPalpite1 * premioUnidade
  console.log(`   Acertos no palpite que ganhou: ${acertosPalpite1}`)
  console.log(`   Prêmio do palpite: ${acertosPalpite1} × R$ ${premioUnidade.toFixed(2)} = R$ ${premioPalpite1.toFixed(2)}`)
  console.log()
  console.log(`✅ RESULTADO: R$ ${premioPalpite1.toFixed(2)}`)
  console.log()

  // CENÁRIO 2: Acerta todos os 4 palpites
  console.log('='.repeat(60))
  console.log('🎯 CENÁRIO 2: Acerta todos os 4 palpites')
  console.log('='.repeat(60))
  console.log()

  const premioTotalTodos = qtdPalpites * premioUnidade
  console.log(`   Acertos por palpite: 1`)
  console.log(`   Prêmio total: ${qtdPalpites} × R$ ${premioUnidade.toFixed(2)} = R$ ${premioTotalTodos.toFixed(2)}`)
  console.log()
  console.log(`✅ RESULTADO: R$ ${premioTotalTodos.toFixed(2)}`)
  console.log()

  // Verificar se R$ 180 seria o valor correto
  console.log('='.repeat(60))
  console.log('🔍 Verificação: Seria R$ 180 o valor correto?')
  console.log('='.repeat(60))
  console.log()

  // Possível interpretação: Se o valor por palpite fosse diferente
  // Ou se houvesse um multiplicador diferente

  // Se o odd fosse diferente:
  const oddPara180 = 180 / (calculation.unitValue * 1) // 1 acerto
  console.log(`   Para ganhar R$ 180 com 1 acerto:`)
  console.log(`   Odd necessária: ${oddPara180.toFixed(2)}x`)
  console.log()

  // Se fosse "each" ao invés de "all":
  console.log('   Se fosse divisão "each" (cada palpite R$ 40,00):')
  const valorPorPalpiteEach = 40.0
  const calculationEach = calcularGrupo(modalidade, qtdGruposPorPalpite, pos_from, pos_to, valorPorPalpiteEach)
  const premioUnidadeEach = calcularPremioUnidade(odd, calculationEach.unitValue)
  const premio1AcertoEach = 1 * premioUnidadeEach
  console.log(`   Valor por palpite: R$ ${valorPorPalpiteEach.toFixed(2)}`)
  console.log(`   Valor unitário: R$ ${calculationEach.unitValue.toFixed(2)}`)
  console.log(`   Prêmio por unidade: R$ ${premioUnidadeEach.toFixed(2)}`)
  console.log(`   Prêmio com 1 acerto: R$ ${premio1AcertoEach.toFixed(2)}`)
  console.log()

  // Se houvesse multiplicador por quantidade de palpites?
  console.log('   Se houvesse bônus/multiplicador:')
  const multiplicadorPara180 = 180 / premioPalpite1
  console.log(`   Multiplicador necessário: ${multiplicadorPara180.toFixed(2)}x`)
  console.log(`   (R$ ${premioPalpite1.toFixed(2)} × ${multiplicadorPara180.toFixed(2)} = R$ 180)`)
  console.log()

  console.log('='.repeat(60))
  console.log('📝 CONCLUSÃO:')
  console.log('='.repeat(60))
  console.log()
  console.log(`   Com divisão "all" (valor dividido):`)
  console.log(`   - Acerta 1 palpite: R$ ${premioPalpite1.toFixed(2)}`)
  console.log(`   - Acerta 4 palpites: R$ ${premioTotalTodos.toFixed(2)}`)
  console.log()
  console.log(`   Se fosse divisão "each" (cada palpite R$ 40,00):`)
  console.log(`   - Acerta 1 palpite: R$ ${premio1AcertoEach.toFixed(2)}`)
  console.log()
  console.log(`   Para resultar em R$ 180, seria necessário:`)
  console.log(`   - Odd de ${oddPara180.toFixed(2)}x (atual é ${odd}x)`)
  console.log(`   - Ou multiplicador de ${multiplicadorPara180.toFixed(2)}x`)
  console.log()
}

// Executar verificação
verificarPremioParcial()
