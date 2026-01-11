'use client'

import { useEffect, useState } from 'react'
import { MODALITIES as DEFAULT_MODALITIES } from '@/data/modalities'
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
  const [modalidades, setModalidades] = useState<Modality[]>(DEFAULT_MODALITIES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModalidades()
    
    // Recarrega quando a janela ganha foco (útil após editar no admin)
    const handleFocus = () => {
      loadModalidades()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadModalidades = async () => {
    try {
      // Adiciona timestamp para evitar cache
      const response = await fetch(`/api/modalidades?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      if (data.modalidades && data.modalidades.length > 0) {
        // Filtra apenas modalidades ativas antes de setar no estado
        const activeModalidades = data.modalidades.filter((m: Modality) => m.active !== false)
        setModalidades(activeModalidades)
        
        // Se a modalidade selecionada foi desativada, limpa a seleção
        if (selectedModality) {
          const selectedMod = activeModalidades.find(
            (m: Modality) => m.id.toString() === selectedModality
          )
          if (!selectedMod) {
            onModalitySelect('') // Limpa a seleção
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      // Mantém os dados padrão em caso de erro
    } finally {
      setLoading(false)
    }
  }
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

      {loading ? (
        <div className="text-center py-8 text-gray-600">Carregando modalidades...</div>
      ) : (
        <>
          {/* Selected Summary */}
          {selectedModality && (() => {
            const modality = modalidades.find(
              (m) => m.id.toString() === selectedModality && m.active !== false
            )
            // Se a modalidade selecionada foi desativada, não mostra o resumo
            if (!modality) {
              return null
            }
            return (
              <div className="mb-6">
                <p className="mb-2 text-sm font-semibold text-gray-700">Modalidade selecionada:</p>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-950">{modality.name}</span>
                    <span className="font-bold text-blue">{modality.value}</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Modalities Grid - 2 columns fixed */}
          <div className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-2">
            {modalidades.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                Nenhuma modalidade disponível no momento.
              </div>
            ) : (
              modalidades.map((modality) => {
                const isSelected = selectedModality === modality.id.toString()
                return (
                  <button
                    key={modality.id}
                    onClick={() => onModalitySelect(modality.id.toString())}
                    className={`flex min-h-[72px] flex-row items-center justify-between rounded-xl border-2 py-3 px-4 text-left transition-all ${
                      isSelected
                        ? 'border-blue bg-blue/5'
                        : 'border-gray-200 bg-white hover:border-blue/30'
                    }`}
                  >
                    <h3 className="text-base font-bold text-blue leading-tight">{modality.name}</h3>
                    <div className="flex items-center gap-1">
                      <div className="inline-flex items-center gap-1 rounded-full border-2 border-blue bg-blue px-3 py-1.5">
                        <span className="text-sm font-bold text-white leading-tight">{modality.value}</span>
                        {modality.hasLink && (
                          <span className="text-red-500 text-sm leading-none">🔥</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
