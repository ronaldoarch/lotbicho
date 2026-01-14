'use client'

import { useEffect, useState } from 'react'

interface Tema {
  id: string
  nome: string
  cores: {
    primaria: string
    secundaria: string
    acento: string
    sucesso: string
    texto: string
    textoSecundario: string
    textoLink?: string
    textoParagrafo?: string
    textoTitulo?: string
    fundo: string
    fundoSecundario: string
  }
  ativo: boolean
}

export function useTema() {
  const [tema, setTema] = useState<Tema | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTema()
    
    // Recarrega quando a janela ganha foco
    const handleFocus = () => {
      loadTema()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadTema = async () => {
    try {
      const response = await fetch(`/api/tema?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      
      if (data.tema) {
        setTema(data.tema)
        applyTema(data.tema)
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyTema = (temaData: Tema) => {
    const root = document.documentElement
    root.style.setProperty('--tema-primaria', temaData.cores.primaria)
    root.style.setProperty('--tema-secundaria', temaData.cores.secundaria)
    root.style.setProperty('--tema-acento', temaData.cores.acento)
    root.style.setProperty('--tema-sucesso', temaData.cores.sucesso)
    root.style.setProperty('--tema-texto', temaData.cores.texto)
    root.style.setProperty('--tema-texto-secundario', temaData.cores.textoSecundario)
    root.style.setProperty('--tema-texto-link', temaData.cores.textoLink || temaData.cores.primaria)
    root.style.setProperty('--tema-texto-paragrafo', temaData.cores.textoParagrafo || temaData.cores.texto)
    root.style.setProperty('--tema-texto-titulo', temaData.cores.textoTitulo || temaData.cores.texto)
    root.style.setProperty('--tema-fundo', temaData.cores.fundo)
    root.style.setProperty('--tema-fundo-secundario', temaData.cores.fundoSecundario)
  }

  return { tema, loading }
}
