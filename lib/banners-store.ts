// Store compartilhado para banners (em produção, usar banco de dados)
// Inicializa vazio - banners devem ser criados via admin
let banners: any[] = []

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
