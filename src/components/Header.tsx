'use client'

import React from 'react'
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { Button, Logo, HamburgerButton } from '@/components/ui'

interface HeaderProps {
  usageCount: number | null
  onMenuClick?: () => void
  drawerOpen?: boolean
  drawerId?: string
}

export function Header({ usageCount, onMenuClick, drawerOpen = false, drawerId }: HeaderProps) {
  const t = useTranslations()

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

      <div
        className="md:hidden"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      >
        <Logo />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          {usageCount !== null && usageCount > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {t('Sidebar.searchesCount', { count: usageCount })}
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
          <UserButton
            appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }}
          />
        </Show>
      </div>
    </header>
  )
}
