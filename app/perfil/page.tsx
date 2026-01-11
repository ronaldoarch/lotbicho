'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

export default function PerfilPage() {
  const [user, setUser] = useState({
    name: 'Cayo Henrique da Cunha',
    saldo: 5.2,
    bonus: 1.6,
    bonusBloqueado: 3.4,
    bonusSemanal: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar dados do usuário
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Simular carregamento de dados do usuário
      // Em produção, buscar da API
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadUserData()
  }

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      // Implementar logout
      window.location.href = '/'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-scale-100">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-gray-600">Carregando...</div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          {/* Modal de Perfil */}
          <div className="w-full rounded-2xl bg-blue p-6 md:p-8 shadow-xl">
            {/* Header do Perfil */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white md:text-3xl">{user.name}</h2>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-white hover:bg-white/10 transition-colors"
              >
                <span className="iconify i-material-symbols:logout text-xl"></span>
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>

            {/* Bônus Semanal */}
            <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="iconify i-material-symbols:card-giftcard text-2xl text-white"></span>
                  <span className="font-semibold text-white">Bônus semanal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-yellow">{user.bonusSemanal}%</span>
                  <div className="relative h-10 w-10">
                    <svg className="h-10 w-10 -rotate-90 transform" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeDasharray={`${(user.bonusSemanal / 100) * 100.48}, 100.48`}
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <Link
                href="/bônus-semanal"
                className="text-sm font-semibold text-yellow hover:text-yellow/80 transition-colors"
              >
                Saiba mais
              </Link>
            </div>

            {/* Informações Financeiras */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Saldo:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    className="rounded-full p-1 text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="iconify i-material-symbols:refresh text-xl"></span>
                  </button>
                  <span className="text-xl font-bold text-white">R$ {user.saldo.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Bônus:</span>
                <span className="text-xl font-bold text-white">R$ {user.bonus.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Bônus bloqueado:</span>
                <span className="text-xl font-bold text-white">R$ {user.bonusBloqueado.toFixed(2)}</span>
              </div>
            </div>

            {/* Links de Ação */}
            <div className="mb-6 space-y-3">
              <Link
                href="/minhas-apostas"
                className="flex items-center gap-3 rounded-lg p-3 text-yellow hover:bg-white/10 transition-colors"
              >
                <span className="iconify i-material-symbols:receipt text-2xl"></span>
                <span className="font-semibold">Minhas apostas</span>
              </Link>

              <Link
                href="/carteira"
                className="flex items-center gap-3 rounded-lg border-2 border-white/20 bg-white/5 p-3 text-white hover:bg-white/10 transition-colors"
              >
                <span className="iconify i-material-symbols:account-balance-wallet text-2xl"></span>
                <span className="font-semibold">Carteira</span>
              </Link>
            </div>

            {/* Botão Depositar */}
            <Link
              href="/depositar"
              className="block w-full rounded-xl bg-yellow px-6 py-4 text-center text-lg font-bold text-blue-950 hover:bg-yellow/90 transition-colors"
            >
              Depositar
            </Link>
          </div>

          {/* Informações Adicionais */}
          <div className="rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Outras opções</h3>
            <div className="space-y-3">
              <Link
                href="/historico"
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="iconify i-material-symbols:history text-2xl text-blue"></span>
                  <span className="font-semibold text-gray-900">Histórico de transações</span>
                </div>
                <span className="iconify i-material-symbols:chevron-right text-2xl text-gray-400"></span>
              </Link>

              <Link
                href="/configuracoes"
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="iconify i-material-symbols:settings text-2xl text-blue"></span>
                  <span className="font-semibold text-gray-900">Configurações</span>
                </div>
                <span className="iconify i-material-symbols:chevron-right text-2xl text-gray-400"></span>
              </Link>

              <Link
                href="/suporte"
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="iconify i-material-symbols:help text-2xl text-blue"></span>
                  <span className="font-semibold text-gray-900">Ajuda e Suporte</span>
                </div>
                <span className="iconify i-material-symbols:chevron-right text-2xl text-gray-400"></span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
