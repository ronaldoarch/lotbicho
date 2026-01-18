'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MODALITIES } from '@/data/modalities'
import { extracoes } from '@/data/extracoes'

interface Cotacao {
  id: number
  name: string | null
  value: string | null
  modalidadeId: number | null
  extracaoId: number | null
  promocaoId: number | null
  isSpecial: boolean
  active: boolean
  createdAt: string
}

export default function CotacoesPage() {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCotacoes()
  }, [])

  const loadCotacoes = async () => {
    try {
      const response = await fetch('/api/admin/cotacoes')
      const data = await response.json()
      setCotacoes(data.cotacoes || [])
    } catch (error) {
      console.error('Erro ao carregar cotações:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: number, active: boolean) => {
    try {
      await fetch('/api/admin/cotacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      })
      loadCotacoes()
    } catch (error) {
      console.error('Erro ao atualizar cotação:', error)
    }
  }

  const deleteCotacao = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta cotação?')) return

    try {
      await fetch(`/api/admin/cotacoes?id=${id}`, { method: 'DELETE' })
      loadCotacoes()
    } catch (error) {
      console.error('Erro ao deletar cotação:', error)
    }
  }

  const getModalidadeName = (id: number | null) => {
    if (!id) return 'Todas'
    return MODALITIES.find(m => m.id === id)?.name || 'N/A'
  }

  const getExtracaoName = (id: number | null) => {
    if (!id) return 'Todas'
    const ext = extracoes.find(e => e.id === id)
    return ext ? `${ext.name} ${ext.time}` : 'N/A'
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Cotações</h1>
        <Link
          href="/admin/cotacoes/new"
          className="bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Cotação
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modalidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cotacoes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma cotação cadastrada
                </td>
              </tr>
            ) : (
              cotacoes.map((cotacao) => (
                <tr key={cotacao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cotacao.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cotacao.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cotacao.value || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getModalidadeName(cotacao.modalidadeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getExtracaoName(cotacao.extracaoId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cotacao.isSpecial ? (
                      <span className="text-xl" title="Cotação Especial">🔥</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(cotacao.id, cotacao.active)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        cotacao.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cotacao.active ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/cotacoes/${cotacao.id}`}
                      className="text-blue hover:text-blue-700 mr-4"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => deleteCotacao(cotacao.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
