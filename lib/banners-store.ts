import { prisma } from './prisma'

export async function getBanners() {
  return await prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })
}

export async function getAllBanners() {
  return await prisma.banner.findMany({
    orderBy: { order: 'asc' },
  })
}

export async function updateBanner(id: number, updates: any) {
  return await prisma.banner.update({
    where: { id },
    data: updates,
  })
}

export async function addBanner(banner: any) {
  const maxOrder = await prisma.banner.aggregate({
    _max: { order: true },
  })
  
  return await prisma.banner.create({
    data: {
      ...banner,
      active: banner.active !== undefined ? banner.active : true,
      order: banner.order || (maxOrder._max.order ? maxOrder._max.order + 1 : 1),
    },
  })
}

export async function deleteBanner(id: number) {
  await prisma.banner.delete({
    where: { id },
  })
  return true
}
