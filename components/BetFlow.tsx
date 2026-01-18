'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BetData } from '@/types/bet'
import { ANIMALS } from '@/data/animals'
import { MODALITIES } from '@/data/modalities'
import { 
  calcularValorPorPalpite,
  calcularNumero,
  calcularGrupo,
  buscarOdd,
  calcularPremioUnidade,
  type ModalityType 
} from '@/lib/bet-rules-engine'
import { useModalidades } from '@/hooks/useModalidades'
import { parsePosition } from '@/lib/position-parser'
import ProgressIndicator from './ProgressIndicator'
import SpecialQuotationsModal from './SpecialQuotationsModal'
import ModalitySelection from './ModalitySelection'
import AnimalSelection from './AnimalSelection'
import NumberCalculator from './NumberCalculator'
import PositionAmountDivision from './PositionAmountDivision'
import LocationSelection from './LocationSelection'
import BetConfirmation from './BetConfirmation'
import InstantResultModal from './InstantResultModal'
import AlertModal from './AlertModal'

const INITIAL_BET_DATA: BetData = {
  modality: null,
  animalBets: [],
  numberBets: [],
  position: null,
  customPosition: false,
  customPositionValue: '',
  amount: 2.0,
  divisionType: 'all',
  useBonus: false,
  bonusAmount: 0,
  location: null,
  instant: false,
  specialTime: null,
}

export default function BetFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { modalidades } = useModalidades()
  const [currentStep, setCurrentStep] = useState(1)
  const [betData, setBetData] = useState<BetData>(INITIAL_BET_DATA)
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'bicho' | 'loteria'>('bicho')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showInstantResult, setShowInstantResult] = useState(false)
  const [instantResult, setInstantResult] = useState<{ prizes: number[]; groups: number[]; premioTotal: number } | null>(null)
  const [userSaldo, setUserSaldo] = useState<number>(0)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cotacaoEspecialId, setCotacaoEspecialId] = useState<number | null>(null)
  const [cotacaoEspecial, setCotacaoEspecial] = useState<{ value: string; extracaoId: number | null } | null>(null)

  const MAX_PALPITES = 10

  const requiredAnimalsPerBet = useMemo(
    () => getRequiredAnimalsPerBet(betData.modalityName || betData.modality),
    [betData.modality, betData.modalityName]
  )

  // Detecta se a modalidade é numérica
  const isNumberModality = useMemo(() => {
    const modalityName = betData.modalityName || ''
    const numberModalities = [
      'Milhar',
      'Centena',
      'Dezena',
      'Milhar Invertida',
      'Centena Invertida',
      'Dezena Invertida',
      'Milhar/Centena',
      'Duque de Dezena',
      'Terno de Dezena',
    ]
    return numberModalities.includes(modalityName)
  }, [betData.modalityName])

  const animalsValid = betData.animalBets.length > 0 && betData.animalBets.length <= MAX_PALPITES
  const numbersValid = betData.numberBets.length > 0 && betData.numberBets.length <= MAX_PALPITES
  const step2Valid = isNumberModality ? numbersValid : animalsValid

  // Carregar parâmetros da URL ao montar o componente
  useEffect(() => {
    const modalidadeParam = searchParams?.get('modalidade')
    const modalidadeNameParam = searchParams?.get('modalidadeName')
    const extracaoParam = searchParams?.get('extracao')
    const cotacaoEspecialParam = searchParams?.get('cotacaoEspecial')

    if (modalidadeParam && modalidadeNameParam) {
      const modalidadeId = parseInt(modalidadeParam)
      setBetData((prev) => ({
        ...prev,
        modality: modalidadeId.toString(),
        modalityName: modalidadeNameParam,
      }))
      setCurrentStep(2) // Avançar para o passo de seleção de palpites
    }

    if (extracaoParam) {
      const extracaoId = parseInt(extracaoParam)
      setBetData((prev) => ({
        ...prev,
        location: extracaoId.toString(),
      }))
    }

    if (cotacaoEspecialParam) {
      const cotacaoId = parseInt(cotacaoEspecialParam)
      setCotacaoEspecialId(cotacaoId)
      
      // Buscar dados da cotação especial
      fetch(`/api/admin/cotacoes`)
        .then(res => res.json())
        .then(data => {
          const cotacao = data.cotacoes?.find((c: any) => c.id === cotacaoId)
          if (cotacao) {
            setCotacaoEspecial({
              value: cotacao.value || '',
              extracaoId: cotacao.extracaoId,
            })
          }
        })
        .catch(err => console.error('Erro ao buscar cotação especial:', err))
    }
  }, [searchParams])

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        setIsAuthenticated(Boolean(data?.user))
        if (data?.user) {
          setBetData((prev) => ({ ...prev, bonusAmount: data.user.bonus ?? 0 }))
          setUserSaldo(data.user.saldo ?? 0)
        } else {
          setBetData((prev) => ({ ...prev, bonusAmount: 0 }))
          setUserSaldo(0)
        }
      } catch (error) {
        setIsAuthenticated(false)
        setBetData((prev) => ({ ...prev, bonusAmount: 0 }))
        setUserSaldo(0)
      }
    }
    loadMe()
  }, [])

  const handleNext = () => {
    if (currentStep === 2 && !step2Valid) return
    
    // Validar posição no step 3
    if (currentStep === 3) {
      if (!betData.customPosition && !betData.position) {
        setAlertMessage({
          title: 'Posição não selecionada',
          message: 'Por favor, selecione uma posição ou marque "Personalizado" e digite uma posição válida.',
        })
        setShowAlert(true)
        return
      }
      
      if (betData.customPosition && (!betData.customPositionValue || betData.customPositionValue.trim() === '')) {
        setAlertMessage({
          title: 'Posição personalizada vazia',
          message: 'Por favor, digite uma posição personalizada (ex: 1-5, 7, 5, etc.).',
        })
        setShowAlert(true)
        return
      }
      
      // Validar formato da posição personalizada
      if (betData.customPosition && betData.customPositionValue) {
        const customPos = betData.customPositionValue.trim().replace(/\s/g, '')
        
        // Aceita: números únicos (1, 2, 3...), ranges (1-5, 2-7...), ou formato "1º", "1-5", etc.
        // Remove "º" e valida apenas números e hífen
        const cleanedPos = customPos.replace(/º/g, '')
        const isValidFormat = /^\d+(-\d+)?$/.test(cleanedPos)
        
        if (!isValidFormat) {
          setAlertMessage({
            title: 'Formato inválido',
            message: 'Formato inválido. Use números individuais (ex: "1", "2", "3", "5", "6", "7") ou ranges (ex: "1-5", "1-7", "2-6").',
          })
          setShowAlert(true)
          return
        }
        
        // Validar que os números são válidos (entre 1 e 7)
        const parts = cleanedPos.split('-')
        const firstNum = parseInt(parts[0], 10)
        const secondNum = parts[1] ? parseInt(parts[1], 10) : firstNum
        
        if (firstNum < 1 || firstNum > 7 || secondNum < 1 || secondNum > 7 || firstNum > secondNum) {
          setAlertMessage({
            title: 'Posição inválida',
            message: 'As posições devem estar entre 1 e 7. Use números individuais (ex: "1", "2", "3", "5", "6", "7") ou ranges onde a primeira posição é menor ou igual à segunda (ex: "1-5", "2-6", "1-7").',
          })
          setShowAlert(true)
          return
        }
      }
    }
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

  const handleAddNumberBet = (number: string) => {
    setBetData((prev) => ({
      ...prev,
      numberBets: [...prev.numberBets, number],
    }))
  }

  const handleRemoveNumberBet = (index: number) => {
    setBetData((prev) => ({
      ...prev,
      numberBets: prev.numberBets.filter((_, i) => i !== index),
    }))
  }

  const calcularValorTotalAposta = () => {
    let valorTotal = betData.amount
    const qtdPalpites = isNumberModality ? betData.numberBets.length : betData.animalBets.length
    if (betData.divisionType === 'each') {
      valorTotal = betData.amount * qtdPalpites
    }
    if (betData.useBonus && betData.bonusAmount > 0) {
      valorTotal = Math.max(0, valorTotal - betData.bonusAmount)
    }
    return valorTotal
  }

  const validarSaldo = () => {
    if (!isAuthenticated) return true // Se não está logado, validação será no backend
    
    const valorTotal = calcularValorTotalAposta()
    const saldoDisponivel = userSaldo + (betData.useBonus ? betData.bonusAmount : 0)
    
    return valorTotal <= saldoDisponivel
  }

  const calcularRetornoPrevisto = (): number => {
    if (!betData.modalityName || (!isNumberModality && betData.animalBets.length === 0) || (isNumberModality && betData.numberBets.length === 0)) {
      return 0
    }

    try {
      // Mapear nome da modalidade para tipo (definir antes de usar)
      const modalityMap: Record<string, ModalityType> = {
        'Grupo': 'GRUPO',
        'Dupla de Grupo': 'DUPLA_GRUPO',
        'Terno de Grupo': 'TERNO_GRUPO',
        'Quadra de Grupo': 'QUADRA_GRUPO',
        'Dezena': 'DEZENA',
        'Centena': 'CENTENA',
        'Milhar': 'MILHAR',
        'Dezena Invertida': 'DEZENA_INVERTIDA',
        'Centena Invertida': 'CENTENA_INVERTIDA',
        'Milhar Invertida': 'MILHAR_INVERTIDA',
        'Milhar/Centena': 'MILHAR_CENTENA',
        'Passe vai': 'PASSE',
        'Passe vai e vem': 'PASSE_VAI_E_VEM',
      }
      const modalityType = modalityMap[betData.modalityName] || 'GRUPO'
      
      // Usar posição personalizada se estiver marcado, senão usar posição padrão
      const positionToUse = betData.customPosition && betData.customPositionValue 
        ? betData.customPositionValue.trim() 
        : betData.position
      const { pos_from, pos_to } = parsePosition(positionToUse)
      
      // Priorizar cotação especial se disponível
      let odd: number
      
      if (cotacaoEspecial && cotacaoEspecial.value) {
        // Extrair valor da cotação especial (ex: "1x R$ 7000.00" -> 7000)
        const rMatch = cotacaoEspecial.value.match(/R\$\s*(\d+(?:\.\d+)?)/)
        if (rMatch) {
          odd = parseFloat(rMatch[1])
        } else {
          // Fallback para cotação padrão
          const modalidadeDoBanco = modalidades.find(m => m.name === betData.modalityName && m.active !== false)
          if (modalidadeDoBanco && modalidadeDoBanco.value) {
            const rMatch2 = modalidadeDoBanco.value.match(/R\$\s*(\d+(?:\.\d+)?)/)
            odd = rMatch2 ? parseFloat(rMatch2[1]) : buscarOdd(modalityType, pos_from, pos_to, betData.modalityName)
          } else {
            odd = buscarOdd(modalityType, pos_from, pos_to, betData.modalityName)
          }
        }
      } else {
        // Buscar cotação da modalidade do banco (se disponível)
        const modalidadeDoBanco = modalidades.find(m => m.name === betData.modalityName && m.active !== false)
        
        if (modalidadeDoBanco && modalidadeDoBanco.value) {
          // Extrair valor da cotação do banco (ex: "1x R$ 20.00" -> 20)
          const rMatch = modalidadeDoBanco.value.match(/R\$\s*(\d+(?:\.\d+)?)/)
          if (rMatch) {
            odd = parseFloat(rMatch[1])
          } else {
            // Fallback para buscarOdd se não conseguir extrair
            odd = buscarOdd(modalityType, pos_from, pos_to, betData.modalityName)
          }
        } else {
          // Usar busca padrão se não encontrar no banco
          odd = buscarOdd(modalityType, pos_from, pos_to, betData.modalityName)
        }
      }

      const qtdPalpites = isNumberModality ? betData.numberBets.length : betData.animalBets.length
      const valorPorPalpite = calcularValorPorPalpite(betData.amount, qtdPalpites, betData.divisionType)
      
      let retornoTotal = 0

      if (isNumberModality) {
        for (const numero of betData.numberBets) {
          const calculation = calcularNumero(modalityType, numero, pos_from, pos_to, valorPorPalpite)
          const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)
          // Assumir 1 acerto por palpite (melhor caso)
          retornoTotal += premioUnidade
        }
      } else {
        for (const animalBet of betData.animalBets) {
          const qtdGrupos = animalBet.length
          const calculation = calcularGrupo(modalityType, qtdGrupos, pos_from, pos_to, valorPorPalpite)
          const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)
          // Assumir 1 acerto por palpite (melhor caso)
          retornoTotal += premioUnidade
        }
      }

      return retornoTotal
    } catch (error) {
      console.error('Erro ao calcular retorno previsto:', error)
      return 0
    }
  }

  // Recalcular retorno quando modalidades mudarem
  useEffect(() => {
    if (betData.modalityName) {
      // Força recálculo quando modalidades são carregadas/atualizadas
    }
  }, [modalidades])

  const handleConfirm = () => {
    // Prevenir múltiplas submissões
    if (isSubmitting) {
      return
    }

    // Validar saldo antes de confirmar
    if (!validarSaldo()) {
      const valorTotal = calcularValorTotalAposta()
      const saldoDisponivel = userSaldo + (betData.useBonus ? betData.bonusAmount : 0)
      const falta = valorTotal - saldoDisponivel
      
      setAlertMessage({
        title: 'Saldo Insuficiente',
        message: `Você não tem saldo suficiente para esta aposta.\n\nValor da aposta: R$ ${valorTotal.toFixed(2)}\nSaldo disponível: R$ ${saldoDisponivel.toFixed(2)}\nFalta: R$ ${falta.toFixed(2)}\n\nPor favor, faça um depósito ou ajuste o valor da aposta.`,
      })
      setShowAlert(true)
      return
    }

    setIsSubmitting(true)

    const modalityName = betData.modalityName || MODALITIES.find((m) => String(m.id) === betData.modality)?.name || 'Modalidade'
    
    let apostaText = ''
    if (isNumberModality) {
      apostaText = `${modalityName}: ${betData.numberBets.join(' | ')}`
    } else {
      const animalNames = betData.animalBets
        .map((grp) =>
          grp
            .map((id) => ANIMALS.find((a) => a.id === id)?.name || `Animal ${String(id).padStart(2, '0')}`)
            .join('-'),
        )
        .join(' | ')
      apostaText = `${modalityName}: ${animalNames}`
    }

    const retornoPrevistoCalculado = calcularRetornoPrevisto()

    const payload = {
      concurso: betData.location ? `Extração ${betData.location}` : null,
      loteria: betData.location,
      estado: undefined,
      horario: betData.specialTime || null,
      dataConcurso: new Date().toISOString(),
      modalidade: modalityName,
      aposta: apostaText,
      valor: betData.amount,
      retornoPrevisto: retornoPrevistoCalculado,
      status: 'pendente',
      useBonus: betData.useBonus,
      detalhes: {
        betData,
        modalityName,
        ...(isNumberModality ? { numberBets: betData.numberBets } : { animalNames: betData.animalBets }),
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
          setIsSubmitting(false)
        } else {
          // Redirecionar para minhas apostas após sucesso
          router.push('/minhas-apostas')
        }
      })
      .catch((err) => {
        const msg = err.message || 'Erro ao registrar aposta'
        if (msg.toLowerCase().includes('saldo insuficiente')) {
          alert('Saldo insuficiente. Verifique seu saldo e bônus disponíveis.')
        } else {
          alert(msg)
        }
        setIsSubmitting(false)
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
        if (isNumberModality) {
          return (
            <NumberCalculator
              modalityName={betData.modalityName || ''}
              numberBets={betData.numberBets}
              maxPalpites={MAX_PALPITES}
              onAddBet={handleAddNumberBet}
              onRemoveBet={handleRemoveNumberBet}
            />
          )
        }
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
            customPositionValue={betData.customPositionValue || ''}
            amount={betData.amount}
            divisionType={betData.divisionType}
            useBonus={betData.useBonus}
            bonusAmount={betData.bonusAmount}
            saldoDisponivel={isAuthenticated ? userSaldo + (betData.useBonus ? betData.bonusAmount : 0) : undefined}
            qtdPalpites={isNumberModality ? betData.numberBets.length : betData.animalBets.length}
            onPositionChange={(pos) => setBetData((prev) => ({ ...prev, position: pos, customPosition: false }))}
            onCustomPositionChange={(checked) => {
              setBetData((prev) => ({ 
                ...prev, 
                customPosition: checked,
                position: checked ? null : prev.position // Limpa posição padrão se marcar personalizado
              }))
            }}
            onCustomPositionValueChange={(value) =>
              setBetData((prev) => ({ ...prev, customPositionValue: value }))
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
          <BetConfirmation 
            betData={betData} 
            saldoDisponivel={isAuthenticated ? userSaldo + (betData.useBonus ? betData.bonusAmount : 0) : undefined}
            onConfirm={handleConfirm} 
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
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
              (currentStep === 2 && !step2Valid) ||
              (currentStep === 3 && !betData.customPosition && !betData.position) ||
              (currentStep === 3 && betData.customPosition && (!betData.customPositionValue || betData.customPositionValue.trim() === '')) ||
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
          setIsSubmitting(false)
          // Redirecionar para minhas apostas após fechar o modal
          router.push('/minhas-apostas')
        }}
        resultado={instantResult}
      />

      <AlertModal
        isOpen={showAlert}
        title={alertMessage.title}
        message={alertMessage.message}
        type="error"
        onClose={() => setShowAlert(false)}
        autoClose={5000}
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
