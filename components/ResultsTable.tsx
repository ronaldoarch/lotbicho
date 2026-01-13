'use client'

import { SAMPLE_RESULTS, ResultData } from '@/data/results'
import { ResultadoItem } from '@/types/resultados'

interface ResultsTableProps {
  date?: string
  location?: string
  drawTime?: string
  results?: ResultadoItem[]
  fallbackToSample?: boolean
}

function sortByPosition(rows: (ResultadoItem | ResultData)[]) {
  const getOrder = (value?: string) => {
    if (!value) return Number.MAX_SAFE_INTEGER
    const match = value.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
  }

  return [...rows].sort((a, b) => getOrder(a.position) - getOrder(b.position))
}

export default function ResultsTable({
  date = '10/01/2026',
  location = 'Rio de Janeiro',
  drawTime = 'PT-RIO 9h20',
  results,
  fallbackToSample = true,
}: ResultsTableProps) {
  const baseRows: (ResultadoItem | ResultData)[] =
    results && results.length > 0 ? results : fallbackToSample ? SAMPLE_RESULTS : []
  const rows = sortByPosition(baseRows)

  return (
    <div className="overflow-x-auto rounded-xl bg-white">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-950">
          {date} - {drawTime}
        </h2>
        <p className="text-sm text-gray-600">Local: {location}</p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Prêmio</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Milhar</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grupo</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Animal</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-sm text-gray-600" colSpan={4}>
                Nenhum resultado encontrado para o filtro selecionado.
              </td>
            </tr>
          ) : (
            rows.map((result, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-blue/5 transition-colors"
              >
                <td className="px-4 py-3 font-bold text-blue">{result.position}</td>
                <td className="px-4 py-3 font-semibold text-gray-950">{result.milhar}</td>
                <td className="px-4 py-3 text-gray-700">{result.grupo}</td>
                <td className="px-4 py-3 text-gray-700">{result.animal}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
