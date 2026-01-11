'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

export default function HeroBanner() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBanners()
    
    // Recarrega quando a janela ganha foco
    const handleFocus = () => {
      loadBanners()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadBanners = async () => {
    try {
      const response = await fetch(`/api/banners?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      if (data.banners && data.banners.length > 0) {
        setBanners(data.banners)
      }
    } catch (error) {
      console.error('Erro ao carregar banners:', error)
    } finally {
      setLoading(false)
    }
  }

  // Banners padrão caso não carregue
  const defaultBanners = [
    {
      id: 1,
      badge: 'NOVO POR AQUI?',
      title: 'Seu Primeiro Depósito Vale O',
      highlight: 'DOBRO!',
      button: 'Deposite agora e aproveite!',
      bonus: 'R$ 50',
      bonusBgClass: 'bg-green-600',
    },
  ]

  const bannersToShow = banners.length > 0 ? banners : defaultBanners

  if (loading && banners.length === 0) {
    return (
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-yellow via-yellow-400 to-yellow-300 min-h-[300px] flex items-center justify-center">
        <div className="text-gray-600">Carregando banners...</div>
      </div>
    )
  }

  if (bannersToShow.length === 0) {
    return null
  }

  return (
    <div className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white/50',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-white',
        }}
        loop={bannersToShow.length > 1}
        className="hero-banner-swiper"
      >
        {bannersToShow.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              className="relative w-full overflow-hidden bg-gradient-to-br from-yellow via-yellow-400 to-yellow-300"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)',
              }}
            >
              {/* Conteúdo do Banner */}
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-4 py-8 lg:px-12 lg:py-16">
                {/* Lado Esquerdo */}
                <div className="flex flex-col items-start gap-6 lg:w-1/2">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 bg-red-600 text-white px-3 py-1 rounded-lg transform -rotate-2 text-sm font-bold">
                      {banner.badge}
                    </div>
                    <div className="flex items-center gap-3 mt-8">
                      <span className="text-4xl">🦁</span>
                      <span className="text-3xl font-bold text-blue lg:text-4xl">Lot Bicho</span>
                    </div>
                  </div>

                  <div className="bg-blue rounded-2xl p-6 shadow-xl">
                    <h2 className="text-2xl lg:text-4xl font-extrabold text-white mb-2">
                      {banner.title}{' '}
                      <span className="text-yellow relative">
                        {banner.highlight}
                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></span>
                      </span>
                    </h2>
                  </div>

                  <button className="bg-blue text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-scale-70 transition-colors">
                    {banner.button}
                  </button>

                  <div className="relative mt-4">
                    <div
                      className={`h-32 w-48 transform -rotate-12 opacity-80 ${banner.bonusBgClass} rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                    >
                      {banner.bonus}
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
              <div className="absolute bottom-4 right-4 lg:right-12 text-xs text-gray-700 z-20">
                *Confira as regras.
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Estilos customizados para paginação */}
      <style jsx global>{`
        .hero-banner-swiper .swiper-pagination {
          bottom: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: auto !important;
        }
        .hero-banner-swiper .swiper-pagination-bullet {
          width: 12px !important;
          height: 12px !important;
          margin: 0 4px !important;
          opacity: 0.5 !important;
        }
        .hero-banner-swiper .swiper-pagination-bullet-active {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}
