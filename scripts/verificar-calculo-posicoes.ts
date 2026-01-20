/**
 * Script para verificar se o cálculo deve multiplicar pela quantidade de posições no final
 * 
 * Testando diferentes interpretações da regra de cálculo
 */

import {
  calcularGrupo,
  calcularPremioUnidade,
  buscarOdd,
  type ModalityType,
} from '../lib/bet-rules-engine'

function verificarCalculoComPosicoes() {
  console.log('🔍 Verificando cálculo multiplicando por quantidade de posições...\n')

  // Dados da aposta
  const modalidade: ModalityType = 'GRUPO'
  const pos_from = 1
  const pos_to = 5
  const qtdPalpites = 4
  const valorPorPalpite = 10.0
  const qtdPosicoes = pos_to - pos_from + 1 // 5 posições

  console.log('📊 Dados da aposta:')
  console.log(`   Modalidade: ${modalidade}`)
  console.log(`   Posição: ${pos_from}º ao ${pos_to}º (${qtdPosicoes} posições)`)
  console.log(`   Quantidade de palpites: ${qtdPalpites}`)
  console.log(`   Valor por palpite: R$ ${valorPorPalpite.toFixed(2)}`)
  console.log()

  // Calcular unidades (método atual)
  const calculation = calcularGrupo(modalidade, 1, pos_from, pos_to, valorPorPalpite)
  const odd = buscarOdd(modalidade, pos_from, pos_to, 'Grupo')
  
  console.log('📐 Cálculo ATUAL:')
  console.log(`   Unidades: ${calculation.units} (${calculation.combinations} comb × ${calculation.positions} pos)`)
  console.log(`   Valor unitário: R$ ${calculation.unitValue.toFixed(2)}`)
  console.log(`   Odd: ${odd}x`)
  console.log(`   Prêmio por unidade: ${odd} × R$ ${calculation.unitValue.toFixed(2)} = R$ ${(odd * calculation.unitValue).toFixed(2)}`)
  console.log(`   Prêmio com 1 acerto: 1 × R$ ${(odd * calculation.unitValue).toFixed(2)} = R$ ${(1 * odd * calculation.unitValue).toFixed(2)}`)
  console.log()

  // OPÇÃO 1: Multiplicar pelo número de posições no final
  console.log('='.repeat(60))
  console.log('🔍 OPÇÃO 1: Multiplicar por posições no final')
  console.log('='.repeat(60))
  console.log()
  
  const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)
  const premioComPosicoes = premioUnidade * qtdPosicoes
  
  console.log(`   Prêmio por unidade (sem multiplicar pos): R$ ${premioUnidade.toFixed(2)}`)
  console.log(`   Multiplicador de posições: × ${qtdPosicoes}`)
  console.log(`   Prêmio final (1 acerto): R$ ${premioUnidade.toFixed(2)} × ${qtdPosicoes} = R$ ${premioComPosicoes.toFixed(2)}`)
  console.log()
  console.log(`   Para 1 palpite: R$ ${premioComPosicoes.toFixed(2)}`)
  console.log(`   Para 4 palpites: R$ ${(premioComPosicoes * qtdPalpites).toFixed(2)}`)
  console.log()

  // OPÇÃO 2: Usar valor por palpite direto (sem dividir por unidades)
  console.log('='.repeat(60))
  console.log('🔍 OPÇÃO 2: Usar valor por palpite direto')
  console.log('='.repeat(60))
  console.log()
  
  const premioDireto = odd * valorPorPalpite
  console.log(`   Odd × Valor por palpite: ${odd} × R$ ${valorPorPalpite.toFixed(2)} = R$ ${premioDireto.toFixed(2)}`)
  console.log(`   Prêmio com 1 acerto: R$ ${premioDireto.toFixed(2)}`)
  console.log()
  console.log(`   Para 1 palpite: R$ ${premioDireto.toFixed(2)}`)
  console.log(`   Para 4 palpites: R$ ${(premioDireto * qtdPalpites).toFixed(2)}`)
  console.log()

  // OPÇÃO 3: Valor direto × posições
  console.log('='.repeat(60))
  console.log('🔍 OPÇÃO 3: Valor direto × posições')
  console.log('='.repeat(60))
  console.log()
  
  const premioDiretoPosicoes = odd * valorPorPalpite * qtdPosicoes
  console.log(`   Odd × Valor por palpite × Posições: ${odd} × R$ ${valorPorPalpite.toFixed(2)} × ${qtdPosicoes}`)
  console.log(`   Prêmio com 1 acerto: R$ ${premioDiretoPosicoes.toFixed(2)}`)
  console.log()
  console.log(`   Para 1 palpite: R$ ${premioDiretoPosicoes.toFixed(2)}`)
  console.log(`   Para 4 palpites: R$ ${(premioDiretoPosicoes * qtdPalpites).toFixed(2)}`)
  console.log()

  // OPÇÃO 4: Verificar se com outra interpretação chega em 180
  console.log('='.repeat(60))
  console.log('🔍 OPÇÃO 4: Tentando chegar em R$ 180,00')
  console.log('='.repeat(60))
  console.log()
  
  const alvo180 = 180.0
  const multiplicadorPara180 = alvo180 / premioUnidade
  console.log(`   Prêmio atual (1 acerto): R$ ${premioUnidade.toFixed(2)}`)
  console.log(`   Multiplicador para R$ 180: ${multiplicadorPara180.toFixed(2)}x`)
  console.log(`   Se fosse ${multiplicadorPara180.toFixed(2)} × R$ ${premioUnidade.toFixed(2)} = R$ 180,00`)
  console.log()
  
  // Verificar se faz sentido multiplicar por 5 (posições)
  const premioCom5x = premioUnidade * 5
  console.log(`   Se multiplicar por 5 (posições): R$ ${premioUnidade.toFixed(2)} × 5 = R$ ${premioCom5x.toFixed(2)}`)
  console.log()

  // Comparação final
  console.log('='.repeat(60))
  console.log('📊 COMPARAÇÃO DE TODAS AS OPÇÕES')
  console.log('='.repeat(60))
  console.log()
  console.log('   Cenário: Acerta apenas 1 dos 4 palpites')
  console.log()
  console.log(`   1. Cálculo atual:                  R$ ${premioUnidade.toFixed(2)}`)
  console.log(`   2. Multiplicar por posições:       R$ ${premioComPosicoes.toFixed(2)}`)
  console.log(`   3. Valor direto (sem dividir):     R$ ${premioDireto.toFixed(2)}`)
  console.log(`   4. Valor direto × posições:        R$ ${premioDiretoPosicoes.toFixed(2)}`)
  console.log(`   5. Multiplicar por 5 (alvo 180):   R$ ${premioCom5x.toFixed(2)}`)
  console.log()
  console.log('   Valor esperado pelo usuário: R$ 180,00')
  console.log()

  // Verificar qual fórmula chega mais perto
  const formulas = [
    { nome: 'Atual', valor: premioUnidade },
    { nome: 'Com posições', valor: premioComPosicoes },
    { nome: 'Valor direto', valor: premioDireto },
    { nome: 'Direto × posições', valor: premioDiretoPosicoes },
    { nome: 'Multiplicar por 5', valor: premioCom5x },
  ]

  const maisProximo = formulas.reduce((prev, curr) => {
    const diffPrev = Math.abs(prev.valor - alvo180)
    const diffCurr = Math.abs(curr.valor - alvo180)
    return diffCurr < diffPrev ? curr : prev
  })

  console.log('='.repeat(60))
  console.log('✅ CONCLUSÃO')
  console.log('='.repeat(60))
  console.log()
  console.log(`   Fórmula mais próxima de R$ 180: "${maisProximo.nome}" = R$ ${maisProximo.valor.toFixed(2)}`)
  console.log()
  
  if (Math.abs(premioCom5x - alvo180) < 0.01) {
    console.log('   ✓ Multiplicar por 5 (quantidade de posições) resulta em R$ 180!')
    console.log()
    console.log('   Fórmula sugerida:')
    console.log(`   Prêmio = Odd × Valor_Unitário × Quantidade_Posições`)
    console.log(`   Prêmio = ${odd} × R$ ${calculation.unitValue.toFixed(2)} × ${qtdPosicoes}`)
    console.log(`   Prêmio = R$ ${premioCom5x.toFixed(2)}`)
  }
}

// Executar verificação
verificarCalculoComPosicoes()
