'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

interface SidebarDrawerProps {
  open: boolean
  onClose: () => void
  titleId: string
  closeLabel: string
  children: ReactNode
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

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

export function SidebarDrawer({
  open,
  onClose,
  titleId,
  closeLabel,
  children,
}: SidebarDrawerProps) {
  const isMobile = useIsMobile()
  const drawerRef = useRef<HTMLElement>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (!isMobile || !open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isMobile, open, onClose])

  useEffect(() => {
    if (!isMobile || !open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, open])

  useEffect(() => {
    if (!isMobile) {
      wasOpenRef.current = open
      return
    }
    if (open && !wasOpenRef.current) {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      firstFocusable?.focus()
    }
    wasOpenRef.current = open
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
        <button
          type="button"
          data-testid="sidebar-drawer-backdrop"
          aria-label={closeLabel}
          tabIndex={-1}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 200,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      )}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal={open || undefined}
        aria-labelledby={titleId}
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
