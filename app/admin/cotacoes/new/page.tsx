'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MODALITIES } from '@/data/modalities'
import { extracoes } from '@/data/extracoes'

export default function NewCotacaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    modalidadeId: '',
    extracaoId: '',
    promocaoId: '',
    isSpecial: false,
    active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/cotacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          modalidadeId: formData.modalidadeId ? parseInt(formData.modalidadeId) : null,
          extracaoId: formData.extracaoId ? parseInt(formData.extracaoId) : null,
          promocaoId: formData.promocaoId ? parseInt(formData.promocaoId) : null,
        }),
      })

      if (response.ok) {
        alert('Cotação criada com sucesso!')
        router.push('/admin/cotacoes')
      } else {
        alert('Erro ao criar cotação')
      }
    } catch (error) {
      console.error('Erro ao criar cotação:', error)
      alert('Erro ao criar cotação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nova Cotação</h1>
        <Link
          href="/admin/cotacoes"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Voltar
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Ex: Cotação Especial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$)
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Ex: 1x R$ 7000.00"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade
              </label>
              <select
                value={formData.modalidadeId}
                onChange={(e) => setFormData({ ...formData, modalidadeId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              >
                <option value="">Todas</option>
                {MODALITIES.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extração
              </label>
              <select
                value={formData.extracaoId}
                onChange={(e) => setFormData({ ...formData, extracaoId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              >
                <option value="">Todas</option>
                {extracoes.map((ext) => (
                  <option key={ext.id} value={ext.id}>
                    {ext.name} {ext.time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promoção
              </label>
              <select
                value={formData.promocaoId}
                onChange={(e) => setFormData({ ...formData, promocaoId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              >
                <option value="">Nenhuma</option>
                {/* Adicionar promoções quando disponível */}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSpecial"
              checked={formData.isSpecial}
              onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
              className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
            />
            <label htmlFor="isSpecial" className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              Marcar como especial (foguinho)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
            />
            <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
              Ativa
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <Link
              href="/admin/cotacoes"
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
