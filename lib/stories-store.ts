import { prisma } from './prisma'

export async function getStories() {
  return await prisma.story.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })
}

export async function getAllStories() {
  return await prisma.story.findMany({
    orderBy: { order: 'asc' },
  })
}

export async function updateStory(id: number, updates: any) {
  return await prisma.story.update({
    where: { id },
    data: updates,
  })
}

export async function addStory(story: any) {
  const maxOrder = await prisma.story.aggregate({
    _max: { order: true },
  })
  
  return await prisma.story.create({
    data: {
      title: story.title || '',
      image: story.image,
      alt: story.alt || '',
      active: story.active !== undefined ? story.active : true,
      order: story.order || (maxOrder._max.order ? maxOrder._max.order + 1 : 1),
    },
  })
}

export async function deleteStory(id: number) {
  await prisma.story.delete({
    where: { id },
  })
  return true
}
