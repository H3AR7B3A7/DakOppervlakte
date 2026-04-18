import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const handleI18n = createIntlMiddleware(routing)

export default clerkMiddleware(async (_auth, req) => {
  // Don't run i18n middleware on API routes — it would prefix them with /en/api/...
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  return handleI18n(req)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
