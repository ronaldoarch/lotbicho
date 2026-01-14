'use client'

import { useEffect, useState } from 'react'

interface InstantResultModalProps {
  open: boolean
  onClose: () => void
  resultado?: {
    prizes: number[]
    groups: number[]
    premioTotal: number
  } | null
}

const POSICOES = [1, 2, 3, 4, 5, 6, 7]

export default function InstantResultModal({ open, onClose, resultado }: InstantResultModalProps) {
  const [countdown, setCountdown] = useState(5)
  const [numeros, setNumeros] = useState<string[]>([])
  const [revelados, setRevelados] = useState<number>(0)

  useEffect(() => {
    if (!open) return

    // reset ao abrir
    setCountdown(5)
    setRevelados(0)

    // Usar resultado real se disponível, senão gerar números aleatórios
    if (resultado && resultado.prizes && resultado.prizes.length > 0) {
      setNumeros(resultado.prizes.map((p) => p.toString().padStart(4, '0')))
    } else {
      // Fallback: gerar números aleatórios
      setNumeros(POSICOES.map(() => Math.floor(Math.random() * 10000).toString().padStart(4, '0')))
    }

    // contagem regressiva 5s
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [open, resultado])

  useEffect(() => {
    // após countdown zero, revela um a um
    if (!open || countdown > 0) return
    const revealTimer = setInterval(() => {
      setRevelados((r) => {
        if (r >= POSICOES.length) {
          clearInterval(revealTimer)
          return r
        }
        return r + 1
      })
    }, 800)
    return () => clearInterval(revealTimer)
  }, [open, countdown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Fechar"
        >
          ✕
        </button>
        <h2 className="text-center text-xl font-bold text-gray-900">Resultado Instantâneo</h2>
        <p className="mb-4 text-center text-sm text-gray-600">Confira o resultado instantâneo</p>

        {countdown > 0 ? (
          <div className="mb-4 text-center text-lg font-semibold text-blue">
            Gerando números... {countdown}s
          </div>
        ) : (
          <div className="mb-4 text-center text-lg font-semibold text-green-700">Resultado gerado</div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {POSICOES.map((pos, idx) => {
            const revelado = idx < revelados
            const valor = revelado ? numeros[idx] : '—'
            return (
              <div
                key={pos}
                className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 ${
                  revelado ? 'border-blue bg-blue/5' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <span className="text-sm font-semibold text-gray-700">{pos}º</span>
                <span className="text-2xl font-extrabold text-gray-900 tracking-wider">{valor}</span>
              </div>
            )
          })}
        </div>

        {revelados >= POSICOES.length && (
          <div className="mt-4 space-y-3">
            {resultado && resultado.premioTotal > 0 && (
              <div className="rounded-lg bg-green-50 border-2 border-green-500 p-4 text-center">
                <p className="text-sm font-semibold text-green-800 mb-1">Parabéns! Você ganhou:</p>
                <p className="text-2xl font-bold text-green-900">R$ {resultado.premioTotal.toFixed(2)}</p>
              </div>
            )}
            {resultado && resultado.premioTotal === 0 && (
              <div className="rounded-lg bg-gray-50 border-2 border-gray-300 p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">Não houve prêmio desta vez</p>
              </div>
            )}
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="rounded-lg bg-blue px-4 py-2 text-white font-semibold hover:bg-blue/90 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

