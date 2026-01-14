'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewBannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [formData, setFormData] = useState({
    badge: 'NOVO POR AQUI?',
    title: 'Seu Primeiro Depósito Vale O',
    highlight: 'DOBRO!',
    button: 'Deposite agora e aproveite!',
    bonus: 'R$ 50',
    bonusBgClass: 'bg-green-600',
    bannerImage: '',
    logoImage: '',
    active: true,
    order: 1,
  })

  const validateBannerImage = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        const width = img.width
        const height = img.height
        
        // Validar proporção 16:9 (com tolerância de ±5%)
        const aspectRatio = width / height
        const idealRatio = 16 / 9
        const tolerance = 0.05
        const minRatio = idealRatio * (1 - tolerance)
        const maxRatio = idealRatio * (1 + tolerance)

        if (aspectRatio < minRatio || aspectRatio > maxRatio) {
          resolve(`Proporção incorreta. Use 16:9 (ex.: 1920×1080 ou 1600×900).\nAtual: ${width}×${height}px (${aspectRatio.toFixed(2)}:1)`)
          return
        }

        // Validar tamanho mínimo recomendado
        const minWidth = 1200
        const minHeight = 675
        if (width < minWidth || height < minHeight) {
          resolve(`Dimensões muito pequenas. Mínimo recomendado: ${minWidth}×${minHeight}px.\nAtual: ${width}×${height}px`)
          return
        }

        // Validar tamanho do arquivo (recomendado < 500KB)
        const recommendedSize = 500 * 1024 // 500KB
        if (file.size > recommendedSize) {
          console.warn(`⚠️ Banner grande: ${(file.size / 1024).toFixed(0)}KB (recomendado < 500KB)`)
        }

        resolve(null) // Válido
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve('Erro ao ler a imagem')
      }
      
      img.src = url
    })
  }

  const handleFileUpload = async (file: File, type: 'banner' | 'logo') => {
    if (type === 'banner') {
      setUploadingBanner(true)
    } else {
      setUploadingLogo(true)
    }

    try {
      // Validar banner antes de fazer upload
      if (type === 'banner') {
        const validationError = await validateBannerImage(file)
        if (validationError) {
          alert(`❌ ${validationError}\n\n💡 Dicas:\n- Proporção ideal: 16:9 (ex.: 1920×1080 ou 1600×900)\n- Tamanho mínimo: 1200×675px\n- Formato: JPG ou WebP\n- Tamanho do arquivo: < 500KB (máximo 5MB)\n- Deixe margem de segurança nas bordas`)
          if (type === 'banner') {
            setUploadingBanner(false)
          } else {
            setUploadingLogo(false)
          }
          return
        }
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', type)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        if (type === 'banner') {
          setFormData({ ...formData, bannerImage: data.url })
        } else {
          setFormData({ ...formData, logoImage: data.url })
        }
      } else {
        alert(data.error || 'Erro ao fazer upload')
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      if (type === 'banner') {
        setUploadingBanner(false)
      } else {
        setUploadingLogo(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/banners')
      } else {
        alert('Erro ao criar banner')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar banner')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Novo Banner</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Upload de Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
          <div className="space-y-4">
            {formData.logoImage && (
              <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={formData.logoImage}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoImage: '' })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <div>
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file, 'logo')
                  }
                }}
                className="hidden"
                disabled={uploadingLogo}
              />
              <label
                htmlFor="logo-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer ${
                  uploadingLogo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                {uploadingLogo ? 'Enviando...' : formData.logoImage ? 'Trocar Logo' : 'Upload Logo'}
              </label>
            </div>
          </div>
        </div>

        {/* Upload de Banner */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Banner</label>
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>📐 Especificações recomendadas:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Proporção: <strong>16:9</strong> (ex.: 1920×1080 ou 1600×900)</li>
              <li>Tamanho mínimo: <strong>1200×675px</strong></li>
              <li>Formato: <strong>JPG ou WebP</strong></li>
              <li>Tamanho do arquivo: <strong>&lt; 500KB</strong> (máximo 5MB)</li>
              <li>💡 Deixe margem de segurança nas bordas (texto e botões afastados)</li>
            </ul>
          </div>
          <div className="space-y-4">
            {formData.bannerImage && (
              <div className="relative w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={formData.bannerImage}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, bannerImage: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <div>
              <input
                type="file"
                id="banner-upload"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file, 'banner')
                  }
                }}
                className="hidden"
                disabled={uploadingBanner}
              />
              <label
                htmlFor="banner-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer ${
                  uploadingBanner ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                {uploadingBanner ? 'Enviando...' : formData.bannerImage ? 'Trocar Banner' : 'Upload Banner'}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Badge</label>
          <input
            type="text"
            value={formData.badge}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destaque</label>
          <input
            type="text"
            value={formData.highlight}
            onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Botão</label>
          <input
            type="text"
            value={formData.button}
            onChange={(e) => setFormData({ ...formData, button: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bônus</label>
          <input
            type="text"
            value={formData.bonus}
            onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Bônus</label>
          <select
            value={formData.bonusBgClass}
            onChange={(e) => setFormData({ ...formData, bonusBgClass: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
          >
            <option value="bg-green-600">Verde</option>
            <option value="bg-blue-600">Azul</option>
            <option value="bg-purple-600">Roxo</option>
            <option value="bg-red-600">Vermelho</option>
            <option value="bg-yellow-600">Amarelo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ordem</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            min="1"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="h-4 w-4 text-blue focus:ring-blue border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
            Banner ativo
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Banner'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
