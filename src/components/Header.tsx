'use client'

import React from 'react'
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { Button, Logo } from '@/components/ui'

interface HeaderProps {
  usageCount: number | null
}

export function Header({ usageCount }: HeaderProps) {
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
      <Logo />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {usageCount !== null && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {t('Sidebar.calculationsCount', { count: usageCount })}
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

        <Show when="signed-in">
          <UserButton
            appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }}
          />
        </Show>
      </div>
    </header>
  )
}
