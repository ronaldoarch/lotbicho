'use client'

import { useMemo, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import ResultsTable from '@/components/ResultsTable'
import { LOCATIONS } from '@/data/results'
import { useResultados } from '@/hooks/useResultados'
import { formatDateLabel, getDefaultDateISO, groupResultsByDrawTime } from '@/lib/resultados-helpers'

export default function ResultadosPage() {
  const defaultDate = getDefaultDateISO()
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].name)
  const [activeTab, setActiveTab] = useState<'bicho' | 'loteria'>('bicho')
  const { results, loading, load } = useResultados({ date: defaultDate, location: LOCATIONS[0].name })

  const groupedResults = useMemo(
    () => groupResultsByDrawTime(results, selectedLocation, selectedDate),
    [results, selectedLocation, selectedDate]
  )

  const handleSearch = () => {
    load({ date: selectedDate, location: selectedLocation })
  }

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
              Resultados
            </h1>
          </div>

          {/* Content */}
          <div className="rounded-xl bg-white p-4 md:p-6 lg:p-8">
            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('bicho')}
                className={`flex items-center gap-2 border-b-2 pb-2 px-4 font-semibold transition-colors ${
                  activeTab === 'bicho' ? 'border-blue text-blue' : 'border-transparent text-gray-600 hover:text-blue'
                }`}
              >
                <span className="iconify i-fluent:animal-rabbit-20-regular"></span>
                Bicho
              </button>
              <button
                onClick={() => setActiveTab('loteria')}
                className={`flex items-center gap-2 border-b-2 pb-2 px-4 font-semibold transition-colors ${
                  activeTab === 'loteria' ? 'border-blue text-blue' : 'border-transparent text-gray-600 hover:text-blue'
                }`}
              >
                <span className="iconify i-fluent:ticket-diagonal-16-regular"></span>
                Loterias
              </button>
            </div>

            {/* Search Form */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
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
                <label className="mb-2 block text-sm font-semibold text-gray-700">Estado</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
                >
                  {LOCATIONS.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.flag} {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="rounded-lg bg-blue px-6 py-2 font-semibold text-white hover:bg-blue-scale-70 transition-colors disabled:opacity-70"
                disabled={loading}
                type="button"
              >
                Buscar
              </button>
            </div>

            {/* Info Text */}
            <p className="mb-4 text-sm text-gray-600">
              * Todos os resultados seguem o horário de Brasília (GMT-3).
            </p>
            <p className="mb-6 text-base font-semibold text-gray-950">
              Busque por uma data e um estado.
            </p>

            {/* Results Table */}
            {activeTab === 'bicho' && (
              <>
                {loading && <div className="py-6 text-gray-600">Carregando resultados...</div>}

                {!loading && groupedResults.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                    Nenhum resultado encontrado para o filtro selecionado.
                  </div>
                )}

                {!loading &&
                  groupedResults.map((group) => (
                    <div key={`${group.drawTime}-${group.dateLabel}`} className="mb-6 last:mb-0">
                      <ResultsTable
                        date={group.dateLabel || formatDateLabel(selectedDate)}
                        location={group.locationLabel}
                        drawTime={group.drawTime}
                        results={group.rows}
                        fallbackToSample={false}
                      />
                    </div>
                  ))}
              </>
            )}

            {/* Play Now Button */}
            <div className="mt-8 text-center">
              <a
                href="/jogo-do-bicho"
                className="inline-block rounded-lg bg-yellow px-8 py-3 font-bold text-blue-950 hover:bg-yellow/90 transition-colors"
              >
                JOGAR AGORA
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
