'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Story {
  id: number
  title?: string
  image: string
  alt?: string
}

interface StoryViewerProps {
  stories: Story[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export default function StoryViewer({ stories, initialIndex, isOpen, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      return
    }

    setCurrentIndex(initialIndex)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Avança para próximo story
          setCurrentIndex((current) => {
            if (current < stories.length - 1) {
              return current + 1
            } else {
              onClose()
              return current
            }
          })
          return 0
        }
        return prev + 2 // Incrementa a cada 100ms (total 5s para completar)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, initialIndex, stories.length, onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, stories.length])

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      handleNext()
    } else {
      handlePrevious()
    }
  }

  if (!isOpen || stories.length === 0) return null

  const currentStory = stories[currentIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress bars no topo */}
      <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
        {stories.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all duration-100 ${
                index < currentIndex ? 'w-full' : index === currentIndex ? 'w-full' : 'w-0'
              }`}
              style={
                index === currentIndex
                  ? { width: `${progress}%`, transition: 'width 0.1s linear' }
                  : {}
              }
            />
          </div>
        ))}
      </div>

      {/* Botão fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Story atual */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={currentStory.image}
          alt={currentStory.alt || currentStory.title || 'Story'}
          fill
          className="object-contain"
          priority
        />

        {/* Área clicável esquerda (anterior) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-40"
          onClick={() => handleSwipe('right')}
        />

        {/* Área clicável direita (próximo) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-40"
          onClick={() => handleSwipe('left')}
        />

        {/* Botões de navegação (desktop) */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === stories.length - 1}
          className="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Swipe touch handlers */}
      <div
        className="absolute inset-0 z-30 touch-none"
        onTouchStart={(e) => {
          const startX = e.touches[0].clientX
          let moved = false

          const onTouchMove = (e: TouchEvent) => {
            moved = true
          }

          const onTouchEnd = (e: TouchEvent) => {
            const endX = e.changedTouches[0].clientX
            const diff = startX - endX

            if (Math.abs(diff) > 50) {
              if (diff > 0) {
                handleSwipe('left') // Swipe left = próximo
              } else {
                handleSwipe('right') // Swipe right = anterior
              }
            }

            document.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('touchend', onTouchEnd)
          }

          document.addEventListener('touchmove', onTouchMove)
          document.addEventListener('touchend', onTouchEnd)
        }}
      />
    </div>
  )
}
