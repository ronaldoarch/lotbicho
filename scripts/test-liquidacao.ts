/**
 * Script de teste para sistema de liquidação
 * 
 * Uso:
 *   npx tsx scripts/test-liquidacao.ts
 * 
 * Requer servidor rodando em http://localhost:3000
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000'

async function testarLiquidacao() {
  console.log('🧪 Testando Sistema de Liquidação\n')
  console.log('=' .repeat(50))

  // Teste 1: GET - Estatísticas
  console.log('\n📊 Teste 1: Buscar Estatísticas (GET)')
  try {
    const res = await fetch(`${API_BASE}/api/resultados/liquidar`)
    const data = await res.json()
    console.log('✅ Status:', res.status)
    console.log('📈 Dados:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Erro:', error)
  }

  // Teste 2: POST - Tentar Monitor Primeiro
  console.log('\n🔄 Teste 2: Liquidação com Monitor (POST)')
  try {
    const res = await fetch(`${API_BASE}/api/resultados/liquidar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usarMonitor: true,
      }),
    })
    const data = await res.json()
    console.log('✅ Status:', res.status)
    console.log('📦 Resposta:', JSON.stringify(data, null, 2))
    console.log('🔍 Fonte usada:', data.fonte || 'desconhecida')
  } catch (error) {
    console.error('❌ Erro:', error)
  }

  // Teste 3: POST - Forçar Uso Próprio
  console.log('\n⚙️ Teste 3: Liquidação Forçada (Implementação Própria)')
  try {
    const res = await fetch(`${API_BASE}/api/resultados/liquidar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usarMonitor: false,
      }),
    })
    const data = await res.json()
    console.log('✅ Status:', res.status)
    console.log('📦 Resposta:', JSON.stringify(data, null, 2))
    console.log('🔍 Fonte usada:', data.fonte || 'desconhecida')
  } catch (error) {
    console.error('❌ Erro:', error)
  }

  // Teste 4: POST - Com Filtros
  console.log('\n🎯 Teste 4: Liquidação com Filtros')
  try {
    const res = await fetch(`${API_BASE}/api/resultados/liquidar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usarMonitor: false,
        loteria: 'PT Rio de Janeiro',
        horario: '09:30',
      }),
    })
    const data = await res.json()
    console.log('✅ Status:', res.status)
    console.log('📦 Resposta:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Erro:', error)
  }

  // Teste 5: Verificar Status do Monitor
  console.log('\n📡 Teste 5: Status do Monitor')
  try {
    const res = await fetch(`${API_BASE}/api/status`)
    const data = await res.json()
    console.log('✅ Status:', res.status)
    console.log('📡 Monitor:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Erro:', error)
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Testes concluídos!')
}

// Executar testes
testarLiquidacao().catch(console.error)
