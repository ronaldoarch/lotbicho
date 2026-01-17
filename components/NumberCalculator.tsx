'use client'

import { useState, useEffect } from 'react'

interface NumberCalculatorProps {
  modalityName: string
  numberBets: string[]
  maxPalpites: number
  onAddBet: (number: string) => void
  onRemoveBet: (index: number) => void
}

// Mapeamento de modalidades para quantidade de dígitos
const MODALITY_DIGITS: Record<string, number> = {
  'Dezena': 2,
  'Centena': 3,
  'Milhar': 4,
  'Dezena Invertida': 2,
  'Centena Invertida': 3,
  'Milhar Invertida': 4,
  'Milhar/Centena': 4, // Aceita 3 ou 4 dígitos
  'Duque de Dezena': 2,
  'Terno de Dezena': 2,
}

export default function NumberCalculator({
  modalityName,
  numberBets,
  maxPalpites,
  onAddBet,
  onRemoveBet,
}: NumberCalculatorProps) {
  const [currentNumber, setCurrentNumber] = useState('')
  const [error, setError] = useState('')

  const maxDigits = MODALITY_DIGITS[modalityName] || 4
  const isMilharCentena = modalityName === 'Milhar/Centena'
  const maxReached = numberBets.length >= maxPalpites

  useEffect(() => {
    setCurrentNumber('')
    setError('')
  }, [modalityName])

  const handleNumberClick = (digit: string) => {
    if (maxReached && currentNumber.length === 0) return

    const newNumber = currentNumber + digit

    // Validação de limite de dígitos
    if (isMilharCentena) {
      // Milhar/Centena aceita 3 ou 4 dígitos
      if (newNumber.length > 4) {
        setError('Máximo de 4 dígitos')
        return
      }
    } else {
      // Outras modalidades têm limite fixo
      if (newNumber.length > maxDigits) {
        setError(`Máximo de ${maxDigits} dígitos`)
        return
      }
    }

    setCurrentNumber(newNumber)
    setError('')

    // Auto-confirma quando atinge o limite
    if (isMilharCentena) {
      if (newNumber.length === 3 || newNumber.length === 4) {
        handleConfirm()
      }
    } else {
      if (newNumber.length === maxDigits) {
        handleConfirm()
      }
    }
  }

  const handleBackspace = () => {
    setCurrentNumber((prev) => prev.slice(0, -1))
    setError('')
  }

  const handleClear = () => {
    setCurrentNumber('')
    setError('')
  }

  const handleConfirm = () => {
    if (!currentNumber || currentNumber.length === 0) {
      setError('Digite um número')
      return
    }

    // Validação final
    if (isMilharCentena) {
      if (currentNumber.length < 3 || currentNumber.length > 4) {
        setError('Milhar/Centena precisa de 3 ou 4 dígitos')
        return
      }
    } else {
      if (currentNumber.length !== maxDigits) {
        setError(`${modalityName} precisa de exatamente ${maxDigits} dígitos`)
        return
      }
    }

    // Formata o número com zeros à esquerda se necessário
    const formattedNumber = currentNumber.padStart(maxDigits, '0')
    onAddBet(formattedNumber)
    setCurrentNumber('')
    setError('')
  }

  const formatDisplayNumber = (num: string) => {
    if (isMilharCentena) {
      return num.padStart(4, '0')
    }
    return num.padStart(maxDigits, '0')
  }

  const canConfirm = () => {
    if (isMilharCentena) {
      return currentNumber.length >= 3 && currentNumber.length <= 4
    }
    return currentNumber.length === maxDigits
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-950">Calculadora:</h2>
        <p className="text-gray-600">
          {isMilharCentena
            ? 'Digite 3 ou 4 números (até 10 palpites).'
            : `Digite ${maxDigits} números (até ${maxPalpites} palpites).`}
        </p>
      </div>

      {/* Palpites adicionados */}
      <div className="mb-4 flex flex-wrap gap-2">
        {numberBets.map((bet, idx) => (
          <span
            key={idx}
            className="flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-base font-semibold text-gray-900 shadow"
          >
            {bet}
            <button
              onClick={() => onRemoveBet(idx)}
              className="text-gray-900 hover:text-gray-700"
              aria-label="Remover palpite"
            >
              <span className="iconify i-material-symbols:delete-outline text-lg"></span>
            </button>
          </span>
        ))}
      </div>

      {/* Display do número atual */}
      <div className="mb-4">
        <div className="rounded-xl border-2 border-blue bg-blue/5 p-6">
          <div className="text-center">
            <p className="mb-2 text-sm font-semibold text-gray-700">Número atual:</p>
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: maxDigits }).map((_, idx) => {
                const digit = currentNumber[idx] || '_'
                const isFilled = idx < currentNumber.length
                return (
                  <div
                    key={idx}
                    className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 text-3xl font-bold transition-all ${
                      isFilled
                        ? 'border-blue bg-blue text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {digit}
                  </div>
                )
              })}
            </div>
            {error && (
              <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
            )}
            {currentNumber.length > 0 && !error && (
              <p className="mt-2 text-sm text-gray-600">
                {currentNumber.length}/{isMilharCentena ? '3-4' : maxDigits} dígitos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Teclado numérico */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              disabled={maxReached && currentNumber.length === 0}
              className="flex h-14 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-2xl font-bold text-gray-950 transition-all hover:border-blue hover:bg-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="flex h-14 items-center justify-center rounded-xl border-2 border-red-300 bg-red-50 text-xl font-bold text-red-700 transition-all hover:border-red-500 hover:bg-red-100"
          >
            ⌫
          </button>
          <button
            onClick={() => handleNumberClick('0')}
              disabled={maxReached && currentNumber.length === 0}
            className="flex h-14 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-2xl font-bold text-gray-950 transition-all hover:border-blue hover:bg-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleClear}
            className="flex h-14 items-center justify-center rounded-xl border-2 border-gray-300 bg-gray-100 text-lg font-bold text-gray-700 transition-all hover:border-gray-500 hover:bg-gray-200"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Botão confirmar */}
      <div className="flex justify-center">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm() || maxReached}
          className="rounded-xl bg-blue px-8 py-3 text-lg font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {maxReached ? 'Limite atingido' : canConfirm() ? 'Confirmar' : 'Complete o número'}
        </button>
      </div>
    </div>
  )
}
