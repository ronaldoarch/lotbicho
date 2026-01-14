'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface DepositPixModalProps {
  isOpen: boolean
  valor: number
  onClose: () => void
}

export default function DepositPixModal({ isOpen, valor, onClose }: DepositPixModalProps) {
  const [qrCodeText, setQrCodeText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && valor > 0) {
      generatePixQrCode()
    } else {
      // Reset ao fechar
      setQrCodeText(null)
      setError(null)
      setExpiresAt(null)
      setCopied(false)
    }
  }, [isOpen, valor])

  const generatePixQrCode = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/deposito/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ valor }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar QR code')
      }

      setQrCodeText(data.qrCodeText || data.qrCode)
      if (data.expiresAt) {
        setExpiresAt(new Date(data.expiresAt))
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar QR code do PIX')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (qrCodeText) {
      navigator.clipboard.writeText(qrCodeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="iconify text-2xl" data-icon="material-symbols:close"></span>
        </button>

        <h2 className="mb-4 text-2xl font-bold text-gray-900">Depósito via PIX</h2>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue border-t-transparent"></div>
            <p className="text-gray-600">Gerando QR code...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Erro</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={generatePixQrCode}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && qrCodeText && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Valor: R$ {valor.toFixed(2)}</p>
              {expiresAt && (
                <p className="mt-1 text-sm text-gray-600">
                  Expira em: {expiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center rounded-lg border-2 border-gray-200 bg-white p-4">
              <QRCodeSVG value={qrCodeText} size={256} level="M" />
            </div>

            {/* Copy PIX Code */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Código PIX (Copiar e Colar):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrCodeText}
                  className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                    copied ? 'bg-green-600' : 'bg-blue hover:bg-blue-scale-70'
                  }`}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-semibold">Instruções:</p>
              <ol className="mt-1 list-decimal list-inside space-y-1">
                <li>Abra o app do seu banco</li>
                <li>Escaneie o QR code ou cole o código PIX</li>
                <li>Confirme o pagamento</li>
                <li>O saldo será creditado automaticamente após a confirmação</li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-gray-300 bg-white px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
