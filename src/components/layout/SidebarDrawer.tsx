'use client'

import React, { useEffect, useRef, useState } from 'react'

interface SidebarDrawerProps {
  open: boolean
  onOpen?: () => void
  onClose: () => void
  titleId: string
  children: React.ReactNode
}

const EDGE_SWIPE_START_PX = 24
const OPEN_SWIPE_DISTANCE_PX = 60
const CLOSE_SWIPE_DISTANCE_PX = 60
const HORIZONTAL_DOMINANCE_RATIO = 1.2

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

export function SidebarDrawer({ open, onOpen, onClose, titleId, children }: SidebarDrawerProps) {
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
    if (!isMobile || open || !onOpen) return

    let startX = 0
    let startY = 0
    let tracking = false
    let committedHorizontal = false

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false
        return
      }
      const touch = e.touches[0]
      if (touch.clientX > EDGE_SWIPE_START_PX) {
        tracking = false
        return
      }
      startX = touch.clientX
      startY = touch.clientY
      tracking = true
      committedHorizontal = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      const touch = e.touches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (!committedHorizontal) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
        if (Math.abs(dy) > Math.abs(dx)) {
          tracking = false
          return
        }
        committedHorizontal = true
      }
      if (e.cancelable) e.preventDefault()
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const touch = e.changedTouches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (dx >= OPEN_SWIPE_DISTANCE_PX && Math.abs(dx) > HORIZONTAL_DOMINANCE_RATIO * Math.abs(dy)) {
        onOpen()
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile, open, onOpen])

  useEffect(() => {
    if (!isMobile || !open) return

    let startX = 0
    let startY = 0
    let tracking = false
    let committedHorizontal = false

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false
        return
      }
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      tracking = true
      committedHorizontal = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      const touch = e.touches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (!committedHorizontal) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
        if (Math.abs(dy) > Math.abs(dx) || dx > 0) {
          tracking = false
          return
        }
        committedHorizontal = true
      }
      if (e.cancelable) e.preventDefault()
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const touch = e.changedTouches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (-dx >= CLOSE_SWIPE_DISTANCE_PX && Math.abs(dx) > HORIZONTAL_DOMINANCE_RATIO * Math.abs(dy)) {
        onClose()
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile, open, onClose])

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
