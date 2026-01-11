'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import ResultsTable from '@/components/ResultsTable'
import { LOCATIONS } from '@/data/results'

export default function ResultadosPage() {
  const [selectedDate, setSelectedDate] = useState('2026-01-10')
  const [selectedLocation, setSelectedLocation] = useState('Rio de Janeiro')
  const [activeTab, setActiveTab] = useState<'bicho' | 'loteria'>('bicho')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

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
              Resultados
            </h1>
          </div>

          {/* Tabs */}
          <div className="rounded-xl bg-white p-4 md:p-6 lg:p-8">
            <div className="mb-6 flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('bicho')}
                className={`flex items-center gap-2 border-b-2 pb-2 px-4 font-semibold transition-colors ${
                  activeTab === 'bicho'
                    ? 'border-blue text-blue'
                    : 'border-transparent text-gray-600 hover:text-blue'
                }`}
              >
                <span className="iconify i-fluent:animal-rabbit-20-regular"></span>
                Bicho
              </button>
              <button
                onClick={() => setActiveTab('loteria')}
                className={`flex items-center gap-2 border-b-2 pb-2 px-4 font-semibold transition-colors ${
                  activeTab === 'loteria'
                    ? 'border-blue text-blue'
                    : 'border-transparent text-gray-600 hover:text-blue'
                }`}
              >
                <span className="iconify i-fluent:ticket-diagonal-16-regular"></span>
                Loterias
              </button>
            </div>

            {/* Filters */}
            {activeTab === 'bicho' && (
              <>
                <div className="mb-6 flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Data</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Localização</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="w-full rounded-lg bg-blue px-6 py-2 font-semibold text-white hover:bg-blue-scale-70 transition-colors md:w-auto">
                      Buscar
                    </button>
                  </div>
                </div>

                <p className="mb-4 text-xs text-gray-500">
                  * Todos os resultados seguem o horário de Brasília (GMT-3).
                </p>

                {/* Results Table */}
                <ResultsTable
                  date={formatDate(selectedDate)}
                  location={selectedLocation}
                  drawTime="PT-RIO 9h20"
                />
              </>
            )}

            {activeTab === 'loteria' && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="iconify i-fluent:ticket-diagonal-16-regular text-6xl text-gray-400 mb-4"></span>
                <p className="text-gray-600">Seção de Loterias em desenvolvimento</p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          {activeTab === 'bicho' && (
            <div className="flex justify-center">
              <a
                href="/jogo-do-bicho"
                className="rounded-lg bg-yellow px-8 py-3 font-bold text-blue-950 hover:bg-yellow/90 transition-colors"
              >
                JOGAR AGORA
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
