'use client'

import { MODALITIES } from '@/data/modalities'
import { Modality } from '@/types/bet'

interface ModalitySelectionProps {
  selectedModality: string | null
  onModalitySelect: (modalityId: string) => void
  onSpecialQuotationsClick: () => void
}

export default function ModalitySelection({
  selectedModality,
  onModalitySelect,
  onSpecialQuotationsClick,
}: ModalitySelectionProps) {
  return (
    <div>
      {/* Header with title and special quotations button */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Modalidade:</h2>
          <p className="mt-1 text-gray-600">Para começar, escolha a modalidade de jogo.</p>
        </div>
        <button
          onClick={onSpecialQuotationsClick}
          className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-blue bg-blue px-4 py-2 font-semibold text-white hover:bg-blue-scale-70 transition-colors"
        >
          <span className="text-lg">📊</span>
          Cotações Especiais
        </button>
      </div>

      {/* Selected Summary */}
      {selectedModality && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-gray-700">Modalidade selecionada:</p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            {(() => {
              const modality = MODALITIES.find((m) => m.id.toString() === selectedModality)
              return modality ? (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-950">{modality.name}</span>
                  <span className="font-bold text-blue">{modality.value}</span>
                </div>
              ) : null
            })()}
          </div>
        </div>
      )}

      {/* Modalities Grid - 2 columns fixed */}
      <div className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-2">
        {MODALITIES.map((modality) => {
          const isSelected = selectedModality === modality.id.toString()
          return (
            <button
              key={modality.id}
              onClick={() => onModalitySelect(modality.id.toString())}
              className={`flex flex-col rounded-md border-2 py-1.5 px-0.5 text-left transition-all ${
                isSelected
                  ? 'border-blue bg-blue/5'
                  : 'border-gray-200 bg-white hover:border-blue/30'
              }`}
            >
              <h3 className="mb-0.5 text-xs font-semibold text-gray-950 leading-tight">{modality.name}</h3>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-blue leading-tight">{modality.value}</p>
                {modality.hasLink && (
                  <span className="text-red-500 text-xs leading-none">🔥</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
