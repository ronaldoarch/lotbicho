// Store compartilhado para stories (em produção, usar banco de dados)
let stories: any[] = [
  {
    id: 1,
    image: 'https://ponto-do-bicho.b-cdn.net/stories/aposte-com-seguranca.webp',
    alt: 'Aposte com segurança!',
    active: true,
    order: 1,
  },
  {
    id: 2,
    image: 'https://ponto-do-bicho.b-cdn.net/stories/aposte-agora.webp',
    alt: 'Aposte agora e tente a sorte!',
    active: true,
    order: 2,
  },
  {
    id: 3,
    image: 'https://ponto-do-bicho.b-cdn.net/stories/eles-apostam-e-faturam.webp',
    alt: 'Eles apostam e faturam!',
    active: true,
    order: 3,
  },
  {
    id: 4,
    image: 'https://ponto-do-bicho.b-cdn.net/stories/fezinha-hoje.webp',
    alt: 'Fez sua fezinha hoje?',
    active: true,
    order: 4,
  },
]

export function getStories(): any[] {
  return stories.filter((s) => s.active).sort((a, b) => a.order - b.order)
}

export function getAllStories(): any[] {
  return stories.sort((a, b) => a.order - b.order)
}

export function updateStory(id: number, updates: any): any | null {
  const index = stories.findIndex((s) => s.id === id)
  if (index === -1) {
    return null
  }
  stories[index] = { ...stories[index], ...updates }
  return stories[index]
}

export function addStory(story: any): any {
  const newStory = {
    id: stories.length > 0 ? Math.max(...stories.map((s) => s.id)) + 1 : 1,
    ...story,
    active: story.active !== undefined ? story.active : true,
    order: story.order || stories.length + 1,
  }
  stories.push(newStory)
  return newStory
}

export function deleteStory(id: number): boolean {
  const index = stories.findIndex((s) => s.id === id)
  if (index === -1) {
    return false
  }
  stories.splice(index, 1)
  return true
}
