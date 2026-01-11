'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

export default function SuportePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          {/* Sub-header */}
          <div className="flex items-center gap-4 bg-blue/10 px-4 py-3">
            <a href="/" className="flex items-center justify-center rounded-lg p-2 hover:bg-white/20 transition-colors">
              <span className="iconify i-material-symbols:arrow-back text-2xl text-gray-950"></span>
            </a>
            <h1 className="flex-1 text-center text-xl font-bold text-gray-950 md:text-2xl">
              Suporte
            </h1>
          </div>

          {/* Content */}
          <div className="rounded-xl bg-white p-4 md:p-6 lg:p-8">
            {/* Welcome Section */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-blue">
                Aprenda a navegar pelo site da Lot Bicho
              </h2>
              <p className="mb-6 text-gray-700">
                Explore nossos <strong>tutoriais</strong> e saiba como aproveitar o melhor da Lot Bicho.
              </p>
              <button className="rounded-lg bg-blue px-6 py-3 font-semibold text-white hover:bg-blue-scale-70 transition-colors">
                Tour de boas-vindas
              </button>
            </section>

            {/* Functionalities Section */}
            <section className="mb-8">
              <h3 className="mb-4 text-xl font-bold text-gray-950">Entenda as funcionalidades</h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Funcionalidades Gerais */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold text-gray-950">Funcionalidades</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="/suporte/saque" className="text-blue hover:underline">
                        SAQUE
                      </a>
                    </li>
                    <li>
                      <a href="/suporte/transacoes" className="text-blue hover:underline">
                        MINHAS TRANSAÇÕES
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho/resultados" className="text-blue hover:underline">
                        RESULTADOS
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho" className="text-blue hover:underline">
                        APOSTAS
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Modalidades Jogo do Bicho */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold text-gray-950">Jogo do Bicho</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="/jogo-do-bicho?modalidade=grupos" className="text-blue hover:underline">
                        GRUPOS
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho?modalidade=dezenas" className="text-blue hover:underline">
                        DEZENAS
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho?modalidade=centenas" className="text-blue hover:underline">
                        CENTENAS
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho?modalidade=milhares" className="text-blue hover:underline">
                        MILHARES
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho?modalidade=passe-vai" className="text-blue hover:underline">
                        PASSE VAI
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho?modalidade=passe-vai-e-vem" className="text-blue hover:underline">
                        PASSE VAI E VEM
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Modalidades Loterias */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold text-gray-950">Loterias</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="/jogo-do-bicho?modalidade=lotinha" className="text-blue hover:underline">
                        LOTINHA
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho?modalidade=quininha" className="text-blue hover:underline">
                        QUININHA
                      </a>
                    </li>
                    <li>
                      <a href="/jogo-do-bicho?modalidade=seninha" className="text-blue hover:underline">
                        SENINHA
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* WhatsApp Support */}
            <section className="border-t border-gray-200 pt-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-gray-700">
                  Se precisar de ajuda, fale no WhatsApp: <strong>+55 (21) 9 6688-5185</strong>
                </p>
                <a
                  href="https://wa.me/5521966885185"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 transition-colors"
                >
                  <span className="text-2xl">💬</span>
                  Falar no WhatsApp
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
