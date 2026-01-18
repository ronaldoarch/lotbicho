'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import BetFlowWrapper from '@/components/BetFlowWrapper'
import PromotionalBanner from '@/components/PromotionalBanner'

export default function ApostarPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          {/* Sub-header */}
          <div className="flex items-center gap-4 bg-blue/10 px-4 py-3">
            <button className="flex items-center justify-center rounded-lg p-2 hover:bg-white/20 transition-colors">
              <span className="iconify i-material-symbols:arrow-back text-2xl text-gray-950"></span>
            </button>
            <h1 className="flex-1 text-center text-xl font-bold text-gray-950 md:text-2xl">
              Jogo do Bicho Online
            </h1>
          </div>

          {/* Promotional Banner */}
          <PromotionalBanner />

          {/* Content */}
          <div className="rounded-xl bg-white p-4 md:p-6 lg:p-8">
            <BetFlowWrapper />
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
