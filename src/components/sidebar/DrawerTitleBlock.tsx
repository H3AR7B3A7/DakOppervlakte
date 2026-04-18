'use client'

import { useTranslations } from 'next-intl'

interface DrawerTitleBlockProps {
  titleId: string
}

export function DrawerTitleBlock({ titleId }: DrawerTitleBlockProps) {
  const t = useTranslations()
  return (
    <div className="drawer-title-block">
      <h1 id={titleId}>
        {t('App.title')}
        <br />
        <span className="accent">{t('App.titleAccent')}</span>
      </h1>
      <p>{t('App.subtitle')}</p>
    </div>
  )
}
