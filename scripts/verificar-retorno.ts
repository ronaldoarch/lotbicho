/**
 * Script para verificar cálculo de retorno previsto
 * 
 * Dados da aposta:
 * - Modalidade: Grupo
 * - Posição: 1º ao 5º
 * - Palpites: 4 grupos (23, 12, 07, 08)
 * - Valor por palpite: R$ 10.00
 * - Valor total: R$ 40.00
 * - Retorno previsto: R$ 144.00
 */

import {
  calcularGrupo,
  calcularPremioUnidade,
  buscarOdd,
  type ModalityType,
} from '../lib/bet-rules-engine'

function verificarRetorno() {
  console.log('🔍 Verificando cálculo de retorno previsto...\n')

  // Dados da aposta
  const modalidade: ModalityType = 'GRUPO'
  const pos_from = 1
  const pos_to = 5
  const qtdPalpites = 4
  const valorPorPalpite = 10.0
  const valorTotal = 40.0
  const retornoPrevistoEsperado = 144.0

  console.log('📊 Dados da aposta:')
  console.log(`   Modalidade: ${modalidade}`)
  console.log(`   Posição: ${pos_from}º ao ${pos_to}º`)
  console.log(`   Quantidade de palpites: ${qtdPalpites}`)
  console.log(`   Valor por palpite: R$ ${valorPorPalpite.toFixed(2)}`)
  console.log(`   Valor total: R$ ${valorTotal.toFixed(2)}`)
  console.log(`   Retorno previsto (esperado): R$ ${retornoPrevistoEsperado.toFixed(2)}`)
  console.log()

  // 1. Calcular unidades para um palpite de grupo
  const qtdGruposPorPalpite = 1 // Grupo simples
  const calculation = calcularGrupo(modalidade, qtdGruposPorPalpite, pos_from, pos_to, valorPorPalpite)

  console.log('📐 Cálculo de unidades:')
  console.log(`   Combinações: ${calculation.combinations}`)
  console.log(`   Posições: ${calculation.positions}`)
  console.log(`   Unidades: ${calculation.units}`)
  console.log(`   Valor unitário: R$ ${calculation.unitValue.toFixed(2)}`)
  console.log()

  // 2. Buscar odd (cotação)
  const odd = buscarOdd(modalidade, pos_from, pos_to, 'Grupo')
  console.log('💰 Cotação (Odd):')
  console.log(`   Odd para Grupo (1º-5º): ${odd}x`)
  console.log()

  // 3. Calcular prêmio por unidade
  const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)
  console.log('💵 Prêmio por unidade:')
  console.log(`   Odd × Valor unitário = ${odd} × R$ ${calculation.unitValue.toFixed(2)}`)
  console.log(`   Prêmio por unidade = R$ ${premioUnidade.toFixed(2)}`)
  console.log()

  // 4. Calcular retorno por palpite (assumindo 1 acerto)
  const acertosPorPalpite = 1 // Retorno previsto assume melhor caso
  const retornoPorPalpite = acertosPorPalpite * premioUnidade
  console.log('🎯 Retorno por palpite (1 acerto):')
  console.log(`   Acertos × Prêmio por unidade = ${acertosPorPalpite} × R$ ${premioUnidade.toFixed(2)}`)
  console.log(`   Retorno por palpite = R$ ${retornoPorPalpite.toFixed(2)}`)
  console.log()

  // 5. Calcular retorno total
  const retornoTotalCalculado = qtdPalpites * retornoPorPalpite
  console.log('📊 Retorno total calculado:')
  console.log(`   Quantidade de palpites × Retorno por palpite`)
  console.log(`   ${qtdPalpites} × R$ ${retornoPorPalpite.toFixed(2)} = R$ ${retornoTotalCalculado.toFixed(2)}`)
  console.log()

  // 6. Comparar com o esperado
  console.log('✅ Comparação:')
  console.log(`   Retorno esperado: R$ ${retornoPrevistoEsperado.toFixed(2)}`)
  console.log(`   Retorno calculado: R$ ${retornoTotalCalculado.toFixed(2)}`)
  console.log()

  const diferenca = Math.abs(retornoTotalCalculado - retornoPrevistoEsperado)
  const estaCorreto = diferenca < 0.01 // Tolerância de centavos

  if (estaCorreto) {
    console.log('✅ RESULTADO: Retorno previsto está CORRETO! ✓')
  } else {
    console.log(`❌ RESULTADO: Retorno previsto está INCORRETO!`)
    console.log(`   Diferença: R$ ${diferenca.toFixed(2)}`)
    console.log(`   `)
    console.log(`   Possíveis causas:`)
    console.log(`   - Cotação dinâmica diferente da tabela fixa`)
    console.log(`   - Lógica de cálculo diferente do esperado`)
    console.log(`   - Divisão de valor incorreta`)
  }

  console.log()
  console.log('='.repeat(60))
  console.log('🔍 Verificação detalhada da fórmula:')
  console.log('='.repeat(60))
  console.log()
  console.log('Fórmula:')
  console.log('  Retorno = Qtd_Palpites × Acertos × (Odd × Valor_Unitário)')
  console.log()
  console.log('Substituindo:')
  console.log(`  Retorno = ${qtdPalpites} × ${acertosPorPalpite} × (${odd} × R$ ${calculation.unitValue.toFixed(2)})`)
  console.log(`  Retorno = ${qtdPalpites} × ${acertosPorPalpite} × R$ ${premioUnidade.toFixed(2)}`)
  console.log(`  Retorno = ${qtdPalpites} × R$ ${retornoPorPalpite.toFixed(2)}`)
  console.log(`  Retorno = R$ ${retornoTotalCalculado.toFixed(2)}`)
  console.log()
}

// Executar verificação
verificarRetorno()
