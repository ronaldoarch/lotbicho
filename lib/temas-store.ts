import { prisma } from './prisma'

export interface Tema {
  id: string
  nome: string
  cores: {
    primaria: string
    secundaria: string
    acento: string
    sucesso: string
    texto: string
    textoSecundario: string
    fundo: string
    fundoSecundario: string
  }
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export async function getTemas(): Promise<Tema[]> {
  const temas = await prisma.tema.findMany({
    orderBy: { criadoEm: 'desc' },
  })
  
  return temas.map((t) => ({
    id: t.id,
    nome: t.nome,
    cores: {
      primaria: t.primaria,
      secundaria: t.secundaria,
      acento: t.acento,
      sucesso: t.sucesso,
      texto: t.texto,
      textoSecundario: t.textoSecundario,
      fundo: t.fundo,
      fundoSecundario: t.fundoSecundario,
    },
    ativo: t.ativo,
    criadoEm: t.criadoEm.toISOString(),
    atualizadoEm: t.atualizadoEm.toISOString(),
  }))
}

export async function getTema(id: string): Promise<Tema | undefined> {
  const tema = await prisma.tema.findUnique({
    where: { id },
  })
  
  if (!tema) return undefined
  
  return {
    id: tema.id,
    nome: tema.nome,
    cores: {
      primaria: tema.primaria,
      secundaria: tema.secundaria,
      acento: tema.acento,
      sucesso: tema.sucesso,
      texto: tema.texto,
      textoSecundario: tema.textoSecundario,
      fundo: tema.fundo,
      fundoSecundario: tema.fundoSecundario,
    },
    ativo: tema.ativo,
    criadoEm: tema.criadoEm.toISOString(),
    atualizadoEm: tema.atualizadoEm.toISOString(),
  }
}

export async function getTemaAtivo(): Promise<Tema> {
  let tema = await prisma.tema.findFirst({
    where: { ativo: true },
  })
  
  // Se não houver tema ativo, criar o tema padrão
  if (!tema) {
    tema = await prisma.tema.create({
      data: {
        nome: 'Tema Padrão',
        primaria: '#052370',
        secundaria: '#FFD700',
        acento: '#FF4444',
        sucesso: '#25D366',
        texto: '#1C1C1C',
        textoSecundario: '#4A4A4A',
        fundo: '#F5F5F5',
        fundoSecundario: '#FFFFFF',
        ativo: true,
      },
    })
  }
  
  return {
    id: tema.id,
    nome: tema.nome,
    cores: {
      primaria: tema.primaria,
      secundaria: tema.secundaria,
      acento: tema.acento,
      sucesso: tema.sucesso,
      texto: tema.texto,
      textoSecundario: tema.textoSecundario,
      fundo: tema.fundo,
      fundoSecundario: tema.fundoSecundario,
    },
    ativo: tema.ativo,
    criadoEm: tema.criadoEm.toISOString(),
    atualizadoEm: tema.atualizadoEm.toISOString(),
  }
}

export async function createTema(tema: Omit<Tema, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Tema> {
  const novoTema = await prisma.tema.create({
    data: {
      nome: tema.nome,
      primaria: tema.cores.primaria,
      secundaria: tema.cores.secundaria,
      acento: tema.cores.acento,
      sucesso: tema.cores.sucesso,
      texto: tema.cores.texto,
      textoSecundario: tema.cores.textoSecundario,
      fundo: tema.cores.fundo,
      fundoSecundario: tema.cores.fundoSecundario,
      ativo: tema.ativo,
    },
  })
  
  return {
    id: novoTema.id,
    nome: novoTema.nome,
    cores: {
      primaria: novoTema.primaria,
      secundaria: novoTema.secundaria,
      acento: novoTema.acento,
      sucesso: novoTema.sucesso,
      texto: novoTema.texto,
      textoSecundario: novoTema.textoSecundario,
      fundo: novoTema.fundo,
      fundoSecundario: novoTema.fundoSecundario,
    },
    ativo: novoTema.ativo,
    criadoEm: novoTema.criadoEm.toISOString(),
    atualizadoEm: novoTema.atualizadoEm.toISOString(),
  }
}

export async function updateTema(id: string, updates: Partial<Tema>): Promise<Tema | null> {
  const data: any = {}
  
  if (updates.nome) data.nome = updates.nome
  if (updates.cores) {
    data.primaria = updates.cores.primaria
    data.secundaria = updates.cores.secundaria
    data.acento = updates.cores.acento
    data.sucesso = updates.cores.sucesso
    data.texto = updates.cores.texto
    data.textoSecundario = updates.cores.textoSecundario
    data.fundo = updates.cores.fundo
    data.fundoSecundario = updates.cores.fundoSecundario
  }
  if (updates.ativo !== undefined) data.ativo = updates.ativo
  
  const tema = await prisma.tema.update({
    where: { id },
    data,
  })
  
  return {
    id: tema.id,
    nome: tema.nome,
    cores: {
      primaria: tema.primaria,
      secundaria: tema.secundaria,
      acento: tema.acento,
      sucesso: tema.sucesso,
      texto: tema.texto,
      textoSecundario: tema.textoSecundario,
      fundo: tema.fundo,
      fundoSecundario: tema.fundoSecundario,
    },
    ativo: tema.ativo,
    criadoEm: tema.criadoEm.toISOString(),
    atualizadoEm: tema.atualizadoEm.toISOString(),
  }
}

export async function deleteTema(id: string): Promise<boolean> {
  await prisma.tema.delete({
    where: { id },
  })
  return true
}

export async function setTemaAtivo(id: string): Promise<Tema | null> {
  // Desativar todos os temas
  await prisma.tema.updateMany({
    data: { ativo: false },
  })
  
  // Ativar o tema selecionado
  const tema = await prisma.tema.update({
    where: { id },
    data: { ativo: true },
  })
  
  return {
    id: tema.id,
    nome: tema.nome,
    cores: {
      primaria: tema.primaria,
      secundaria: tema.secundaria,
      acento: tema.acento,
      sucesso: tema.sucesso,
      texto: tema.texto,
      textoSecundario: tema.textoSecundario,
      fundo: tema.fundo,
      fundoSecundario: tema.fundoSecundario,
    },
    ativo: tema.ativo,
    criadoEm: tema.criadoEm.toISOString(),
    atualizadoEm: tema.atualizadoEm.toISOString(),
  }
}
