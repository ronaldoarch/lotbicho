// Store compartilhado para banners (em produção, usar banco de dados)
let banners: any[] = [
  {
    id: 1,
    title: 'Seu Primeiro Depósito Vale O DOBRO!',
    badge: 'NOVO POR AQUI?',
    highlight: 'DOBRO!',
    button: 'Deposite agora e aproveite!',
    bonus: 'R$ 50',
    bonusBgClass: 'bg-green-600',
    active: true,
    order: 1,
  },
  {
    id: 2,
    title: 'Ganhe Até R$ 1 MILHÃO!',
    badge: 'PROMOÇÃO ESPECIAL',
    highlight: 'R$ 1 MILHÃO!',
    button: 'Aposte agora!',
    bonus: 'R$ 100',
    bonusBgClass: 'bg-blue-600',
    active: true,
    order: 2,
  },
  {
    id: 3,
    title: 'Bônus de 100%!',
    badge: 'BÔNUS EXCLUSIVO',
    highlight: '100%!',
    button: 'Confira as condições!',
    bonus: 'R$ 200',
    bonusBgClass: 'bg-purple-600',
    active: true,
    order: 3,
  },
]

export function getBanners(): any[] {
  return banners.filter((b) => b.active).sort((a, b) => a.order - b.order)
}

export function getAllBanners(): any[] {
  return banners.sort((a, b) => a.order - b.order)
}

export function updateBanner(id: number, updates: any): any | null {
  const index = banners.findIndex((b) => b.id === id)
  if (index === -1) {
    return null
  }
  banners[index] = { ...banners[index], ...updates }
  return banners[index]
}

export function addBanner(banner: any): any {
  const newBanner = {
    id: banners.length > 0 ? Math.max(...banners.map((b) => b.id)) + 1 : 1,
    ...banner,
    active: banner.active !== undefined ? banner.active : true,
    order: banner.order || banners.length + 1,
  }
  banners.push(newBanner)
  return newBanner
}

export function deleteBanner(id: number): boolean {
  const index = banners.findIndex((b) => b.id === id)
  if (index === -1) {
    return false
  }
  banners.splice(index, 1)
  return true
}
