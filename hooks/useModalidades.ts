'use client'

import { useEffect, useState } from 'react'

interface Modality {
  id: number
  name: string
  value: string
  hasLink: boolean
  active?: boolean
}

export function useModalidades() {
  const [modalidades, setModalidades] = useState<Modality[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModalidades()
    
    // Recarregar quando a janela recebe foco (para pegar atualizações)
    const handleFocus = () => {
      loadModalidades()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadModalidades = async () => {
    try {
      const response = await fetch(`/api/modalidades?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      if (data.modalidades) {
        setModalidades(data.modalidades)
      }
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      // Fallback para modalidades padrão em caso de erro
      const { MODALITIES } = require('@/data/modalities')
      setModalidades(MODALITIES)
    } finally {
      setLoading(false)
    }
  }

  return { modalidades, loading, reload: loadModalidades }
}
