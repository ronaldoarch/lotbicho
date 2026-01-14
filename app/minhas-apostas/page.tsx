'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

interface Aposta {
  id: number
  concurso?: string | null
  loteria?: string | null
  estado?: string | null
  horario?: string | null
  dataConcurso?: string | null
  modalidade?: string | null
  aposta?: string | null
  valor: number
  retornoPrevisto?: number | null
  status: 'pendente' | 'ganhou' | 'perdeu'
  detalhes?: any
}

export default function MinhasApostasPage() {
  const [apostas, setApostas] = useState<Aposta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selecionada, setSelecionada] = useState<Aposta | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/apostas', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao carregar apostas')
        }
        setApostas(data.apostas || [])
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar apostas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Minhas apostas</h1>
          {loading && <div className="text-gray-600">Carregando...</div>}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && apostas.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-700">
              Nenhuma aposta encontrada. Faça login e realize uma aposta.
            </div>
          )}

          {!loading && !error && apostas.length > 0 && (
            <div className="overflow-x-auto rounded-xl bg-white shadow">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                    <th className="px-4 py-3">Concurso</th>
                    <th className="px-4 py-3">Aposta</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Retorno</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {apostas.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 text-sm text-gray-800">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{a.concurso || '—'}</div>
                        <div className="text-xs text-gray-500">
                          {[a.loteria, a.estado, a.horario].filter(Boolean).join(' • ')}
                        </div>
                      </td>
                      <td className="px-4 py-3">{a.aposta || a.modalidade || '—'}</td>
                      <td className="px-4 py-3">
                        {a.dataConcurso ? new Date(a.dataConcurso).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">R$ {Number(a.valor || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">R$ {Number(a.retornoPrevisto || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            a.status === 'ganhou'
                              ? 'bg-green-100 text-green-800'
                              : a.status === 'pendente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelecionada(a)}
                          className="text-sm font-semibold text-blue hover:text-blue-700"
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />

      {selecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalhes da aposta</h2>
                <p className="text-sm text-gray-500">
                  {selecionada.concurso || '—'} •{' '}
                  {selecionada.dataConcurso
                    ? new Date(selecionada.dataConcurso).toLocaleString('pt-BR')
                    : '—'}
                </p>
              </div>
              <button
                onClick={() => setSelecionada(null)}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
              <Detail label="Modalidade" value={selecionada.modalidade || '—'} />
              <Detail label="Status" value={selecionada.status} />
              <Detail label="Aposta" value={selecionada.aposta || '—'} />
              <Detail
                label="Valor apostado"
                value={`R$ ${Number(selecionada.valor || 0).toFixed(2)}`}
              />
              <Detail
                label="Retorno previsto"
                value={`R$ ${Number(selecionada.retornoPrevisto || 0).toFixed(2)}`}
              />
              <Detail label="Horário" value={selecionada.horario || '—'} />
              <Detail label="Loteria" value={selecionada.loteria || '—'} />
              <Detail label="Estado" value={selecionada.estado || '—'} />
            </div>

            {selecionada.detalhes && (
              <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800">
                <h3 className="mb-2 font-semibold text-gray-900">Palpites</h3>
                <pre className="whitespace-pre-wrap text-xs text-gray-700">
                  {JSON.stringify(selecionada.detalhes, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  )
}
