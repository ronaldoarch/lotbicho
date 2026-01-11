'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

export default function LiveQuotation() {
  return (
    <section className="w-full rounded-xl bg-white p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className="iconify i-fluent:live-24-regular text-gray-scale-700 text-2xl lg:text-3xl"></span>
          <h2 className="text-lg font-bold uppercase leading-none text-gray-scale-700 md:text-xl lg:text-2xl">
            COTAÇÃO AO VIVO
          </h2>
        </div>
        <a href="/jogo-do-bicho/cotacao" className="flex min-w-[84px] items-center gap-2 text-base text-blue underline">
          Ver todos
        </a>
      </div>

      <div className="flex w-full gap-6">
        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView="auto"
          navigation
          className="w-full"
        >
          <SwiperSlide className="!w-auto">
            <div className="flex min-w-[200px] flex-col items-center gap-3 rounded-xl border border-gray-200 p-4">
              <div className="text-2xl">🎯</div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Grupo</p>
                <p className="text-lg font-bold text-blue">Avestruz</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Cotação</p>
                <p className="text-xl font-extrabold text-yellow">1:18</p>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide className="!w-auto">
            <div className="flex min-w-[200px] flex-col items-center gap-3 rounded-xl border border-gray-200 p-4">
              <div className="text-2xl">🐅</div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Grupo</p>
                <p className="text-lg font-bold text-blue">Tigre</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Cotação</p>
                <p className="text-xl font-extrabold text-yellow">1:18</p>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide className="!w-auto">
            <div className="flex min-w-[200px] flex-col items-center gap-3 rounded-xl border border-gray-200 p-4">
              <div className="text-2xl">🐘</div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Grupo</p>
                <p className="text-lg font-bold text-blue">Elefante</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Cotação</p>
                <p className="text-xl font-extrabold text-yellow">1:18</p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </section>
  )
}
