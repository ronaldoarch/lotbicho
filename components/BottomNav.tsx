'use client'

import { useState } from 'react'

export default function BottomNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="border-top-gradient-r-blue-to-yellow bottom-nav-container fixed bottom-0 left-0 right-0 z-50 flex w-full items-center justify-around bg-blue text-sm text-white shadow-lg xl:hidden">
      {/* Submenu */}
      <div
        className={`submenu-container has-2-items absolute bottom-10 left-1/2 z-20 flex h-20 w-20 -translate-x-1/2 transform items-center justify-center ${
          isMenuOpen ? 'active' : ''
        }`}
      >
        <div className="submenu-item flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-blue p-3 text-center text-white shadow-md">
          <span className="iconify i-material-symbols:pets" style={{ fontSize: '24px' }}></span>
          <span className="w-16 text-xs font-semibold leading-tight">Jogo do Bicho</span>
        </div>
        <div className="submenu-item flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-blue p-3 text-center text-white shadow-md">
          <span className="iconify i-fluent:ticket-diagonal-16-regular" style={{ fontSize: '24px' }}></span>
          <span className="w-16 text-xs font-semibold leading-tight">Loterias</span>
        </div>
      </div>

      {/* Menu */}
      <div
        className="flex cursor-pointer flex-col items-center justify-center gap-1 p-2 text-xs"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="iconify i-material-symbols-light:menu-rounded" style={{ fontSize: '20px' }}></span>
        Menu
      </div>

      {/* Resultados */}
      <a href="/jogo-do-bicho/resultados" className="flex cursor-pointer flex-col items-center justify-center gap-1 p-2 text-xs">
        <span className="iconify i-fluent:target-arrow-16-regular" style={{ fontSize: '20px' }}></span>
        Resultados
      </a>

      {/* Realizar Aposta - Botão Destaque */}
      <a href="/jogo-do-bicho" className="bg-yellow">
        <div className="relative -top-1 z-30 cursor-pointer bg-yellow px-2 text-xs text-blue-950 sm:px-4 sm:text-sm">
          <div className="pointer-events-none flex flex-col items-center justify-center gap-1">
            <span className="iconify i-material-symbols:pets" style={{ fontSize: '20px' }}></span>
            <div className="flex flex-col items-center leading-none">
              <span>Realizar</span>
              <span className="font-semibold">Aposta</span>
            </div>
          </div>
          <div className="absolute -top-3 left-0 -z-10 h-full w-full rounded-t-2xl bg-yellow"></div>
        </div>
      </a>

      {/* Cotação */}
      <a href="/jogo-do-bicho/cotacao" className="flex cursor-pointer flex-col items-center justify-center gap-1 p-2 text-xs">
        <span className="iconify i-fluent:reward-16-regular" style={{ fontSize: '20px' }}></span>
        Cotação
      </a>

      {/* Carteira */}
      <div className="flex cursor-pointer flex-col items-center justify-center gap-1 p-2 text-xs">
        <span className="iconify i-fluent:wallet-16-regular" style={{ fontSize: '20px' }}></span>
        Carteira
      </div>
    </div>
  )
}
