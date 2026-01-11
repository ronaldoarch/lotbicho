'use client'

import { useEffect, useState } from 'react'

interface Modality {
  id: number
  name: string
  value: string
  hasLink: boolean
  active?: boolean
}

export default function ModalidadesPage() {
  const [modalidades, setModalidades] = useState<Modality[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedValue, setEditedValue] = useState<string>('')

  useEffect(() => {
    loadModalidades()
  }, [])

  const loadModalidades = async () => {
    try {
      const response = await fetch('/api/admin/modalidades')
      const data = await response.json()
      setModalidades(data.modalidades || [])
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: number) => {
    try {
      // Encontra a modalidade atual para pegar o estado correto
      const modalidade = modalidades.find((m) => m.id === id)
      if (!modalidade) return
      
      // Pega o estado atual (se for undefined, considera como true)
      const currentActive = modalidade.active !== undefined ? modalidade.active : true
      
      await fetch('/api/admin/modalidades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      })
      loadModalidades()
    } catch (error) {
      console.error('Erro ao atualizar modalidade:', error)
    }
  }

  const startEditing = (modalidade: Modality) => {
    setEditingId(modalidade.id)
    // Extrai o valor numérico do formato "1x R$ 18.00"
    const match = modalidade.value.match(/R\$\s*([\d.]+)/)
    setEditedValue(match ? match[1] : '0')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditedValue('')
  }

  const saveValue = async (id: number) => {
    try {
      const numericValue = parseFloat(editedValue) || 0
      const formattedValue = `1x R$ ${numericValue.toFixed(2)}`
      
      await fetch('/api/admin/modalidades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value: formattedValue }),
      })
      
      setEditingId(null)
      setEditedValue('')
      loadModalidades()
      alert('Cotação atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar cotação:', error)
      alert('Erro ao salvar cotação')
    }
  }

  const extractNumericValue = (value: string): number => {
    const match = value.match(/R\$\s*([\d.]+)/)
    return match ? parseFloat(match[1]) : 0
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gerenciar Modalidades e Cotações</h1>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cotação (R$)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link Especial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {modalidades.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma modalidade cadastrada
                </td>
              </tr>
            ) : (
              modalidades.map((modalidade) => (
                <tr key={modalidade.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{modalidade.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {modalidade.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === modalidade.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">R$</span>
                        <input
                          type="number"
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)}
                          className="w-24 px-3 py-1 border-2 border-blue rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                          min="0"
                          step="0.01"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveValue(modalidade.id)
                            } else if (e.key === 'Escape') {
                              cancelEditing()
                            }
                          }}
                        />
                        <button
                          onClick={() => saveValue(modalidade.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-semibold"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue">
                          {modalidade.value}
                        </span>
                        <button
                          onClick={() => startEditing(modalidade)}
                          className="text-blue hover:text-blue-700 text-xs underline"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {modalidade.hasLink ? '✅ Sim' : '❌ Não'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(modalidade.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        modalidade.active !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {modalidade.active !== false ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleActive(modalidade.id)}
                      className="text-blue hover:text-blue-700 mr-4"
                    >
                      {modalidade.active !== false ? 'Desativar' : 'Ativar'}
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
