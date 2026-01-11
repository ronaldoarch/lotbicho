import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import QuotationGrid from '@/components/QuotationGrid'

export default function CotacaoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          {/* Sub-header */}
          <div className="flex items-center gap-4 bg-blue/10 px-4 py-3">
            <a href="/jogo-do-bicho" className="flex items-center justify-center rounded-lg p-2 hover:bg-white/20 transition-colors">
              <span className="iconify i-material-symbols:arrow-back text-2xl text-gray-950"></span>
            </a>
            <h1 className="flex-1 text-center text-xl font-bold text-gray-950 md:text-2xl">
              Cotação
            </h1>
          </div>

          {/* Content */}
          <div className="rounded-xl bg-white p-4 md:p-6 lg:p-8">
            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-gray-200">
              <button className="flex items-center gap-2 border-b-2 border-blue pb-2 px-4 font-semibold text-blue">
                <span className="iconify i-fluent:animal-rabbit-20-regular"></span>
                Bicho
              </button>
              <button className="flex items-center gap-2 border-b-2 border-transparent pb-2 px-4 font-semibold text-gray-600 hover:text-blue transition-colors">
                <span className="iconify i-fluent:ticket-diagonal-16-regular"></span>
                Loterias
              </button>
            </div>

            {/* Quotation Grid */}
            <QuotationGrid />
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
