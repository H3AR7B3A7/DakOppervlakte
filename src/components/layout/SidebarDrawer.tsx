'use client'

import React, { useEffect, useRef, useState } from 'react'

interface SidebarDrawerProps {
  open: boolean
  onClose: () => void
  titleId: string
  children: React.ReactNode
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsMobile(!mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}

export function SidebarDrawer({ open, onClose, titleId, children }: SidebarDrawerProps) {
  const isMobile = useIsMobile()
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isMobile || !open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isMobile, open, onClose])

  useEffect(() => {
    if (!isMobile) return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobile, open])

  useEffect(() => {
    if (!isMobile || !open) return
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    )
    firstFocusable?.focus()
  }, [isMobile, open])

  if (!isMobile) {
    return (
      <aside
        style={{
          width: 360,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          height: '100%',
        }}
      >
        {children}
      </aside>
    )
  }

  return (
    <>
      {open && (
        <div
          data-testid="sidebar-drawer-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 200,
          }}
        />
      )}
      <aside
        ref={drawerRef}
        role={open ? 'dialog' : undefined}
        aria-modal={open ? true : undefined}
        aria-labelledby={open ? titleId : undefined}
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '85vw',
          maxWidth: 360,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          zIndex: 201,
        }}
      >
        {children}
      </aside>
    </>
  )
}
