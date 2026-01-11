'use client'

export default function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-yellow via-yellow-400 to-yellow-300" 
         style={{
           backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)'
         }}>
      {/* Conteúdo do Banner */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-4 py-8 lg:px-12 lg:py-16">
        {/* Lado Esquerdo */}
        <div className="flex flex-col items-start gap-6 lg:w-1/2">
          <div className="relative">
            <div className="absolute -top-2 -left-2 bg-red-600 text-white px-3 py-1 rounded-lg transform -rotate-2 text-sm font-bold">
              NOVO POR AQUI?
            </div>
            <div className="flex items-center gap-3 mt-8">
              <span className="text-4xl">🦁</span>
              <span className="text-3xl font-bold text-blue lg:text-4xl">Lot Bicho</span>
            </div>
          </div>

          <div className="bg-blue rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl lg:text-4xl font-extrabold text-white mb-2">
              Seu Primeiro Depósito Vale O{' '}
              <span className="text-yellow relative">
                DOBRO!
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></span>
              </span>
            </h2>
          </div>

          <button className="bg-blue text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-scale-70 transition-colors">
            Deposite agora e aproveite!
          </button>

          <div className="relative mt-4">
            <div className="h-32 w-48 transform -rotate-12 opacity-80 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
              R$ 50
            </div>
          </div>
        </div>

        {/* Lado Direito - Mascote e Celular */}
        <div className="relative lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
          <div className="relative">
            {/* Mascote Leão - Placeholder */}
            <div className="relative z-10">
              <div className="h-64 lg:h-96 w-64 lg:w-96 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-6xl shadow-2xl">
                🦁
              </div>
            </div>

            {/* Celular com App */}
            <div className="absolute top-20 right-0 lg:right-20 bg-white rounded-2xl shadow-2xl p-4 transform rotate-12">
              <div className="w-48 h-80 bg-gradient-to-br from-blue to-purple-600 rounded-xl p-3">
                <h3 className="text-white text-sm font-bold mb-2">Aposte na sua sorte</h3>
                <div className="bg-white/10 rounded-lg p-2 mb-2">
                  <p className="text-white text-xs">Palpites: 1621</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 mb-4">
                  <p className="text-white text-xs">Resultado: 2948, 9154, 1621, 4959, 4513, 3195, 045</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-green-500 text-white text-xs py-2 rounded">Repetir</button>
                  <button className="flex-1 bg-purple-500 text-white text-xs py-2 rounded">Ver Detalhes</button>
                </div>
              </div>
            </div>

            {/* Nota de 100 reais - Placeholder */}
            <div className="absolute bottom-0 right-0 transform rotate-12">
              <div className="h-32 w-48 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                R$ 100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Texto de regras */}
      <div className="absolute bottom-4 right-4 lg:right-12 text-xs text-gray-700">
        *Confira as regras.
      </div>
    </div>
  )
}
