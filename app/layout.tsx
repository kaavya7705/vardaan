import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Playfair_Display, Cinzel } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800'],
})

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'Vardaan Builders | Award-Winning Construction',
  description: 'Premium architectural excellence and construction services. Mastering residential and commercial spaces with unparalleled precision.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${jakarta.variable} ${playfair.variable} ${cinzel.variable} font-sans bg-zinc-950 text-zinc-50 antialiased selection:bg-amber-500/30 selection:text-amber-200`}>
        {children}
      </body>
    </html>
  )
}
