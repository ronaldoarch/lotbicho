'use client'

import { useState, useEffect } from 'react'
import { MODALITIES, SPECIAL_QUOTATIONS } from '@/data/modalities'
import SpecialQuotationsModal from './SpecialQuotationsModal'
import { useModalidades } from '@/hooks/useModalidades'

interface CotacaoEspecial {
  id: number
  name: string | null
  value: string | null
  modalidadeId: number | null
  extracaoId: number | null
  promocaoId: number | null
  isSpecial: boolean
}

export default function QuotationGrid() {
  const { modalidades } = useModalidades()
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [selectedModalidadeId, setSelectedModalidadeId] = useState<number | undefined>(undefined)
  const [cotacoesEspeciais, setCotacoesEspeciais] = useState<CotacaoEspecial[]>([])
  
  // Usar modalidades do banco se disponíveis, senão usar do arquivo estático
  const modalidadesParaExibir = modalidades.length > 0 ? modalidades : MODALITIES

  useEffect(() => {
    loadCotacoesEspeciais()
  }, [])

  const loadCotacoesEspeciais = async () => {
    try {
      const response = await fetch('/api/cotacoes/especiais')
      const data = await response.json()
      setCotacoesEspeciais(data.cotacoes || [])
    } catch (error) {
      console.error('Erro ao carregar cotações especiais:', error)
    }
  }

  const hasSpecialQuotation = (modalidadeId: number) => {
    return cotacoesEspeciais.some(c => c.modalidadeId === modalidadeId)
  }

  const getSpecialQuotation = (modalidadeId: number) => {
    return cotacoesEspeciais.find(c => c.modalidadeId === modalidadeId)
  }

  const handleOpenSpecialModal = (modalidadeId: number) => {
    setSelectedModalidadeId(modalidadeId)
    setShowSpecialModal(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modalidadesParaExibir.map((quotation) => {
          const isSpecial = hasSpecialQuotation(quotation.id)
          const specialQuot = isSpecial ? getSpecialQuotation(quotation.id) : null
          
          return (
            <div
              key={quotation.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {isSpecial && (
                <span 
                  className="absolute top-2 right-2 text-xl" 
                  title="Cotação Especial"
                >
                  🔥
                </span>
              )}
              
              <h3 className="mb-2 text-lg font-bold text-gray-950 flex items-center gap-2">
                {quotation.name}
              </h3>
              
              <p className="mb-4 text-2xl font-extrabold text-blue">
                {specialQuot?.value || quotation.value}
              </p>

              {quotation.hasLink && (
                <button
                  onClick={() => handleOpenSpecialModal(quotation.id)}
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
          )
        })}
      </div>

      <SpecialQuotationsModal
        isOpen={showSpecialModal}
        onClose={() => {
          setShowSpecialModal(false)
          setSelectedModalidadeId(undefined)
        }}
        modalidadeId={selectedModalidadeId}
      />
    </>
  )
}
