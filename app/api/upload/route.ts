import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'banner' ou 'logo'

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP' }, { status: 400 })
    }

    // Validar tamanho (max 5MB, preferir < 500KB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    const recommendedSize = 500 * 1024 // 500KB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 5MB, recomendado < 500KB)' }, { status: 400 })
    }
    if (file.size > recommendedSize && type === 'banner') {
      console.warn(`⚠️ Banner grande: ${(file.size / 1024).toFixed(0)}KB (recomendado < 500KB)`)
    }

    // Validação de dimensões para banners é feita no frontend
    // Backend apenas valida tamanho e tipo de arquivo
    if (type === 'banner' && file.size > recommendedSize) {
      console.warn(`⚠️ Banner grande: ${(file.size / 1024).toFixed(0)}KB (recomendado < 500KB)`)
    }

    // Determinar diretório baseado no tipo
    let uploadDir = 'banners'
    if (type === 'logo') {
      uploadDir = 'logos'
    } else if (type === 'story') {
      uploadDir = 'stories'
    }
    const uploadPath = join(process.cwd(), 'public', 'uploads', uploadDir)

    // Criar diretório se não existir
    try {
      if (!existsSync(uploadPath)) {
        await mkdir(uploadPath, { recursive: true })
        console.log(`📁 Diretório criado: ${uploadPath}`)
      }
    } catch (mkdirError) {
      console.error('Erro ao criar diretório:', mkdirError)
      return NextResponse.json({ error: 'Erro ao criar diretório de upload' }, { status: 500 })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomStr}.${extension}`
    const filePath = join(uploadPath, fileName)

    // Converter File para Buffer e salvar
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      
      // Verificar se o arquivo foi realmente salvo
      if (!existsSync(filePath)) {
        console.error(`❌ Arquivo não foi salvo: ${filePath}`)
        return NextResponse.json({ error: 'Erro ao salvar arquivo' }, { status: 500 })
      }
      
      console.log(`✅ Arquivo salvo: ${filePath}`)
    } catch (writeError) {
      console.error('Erro ao salvar arquivo:', writeError)
      return NextResponse.json({ error: 'Erro ao salvar arquivo no servidor' }, { status: 500 })
    }

    // Retornar URL do arquivo (usar rota interna para garantir entrega em qualquer ambiente)
    const fileUrl = `/uploads/${uploadDir}/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 })
  }
}
