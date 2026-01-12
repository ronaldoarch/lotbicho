import { prisma } from './prisma'

export async function getConfiguracoes() {
  let config = await prisma.configuracao.findFirst()
  
  if (!config) {
    // Criar configuração padrão se não existir
    config = await prisma.configuracao.create({
      data: {
        nomePlataforma: 'Lot Bicho',
        numeroSuporte: '(00) 00000-0000',
        emailSuporte: 'suporte@lotbicho.com',
        whatsappSuporte: '5500000000000',
        logoSite: '',
      },
    })
  }
  
  return config
}

export async function updateConfiguracoes(updates: any) {
  let config = await prisma.configuracao.findFirst()
  
  if (!config) {
    return await prisma.configuracao.create({
      data: updates,
    })
  }
  
  return await prisma.configuracao.update({
    where: { id: config.id },
    data: updates,
  })
}
