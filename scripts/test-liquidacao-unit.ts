/**
 * Teste unitário do sistema de liquidação
 * Testa as funções diretamente sem precisar do servidor
 */

import {
  gerarResultadoInstantaneo,
  conferirPalpite,
  calcularValorPorPalpite,
  milharParaGrupo,
  dezenaParaGrupo,
  contarPermutacoesDistintas,
  buscarOdd,
} from '../lib/bet-rules-engine'

console.log('🧪 Testes Unitários do Sistema de Liquidação\n')
console.log('='.repeat(50))

// Teste 1: Conversão dezena → grupo
console.log('\n📊 Teste 1: Conversão Dezena → Grupo')
const testesDezena = [
  { dezena: 1, esperado: 1 },
  { dezena: 4, esperado: 1 },
  { dezena: 5, esperado: 2 },
  { dezena: 21, esperado: 6 },
  { dezena: 0, esperado: 25 }, // 00
  { dezena: 97, esperado: 25 },
]
testesDezena.forEach(({ dezena, esperado }) => {
  const resultado = dezenaParaGrupo(dezena)
  const status = resultado === esperado ? '✅' : '❌'
  console.log(`${status} Dezena ${dezena.toString().padStart(2, '0')} → Grupo ${resultado} (esperado: ${esperado})`)
})

// Teste 2: Conversão milhar → grupo
console.log('\n📊 Teste 2: Conversão Milhar → Grupo')
const testesMilhar = [
  { milhar: 4321, esperado: 6 }, // Dezena 21 → Grupo 6
  { milhar: 589, esperado: 23 }, // Dezena 89 → Grupo 23
  { milhar: 704, esperado: 1 }, // Dezena 04 → Grupo 1
  { milhar: 1297, esperado: 25 }, // Dezena 97 → Grupo 25
]
testesMilhar.forEach(({ milhar, esperado }) => {
  const resultado = milharParaGrupo(milhar)
  const status = resultado === esperado ? '✅' : '❌'
  console.log(`${status} Milhar ${milhar.toString().padStart(4, '0')} → Grupo ${resultado} (esperado: ${esperado})`)
})

// Teste 3: Permutações distintas
console.log('\n📊 Teste 3: Permutações Distintas')
const testesPermutacoes = [
  { numero: '27', esperado: 2 }, // 27, 72
  { numero: '22', esperado: 1 }, // 22
  { numero: '384', esperado: 6 }, // Todos diferentes
  { numero: '2580', esperado: 24 }, // Todos diferentes (4 dígitos)
]
testesPermutacoes.forEach(({ numero, esperado }) => {
  const resultado = contarPermutacoesDistintas(numero)
  const status = resultado === esperado ? '✅' : '❌'
  console.log(`${status} "${numero}" → ${resultado} permutações (esperado: ${esperado})`)
})

// Teste 4: Buscar odds
console.log('\n📊 Teste 4: Buscar Odds')
const testesOdds = [
  { modalidade: 'GRUPO', pos_from: 1, pos_to: 5, esperado: 18 },
  { modalidade: 'DUPLA_GRUPO', pos_from: 1, pos_to: 5, esperado: 180 },
  { modalidade: 'DEZENA', pos_from: 1, pos_to: 7, esperado: 60 },
  { modalidade: 'MILHAR', pos_from: 1, pos_to: 5, esperado: 5000 },
]
testesOdds.forEach(({ modalidade, pos_from, pos_to, esperado }) => {
  try {
    const resultado = buscarOdd(modalidade as any, pos_from, pos_to)
    const status = resultado === esperado ? '✅' : '❌'
    console.log(`${status} ${modalidade} (${pos_from}-${pos_to}) → ${resultado}x (esperado: ${esperado}x)`)
  } catch (error) {
    console.log(`❌ ${modalidade} (${pos_from}-${pos_to}) → Erro: ${error}`)
  }
})

// Teste 5: Calcular valor por palpite
console.log('\n📊 Teste 5: Calcular Valor por Palpite')
const testesValor = [
  { valor: 10, qtd: 2, tipo: 'each', esperado: 10 },
  { valor: 10, qtd: 2, tipo: 'all', esperado: 5 },
  { valor: 20, qtd: 4, tipo: 'all', esperado: 5 },
]
testesValor.forEach(({ valor, qtd, tipo, esperado }) => {
  const resultado = calcularValorPorPalpite(valor, qtd, tipo as any)
  const status = Math.abs(resultado - esperado) < 0.01 ? '✅' : '❌'
  console.log(`${status} R$ ${valor} / ${qtd} palpites (${tipo}) → R$ ${resultado.toFixed(2)} (esperado: R$ ${esperado.toFixed(2)})`)
})

// Teste 6: Gerar resultado instantâneo
console.log('\n📊 Teste 6: Gerar Resultado Instantâneo')
try {
  const resultado = gerarResultadoInstantaneo(7)
  console.log('✅ Resultado gerado:', resultado.prizes.length, 'prêmios')
  console.log('   Milhares:', resultado.prizes.map((p) => p.toString().padStart(4, '0')).join(', '))
  console.log('   Grupos:', resultado.groups.join(', '))
} catch (error) {
  console.log('❌ Erro ao gerar resultado:', error)
}

// Teste 7: Conferir palpite de GRUPO
console.log('\n📊 Teste 7: Conferir Palpite GRUPO')
try {
  const resultado = gerarResultadoInstantaneo(7)
  const conferencia = conferirPalpite(
    resultado,
    'GRUPO',
    { grupos: [8] }, // Grupo 8 (Camelo)
    1,
    7,
    10.0,
    'all'
  )
  console.log('✅ Conferência realizada')
  console.log('   Acertos:', conferencia.prize.hits)
  console.log('   Prêmio total: R$', conferencia.totalPrize.toFixed(2))
  console.log('   Unidades:', conferencia.calculation.units)
  console.log('   Valor unitário: R$', conferencia.calculation.unitValue.toFixed(2))
} catch (error) {
  console.log('❌ Erro ao conferir:', error)
}

console.log('\n' + '='.repeat(50))
console.log('✅ Testes unitários concluídos!')
