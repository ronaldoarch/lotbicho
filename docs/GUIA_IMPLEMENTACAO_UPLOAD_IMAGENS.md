# 📸 Guia de Implementação: Sistema de Upload de Imagens

Este guia explica como implementar o mesmo sistema de upload de imagens usado no Lot Bicho em outro sistema.

## 📋 Visão Geral

O sistema utiliza:
- **Armazenamento local**: Arquivos salvos no sistema de arquivos
- **PostgreSQL**: Apenas URLs/referências das imagens
- **API REST**: Endpoints para upload e gerenciamento

---

## 🗂️ Estrutura de Diretórios

```
projeto/
├── public/
│   └── uploads/
│       ├── banners/
│       ├── logos/
│       └── stories/
├── app/
│   └── api/
│       ├── upload/
│       │   └── route.ts          # Endpoint de upload
│       └── uploads/
│           └── [...path]/
│               └── route.ts      # Servir arquivos
└── lib/
    └── prisma.ts                 # Cliente Prisma
```

---

## 📦 Dependências Necessárias

```bash
npm install @prisma/client prisma
npm install --save-dev @types/node
```

---

## 🗄️ Schema do Banco de Dados (Prisma)

```prisma
// prisma/schema.prisma

model Banner {
  id          Int      @id @default(autoincrement())
  title       String?
  text        String?
  bonus       String?
  logoImage   String?   // URL da imagem: /uploads/logos/arquivo.jpg
  bannerImage String?   // URL do banner: /uploads/banners/arquivo.jpg
  active      Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Story {
  id        Int      @id @default(autoincrement())
  title     String?
  image     String   // URL: /uploads/stories/arquivo.jpg
  alt       String?
  active    Boolean  @default(true)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🔧 Implementação do Endpoint de Upload

### 1. Criar arquivo: `app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'banner', 'logo', 'story'

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP' },
        { status: 400 }
      )
    }

    // Validar tamanho (max 5MB, recomendado < 500KB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    const recommendedSize = 500 * 1024 // 500KB
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máximo 5MB, recomendado < 500KB)' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Erro ao criar diretório de upload' },
        { status: 500 }
      )
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
        return NextResponse.json(
          { error: 'Erro ao salvar arquivo' },
          { status: 500 }
        )
      }

      console.log(`✅ Arquivo salvo: ${filePath}`)
    } catch (writeError) {
      console.error('Erro ao salvar arquivo:', writeError)
      return NextResponse.json(
        { error: 'Erro ao salvar arquivo no servidor' },
        { status: 500 }
      )
    }

    // Retornar URL do arquivo
    const fileUrl = `/uploads/${uploadDir}/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}
```

---

## 📤 Servir Arquivos Estáticos

### 2. Criar arquivo: `app/uploads/[...path]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync } from 'fs'
import { join } from 'path'

// Servir arquivos de upload diretamente do volume /public/uploads
export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const relativePath = params.path.join('/')
    const filePath = join(process.cwd(), 'public', 'uploads', relativePath)
    
    // Verificar se arquivo existe
    const stat = statSync(filePath)
    
    const stream = createReadStream(filePath)
    const response = new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Length': stat.size.toString(),
      },
    })

    // Definir Content-Type baseado na extensão
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      response.headers.set('Content-Type', 'image/jpeg')
    } else if (filePath.endsWith('.png')) {
      response.headers.set('Content-Type', 'image/png')
    } else if (filePath.endsWith('.webp')) {
      response.headers.set('Content-Type', 'image/webp')
    } else if (filePath.endsWith('.gif')) {
      response.headers.set('Content-Type', 'image/gif')
    }

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Arquivo não encontrado' },
      { status: 404 }
    )
  }
}
```

---

## 💾 Integração com Banco de Dados

### 3. Criar arquivo: `lib/banners-store.ts`

```typescript
import { prisma } from './prisma'

// Buscar banners ativos
export async function getBanners() {
  return await prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })
}

// Buscar todos os banners
export async function getAllBanners() {
  return await prisma.banner.findMany({
    orderBy: { order: 'asc' },
  })
}

// Normalizar dados do banner
function normalizeBannerInput(banner: any, nextOrder?: number) {
  const data: any = {}
  if (banner.title !== undefined) data.title = banner.title
  if (banner.text !== undefined) data.text = banner.text
  if (banner.bonus !== undefined) data.bonus = banner.bonus
  if (banner.logoImage !== undefined) data.logoImage = banner.logoImage
  if (banner.bannerImage !== undefined) data.bannerImage = banner.bannerImage
  if (banner.active !== undefined) data.active = !!banner.active
  if (banner.order !== undefined) data.order = Number(banner.order)
  if (data.order === undefined || Number.isNaN(data.order)) {
    data.order = nextOrder ?? 1
  }
  return data
}

// Criar banner
export async function addBanner(banner: any) {
  const maxOrder = await prisma.banner.aggregate({
    _max: { order: true },
  })
  const nextOrder = maxOrder._max.order ? maxOrder._max.order + 1 : 1
  const data = normalizeBannerInput(banner, nextOrder)
  
  return await prisma.banner.create({
    data: {
      ...data,
      active: data.active !== undefined ? data.active : true,
      order: data.order ?? nextOrder,
    },
  })
}

// Atualizar banner
export async function updateBanner(id: number, updates: any) {
  const data = normalizeBannerInput(updates)
  return await prisma.banner.update({
    where: { id },
    data,
  })
}

// Deletar banner
export async function deleteBanner(id: number) {
  await prisma.banner.delete({
    where: { id },
  })
  return true
}
```

---

## 🎨 Uso no Frontend

### 4. Exemplo de componente React para upload

```typescript
'use client'

import { useState } from 'react'

export default function ImageUpload({ type, onUploadComplete }: {
  type: 'banner' | 'logo' | 'story'
  onUploadComplete: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      onUploadComplete(data.url)
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Enviando...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
```

---

## 🔌 API Endpoints

### Endpoints disponíveis:

1. **POST `/api/upload`**
   - Upload de imagem
   - Body: `FormData` com `file` e `type`
   - Response: `{ success: true, url: string, fileName: string }`

2. **GET `/uploads/[...path]`**
   - Servir arquivo estático
   - Exemplo: `/uploads/banners/1234567890-abc123.jpg`

---

## 🐳 Configuração Docker

### Dockerfile

```dockerfile
FROM node:20-bullseye-slim

# Criar diretório para uploads
RUN mkdir -p /app/public/uploads/banners \
             /app/public/uploads/logos \
             /app/public/uploads/stories

# ... resto da configuração ...

VOLUME ["/app/public/uploads"]
```

### docker-compose.yml

```yaml
services:
  app:
    volumes:
      - uploads-storage:/app/public/uploads

volumes:
  uploads-storage:
```

---

## 📝 Checklist de Implementação

- [ ] Criar estrutura de diretórios `public/uploads/{banners,logos,stories}`
- [ ] Implementar endpoint `POST /api/upload`
- [ ] Implementar rota `GET /uploads/[...path]`
- [ ] Criar schema Prisma para Banner/Story
- [ ] Criar funções de gerenciamento no banco (`lib/banners-store.ts`)
- [ ] Configurar volume persistente no Docker (se aplicável)
- [ ] Criar componente de upload no frontend
- [ ] Testar upload de diferentes tipos de arquivo
- [ ] Validar tamanho máximo e tipos permitidos

---

## 🔒 Segurança

### Recomendações:

1. **Validação de tipos**: Sempre validar extensão e MIME type
2. **Limite de tamanho**: Implementar limite máximo (5MB recomendado)
3. **Sanitização**: Limpar nomes de arquivo antes de salvar
4. **Autenticação**: Proteger endpoints de upload com autenticação
5. **Rate limiting**: Limitar número de uploads por usuário/IP

### Exemplo de proteção de rota:

```typescript
// app/api/upload/route.ts
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // Verificar autenticação
  const session = cookies().get('session')?.value
  const user = parseSessionToken(session)
  
  if (!user || !user.isAdmin) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    )
  }
  
  // ... resto do código
}
```

---

## 🚀 Próximos Passos

1. **Otimização de imagens**: Implementar compressão automática
2. **CDN**: Migrar para CDN (Cloudflare, AWS CloudFront)
3. **Storage em nuvem**: Migrar para S3/Cloudinary para escalabilidade
4. **Thumbnails**: Gerar miniaturas automaticamente
5. **Watermark**: Adicionar marca d'água em imagens

---

## 📚 Referências

- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js File System](https://nodejs.org/api/fs.html)
