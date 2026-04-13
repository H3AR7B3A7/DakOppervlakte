import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'

const syne = Syne({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-syne' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: 'Dakoppervlakte — Bereken uw dak',
  description: 'Bereken gratis de oppervlakte van elk dak in België op adres.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="nl" className={`${syne.variable} ${dmSans.variable}`}>
        <body className="min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  )
}
