/**
 * Teste completo de liquidação simulando cenários reais
 */

import {
  gerarResultadoInstantaneo,
  conferirPalpite,
  calcularValorPorPalpite,
  milharParaGrupo,
} from '../lib/bet-rules-engine'

console.log('🧪 Teste Completo de Liquidação\n')
console.log('='.repeat(50))

// Cenário 1: Aposta de GRUPO que ganha
console.log('\n🎯 Cenário 1: Aposta GRUPO - Ganhou')
try {
  // Gerar resultado onde grupo 8 aparece no 1º prêmio
  const milharGanhou = 4732 // Grupo 8 (Camelo)
  const resultado = {
    prizes: [milharGanhou, 1234, 5678, 9012, 3456, 7890, 2345],
    groups: [8, 9, 20, 23, 9, 20, 6], // Grupo 8 no 1º prêmio
  }

  const conferencia = conferirPalpite(
    resultado,
    'GRUPO',
    { grupos: [8] }, // Apostou no grupo 8
    1,
    7,
    10.0,
    'all'
  )

  console.log('✅ Aposta conferida')
  console.log('   Grupo apostado: 8 (Camelo)')
  console.log('   Grupo no 1º prêmio:', resultado.groups[0])
  console.log('   Acertos:', conferencia.prize.hits)
  console.log('   Prêmio: R$', conferencia.totalPrize.toFixed(2))
  console.log('   Status:', conferencia.prize.hits > 0 ? '✅ GANHOU' : '❌ PERDEU')
} catch (error) {
  console.log('❌ Erro:', error)
}

// Cenário 2: Aposta de DUPLA_GRUPO que ganha
console.log('\n🎯 Cenário 2: Aposta DUPLA_GRUPO - Ganhou')
try {
  const resultado = {
    prizes: [4732, 1234, 5678, 9012, 3456, 7890, 2345],
    groups: [8, 9, 20, 23, 9, 20, 6], // Grupos 8 e 9 presentes
  }

  const conferencia = conferirPalpite(
    resultado,
    'DUPLA_GRUPO',
    { grupos: [8, 9] }, // Apostou nos grupos 8 e 9
    1,
    7,
    20.0,
    'all'
  )

  console.log('✅ Aposta conferida')
  console.log('   Grupos apostados: 8 e 9')
  console.log('   Grupos no resultado:', [...new Set(resultado.groups)].join(', '))
  console.log('   Acertos:', conferencia.prize.hits)
  console.log('   Prêmio: R$', conferencia.totalPrize.toFixed(2))
  console.log('   Status:', conferencia.prize.hits > 0 ? '✅ GANHOU' : '❌ PERDEU')
} catch (error) {
  console.log('❌ Erro:', error)
}

// Cenário 3: Aposta de GRUPO que perde
console.log('\n🎯 Cenário 3: Aposta GRUPO - Perdeu')
try {
  const resultado = {
    prizes: [1234, 5678, 9012, 3456, 7890, 2345, 6789],
    groups: [9, 20, 23, 9, 20, 6, 17], // Grupo 8 NÃO aparece
  }

  const conferencia = conferirPalpite(
    resultado,
    'GRUPO',
    { grupos: [8] }, // Apostou no grupo 8
    1,
    7,
    10.0,
    'all'
  )

  console.log('✅ Aposta conferida')
  console.log('   Grupo apostado: 8 (Camelo)')
  console.log('   Grupos no resultado:', resultado.groups.join(', '))
  console.log('   Acertos:', conferencia.prize.hits)
  console.log('   Prêmio: R$', conferencia.totalPrize.toFixed(2))
  console.log('   Status:', conferencia.prize.hits > 0 ? '✅ GANHOU' : '❌ PERDEU')
} catch (error) {
  console.log('❌ Erro:', error)
}

// Cenário 4: Aposta de QUADRA_GRUPO
console.log('\n🎯 Cenário 4: Aposta QUADRA_GRUPO')
try {
  const resultado = {
    prizes: [4732, 1234, 5678, 9012, 3456, 7890, 2345],
    groups: [8, 9, 20, 23, 9, 20, 6],
  }

  const conferencia = conferirPalpite(
    resultado,
    'QUADRA_GRUPO',
    { grupos: [8, 9, 20, 23] }, // Todos presentes
    1,
    5,
    25.0,
    'all'
  )

  console.log('✅ Aposta conferida')
  console.log('   Grupos apostados: 8, 9, 20, 23')
  console.log('   Grupos únicos no resultado:', [...new Set(resultado.groups)].join(', '))
  console.log('   Acertos:', conferencia.prize.hits)
  console.log('   Prêmio: R$', conferencia.totalPrize.toFixed(2))
  console.log('   Status:', conferencia.prize.hits > 0 ? '✅ GANHOU' : '❌ PERDEU')
} catch (error) {
  console.log('❌ Erro:', error)
}

// Cenário 5: Múltiplos palpites
console.log('\n🎯 Cenário 5: Múltiplos Palpites')
try {
  const resultado = gerarResultadoInstantaneo(7)
  console.log('   Resultado gerado:', resultado.prizes.map((p) => p.toString().padStart(4, '0')).join(', '))
  console.log('   Grupos:', resultado.groups.join(', '))

  const palpites = [
    { grupos: [resultado.groups[0]] }, // Primeiro grupo do resultado
    { grupos: [99] }, // Grupo que não existe (sempre perde)
    { grupos: [resultado.groups[2]] }, // Terceiro grupo do resultado
  ]

  let premioTotal = 0
  palpites.forEach((palpite, idx) => {
    const conferencia = conferirPalpite(
      resultado,
      'GRUPO',
      palpite,
      1,
      7,
      10.0,
      'each' // R$ 10 por palpite
    )
    premioTotal += conferencia.totalPrize
    console.log(`   Palpite ${idx + 1}: ${conferencia.prize.hits > 0 ? '✅' : '❌'} R$ ${conferencia.totalPrize.toFixed(2)}`)
  })

  console.log('   Prêmio total: R$', premioTotal.toFixed(2))
} catch (error) {
  console.log('❌ Erro:', error)
}

// Cenário 6: Teste de divisão "all" vs "each"
console.log('\n🎯 Cenário 6: Comparação Divisão "all" vs "each"')
try {
  const resultado = {
    prizes: [4732, 1234, 5678, 9012, 3456, 7890, 2345],
    groups: [8, 9, 20, 23, 9, 20, 6],
  }

  const valorTotal = 20.0
  const qtdPalpites = 2

  // Divisão "all": R$ 20 dividido entre 2 palpites = R$ 10 cada
  const conferenciaAll = conferirPalpite(
    resultado,
    'GRUPO',
    { grupos: [8] },
    1,
    7,
    calcularValorPorPalpite(valorTotal, qtdPalpites, 'all'),
    'all'
  )

  // Divisão "each": R$ 20 por palpite = R$ 20 cada
  const conferenciaEach = conferirPalpite(
    resultado,
    'GRUPO',
    { grupos: [8] },
    1,
    7,
    calcularValorPorPalpite(valorTotal, qtdPalpites, 'each'),
    'each'
  )

  console.log('   Valor total: R$', valorTotal)
  console.log('   Quantidade de palpites:', qtdPalpites)
  console.log('   Divisão "all": R$', calcularValorPorPalpite(valorTotal, qtdPalpites, 'all').toFixed(2), 'por palpite')
  console.log('   Divisão "each": R$', calcularValorPorPalpite(valorTotal, qtdPalpites, 'each').toFixed(2), 'por palpite')
  console.log('   Prêmio "all": R$', conferenciaAll.totalPrize.toFixed(2))
  console.log('   Prêmio "each": R$', conferenciaEach.totalPrize.toFixed(2))
} catch (error) {
  console.log('❌ Erro:', error)
}

console.log('\n' + '='.repeat(50))
console.log('✅ Testes completos concluídos!')
