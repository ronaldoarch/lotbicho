'use client'

import { useState } from 'react'
import { MODALITIES, SPECIAL_QUOTATIONS } from '@/data/modalities'
import SpecialQuotationsModal from './SpecialQuotationsModal'
import { useModalidades } from '@/hooks/useModalidades'

export default function QuotationGrid() {
  const { modalidades } = useModalidades()
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  
  // Usar modalidades do banco se disponíveis, senão usar do arquivo estático
  const modalidadesParaExibir = modalidades.length > 0 ? modalidades : MODALITIES

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modalidadesParaExibir.map((quotation) => (
          <div
            key={quotation.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="mb-2 text-lg font-bold text-gray-950">{quotation.name}</h3>
            <p className="mb-4 text-2xl font-extrabold text-blue">{quotation.value}</p>

            {quotation.hasLink && (
              <button
                onClick={() => setShowSpecialModal(true)}
                className="mb-3 flex items-center gap-1 text-sm text-blue underline hover:text-blue-scale-70 transition-colors"
              >
                Ver cotações
                <span className="iconify i-material-symbols:arrow-drop-down text-lg"></span>
              </button>
            )}

            <button className="mt-auto rounded-lg bg-blue px-4 py-2 font-semibold text-white hover:bg-blue-scale-70 transition-colors">
              JOGAR
            </button>
          </div>
        ))}
      </div>

      <SpecialQuotationsModal
        isOpen={showSpecialModal}
        onClose={() => setShowSpecialModal(false)}
      />
    </>
  )
}
