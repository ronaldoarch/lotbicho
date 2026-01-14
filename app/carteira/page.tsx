'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import DepositPixModal from '@/components/DepositPixModal'

interface UserInfo {
  nome: string
  email: string
  saldo: number
  bonus: number
  bonusBloqueado: number
}

interface Transaction {
  id: number
  tipo: 'Depósito' | 'Saque'
  data: string
  valor: number
  estado: string
  pagoEm?: string
}

export default function CarteiraPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositValue, setDepositValue] = useState('25,00')

  // Placeholder de transações (ajuste quando houver endpoint de transações)
  const [transactions] = useState<Transaction[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.user) {
            setUser({
              nome: data.user.nome,
              email: data.user.email,
              saldo: data.user.saldo ?? 0,
              bonus: data.user.bonus ?? 0,
              bonusBloqueado: data.user.bonusBloqueado ?? 0,
            })
          }
        }
      } catch (e) {
        console.error('Erro ao carregar usuário', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100 text-[#1C1C1C]">
      <Header />

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:py-8">
          <div className="flex items-center gap-2 text-sm text-blue">
            <a href="/" className="rounded-full bg-blue/5 px-3 py-1 font-semibold text-blue hover:bg-blue/10">
              Voltar
            </a>
          </div>

          <h1 className="text-2xl font-bold text-gray-950">Carteira</h1>

          {/* Resumo de saldos */}
          <section className="grid gap-6 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-lg font-bold text-gray-900">Saldo:</p>
                <p className="text-xl font-extrabold text-blue">{loading ? '--' : formatCurrency(user?.saldo || 0)}</p>
              </div>

              <div>
                <p className="text-lg font-bold text-gray-900">Bônus:</p>
                <p className="text-xl font-extrabold text-blue">
                  {loading ? '--' : formatCurrency(user?.bonus || 0)}
                </p>
              </div>

              <div>
                <p className="text-base font-semibold text-gray-900">Recompensa semanal:</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">0%</span>
                  <div className="h-2 w-full rounded-full bg-blue/10">
                    <div className="h-2 w-0 rounded-full bg-blue"></div>
                  </div>
                  <span className="text-lg">🎁</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-lg font-bold text-gray-900">Bônus bloqueado:</p>
                <p className="text-xl font-extrabold text-blue">
                  {loading ? '--' : formatCurrency(user?.bonusBloqueado || 0)}
                </p>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                  O bônus obtido inicialmente é bloqueado e será liberado gradualmente à medida que você utiliza seu
                  saldo em apostas, proporcionando mais oportunidades de ganhos!
                </p>
                <p className="text-sm text-gray-700">
                  Ex.: utiliza R$ 1,00 de saldo e libera R$ 1,00 de bônus.
                </p>
              </div>

              <div>
                <p className="text-base font-semibold text-blue">Bilhetes do Jackpot semanal:</p>
                <p className="text-sm text-gray-800">0 bilhetes</p>
              </div>
            </div>
          </section>

          {/* Ações: Saque e Depósito */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Saque</h2>
              <p className="text-sm text-gray-700">Taxa: R$ 5,00 | Valor mínimo: R$ 30,00</p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-3 py-2">
                  <span className="text-gray-700">R$</span>
                  <input
                    className="w-full border-none text-base outline-none"
                    defaultValue="30,00"
                    aria-label="Valor do saque"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-3 py-2">
                    <span className="text-gray-700">CPF</span>
                    <span className="text-gray-500">↓</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-3 py-2 flex-1">
                    <input
                      className="w-full border-none text-base outline-none"
                      defaultValue="01463973128"
                      aria-label="CPF"
                    />
                    <span className="text-gray-500">🔒</span>
                  </div>
                </div>

                <button className="w-full rounded-lg bg-blue px-4 py-3 text-center font-semibold text-white hover:bg-blue-scale-70 transition-colors">
                  Efetuar saque
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Depósito</h2>
              <p className="text-sm text-gray-700">
                O depósito deve ser feito usando uma conta onde o CPF deve ser o mesmo da conta registrada na plataforma.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-3 py-2">
                  <span className="text-gray-700">R$</span>
                  <input
                    type="text"
                    value={depositValue}
                    onChange={(e) => {
                      // Formatar como moeda brasileira
                      const value = e.target.value.replace(/\D/g, '')
                      if (value === '') {
                        setDepositValue('0,00')
                      } else {
                        const formatted = (Number(value) / 100).toFixed(2).replace('.', ',')
                        setDepositValue(formatted)
                      }
                    }}
                    className="w-full border-none text-base outline-none"
                    aria-label="Valor do depósito"
                    placeholder="0,00"
                  />
                </div>

                <button
                  onClick={() => {
                    const valor = parseFloat(depositValue.replace(',', '.'))
                    if (valor > 0) {
                      setShowDepositModal(true)
                    }
                  }}
                  disabled={parseFloat(depositValue.replace(',', '.')) <= 0}
                  className="w-full rounded-lg bg-yellow px-4 py-3 text-center font-bold text-blue-950 hover:bg-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Efetuar depósito
                </button>
              </div>
            </div>
          </section>

          {/* Transações */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Minhas transações</h2>
            <p className="text-sm text-gray-700">Acompanhe o seu histórico de depósitos e saques.</p>

            <div className="mt-4 flex items-center gap-4 text-blue font-semibold">
              <span className="border-b-2 border-blue pb-1">Todas</span>
              <span className="pb-1">Depósitos</span>
              <span className="pb-1">Saques</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Visualizar</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Transação</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-sm text-gray-500 text-center">
                        Nenhuma transação encontrada.
                      </td>
                    </tr>
                  )}

                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3 text-sm text-blue">👁️</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{t.tipo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{t.data}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(t.valor)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{t.estado}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{t.pagoEm || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação placeholder */}
            <div className="mt-4 flex items-center justify-center gap-3 text-blue">
              <button className="px-2">≪</button>
              <button className="px-2">‹</button>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue text-blue font-bold">
                1
              </span>
              <button className="px-2">›</button>
              <button className="px-2">≫</button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <BottomNav />

      <DepositPixModal
        isOpen={showDepositModal}
        valor={parseFloat(depositValue.replace(',', '.'))}
        onClose={() => setShowDepositModal(false)}
      />
    </div>
  )
}
