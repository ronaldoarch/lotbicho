'use client'

import { POSITIONS } from '@/data/modalities'

interface PositionAmountDivisionProps {
  position: string | null
  customPosition: boolean
  customPositionValue: string
  amount: number
  divisionType: 'all' | 'each'
  useBonus: boolean
  bonusAmount: number
  saldoDisponivel?: number
  qtdPalpites?: number
  onPositionChange: (position: string) => void
  onCustomPositionChange: (checked: boolean) => void
  onCustomPositionValueChange: (value: string) => void
  onAmountChange: (amount: number) => void
  onDivisionTypeChange: (type: 'all' | 'each') => void
  onBonusToggle: (use: boolean) => void
}

export default function PositionAmountDivision({
  position,
  customPosition,
  customPositionValue,
  amount,
  divisionType,
  useBonus,
  bonusAmount,
  saldoDisponivel,
  qtdPalpites = 0,
  onPositionChange,
  onCustomPositionChange,
  onCustomPositionValueChange,
  onAmountChange,
  onDivisionTypeChange,
  onBonusToggle,
}: PositionAmountDivisionProps) {
  const increment = 0.5
  const minAmount = 0.5

  const calcularValorTotal = (valor: number) => {
    let total = valor
    if (divisionType === 'each') {
      total = valor * qtdPalpites
    }
    if (useBonus && bonusAmount > 0) {
      total = Math.max(0, total - bonusAmount)
    }
    return total
  }

  const handleIncrease = () => {
    const novoValor = amount + increment
    const valorTotal = calcularValorTotal(novoValor)
    
    if (saldoDisponivel !== undefined && valorTotal > saldoDisponivel) {
      // Não permite aumentar além do saldo
      return
    }
    
    onAmountChange(novoValor)
  }

  const handleDecrease = () => {
    if (amount > minAmount) {
      onAmountChange(amount - increment)
    }
  }

  const valorTotal = calcularValorTotal(amount)
  const excedeSaldo = saldoDisponivel !== undefined && valorTotal > saldoDisponivel

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-gray-950">Posição, quantia e divisão:</h2>

      {/* Position Selection */}
      <div className="mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-950">Selecione a posição:</h3>
        <div className="flex flex-wrap gap-3">
          {POSITIONS.map((pos) => (
            <label
              key={pos.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
                position === pos.id
                  ? 'border-blue bg-blue/10'
                  : 'border-gray-200 bg-white hover:border-blue/50'
              }`}
            >
              <input
                type="radio"
                name="position"
                value={pos.id}
                checked={position === pos.id}
                onChange={(e) => onPositionChange(e.target.value)}
                className="h-5 w-5 accent-blue"
              />
              <span className="font-semibold text-gray-950">{pos.label}</span>
            </label>
          ))}
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
              customPosition
                ? 'border-blue bg-blue/10'
                : 'border-gray-200 bg-white hover:border-blue/50'
            }`}
          >
            <input
              type="checkbox"
              checked={customPosition}
              onChange={(e) => {
                onCustomPositionChange(e.target.checked)
                if (!e.target.checked) {
                  onPositionChange('')
                }
              }}
              className="h-5 w-5 accent-blue"
            />
            <span className="font-semibold text-gray-950">Personalizado</span>
          </label>
        </div>
        
        {/* Campo de posição personalizada */}
        {customPosition && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Digite a posição personalizada:
            </label>
            <input
              type="text"
              value={customPositionValue}
              onChange={(e) => onCustomPositionValueChange(e.target.value)}
              placeholder="Ex: 1-5, 7, 5, 1-7, etc."
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-950 focus:border-blue focus:outline-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              Exemplos: "1-5" (do 1º ao 5º), "7" (só o 7º), "5" (só o 5º), "3" (só o 3º), "2" (só o 2º), "6" (só o 6º), "1-7" (do 1º ao 7º)
            </p>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-950">Quantia:</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDecrease}
            disabled={amount <= minAmount}
            className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white font-bold text-gray-700 transition-colors hover:border-blue hover:bg-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            -
          </button>
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Valor</label>
            <input
              type="number"
              min={minAmount}
              step={increment}
              value={amount}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || minAmount)}
              className={`w-full rounded-lg border-2 px-4 py-3 text-center text-xl font-bold text-gray-950 focus:outline-none ${
                excedeSaldo ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">Incremento: R$ {increment.toFixed(2)}</p>
            {saldoDisponivel !== undefined && (
              <div className="mt-2">
                <p className="text-xs text-gray-600">
                  Valor total: R$ {valorTotal.toFixed(2)} | Saldo: R$ {saldoDisponivel.toFixed(2)}
                </p>
                {excedeSaldo && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    ⚠️ Valor excede o saldo disponível em R$ {(valorTotal - saldoDisponivel).toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleIncrease}
            className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white font-bold text-gray-700 transition-colors hover:border-blue hover:bg-blue/10"
          >
            +
          </button>
        </div>
      </div>

      {/* Division Type */}
      <div className="mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-950">Divisão:</h3>
        <div className="flex gap-4">
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
              divisionType === 'all'
                ? 'border-blue bg-blue/10'
                : 'border-gray-200 bg-white hover:border-blue/50'
            }`}
          >
            <input
              type="radio"
              name="division"
              value="all"
              checked={divisionType === 'all'}
              onChange={() => onDivisionTypeChange('all')}
              className="h-5 w-5 accent-blue"
            />
            <span className="font-semibold text-gray-950">Para todo o palpite</span>
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
              divisionType === 'each'
                ? 'border-blue bg-blue/10'
                : 'border-gray-200 bg-white hover:border-blue/50'
            }`}
          >
            <input
              type="radio"
              name="division"
              value="each"
              checked={divisionType === 'each'}
              onChange={() => onDivisionTypeChange('each')}
              className="h-5 w-5 accent-blue"
            />
            <span className="font-semibold text-gray-950">Para cada palpite</span>
          </label>
        </div>
      </div>

      {/* Bonus */}
      {bonusAmount > 0 && (
        <div className="rounded-lg border-2 border-yellow bg-yellow/10 p-4">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-950">Bônus disponível: R$ {bonusAmount.toFixed(2)}</h3>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={useBonus}
              onChange={(e) => onBonusToggle(e.target.checked)}
              className="h-5 w-5 accent-yellow"
            />
            <span className="font-semibold text-gray-950">Utilizar bônus</span>
          </label>
        </div>
      )}
    </div>
  )
}
