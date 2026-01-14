'use client'

import { useTema } from '@/hooks/useTema'
import { useEffect } from 'react'

export default function TemaProvider({ children }: { children: React.ReactNode }) {
  const { tema, loading } = useTema()

  useEffect(() => {
    if (tema) {
      const root = document.documentElement
      root.style.setProperty('--tema-primaria', tema.cores.primaria)
      root.style.setProperty('--tema-secundaria', tema.cores.secundaria)
      root.style.setProperty('--tema-acento', tema.cores.acento)
      root.style.setProperty('--tema-sucesso', tema.cores.sucesso)
      root.style.setProperty('--tema-texto', tema.cores.texto)
      root.style.setProperty('--tema-texto-secundario', tema.cores.textoSecundario)
      root.style.setProperty('--tema-texto-link', tema.cores.textoLink || tema.cores.primaria)
      root.style.setProperty('--tema-texto-paragrafo', tema.cores.textoParagrafo || tema.cores.texto)
      root.style.setProperty('--tema-texto-titulo', tema.cores.textoTitulo || tema.cores.texto)
      root.style.setProperty('--tema-fundo', tema.cores.fundo)
      root.style.setProperty('--tema-fundo-secundario', tema.cores.fundoSecundario)
    }
  }, [tema])

  return <>{children}</>
}
