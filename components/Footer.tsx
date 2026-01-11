'use client'

import { useConfiguracoes } from '@/hooks/useConfiguracoes'

export default function Footer() {
  const { configuracoes } = useConfiguracoes()

  return (
    <footer className="order-[999] flex w-full flex-col gap-8 bg-blue p-6 px-8 py-14 text-white lg:px-36">
      <div className="flex w-full items-center justify-between lg:justify-center">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <a 
            href={`https://wa.me/${configuracoes.whatsappSuporte}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2 text-yellow-50 hover:text-yellow transition-colors"
          >
            Suporte
          </a>
          <a href="/termos-de-uso" className="flex items-center gap-2 px-6 py-2 text-yellow-50 hover:text-yellow transition-colors">
            Termos de Uso
          </a>
          <a href="/politica-de-privacidade" className="flex items-center gap-2 px-6 py-2 text-yellow-50 hover:text-yellow transition-colors">
            Política de Privacidade
          </a>
        </div>
      </div>

      <hr className="border-0 border-t border-yellow" />

      <div className="flex w-full flex-col gap-10 p-8">
        <div className="flex w-full justify-center gap-4 lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🦁</span>
            <span className="text-3xl font-bold text-white lg:text-4xl">{configuracoes.nomePlataforma}</span>
          </div>
          <div className="hidden items-center gap-8 lg:flex">
            <a href={`https://wa.me/${configuracoes.whatsappSuporte}`} target="_blank" rel="noopener noreferrer">
              <button className="flex min-h-[48px] shrink-0 cursor-pointer touch-manipulation flex-nowrap items-center justify-center gap-2 rounded-xl border border-blue-scale-100 bg-transparent px-5 py-2 text-base font-semibold text-black transition-colors duration-75 hover:border-yellow hover:bg-blue-scale-2-10 hover:text-yellow focus:border-blue-scale-100 focus:text-blue-scale-100 active:bg-blue-scale-2-10 disabled:cursor-default disabled:opacity-80">
                <span className="iconify i-fluent:chat-12-filled" style={{ fontSize: '24px' }}></span>
                FALE CONOSCO
              </button>
            </a>
            <button className="flex min-h-[48px] shrink-0 cursor-pointer touch-manipulation flex-nowrap items-center justify-center gap-2 rounded-xl border border-blue-scale-100 bg-transparent px-5 py-2 text-base font-semibold text-black transition-colors duration-75 hover:border-yellow hover:bg-blue-scale-2-10 hover:text-yellow focus:border-blue-scale-100 focus:text-blue-scale-100 active:bg-blue-scale-2-10 disabled:cursor-default disabled:opacity-80">
              <span className="iconify i-fluent:question-circle-32-filled" style={{ fontSize: '24px' }}></span>
              COMO JOGAR
            </button>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center pb-14 lg:pb-0">
        <div className="flex items-center justify-center">
          <span className="text-6xl">🦁</span>
        </div>
      </div>
    </footer>
  )
}
