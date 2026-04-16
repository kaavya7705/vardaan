import type { Metadata, Viewport } from 'next'
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vardaanbuilders.vercel.app'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#172554' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vardaan Builders & Contractors | Premium Construction Company in India',
    template: '%s | Vardaan Builders & Contractors',
  },
  description:
    'Vardaan Builders & Contractors — premium construction company founded by Abhi Mehta. We specialize in luxury residential estates, commercial hubs, infrastructure projects, renovation & design-build services. 150+ projects delivered with a 99% completion rate.',
  keywords: [
    'Vardaan Builders',
    'Vardaan Builders and Contractors',
    'construction company India',
    'premium builders',
    'luxury residential construction',
    'commercial construction',
    'infrastructure development',
    'general contracting',
    'design and build',
    'renovation services',
    'Abhi Mehta builder',
    'high-end construction',
    'building contractors',
    'architectural excellence',
    'civil engineering',
    'real estate construction',
  ],
  authors: [{ name: 'Vardaan Builders & Contractors' }],
  creator: 'Vardaan Builders & Contractors',
  publisher: 'Vardaan Builders & Contractors',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Vardaan Builders & Contractors',
    title: 'Vardaan Builders & Contractors | Dream. Design. Deliver.',
    description:
      'Premium construction company delivering luxury residential estates, commercial hubs & infrastructure projects with 99% completion rate. 150+ projects delivered.',
    images: [
      {
        url: '/hero-bg.png',
        width: 1200,
        height: 630,
        alt: 'Vardaan Builders & Contractors — Premium Construction',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vardaan Builders & Contractors | Dream. Design. Deliver.',
    description:
      'Premium construction company delivering luxury residential estates, commercial hubs & infrastructure projects.',
    images: ['/hero-bg.png'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  category: 'construction',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'GeneralContractor',
  name: 'Vardaan Builders & Contractors',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    'Premium construction company specializing in luxury residential estates, commercial hubs, infrastructure projects, renovation and design-build services.',
  founder: {
    '@type': 'Person',
    name: 'Abhi Mehta',
  },
  foundingDate: '2021',
  email: 'vardaanbuildersandcontractors@gmail.com',
  telephone: '+917087099999',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+917087099999',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi'],
  },
  sameAs: [
    'https://wa.me/917087099999',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '150',
    bestRating: '5',
  },
  numberOfEmployees: {
    '@type': 'QuantitativeValue',
    value: '50+',
  },
  knowsAbout: [
    'General Contracting',
    'Design & Build',
    'Renovation',
    'Infrastructure Development',
    'Luxury Residential Construction',
    'Commercial Construction',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${jakarta.variable} ${playfair.variable} ${cinzel.variable} font-sans bg-zinc-950 text-zinc-50 antialiased selection:bg-amber-500/30 selection:text-amber-200`}>
        {children}
      </body>
    </html>
  )
}
