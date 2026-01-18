'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MODALITIES } from '@/data/modalities'
import { useModalidades } from '@/hooks/useModalidades'
import { extracoes } from '@/data/extracoes'

interface SpecialQuotationsModalProps {
  isOpen: boolean
  onClose: () => void
  modalidadeId?: number // ID da modalidade para filtrar cotações especiais
}

interface CotacaoEspecial {
  id: number
  name: string | null
  value: string | null
  modalidadeId: number | null
  extracaoId: number | null
  promocaoId: number | null
  isSpecial: boolean
}

export default function SpecialQuotationsModal({ isOpen, onClose, modalidadeId }: SpecialQuotationsModalProps) {
  const router = useRouter()
  const { modalidades } = useModalidades()
  const [cotacoes, setCotacoes] = useState<CotacaoEspecial[]>([])
  const [loading, setLoading] = useState(false)
  
  // Buscar nome da modalidade
  const modalidadesParaBuscar = modalidades.length > 0 ? modalidades : MODALITIES
  const modalidadeSelecionada = modalidadeId 
    ? modalidadesParaBuscar.find(m => m.id === modalidadeId)
    : null
  const modalidadeNome = modalidadeSelecionada?.name || 'Milhar'

  useEffect(() => {
    if (isOpen) {
      loadCotacoesEspeciais()
    }
  }, [isOpen, modalidadeId])

  const loadCotacoesEspeciais = async () => {
    setLoading(true)
    try {
      const url = modalidadeId 
        ? `/api/cotacoes/especiais?modalidadeId=${modalidadeId}`
        : '/api/cotacoes/especiais'
      
      const response = await fetch(url)
      const data = await response.json()
      setCotacoes(data.cotacoes || [])
    } catch (error) {
      console.error('Erro ao carregar cotações especiais:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCotacaoClick = (cotacao: CotacaoEspecial) => {
    // Fechar modal
    onClose()
    
    // Construir URL com parâmetros
    const params = new URLSearchParams()
    
    if (modalidadeSelecionada) {
      params.set('modalidade', modalidadeSelecionada.id.toString())
      params.set('modalidadeName', modalidadeSelecionada.name)
    }
    
    if (cotacao.extracaoId) {
      params.set('extracao', cotacao.extracaoId.toString())
    }
    
    if (cotacao.id) {
      params.set('cotacaoEspecial', cotacao.id.toString())
    }
    
    // Redirecionar para página de apostar
    router.push(`/apostar?${params.toString()}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-950">Cotações Especiais por Loteria</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <span className="iconify i-material-symbols:close text-2xl"></span>
          </button>
        </div>

        {/* Category */}
        <div className="mb-4">
          <span className="text-lg font-bold text-blue">{modalidadeNome}</span>
        </div>

        {/* List */}
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : cotacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma cotação especial cadastrada
            </div>
          ) : (
            cotacoes.map((quotation) => (
              <button
                key={quotation.id}
                onClick={() => handleCotacaoClick(quotation)}
                className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {quotation.isSpecial && (
                    <span className="text-xl" title="Cotação Especial">🔥</span>
                  )}
                  <p className="font-semibold text-gray-950">{quotation.name || 'Sem nome'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue">{quotation.value || '-'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
