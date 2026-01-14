'use client'

import { useEffect, useMemo, useState } from 'react'
import { BetData } from '@/types/bet'
import { ANIMALS } from '@/data/animals'
import { MODALITIES } from '@/data/modalities'
import ProgressIndicator from './ProgressIndicator'
import SpecialQuotationsModal from './SpecialQuotationsModal'
import ModalitySelection from './ModalitySelection'
import AnimalSelection from './AnimalSelection'
import PositionAmountDivision from './PositionAmountDivision'
import LocationSelection from './LocationSelection'
import BetConfirmation from './BetConfirmation'
import InstantResultModal from './InstantResultModal'

const INITIAL_BET_DATA: BetData = {
  modality: null,
  animalBets: [],
  position: null,
  customPosition: false,
  amount: 2.0,
  divisionType: 'all',
  useBonus: false,
  bonusAmount: 0,
  location: null,
  instant: false,
  specialTime: null,
}

export default function BetFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [betData, setBetData] = useState<BetData>(INITIAL_BET_DATA)
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'bicho' | 'loteria'>('bicho')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showInstantResult, setShowInstantResult] = useState(false)
  const [instantResult, setInstantResult] = useState<{ prizes: number[]; groups: number[]; premioTotal: number } | null>(null)

  const MAX_PALPITES = 10

  const requiredAnimalsPerBet = useMemo(
    () => getRequiredAnimalsPerBet(betData.modalityName || betData.modality),
    [betData.modality, betData.modalityName]
  )

  const animalsValid = betData.animalBets.length > 0 && betData.animalBets.length <= MAX_PALPITES

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        setIsAuthenticated(Boolean(data?.user))
        if (data?.user) {
          setBetData((prev) => ({ ...prev, bonusAmount: data.user.bonus ?? 0 }))
        } else {
          setBetData((prev) => ({ ...prev, bonusAmount: 0 }))
        }
      } catch (error) {
        setIsAuthenticated(false)
        setBetData((prev) => ({ ...prev, bonusAmount: 0 }))
      }
    }
    loadMe()
  }, [])

  const handleNext = () => {
    if (currentStep === 2 && !animalsValid) return
    const nextStep = currentStep + 1
    if (nextStep >= 3 && !isAuthenticated) {
      alert('Você precisa estar logado para continuar. Faça login para usar seu saldo.')
      window.location.href = '/login'
      return
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAddAnimalBet = (ids: number[]) => {
    setBetData((prev) => {
      if (prev.animalBets.length >= MAX_PALPITES) return prev
      return { ...prev, animalBets: [...prev.animalBets, ids] }
    })
  }

  const handleRemoveAnimalBet = (index: number) => {
    setBetData((prev) => ({
      ...prev,
      animalBets: prev.animalBets.filter((_, i) => i !== index),
    }))
  }

  const handleConfirm = () => {
    const modalityName = MODALITIES.find((m) => String(m.id) === betData.modality)?.name || 'Modalidade'
    const animalNames = betData.animalBets
      .map((grp) =>
        grp
          .map((id) => ANIMALS.find((a) => a.id === id)?.name || `Animal ${String(id).padStart(2, '0')}`)
          .join('-'),
      )
      .join(' | ')

    const payload = {
      concurso: betData.location ? `Extração ${betData.location}` : null,
      loteria: betData.location,
      estado: undefined,
      horario: betData.specialTime || null,
      dataConcurso: new Date().toISOString(),
      modalidade: modalityName,
      aposta: `${modalityName}: ${animalNames}`,
      valor: betData.amount,
      retornoPrevisto: 0,
      status: 'pendente',
      useBonus: betData.useBonus,
      detalhes: {
        betData,
        modalityName,
        animalNames,
      },
    }

    fetch('/api/apostas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Erro ao criar aposta')
        }
        const data = await res.json()
        if (betData.instant && data.aposta?.detalhes?.resultadoInstantaneo) {
          setInstantResult({
            prizes: data.aposta.detalhes.resultadoInstantaneo.prizes,
            groups: data.aposta.detalhes.resultadoInstantaneo.groups,
            premioTotal: data.aposta.detalhes.premioTotal || 0,
          })
          setShowInstantResult(true)
        } else {
          alert('Aposta registrada com sucesso!')
        }
      })
      .catch((err) => {
        const msg = err.message || 'Erro ao registrar aposta'
        if (msg.toLowerCase().includes('saldo insuficiente')) {
          alert('Saldo insuficiente. Verifique seu saldo e bônus disponíveis.')
        } else {
          alert(msg)
        }
      })
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Tabs */}
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

            {activeTab === 'bicho' ? (
              <ModalitySelection
                selectedModality={betData.modality}
                onModalitySelect={(modalityId, modalityName) =>
                  setBetData((prev) => ({
                    ...prev,
                    modality: modalityId,
                    modalityName,
                    animalBets: [], // limpa palpites ao trocar modalidade
                  }))
                }
                onSpecialQuotationsClick={() => setShowSpecialModal(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="iconify i-fluent:ticket-diagonal-16-regular text-6xl text-gray-400 mb-4"></span>
                <p className="text-gray-600">Seção de Loterias em desenvolvimento</p>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <AnimalSelection
            animalBets={betData.animalBets}
            requiredPerBet={requiredAnimalsPerBet}
            maxPalpites={MAX_PALPITES}
            onAddBet={handleAddAnimalBet}
            onRemoveBet={handleRemoveAnimalBet}
          />
        )

      case 3:
        return (
          <PositionAmountDivision
            position={betData.position}
            customPosition={betData.customPosition}
            amount={betData.amount}
            divisionType={betData.divisionType}
            useBonus={betData.useBonus}
            bonusAmount={betData.bonusAmount}
            onPositionChange={(pos) => setBetData((prev) => ({ ...prev, position: pos }))}
            onCustomPositionChange={(checked) =>
              setBetData((prev) => ({ ...prev, customPosition: checked }))
            }
            onAmountChange={(amount) => setBetData((prev) => ({ ...prev, amount }))}
            onDivisionTypeChange={(type) => setBetData((prev) => ({ ...prev, divisionType: type }))}
            onBonusToggle={(use) => setBetData((prev) => ({ ...prev, useBonus: use }))}
          />
        )

      case 4:
        return (
          <LocationSelection
            instant={betData.instant}
            location={betData.location}
            specialTime={betData.specialTime}
            onInstantChange={(checked) => setBetData((prev) => ({ ...prev, instant: checked }))}
            onLocationChange={(loc) => setBetData((prev) => ({ ...prev, location: loc }))}
            onSpecialTimeChange={(time) => setBetData((prev) => ({ ...prev, specialTime: time }))}
          />
        )

      case 5:
        return (
          <BetConfirmation betData={betData} onConfirm={handleConfirm} onBack={handleBack} />
        )

      default:
        return null
    }
  }

  return (
    <div>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} />

      {/* Special Quotations Modal */}
      <SpecialQuotationsModal
        isOpen={showSpecialModal}
        onClose={() => setShowSpecialModal(false)}
      />

      {/* Step Content */}
      <div className="mb-6">{renderStep()}</div>

      {/* Aviso de login necessário a partir da etapa 3 */}
      {isAuthenticated === false && currentStep >= 2 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Para avançar para a etapa 3 você precisa fazer login (usa o saldo da carteira).
        </div>
      )}

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !betData.modality && activeTab === 'bicho') ||
              (currentStep === 2 && !animalsValid) ||
              (currentStep >= 2 && isAuthenticated === false)
            }
            className="flex-1 rounded-lg bg-yellow px-6 py-3 font-bold text-blue-950 hover:bg-yellow/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Modal de resultado instantâneo */}
      <InstantResultModal
        open={showInstantResult}
        onClose={() => {
          setShowInstantResult(false)
          setInstantResult(null)
        }}
        resultado={instantResult}
      />
    </div>
  )
}

function getRequiredAnimalsPerBet(modalityIdOrName: string | null): number {
  if (!modalityIdOrName) return 1

  const norm = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  const normalized = norm(modalityIdOrName)

  // Prioriza nome
  if (normalized.includes('dupla de grupo') || normalized === 'dupla') return 2
  if (normalized.includes('terno de grupo') || normalized === 'terno') return 3
  if (normalized.includes('quadra de grupo') || normalized === 'quadra') return 4
  if (normalized.includes('quina de grupo') || normalized === 'quina') return 5
  if (normalized === 'passe vai e vem') return 2
  if (normalized === 'passe vai') return 2

  // Fallback por ID conhecido
  const idNum = Number(modalityIdOrName)
  if (!Number.isNaN(idNum)) {
    if (idNum === 2) return 2 // Dupla de Grupo
    if (idNum === 3) return 3 // Terno de Grupo
    if (idNum === 4) return 4 // Quadra de Grupo
    if (idNum === 5) return 5 // Quina de Grupo
  }

  return 1 // Grupo simples ou outras
}
