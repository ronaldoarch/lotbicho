'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Tema {
  id: string
  nome: string
  cores: {
    primaria: string
    secundaria: string
    acento: string
    sucesso: string
    texto: string
    textoSecundario: string
    textoLink?: string
    textoParagrafo?: string
    textoTitulo?: string
    fundo: string
    fundoSecundario: string
  }
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export default function TemasPage() {
  const [temas, setTemas] = useState<Tema[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTema, setEditingTema] = useState<Tema | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    cores: {
      primaria: '#052370',
      secundaria: '#FFD700',
      acento: '#FF4444',
      sucesso: '#25D366',
      texto: '#1C1C1C',
      textoSecundario: '#4A4A4A',
      textoLink: '#052370',
      textoParagrafo: '#1C1C1C',
      textoTitulo: '#1C1C1C',
      fundo: '#F5F5F5',
      fundoSecundario: '#FFFFFF',
    },
  })

  useEffect(() => {
    loadTemas()
  }, [])

  const loadTemas = async () => {
    try {
      const response = await fetch('/api/admin/temas')
      const data = await response.json()
      setTemas(data.temas || [])
    } catch (error) {
      console.error('Erro ao carregar temas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingTema) {
        // Atualizar tema existente
        const response = await fetch('/api/admin/temas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTema.id,
            nome: formData.nome,
            cores: formData.cores,
          }),
        })

        if (response.ok) {
          alert('Tema atualizado com sucesso!')
          setShowForm(false)
          setEditingTema(null)
          resetForm()
          loadTemas()
        } else {
          alert('Erro ao atualizar tema')
        }
      } else {
        // Criar novo tema
        const response = await fetch('/api/admin/temas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          alert('Tema criado com sucesso!')
          setShowForm(false)
          resetForm()
          loadTemas()
        } else {
          alert('Erro ao criar tema')
        }
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao salvar tema')
    }
  }

  const handleEdit = (tema: Tema) => {
    setEditingTema(tema)
    setFormData({
      nome: tema.nome,
      cores: {
        ...tema.cores,
        textoLink: tema.cores.textoLink || tema.cores.primaria,
        textoParagrafo: tema.cores.textoParagrafo || tema.cores.texto,
        textoTitulo: tema.cores.textoTitulo || tema.cores.texto,
      },
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este tema?')) return

    try {
      const response = await fetch(`/api/admin/temas?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Tema deletado com sucesso!')
        loadTemas()
      } else {
        alert('Erro ao deletar tema')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao deletar tema')
    }
  }

  const handleAtivar = async (id: string) => {
    try {
      const response = await fetch('/api/admin/temas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, acao: 'ativar' }),
      })

      if (response.ok) {
        alert('Tema ativado com sucesso!')
        loadTemas()
      } else {
        alert('Erro ao ativar tema')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao ativar tema')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      cores: {
        primaria: '#052370',
        secundaria: '#FFD700',
        acento: '#FF4444',
        sucesso: '#25D366',
        texto: '#1C1C1C',
        textoSecundario: '#4A4A4A',
        fundo: '#F5F5F5',
        fundoSecundario: '#FFFFFF',
      },
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTema(null)
    resetForm()
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Temas</h1>
        <button
          onClick={() => {
            resetForm()
            setEditingTema(null)
            setShowForm(true)
          }}
          className="bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Tema
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingTema ? 'Editar Tema' : 'Novo Tema'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Tema</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária (Azul)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.primaria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, primaria: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.primaria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, primaria: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária (Amarelo)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.secundaria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, secundaria: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.secundaria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, secundaria: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Acento (Vermelho)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.acento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, acento: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.acento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, acento: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Sucesso (Verde)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.sucesso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, sucesso: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.sucesso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, sucesso: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.texto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, texto: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.texto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, texto: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto Secundário</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.textoSecundario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, textoSecundario: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.textoSecundario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, textoSecundario: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto de Link</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.textoLink || formData.cores.primaria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, textoLink: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.textoLink || formData.cores.primaria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, textoLink: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto de Parágrafo</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.textoParagrafo || formData.cores.texto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, textoParagrafo: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.textoParagrafo || formData.cores.texto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, textoParagrafo: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto de Título</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.textoTitulo || formData.cores.texto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, textoTitulo: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.textoTitulo || formData.cores.texto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, textoTitulo: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Fundo</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.fundo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, fundo: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.fundo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, fundo: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Fundo Secundário</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cores.fundoSecundario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, fundoSecundario: e.target.value },
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cores.fundoSecundario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cores: { ...formData.cores, fundoSecundario: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTema ? 'Atualizar Tema' : 'Criar Tema'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {temas.map((tema) => (
          <div
            key={tema.id}
            className={`bg-white rounded-xl shadow-md p-6 border-2 ${
              tema.ativo ? 'border-green-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{tema.nome}</h3>
                {tema.ativo && (
                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Ativo
                  </span>
                )}
              </div>
            </div>

            {/* Preview das cores */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div
                className="h-12 rounded"
                style={{ backgroundColor: tema.cores.primaria }}
                title="Primária"
              />
              <div
                className="h-12 rounded"
                style={{ backgroundColor: tema.cores.secundaria }}
                title="Secundária"
              />
              <div
                className="h-12 rounded"
                style={{ backgroundColor: tema.cores.acento }}
                title="Acento"
              />
              <div
                className="h-12 rounded"
                style={{ backgroundColor: tema.cores.sucesso }}
                title="Sucesso"
              />
            </div>

            <div className="flex gap-2">
              {!tema.ativo && (
                <button
                  onClick={() => handleAtivar(tema.id)}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  Ativar
                </button>
              )}
              <button
                onClick={() => handleEdit(tema)}
                className="flex-1 bg-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Editar
              </button>
              {tema.id !== 'default' && (
                <button
                  onClick={() => handleDelete(tema.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Deletar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
