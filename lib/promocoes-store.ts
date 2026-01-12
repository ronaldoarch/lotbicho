import { prisma } from './prisma'

export async function getPromocoes() {
  return await prisma.promocao.findMany({
    where: { active: true },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' },
    ],
  })
}

export async function getAllPromocoes() {
  return await prisma.promocao.findMany({
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' },
    ],
  })
}

export async function updatePromocao(id: number, updates: any) {
  return await prisma.promocao.update({
    where: { id },
    data: updates,
  })
}

export async function addPromocao(promocao: any) {
  const maxOrder = await prisma.promocao.aggregate({
    _max: { order: true },
  })
  
  return await prisma.promocao.create({
    data: {
      tipo: promocao.tipo || 'outro',
      valor: promocao.valor || 0,
      titulo: promocao.titulo,
      descricao: promocao.descricao,
      active: promocao.active !== undefined ? promocao.active : true,
      order: promocao.order || (maxOrder._max.order ? maxOrder._max.order + 1 : 1),
    },
  })
}

export async function deletePromocao(id: number) {
  await prisma.promocao.delete({
    where: { id },
  })
  return true
}
