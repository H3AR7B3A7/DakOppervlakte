'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { Button, Input } from '@/components/ui'

interface AddressSearchProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  searching: boolean
  error: string
  autoGenerate: boolean
  onAutoGenerateChange: (value: boolean) => void
  collapsed?: boolean
  onExpand?: () => void
}

export function AddressSearch({
  value,
  onChange,
  onSearch,
  searching,
  error,
  autoGenerate,
  onAutoGenerateChange,
  collapsed = false,
  onExpand,
}: AddressSearchProps) {
  const t = useTranslations('Sidebar')

  if (collapsed) {
    return (
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontFamily: 'Syne, sans-serif',
              marginBottom: 2,
            }}
          >
            {t('currentAddressLabel')}
          </p>
          <p
            title={value}
            style={{
              fontSize: 13,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onExpand}
          style={{ flexShrink: 0, padding: '6px 12px', fontSize: 12 }}
        >
          {t('newSearch')}
        </Button>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            label={t('addressLabel')}
            id="address-search"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={t('addressPlaceholder')}
            error={error}
            aria-label={t('searchAriaLabel')}
          />
        </div>
        <Button
          variant="accent"
          onClick={onSearch}
          disabled={searching || !value.trim()}
          aria-label={t('searchButtonAriaLabel')}
          style={{ padding: '10px 16px', flexShrink: 0, marginBottom: error ? 22 : 0 }}
        >
          {searching ? '…' : '→'}
        </Button>
      </div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 10,
          fontSize: 13,
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={autoGenerate}
          onChange={(e) => onAutoGenerateChange(e.target.checked)}
          style={{ accentColor: 'var(--accent)' }}
        />
        {t('autoGenerate')}
      </label>
    </div>
  )
}
