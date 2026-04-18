import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import '../globals.css'
import type { ReactNode } from 'react'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!locale || !routing.locales.includes(locale as 'en' | 'nl' | 'fr')) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <ClerkProvider>
      <html lang={locale} className={`${syne.variable} ${dmSans.variable}`}>
        <body className="min-h-screen">
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
