import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lot Bicho - Acerte no Jogo do Bicho e Ganhe!',
  description: 'Jogue no Jogo do Bicho Online e concorra a até R$ 1 milhão com um palpite! 100% seguro, com saque imediato via Pix.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://code.iconify.design/3/3.1.1/iconify.min.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
