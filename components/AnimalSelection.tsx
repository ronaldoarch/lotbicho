'use client'

import { ANIMALS } from '@/data/animals'
import { Animal } from '@/types/bet'

interface AnimalSelectionProps {
  selectedAnimals: number[]
  requiredPerBet: number
  maxPalpites: number
  onAnimalToggle: (animalId: number) => void
}

export default function AnimalSelection({
  selectedAnimals,
  requiredPerBet,
  maxPalpites,
  onAnimalToggle,
}: AnimalSelectionProps) {
  const maxAnimals = requiredPerBet * maxPalpites

  const canSelectMore = selectedAnimals.length < maxAnimals

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-950">Animais:</h2>
        <p className="text-gray-600">
          {requiredPerBet === 1
            ? 'Escolha até 10 palpites (1 animal por palpite).'
            : `Esta modalidade exige ${requiredPerBet} animais por palpite. Máximo de ${maxPalpites} palpites (${maxAnimals} animais).`}
        </p>
      </div>

      {/* Selected Summary */}
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-gray-700">Selecionados:</p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          {selectedAnimals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedAnimals.map((animalId) => {
                const animal = ANIMALS.find((a) => a.id === animalId)
                return (
                  <span
                    key={animalId}
                    className="rounded-full bg-blue px-3 py-1 text-sm font-semibold text-white"
                  >
                    {animal?.name}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum animal selecionado</p>
          )}
        </div>
      </div>

      {/* Animals Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {ANIMALS.map((animal) => {
          const isSelected = selectedAnimals.includes(animal.id)
          const disabled = !isSelected && !canSelectMore
          return (
            <button
              key={animal.id}
              onClick={() => !disabled && onAnimalToggle(animal.id)}
              disabled={disabled}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:scale-105 ${
                isSelected
                  ? 'border-blue bg-blue/10 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue/50'
              } ${disabled ? 'cursor-not-allowed opacity-50 hover:scale-100' : ''}`}
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
