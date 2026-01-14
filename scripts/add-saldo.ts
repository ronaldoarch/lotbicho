import { prisma } from '../lib/prisma'

/**
 * Script para adicionar saldo a um usuário
 * Uso: npx tsx scripts/add-saldo.ts <userId> <valor>
 * Exemplo: npx tsx scripts/add-saldo.ts 1 100.50
 */
async function addSaldo() {
  const userId = parseInt(process.argv[2] || '1')
  const valor = parseFloat(process.argv[3] || '100')

  if (!userId || isNaN(userId)) {
    console.error('❌ ID do usuário inválido')
    process.exit(1)
  }

  if (!valor || isNaN(valor) || valor <= 0) {
    console.error('❌ Valor inválido')
    process.exit(1)
  }

  try {
    // Verificar se o usuário existe
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, email: true, saldo: true },
    })

    if (!user) {
      console.error(`❌ Usuário com ID ${userId} não encontrado`)
      process.exit(1)
    }

    console.log(`📋 Usuário encontrado:`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Nome: ${user.nome}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Saldo atual: R$ ${user.saldo.toFixed(2)}`)

    // Adicionar saldo
    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: {
        saldo: { increment: valor },
      },
      select: { id: true, nome: true, saldo: true },
    })

    console.log(`\n✅ Saldo adicionado com sucesso!`)
    console.log(`   Valor adicionado: R$ ${valor.toFixed(2)}`)
    console.log(`   Novo saldo: R$ ${updatedUser.saldo.toFixed(2)}`)

    // Criar registro de transação
    await prisma.transacao.create({
      data: {
        usuarioId: userId,
        tipo: 'deposito',
        status: 'pago',
        valor,
        descricao: `Depósito manual via script`,
      },
    })

    console.log(`\n📝 Transação registrada no histórico`)
  } catch (error) {
    console.error('❌ Erro ao adicionar saldo:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addSaldo()
