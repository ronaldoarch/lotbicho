'use client'

import { ANIMALS } from '@/data/animals'
import { MODALITIES } from '@/data/modalities'
import { BetData } from '@/types/bet'
import { parsePosition, formatarPosicao } from '@/lib/position-parser'
import { calcularValorPorPalpite } from '@/lib/bet-rules-engine'

interface BetConfirmationProps {
  betData: BetData
  saldoDisponivel?: number
  onConfirm: () => void
  onBack: () => void
}

export default function BetConfirmation({ betData, saldoDisponivel, onConfirm, onBack }: BetConfirmationProps) {
  const selectedGroups = betData.animalBets || []
  const numberBets = betData.numberBets || []
  const flatSelectedIds = selectedGroups.flat()
  const selectedAnimals = ANIMALS.filter((animal) => flatSelectedIds.includes(animal.id))

  // Detecta se é modalidade numérica
  const isNumberModality = betData.modalityName && [
    'Milhar',
    'Centena',
    'Dezena',
    'Milhar Invertida',
    'Centena Invertida',
    'Dezena Invertida',
    'Milhar/Centena',
  ].includes(betData.modalityName)

  const calculateTotal = () => {
    let total = betData.amount
    const qtdPalpites = isNumberModality ? numberBets.length : selectedGroups.length
    if (betData.divisionType === 'each') {
      total = total * qtdPalpites
    }
    if (betData.useBonus && betData.bonusAmount > 0) {
      total = Math.max(0, total - betData.bonusAmount)
    }
    return total
  }

  const total = calculateTotal()
  const qtdPalpites = isNumberModality ? numberBets.length : selectedGroups.length
  const valorPorPalpite = qtdPalpites > 0
    ? calcularValorPorPalpite(betData.amount, qtdPalpites, betData.divisionType)
    : betData.amount
  
  const posicaoFormatada = betData.position
    ? formatarPosicao(
        parsePosition(betData.position).pos_from,
        parsePosition(betData.position).pos_to
      )
    : null

  const selectedModality = betData.modalityName
    ? { name: betData.modalityName, value: MODALITIES.find((m) => m.name === betData.modalityName)?.value || '' }
    : betData.modality
      ? MODALITIES.find((m) => m.id.toString() === betData.modality)
      : null

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-gray-950">Confirmação da Aposta</h2>

      <div className="space-y-6 rounded-lg border-2 border-gray-200 bg-white p-6">
        {/* Modality */}
        {selectedModality && (
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Modalidade:</h3>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-950">{selectedModality.name}</span>
              <span className="font-bold text-blue">{selectedModality.value}</span>
            </div>
          </div>
        )}

        {/* Palpites */}
        <div>
          <h3 className="mb-3 font-semibold text-gray-700">Palpites:</h3>
          <div className="flex flex-wrap gap-2">
            {isNumberModality ? (
              numberBets.map((num, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-blue-200 px-3 py-1 text-sm font-semibold text-gray-900"
                >
                  {num}
                </span>
              ))
            ) : (
              selectedGroups.map((grp, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-amber-200 px-3 py-1 text-sm font-semibold text-gray-900"
                >
                  {grp.map((n) => String(n).padStart(2, '0')).join('-')}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Position */}
        {posicaoFormatada && (
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Posição:</h3>
            <p className="text-lg font-bold text-gray-950">{posicaoFormatada}</p>
            {betData.customPosition && (
              <p className="text-sm text-gray-500">(Personalizado)</p>
            )}
          </div>
        )}

        {/* Data e Hora */}
        <div>
          <h3 className="mb-2 font-semibold text-gray-700">Data e Hora:</h3>
          <p className="text-gray-950">
            {new Date().toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>

        {/* Loteria e Horário */}
        {(betData.location || betData.specialTime) && (
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Loteria / Horário:</h3>
            <p className="text-gray-950">
              {[betData.location, betData.specialTime].filter(Boolean).join(' • ') || '—'}
            </p>
          </div>
        )}

        {/* Valor por Palpite */}
        {qtdPalpites > 0 && (
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Valor por Palpite:</h3>
            <p className="text-lg font-bold text-gray-950">
              R$ {valorPorPalpite.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              {betData.divisionType === 'each' 
                ? `Cada um dos ${qtdPalpites} palpites vale R$ ${valorPorPalpite.toFixed(2)}`
                : `R$ ${betData.amount.toFixed(2)} dividido entre ${qtdPalpites} palpites`}
            </p>
          </div>
        )}

        {/* Valor Total Digitado */}
        <div>
          <h3 className="mb-2 font-semibold text-gray-700">Valor Digitado:</h3>
          <p className="text-lg font-bold text-gray-950">
            R$ {betData.amount.toFixed(2)} {betData.divisionType === 'each' ? 'por palpite' : 'total'}
          </p>
        </div>

        {/* Division */}
        <div>
          <h3 className="mb-2 font-semibold text-gray-700">Divisão:</h3>
          <p className="text-gray-950">
            {betData.divisionType === 'all' ? 'Para todo o palpite' : 'Para cada palpite'}
          </p>
        </div>

        {/* Instant */}
        {betData.instant && (
          <div className="rounded-lg bg-yellow/10 border-2 border-yellow p-3">
            <p className="font-semibold text-yellow">✓ Sorteio Instantâneo</p>
            <p className="text-sm text-gray-600 mt-1">O resultado será gerado imediatamente após a confirmação</p>
          </div>
        )}

        {/* Bonus */}
        {betData.useBonus && betData.bonusAmount > 0 && (
          <div className="rounded-lg bg-yellow/10 p-3">
            <p className="font-semibold text-gray-950">
              Bônus aplicado: -R$ {betData.bonusAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Total */}
        <div className="border-t-2 border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-950">Total:</span>
            <span className="text-2xl font-extrabold text-blue">R$ {total.toFixed(2)}</span>
          </div>
          {saldoDisponivel !== undefined && (
            <div className="mt-3 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Saldo disponível:</span>
                <span className={`font-semibold ${total > saldoDisponivel ? 'text-red-600' : 'text-green-600'}`}>
                  R$ {saldoDisponivel.toFixed(2)}
                </span>
              </div>
              {total > saldoDisponivel && (
                <div className="mt-2 rounded-lg bg-red-50 border-2 border-red-200 p-3">
                  <p className="text-sm font-semibold text-red-800">
                    ⚠️ Saldo insuficiente!
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Faltam R$ {(total - saldoDisponivel).toFixed(2)} para completar esta aposta.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onConfirm}
          disabled={saldoDisponivel !== undefined && total > saldoDisponivel}
          className="flex-1 rounded-lg bg-yellow px-6 py-3 font-bold text-blue-950 hover:bg-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {saldoDisponivel !== undefined && total > saldoDisponivel ? 'Saldo Insuficiente' : 'Confirmar Aposta'}
        </button>
      </div>
    </div>
  )
}
