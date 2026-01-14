'use client'

import { useEffect, useState } from 'react'
import { ANIMALS } from '@/data/animals'

interface AnimalSelectionProps {
  animalBets: number[][]
  requiredPerBet: number
  maxPalpites: number
  onAddBet: (ids: number[]) => void
  onRemoveBet: (index: number) => void
}

export default function AnimalSelection({
  animalBets,
  requiredPerBet,
  maxPalpites,
  onAddBet,
  onRemoveBet,
}: AnimalSelectionProps) {
  const [current, setCurrent] = useState<number[]>([])

  useEffect(() => {
    setCurrent([])
  }, [requiredPerBet])

  const maxReached = animalBets.length >= maxPalpites

  const handleToggle = (id: number) => {
    if (maxReached && !current.includes(id)) return
    setCurrent((prev) => {
      const exists = prev.includes(id)
      const next = exists ? prev.filter((n) => n !== id) : [...prev, id]
      if (next.length === requiredPerBet) {
        onAddBet(next)
        return []
      }
      if (next.length > requiredPerBet) return prev
      return next
    })
  }

  const formatBet = (ids: number[]) => ids.map((n) => String(n).padStart(2, '0')).join('-')

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-950">Animais:</h2>
        <p className="text-gray-600">
          {requiredPerBet === 1
            ? 'Cada palpite é 1 animal (até 10 palpites).'
            : `Cada palpite precisa de ${requiredPerBet} animais (até ${maxPalpites} palpites). Ao completar o grupo ele aparece abaixo.`}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {animalBets.map((bet, idx) => (
          <span
            key={idx}
            className="flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-base font-semibold text-gray-900 shadow"
          >
            {formatBet(bet)}
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

      {current.length > 0 && (
        <div className="mb-4 text-sm text-blue-800">
          Palpite em construção: {formatBet(current)} ({current.length}/{requiredPerBet})
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {ANIMALS.map((animal) => {
          const isSelected = current.includes(animal.id)
          const disabled = maxReached && !isSelected
          return (
            <button
              key={animal.id}
              onClick={() => handleToggle(animal.id)}
              disabled={disabled}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                isSelected ? 'border-blue bg-blue/10 shadow-lg' : 'border-gray-200 bg-white hover:border-blue/50'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}`}
            >
              <div className="text-center">
                <p className="font-bold text-gray-950">{animal.name}</p>
                <p className="text-xs text-gray-500">Grupo {animal.group}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
