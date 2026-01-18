'use client'

import { Suspense } from 'react'
import BetFlow from './BetFlow'

export default function BetFlowWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando...</div>
      </div>
    }>
      <BetFlow />
    </Suspense>
  )
}
