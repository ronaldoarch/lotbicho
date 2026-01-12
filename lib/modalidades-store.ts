import { prisma } from './prisma'
import { Modality } from '@/types/bet'
import { MODALITIES as MODALITIES_DATA } from '@/data/modalities'

export async function getModalidades(): Promise<Modality[]> {
  const modalidades = await prisma.modalidade.findMany({
    orderBy: { id: 'asc' },
  })
  
  // Se não houver modalidades no banco, inicializar com dados padrão
  if (modalidades.length === 0) {
    await initializeModalidades()
    return await getModalidades()
  }
  
  return modalidades.map((m) => ({
    id: m.id,
    name: m.name,
    value: m.value,
    hasLink: m.hasLink,
    active: m.active,
  }))
}

async function initializeModalidades() {
  const modalidadesData = MODALITIES_DATA.map((m) => ({
    name: m.name,
    value: m.value,
    hasLink: m.hasLink || false,
    active: m.active !== undefined ? m.active : true,
  }))
  
  await prisma.modalidade.createMany({
    data: modalidadesData,
  })
}

export async function updateModalidade(id: number, updates: Partial<Modality>) {
  return await prisma.modalidade.update({
    where: { id },
    data: updates,
  })
}

export async function setModalidades(newModalidades: Modality[]) {
  // Deletar todas e recriar
  await prisma.modalidade.deleteMany()
  
  await prisma.modalidade.createMany({
    data: newModalidades.map((m) => ({
      name: m.name,
      value: m.value,
      hasLink: m.hasLink || false,
      active: m.active !== undefined ? m.active : true,
    })),
  })
}
