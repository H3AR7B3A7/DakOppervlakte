'use client'

import { Show, SignInButton, SignUpButton } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui'

interface DrawerFooterProps {
  usageCount: number | null
  autogenCount: number | null
}

export function DrawerFooter({ usageCount, autogenCount }: DrawerFooterProps) {
  const t = useTranslations()
  return (
    <div className="flex md:hidden drawer-footer">
      {usageCount !== null && usageCount > 0 && (
        <span className="drawer-footer-stats">
          {t('Sidebar.statsBoast', { search: usageCount, autogen: autogenCount ?? 0 })}
        </span>
      )}
      <Show when="signed-out">
        <div className="drawer-footer-auth">
          <SignInButton mode="modal">
            <Button variant="outline">{t('Header.signIn')}</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="accent">{t('Common.register')}</Button>
          </SignUpButton>
        </div>
      </Show>
    </div>
  )
}
