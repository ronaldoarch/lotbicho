'use client'

import { useEffect, useState } from 'react'

interface Configuracoes {
  nomePlataforma: string
  numeroSuporte: string
  emailSuporte: string
  whatsappSuporte: string
}

export function useConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({
    nomePlataforma: 'Lot Bicho',
    numeroSuporte: '(00) 00000-0000',
    emailSuporte: 'suporte@lotbicho.com',
    whatsappSuporte: '5500000000000',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfiguracoes()
    
    const handleFocus = () => {
      loadConfiguracoes()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadConfiguracoes = async () => {
    try {
      const response = await fetch(`/api/configuracoes?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      if (data.configuracoes) {
        setConfiguracoes(data.configuracoes)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  return { configuracoes, loading }
}
