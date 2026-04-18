'use client'

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { Button, HamburgerButton, Logo } from '@/components/ui'

interface HeaderProps {
  usageCount: number | null
  autogenCount?: number | null
  onMenuClick?: () => void
  drawerOpen?: boolean
  drawerId?: string
}

export function Header({
  usageCount,
  autogenCount = null,
  onMenuClick,
  drawerOpen = false,
  drawerId,
}: HeaderProps) {
  const t = useTranslations()

  return (
    <header className="app-header">
      <div className="app-header-group">
        {onMenuClick && (
          <HamburgerButton
            className="md:hidden"
            ariaLabel={drawerOpen ? t('Sidebar.closeMenu') : t('Sidebar.openMenu')}
            onClick={onMenuClick}
            expanded={drawerOpen}
            controls={drawerId}
          />
        )}
        <div className="hidden md:block">
          <Logo />
        </div>
      </div>

      <div className="md:hidden app-header-logo-center">
        <Logo />
      </div>

      <div className="app-header-group">
        <div className="hidden md:flex app-header-group">
          {usageCount !== null && usageCount > 0 && (
            <span className="app-header-stats">
              {t('Sidebar.statsBoast', { search: usageCount, autogen: autogenCount ?? 0 })}
            </span>
          )}

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline">{t('Header.signIn')}</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="accent">{t('Common.register')}</Button>
            </SignUpButton>
          </Show>
        </div>

        <Show when="signed-in">
          <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
        </Show>
      </div>
    </header>
  )
}
