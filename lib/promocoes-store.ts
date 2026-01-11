// Store compartilhado para promoções (em produção, usar banco de dados)
let promocoes: any[] = []

export function getPromocoes(): any[] {
  return promocoes.filter((p) => p.active).sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  })
}

export function getAllPromocoes(): any[] {
  return promocoes
}

export function updatePromocao(id: number, updates: any): any | null {
  const index = promocoes.findIndex((p) => p.id === id)
  if (index === -1) {
    return null
  }
  promocoes[index] = { ...promocoes[index], ...updates }
  return promocoes[index]
}

export function addPromocao(promocao: any): any {
  const newPromocao = {
    id: promocoes.length > 0 ? Math.max(...promocoes.map((p) => p.id)) + 1 : 1,
    ...promocao,
    active: promocao.active !== undefined ? promocao.active : true,
    createdAt: new Date().toISOString(),
  }
  promocoes.push(newPromocao)
  return newPromocao
}

export function deletePromocao(id: number): boolean {
  const index = promocoes.findIndex((p) => p.id === id)
  if (index === -1) {
    return false
  }
  promocoes.splice(index, 1)
  return true
}
