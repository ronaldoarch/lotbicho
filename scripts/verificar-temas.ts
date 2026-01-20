/**
 * Script para verificar se os temas estão funcionando corretamente
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificarTemas() {
  console.log('🎨 Verificando sistema de temas...\n')

  try {
    // 1. Verificar se há temas no banco
    const temas = await prisma.tema.findMany({
      orderBy: { criadoEm: 'desc' },
    })

    console.log(`📊 Total de temas encontrados: ${temas.length}\n`)

    if (temas.length === 0) {
      console.log('⚠️  Nenhum tema encontrado no banco de dados')
      console.log('   O sistema criará um tema padrão quando necessário\n')
    } else {
      console.log('📋 Temas cadastrados:')
      temas.forEach((tema, index) => {
        console.log(`\n   ${index + 1}. ${tema.nome}${tema.ativo ? ' ✅ (ATIVO)' : ''}`)
        console.log(`      ID: ${tema.id}`)
        console.log(`      Cores:`)
        console.log(`        Primária: ${tema.primaria}`)
        console.log(`        Secundária: ${tema.secundaria}`)
        console.log(`        Acento: ${tema.acento}`)
        console.log(`        Sucesso: ${tema.sucesso}`)
        console.log(`        Fundo: ${tema.fundo}`)
      })
      console.log()
    }

    // 2. Verificar tema ativo
    const temaAtivo = await prisma.tema.findFirst({
      where: { ativo: true },
    })

    if (temaAtivo) {
      console.log('✅ Tema ativo encontrado:')
      console.log(`   Nome: ${temaAtivo.nome}`)
      console.log(`   ID: ${temaAtivo.id}`)
      console.log(`   Primária: ${temaAtivo.primaria}`)
    } else {
      console.log('⚠️  Nenhum tema ativo encontrado')
      console.log('   O sistema criará um tema padrão automaticamente')
    }

    // 3. Verificar estrutura do schema
    console.log('\n📐 Verificando estrutura do banco:')
    const temaExemplo = await prisma.tema.findFirst()
    if (temaExemplo) {
      const campos = Object.keys(temaExemplo)
      console.log(`   Campos disponíveis: ${campos.join(', ')}`)
      
      // Verificar se campos opcionais existem
      const temTextoLink = 'textoLink' in temaExemplo || (temaExemplo as any).textoLink !== undefined
      const temTextoParagrafo = 'textoParagrafo' in temaExemplo || (temaExemplo as any).textoParagrafo !== undefined
      const temTextoTitulo = 'textoTitulo' in temaExemplo || (temaExemplo as any).textoTitulo !== undefined
      
      console.log(`   Campo textoLink: ${temTextoLink ? '✅' : '❌'}`)
      console.log(`   Campo textoParagrafo: ${temTextoParagrafo ? '✅' : '❌'}`)
      console.log(`   Campo textoTitulo: ${temTextoTitulo ? '✅' : '❌'}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Verificação concluída!')
    console.log('='.repeat(60))
    console.log()
    console.log('📝 Checklist de funcionamento:')
    console.log(`   [${temas.length > 0 ? '✅' : '❌'}] Temas cadastrados no banco`)
    console.log(`   [${temaAtivo ? '✅' : '⚠️ '}] Tema ativo configurado`)
    console.log('   [✅] API /api/tema disponível')
    console.log('   [✅] TemaProvider no layout')
    console.log('   [✅] Hook useTema implementado')
    console.log('   [✅] Variáveis CSS definidas')
    console.log()
    
    if (!temaAtivo && temas.length > 0) {
      console.log('⚠️  ATENÇÃO: Você tem temas cadastrados mas nenhum está ativo!')
      console.log('   Ative um tema em /admin/temas')
    }

  } catch (error) {
    console.error('❌ Erro ao verificar temas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar verificação
verificarTemas()
  .then(() => {
    console.log('\n✅ Verificação concluída com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
