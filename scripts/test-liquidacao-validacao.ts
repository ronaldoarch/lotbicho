/**
 * Script para validar a lógica de liquidação de apostas
 * 
 * Testa diferentes cenários para garantir que a liquidação está funcionando corretamente
 */

import {
  conferirPalpite,
  gerarResultadoInstantaneo,
  milharParaGrupo,
  type ModalityType,
  type InstantResult,
} from '../lib/bet-rules-engine'
import { ANIMALS } from '../data/animals'

// Função auxiliar para criar resultado de teste
function criarResultadoTeste(milhares: number[]): InstantResult {
  // Usar função correta para converter milhares em grupos
  const grupos = milhares.map((m) => milharParaGrupo(m))
  return {
    prizes: milhares,
    groups: grupos,
  }
}

console.log('🧪 TESTES DE VALIDAÇÃO DA LIQUIDAÇÃO\n')

// ============================================================================
// TESTE 1: Dupla de Grupo - Deve ganhar
// ============================================================================
console.log('📋 Teste 1: Dupla de Grupo [7, 8] na posição 1º-3º')
// Grupo 7 = dezenas 25-28 (ex: 25, 26, 27, 28)
// Grupo 8 = dezenas 29-32 (ex: 29, 30, 31, 32)
const resultado1 = criarResultadoTeste([7025, 8029, 5017, 1001, 2005]) // Grupos: 7, 8, 5, 1, 2
const animal7 = ANIMALS.find((a) => a.group === 7)!
const animal8 = ANIMALS.find((a) => a.group === 8)!

const conferencia1 = conferirPalpite(
  resultado1,
  'DUPLA_GRUPO',
  { grupos: [7, 8] },
  1,
  3,
  2.0, // R$ 2,00
  'all',
  'Dupla de Grupo'
)

console.log(`  ✅ Acertos: ${conferencia1.prize.hits}`)
console.log(`  ✅ Prêmio Total: R$ ${conferencia1.totalPrize.toFixed(2)}`)
console.log(`  ✅ Esperado: 1 acerto, prêmio > 0`)
console.log(`  ${conferencia1.prize.hits === 1 && conferencia1.totalPrize > 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// TESTE 2: Dupla de Grupo - Não deve ganhar (falta um grupo)
// ============================================================================
console.log('📋 Teste 2: Dupla de Grupo [7, 9] na posição 1º-3º (grupo 9 não está)')
// Grupo 9 = dezenas 33-36 (ex: 33, 34, 35, 36)
const resultado2 = criarResultadoTeste([7025, 8017, 5001, 1005, 2009]) // Grupos: 7, 5, 1, 1, 2 (sem grupo 9)

const conferencia2 = conferirPalpite(
  resultado2,
  'DUPLA_GRUPO',
  { grupos: [7, 9] },
  1,
  3,
  2.0,
  'all',
  'Dupla de Grupo'
)

console.log(`  ✅ Acertos: ${conferencia2.prize.hits}`)
console.log(`  ✅ Prêmio Total: R$ ${conferencia2.totalPrize.toFixed(2)}`)
console.log(`  ✅ Esperado: 0 acertos, prêmio = 0`)
console.log(`  ${conferencia2.prize.hits === 0 && conferencia2.totalPrize === 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// TESTE 3: Dezena - Deve ganhar
// ============================================================================
console.log('📋 Teste 3: Dezena "08" na posição 1º-5º')
const resultado3 = criarResultadoTeste([7008, 8001, 5008, 1000, 2000]) // Dezenas: 08, 01, 08, 00, 00

const conferencia3 = conferirPalpite(
  resultado3,
  'DEZENA',
  { numero: '08' },
  1,
  5,
  1.0,
  'all',
  'Dezena'
)

console.log(`  ✅ Acertos: ${conferencia3.prize.hits}`)
console.log(`  ✅ Prêmio Total: R$ ${conferencia3.totalPrize.toFixed(2)}`)
console.log(`  ✅ Esperado: 2 acertos (posições 1 e 3), prêmio > 0`)
console.log(`  ${conferencia3.prize.hits === 2 && conferencia3.totalPrize > 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// TESTE 4: Grupo Simples - Deve ganhar
// ============================================================================
console.log('📋 Teste 4: Grupo Simples [7] na posição 1º-5º')
const resultado4 = criarResultadoTeste([7025, 8017, 5001, 1005, 2009]) // Grupos: 7, 5, 1, 1, 2

const conferencia4 = conferirPalpite(
  resultado4,
  'GRUPO',
  { grupos: [7] },
  1,
  5,
  1.0,
  'all',
  'Grupo'
)

console.log(`  ✅ Acertos: ${conferencia4.prize.hits}`)
console.log(`  ✅ Prêmio Total: R$ ${conferencia4.totalPrize.toFixed(2)}`)
console.log(`  ✅ Esperado: 1 acerto, prêmio > 0`)
console.log(`  ${conferencia4.prize.hits === 1 && conferencia4.totalPrize > 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// TESTE 5: Terno de Grupo - Deve ganhar
// ============================================================================
console.log('📋 Teste 5: Terno de Grupo [7, 8, 5] na posição 1º-5º')
// Grupo 5 = dezenas 17-20 (ex: 17, 18, 19, 20)
const resultado5 = criarResultadoTeste([7025, 8029, 5017, 1001, 2005]) // Grupos: 7, 8, 5, 1, 2

const conferencia5 = conferirPalpite(
  resultado5,
  'TERNO_GRUPO',
  { grupos: [7, 8, 5] },
  1,
  5,
  3.0,
  'all',
  'Terno de Grupo'
)

console.log(`  ✅ Acertos: ${conferencia5.prize.hits}`)
console.log(`  ✅ Prêmio Total: R$ ${conferencia5.totalPrize.toFixed(2)}`)
console.log(`  ✅ Esperado: 1 acerto, prêmio > 0`)
console.log(`  ${conferencia5.prize.hits === 1 && conferencia5.totalPrize > 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// TESTE 6: Passe vai - Deve ganhar
// ============================================================================
console.log('📋 Teste 6: Passe vai [7, 8] (1º → 2º)')
const resultado6 = criarResultadoTeste([7025, 8029, 5017]) // Grupos: 7, 8, 5

const conferencia6 = conferirPalpite(
  resultado6,
  'PASSE',
  { grupos: [7, 8] },
  1,
  2,
  1.0,
  'all',
  'Passe vai'
)

console.log(`  ✅ Acertos: ${conferencia6.prize.hits}`)
console.log(`  ✅ Prêmio Total: R$ ${conferencia6.totalPrize.toFixed(2)}`)
console.log(`  ✅ Esperado: 1 acerto, prêmio > 0`)
console.log(`  ${conferencia6.prize.hits === 1 && conferencia6.totalPrize > 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// TESTE 7: Passe vai e vem - Deve ganhar (ordem invertida)
// ============================================================================
console.log('📋 Teste 7: Passe vai e vem [8, 7] (aceita ordem invertida)')
const resultado7 = criarResultadoTeste([7025, 8029, 5017]) // Grupos: 7, 8, 5

const conferencia7 = conferirPalpite(
  resultado7,
  'PASSE_VAI_E_VEM',
  { grupos: [8, 7] },
  1,
  2,
  1.0,
  'all',
  'Passe vai e vem'
)

console.log(`  ✅ Acertos: ${conferencia7.prize.hits}`)
console.log(`  ✅ Prêmio Total: R$ ${conferencia7.totalPrize.toFixed(2)}`)
console.log(`  ✅ Esperado: 1 acerto (ordem invertida aceita), prêmio > 0`)
console.log(`  ${conferencia7.prize.hits === 1 && conferencia7.totalPrize > 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// TESTE 8: Dezena Invertida - Deve ganhar
// ============================================================================
console.log('📋 Teste 8: Dezena Invertida "12" na posição 1º-5º')
const resultado8 = criarResultadoTeste([7012, 8021, 5000, 1000, 2000]) // Dezenas: 12, 21, 00, 00, 00

const conferencia8 = conferirPalpite(
  resultado8,
  'DEZENA_INVERTIDA',
  { numero: '12' },
  1,
  5,
  1.0,
  'all',
  'Dezena Invertida'
)

console.log(`  ✅ Acertos: ${conferencia8.prize.hits}`)
console.log(`  ✅ Prêmio Total: R$ ${conferencia8.totalPrize.toFixed(2)}`)
console.log(`  ✅ Esperado: 2 acertos (12 e 21), prêmio > 0`)
console.log(`  ${conferencia8.prize.hits === 2 && conferencia8.totalPrize > 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// TESTE 9: Valor por palpite (divisão "each")
// ============================================================================
console.log('📋 Teste 9: Dupla de Grupo com divisão "each" (R$ 2,00 por palpite)')
const resultado9 = criarResultadoTeste([7025, 8029, 5017]) // Grupos: 7, 8, 5

// Simular 2 palpites de R$ 2,00 cada
const conferencia9a = conferirPalpite(
  resultado9,
  'DUPLA_GRUPO',
  { grupos: [7, 8] },
  1,
  3,
  2.0, // R$ 2,00 por palpite
  'each',
  'Dupla de Grupo'
)

const conferencia9b = conferirPalpite(
  resultado9,
  'DUPLA_GRUPO',
  { grupos: [5, 1] },
  1,
  3,
  2.0,
  'each',
  'Dupla de Grupo'
)

const totalPremio = conferencia9a.totalPrize + conferencia9b.totalPrize
console.log(`  ✅ Prêmio Palpite 1: R$ ${conferencia9a.totalPrize.toFixed(2)}`)
console.log(`  ✅ Prêmio Palpite 2: R$ ${conferencia9b.totalPrize.toFixed(2)}`)
console.log(`  ✅ Prêmio Total: R$ ${totalPremio.toFixed(2)}`)
console.log(`  ✅ Esperado: Ambos ganham, prêmio total > 0`)
console.log(`  ${totalPremio > 0 ? '✅ PASSOU' : '❌ FALHOU'}\n`)

// ============================================================================
// RESUMO
// ============================================================================
console.log('📊 RESUMO DOS TESTES')
console.log('='.repeat(50))
console.log('✅ Testes concluídos!')
console.log('\n💡 Se todos os testes passaram, a liquidação está funcionando corretamente.')
console.log('💡 Se algum teste falhou, verifique a lógica de conferência correspondente.')
