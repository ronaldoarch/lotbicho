'use client'

import { useEffect, useMemo, useState } from 'react'
import { SPECIAL_TIMES } from '@/data/modalities'

interface Extracao {
  id: number
  name: string
  estado?: string
  realCloseTime?: string
  closeTime: string
  time: string
  active: boolean
  max: number
  days: string
}

type ExtracaoWithMeta = Extracao & {
  closeStr?: string
  closeDate?: Date
  minutesToClose: number
}

interface LocationSelectionProps {
  instant: boolean
  location: string | null
  specialTime: string | null
  onInstantChange: (checked: boolean) => void
  onLocationChange: (locationId: string) => void
  onSpecialTimeChange: (timeId: string | null) => void
}

const CLOSE_THRESHOLD_MINUTES = 5

export default function LocationSelection({
  instant,
  location,
  specialTime,
  onInstantChange,
  onLocationChange,
  onSpecialTimeChange,
}: LocationSelectionProps) {
  const [extracoes, setExtracoes] = useState<Extracao[]>([])
  const [loading, setLoading] = useState(true)
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/extracoes')
        const data = await res.json()
        setExtracoes((data?.extracoes || []).filter((e: Extracao) => e.active))
      } catch (error) {
        console.error('Erro ao carregar extrações', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 60_000) // refresca a cada 1 min para trocar automática
    return () => clearInterval(timer)
  }, [])

  const now = Date.now()

  const normalized = useMemo(() => {
    return extracoes
      .map((e) => {
        const closeStr = e.realCloseTime || e.closeTime || e.time
        const closeDate = parseTimeToday(closeStr)
        const minutesToClose = closeDate ? (closeDate.getTime() - now) / 60000 : Number.POSITIVE_INFINITY
        return { ...e, closeStr, closeDate, minutesToClose }
      })
      .sort((a, b) => (a.closeDate?.getTime() || 0) - (b.closeDate?.getTime() || 0))
  }, [extracoes, now])

  const available = normalized.filter((e) => e.minutesToClose > CLOSE_THRESHOLD_MINUTES)

  const groupedByEstado = useMemo(() => {
    const groups: Record<string, ExtracaoWithMeta[]> = {}
    for (const ext of normalized) {
      const key = ext.estado || 'Outros'
      if (!groups[key]) groups[key] = []
      groups[key].push(ext)
    }
    // ordena estados alfabeticamente
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([estado, items]) => ({ estado, items }))
  }, [normalized])

  const toggleEstado = (estado: string) => {
    setOpenStates((prev) => ({ ...prev, [estado]: !prev[estado] }))
  }

  useEffect(() => {
    // abre todos por padrão na primeira carga
    if (groupedByEstado.length > 0 && Object.keys(openStates).length === 0) {
      const next: Record<string, boolean> = {}
      groupedByEstado.forEach((g) => {
        next[g.estado] = true
      })
      setOpenStates(next)
    }
  }, [groupedByEstado, openStates])

  useEffect(() => {
    if (available.length === 0 && normalized.length === 0) return
    const current =
      available.find((e) => e.id.toString() === location) ||
      (available.length > 0 ? available[0] : normalized[0])
    if (!location && current) {
      onLocationChange(current.id.toString())
    }
    if (location && current && current.id.toString() !== location) {
      onLocationChange(current.id.toString())
    }
  }, [available, normalized, location, onLocationChange])

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-gray-950">Selecione a extração e horário:</h2>

      {/* Instant Checkbox */}
      <div className="mb-6">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-4 hover:border-blue/50 transition-colors">
          <input
            type="checkbox"
            checked={instant}
            onChange={(e) => onInstantChange(e.target.checked)}
            className="h-5 w-5 accent-blue"
          />
          <span className="text-lg font-semibold text-gray-950">INSTANTANEA</span>
        </label>
      </div>

      {/* Extrações do banco agrupadas por estado */}
      <div className="mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-950">Extrações ativas (troca automática perto do fechamento):</h3>

        {loading && <p className="text-sm text-gray-500">Carregando extrações...</p>}

        {!loading && normalized.length === 0 && (
          <p className="text-sm text-red-600">Nenhuma extração encontrada.</p>
        )}

        <div className="space-y-3">
          {groupedByEstado.map((group) => (
            <div key={group.estado} className="overflow-hidden rounded-xl border border-blue/60">
              <button
                type="button"
                onClick={() => toggleEstado(group.estado)}
                className="flex w-full items-center justify-between bg-blue/5 px-4 py-3 text-left text-sm font-semibold text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue"></span>
                  {group.estado}
                </span>
                <span className="text-lg text-blue">{openStates[group.estado] ? '▾' : '▸'}</span>
              </button>
              {openStates[group.estado] && (
                <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-3">
                  {group.items.map((ext) => {
                    const isSelected = location === ext.id.toString()
                    const isClosingSoon = ext.minutesToClose <= CLOSE_THRESHOLD_MINUTES && ext.minutesToClose > 0
                    const closed = ext.minutesToClose <= 0
                    return (
                      <button
                        key={ext.id}
                        onClick={() => !closed && onLocationChange(ext.id.toString())}
                        disabled={closed}
                        className={`flex flex-col items-start rounded-lg border-2 p-4 transition-all ${
                          isSelected ? 'border-blue bg-blue/10 shadow-lg' : 'border-gray-200 bg-white hover:border-blue/50'
                        } ${closed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-semibold text-gray-950">{ext.name}</span>
                          <span className="text-xs font-medium text-gray-500">#{ext.id}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-700">
                          Fecha às <strong>{ext.closeStr}</strong>
                          {ext.realCloseTime && ext.realCloseTime !== ext.closeTime && (
                            <span className="text-xs text-gray-500"> (real: {ext.realCloseTime})</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Dias: {ext.days}</div>
                        {closed ? (
                          <span className="mt-2 inline-flex w-fit rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                            Encerrada
                          </span>
                        ) : isClosingSoon ? (
                          <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                            Fechando em {Math.max(1, Math.floor(ext.minutesToClose))} min
                          </span>
                        ) : (
                          <span className="mt-2 inline-flex w-fit rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Aberta
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Horários especiais */}
      {!instant && SPECIAL_TIMES.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-950">Horários Especiais:</h3>
          <div className="space-y-3">
            {SPECIAL_TIMES.map((time) => (
              <label
                key={time.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                  specialTime === time.id
                    ? 'border-blue bg-blue/10'
                    : 'border-gray-200 bg-white hover:border-blue/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={specialTime === time.id}
                  onChange={(e) => onSpecialTimeChange(e.target.checked ? time.id : null)}
                  className="h-5 w-5 accent-blue"
                />
                <span className="font-semibold text-gray-950">{time.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function parseTimeToday(time: string | undefined) {
  if (!time) return undefined
  const [h, m] = time.split(':').map((v) => parseInt(v, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return undefined
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}
