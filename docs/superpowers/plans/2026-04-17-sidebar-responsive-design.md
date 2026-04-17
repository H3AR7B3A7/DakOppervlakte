# Sidebar Responsive Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the sidebar always fit the viewport on desktop, and give mobile (<768px) its own layout — a hamburger drawer plus a polygon chip bar over the map.

**Architecture:** Three new components (`HamburgerButton`, `SidebarDrawer`, `PolygonChipBar`) + surgical edits to `Header`, `AddressSearch`, and `DakoppervlakteApp`. CSS-driven responsive switching via Tailwind `md:` classes (breakpoint at 768px). View state (`drawerOpen`, `searchFormCollapsed`) lives in `DakoppervlakteApp`.

**Tech Stack:** React 18, Next.js 15, Tailwind v4, Vitest + React Testing Library, `next-intl`, inline styles (existing pattern).

---

## File Structure

### New files

| File | Responsibility |
|---|---|
| `src/components/ui/HamburgerButton.tsx` | Accessible icon button for the header. |
| `src/components/layout/SidebarDrawer.tsx` | Wraps the sidebar. On desktop renders inline; on mobile renders as a drawer with backdrop, focus trap, Esc-to-close, body scroll lock. |
| `src/components/layout/index.ts` | Barrel export. |
| `src/components/map/PolygonChipBar.tsx` | Mobile-only chip row overlay for `MapView`. |
| `src/__tests__/components/ui/HamburgerButton.test.tsx` | Tests the button. |
| `src/__tests__/components/layout/SidebarDrawer.test.tsx` | Tests drawer open/close/backdrop/Esc. |
| `src/__tests__/components/map/PolygonChipBar.test.tsx` | Tests chip row behavior. |

### Modified files

| File | Changes |
|---|---|
| `src/components/ui/index.ts` | Export `HamburgerButton`. |
| `src/components/map/index.ts` | Export `PolygonChipBar`. |
| `src/components/Header.tsx` | Add optional `onMenuClick` prop; render hamburger on mobile. |
| `src/components/sidebar/AddressSearch.tsx` | Add `collapsed` + `onExpand` props; render compact row when collapsed. |
| `src/components/DakoppervlakteApp.tsx` | Add `drawerOpen` + `searchFormCollapsed` state, wire `SidebarDrawer`, wrap desktop-only UI, mount `PolygonChipBar`, sidebar height fixes. |
| `messages/nl.json`, `messages/en.json`, `messages/fr.json` | New i18n keys. |
| `src/__tests__/components/Header.test.tsx` | Add hamburger tests. |
| `src/__tests__/components/sidebar/AddressSearch.test.tsx` | Add collapsed-state tests. |
| `src/__tests__/components/DakoppervlakteApp.test.tsx` | Add mobile-drawer integration tests. |

---

## Task 1: i18n strings

New keys must exist in all three locale files for `messages/translations.test.ts` to pass.

**Files:**
- Modify: `messages/nl.json`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`

### Steps

- [ ] **Step 1: Add keys to `messages/nl.json`**

Add inside the existing `"Sidebar"` object (keep the closing brace — just add the four lines before it):

```json
    "newSearch": "Nieuwe zoekopdracht",
    "currentAddressLabel": "Huidig adres",
    "openMenu": "Menu openen",
    "closeMenu": "Menu sluiten"
```

Then, after the existing `"Map": { ... }` block (as a new top-level sibling of `Map`), add:

```json
  "ChipBar": {
    "totalLabel": "Σ",
    "toggleChipAriaLabel": "Schakel vlak {label} in of uit ({area} m²)",
    "deleteChipAriaLabel": "Verwijder {label}",
    "renameChipAriaLabel": "Hernoem {label}"
  },
```

- [ ] **Step 2: Add same keys to `messages/en.json`**

`Sidebar` additions:
```json
    "newSearch": "New search",
    "currentAddressLabel": "Current address",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
```

New `ChipBar` block:
```json
  "ChipBar": {
    "totalLabel": "Σ",
    "toggleChipAriaLabel": "Toggle plane {label} ({area} m²)",
    "deleteChipAriaLabel": "Delete {label}",
    "renameChipAriaLabel": "Rename {label}"
  },
```

- [ ] **Step 3: Add same keys to `messages/fr.json`**

Read `messages/fr.json` first to see its structure, then add inside `Sidebar`:
```json
    "newSearch": "Nouvelle recherche",
    "currentAddressLabel": "Adresse actuelle",
    "openMenu": "Ouvrir le menu",
    "closeMenu": "Fermer le menu"
```

And the new `ChipBar` block:
```json
  "ChipBar": {
    "totalLabel": "Σ",
    "toggleChipAriaLabel": "Basculer le plan {label} ({area} m²)",
    "deleteChipAriaLabel": "Supprimer {label}",
    "renameChipAriaLabel": "Renommer {label}"
  },
```

- [ ] **Step 4: Run translation sync test**

Run: `npx vitest run messages/translations.test.ts`
Expected: PASS (all three files have the same keys).

- [ ] **Step 5: Commit**

```bash
git add messages/nl.json messages/en.json messages/fr.json
git commit -m "feat(i18n): add keys for responsive sidebar redesign"
```

---

## Task 2: `HamburgerButton` UI primitive

A small accessible icon button.

**Files:**
- Create: `src/components/ui/HamburgerButton.tsx`
- Create: `src/__tests__/components/ui/HamburgerButton.test.tsx`
- Modify: `src/components/ui/index.ts`

### Steps

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/ui/HamburgerButton.test.tsx`:

```tsx
import { render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { HamburgerButton } from '@/components/ui/HamburgerButton'

describe('HamburgerButton', () => {
  it('renders an accessible button with the given aria-label', () => {
    render(<HamburgerButton ariaLabel="Menu openen" onClick={vi.fn()} expanded={false} controls="drawer" />)
    expect(screen.getByRole('button', { name: /menu openen/i })).toBeInTheDocument()
  })

  it('exposes aria-expanded and aria-controls for screen readers', () => {
    render(<HamburgerButton ariaLabel="Menu openen" onClick={vi.fn()} expanded={true} controls="drawer-id" />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(btn).toHaveAttribute('aria-controls', 'drawer-id')
  })

  it('calls onClick when tapped', async () => {
    const onClick = vi.fn()
    render(<HamburgerButton ariaLabel="Menu openen" onClick={onClick} expanded={false} controls="drawer" />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/ui/HamburgerButton.test.tsx`
Expected: FAIL with "Failed to resolve import '@/components/ui/HamburgerButton'".

- [ ] **Step 3: Create the component**

Create `src/components/ui/HamburgerButton.tsx`:

```tsx
import React from 'react'

interface HamburgerButtonProps {
  ariaLabel: string
  onClick: () => void
  expanded: boolean
  controls: string
  className?: string
}

export function HamburgerButton({ ariaLabel, onClick, expanded, controls, className }: HamburgerButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      className={className}
      style={{
        background: 'transparent',
        border: 'none',
        width: 40,
        height: 40,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text)',
        padding: 0,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  )
}
```

- [ ] **Step 4: Add to the barrel export**

Edit `src/components/ui/index.ts`. Add the line:

```ts
export { HamburgerButton } from './HamburgerButton'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/ui/HamburgerButton.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/HamburgerButton.tsx src/components/ui/index.ts src/__tests__/components/ui/HamburgerButton.test.tsx
git commit -m "feat(ui): add HamburgerButton primitive"
```

---

## Task 3: Collapsible `AddressSearch`

Add two view states: expanded (default) and collapsed (shows current address as a label with "New search" button).

**Files:**
- Modify: `src/components/sidebar/AddressSearch.tsx`
- Modify: `src/__tests__/components/sidebar/AddressSearch.test.tsx`

### Steps

- [ ] **Step 1: Write the failing tests**

Append the following describe block at the bottom of `src/__tests__/components/sidebar/AddressSearch.test.tsx` (after the existing `describe('User searches for an address', ...)` block):

```tsx
describe('Collapsible search form', () => {
  it('shows the full form by default (expanded)', () => {
    setup({ collapsed: false, value: 'Meir 1' })
    expect(screen.getByRole('textbox', { name: /adres/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /automatisch/i })).toBeInTheDocument()
  })

  it('shows only the address label and a "New search" button when collapsed', () => {
    setup({ collapsed: true, value: 'Meir 1, Antwerpen' })
    expect(screen.queryByRole('textbox', { name: /adres/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /automatisch/i })).not.toBeInTheDocument()
    expect(screen.getByText('Meir 1, Antwerpen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nieuwe zoekopdracht/i })).toBeInTheDocument()
  })

  it('calls onExpand when the "New search" button is clicked', async () => {
    const onExpand = vi.fn()
    setup({ collapsed: true, value: 'Meir 1', onExpand })
    await userEvent.click(screen.getByRole('button', { name: /nieuwe zoekopdracht/i }))
    expect(onExpand).toHaveBeenCalledTimes(1)
  })
})
```

Also, extend the `setup` helper defaults at the top of the file to include:
```tsx
collapsed: false,
onExpand: vi.fn(),
```

so the existing tests keep passing unchanged.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/sidebar/AddressSearch.test.tsx`
Expected: FAIL — new tests fail (no `collapsed` handling yet). Existing tests still pass.

- [ ] **Step 3: Update the component**

Replace the full contents of `src/components/sidebar/AddressSearch.tsx` with:

```tsx
'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/sidebar/AddressSearch.test.tsx`
Expected: PASS (all existing + 3 new tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/AddressSearch.tsx src/__tests__/components/sidebar/AddressSearch.test.tsx
git commit -m "feat(sidebar): add collapsed state to AddressSearch"
```

---

## Task 4: `SidebarDrawer` component

Wraps sidebar content. On mobile (`<768px`) renders as a slide-in drawer with backdrop, focus trap, Esc-to-close, and body scroll lock. On desktop (`≥768px`) renders children inline in the existing `<aside>`.

**Files:**
- Create: `src/components/layout/SidebarDrawer.tsx`
- Create: `src/components/layout/index.ts`
- Create: `src/__tests__/components/layout/SidebarDrawer.test.tsx`

### Steps

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/layout/SidebarDrawer.test.tsx`:

```tsx
import { render, screen, act } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { SidebarDrawer } from '@/components/layout/SidebarDrawer'

function setMobileViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: !query.includes('min-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

function setDesktopViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

describe('SidebarDrawer', () => {
  describe('On mobile', () => {
    beforeEach(setMobileViewport)

    it('renders the drawer with dialog role when open', () => {
      render(
        <SidebarDrawer open={true} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('content')).toBeVisible()
    })

    it('calls onClose when the backdrop is clicked', async () => {
      const onClose = vi.fn()
      render(
        <SidebarDrawer open={true} onClose={onClose} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      await userEvent.click(screen.getByTestId('sidebar-drawer-backdrop'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape is pressed', async () => {
      const onClose = vi.fn()
      render(
        <SidebarDrawer open={true} onClose={onClose} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      await userEvent.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not render a backdrop when closed', () => {
      render(
        <SidebarDrawer open={false} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      expect(screen.queryByTestId('sidebar-drawer-backdrop')).not.toBeInTheDocument()
    })

    it('locks body scroll when open', () => {
      const { rerender } = render(
        <SidebarDrawer open={false} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )
      expect(document.body.style.overflow).toBe('')

      rerender(
        <SidebarDrawer open={true} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )
      expect(document.body.style.overflow).toBe('hidden')

      rerender(
        <SidebarDrawer open={false} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('On desktop', () => {
    beforeEach(setDesktopViewport)

    it('renders children without backdrop or dialog role', () => {
      render(
        <SidebarDrawer open={false} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
          <p>content</p>
        </SidebarDrawer>,
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-drawer-backdrop')).not.toBeInTheDocument()
      expect(screen.getByText('content')).toBeVisible()
    })

    it('does not lock body scroll', () => {
      render(
        <SidebarDrawer open={true} onClose={vi.fn()} titleId="t">
          <h2 id="t">Menu</h2>
        </SidebarDrawer>,
      )
      expect(document.body.style.overflow).toBe('')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/layout/SidebarDrawer.test.tsx`
Expected: FAIL with "Failed to resolve import '@/components/layout/SidebarDrawer'".

- [ ] **Step 3: Create the component**

Create `src/components/layout/SidebarDrawer.tsx`:

```tsx
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
```

- [ ] **Step 4: Create the barrel export**

Create `src/components/layout/index.ts`:

```ts
export { SidebarDrawer } from './SidebarDrawer'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/layout/SidebarDrawer.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/__tests__/components/layout/
git commit -m "feat(layout): add SidebarDrawer component"
```

---

## Task 5: `PolygonChipBar` component

Mobile-only horizontal chip row + total-area pill. Handles tap (toggle excluded), long-press (inline rename), delete (× button).

**Files:**
- Create: `src/components/map/PolygonChipBar.tsx`
- Create: `src/__tests__/components/map/PolygonChipBar.test.tsx`
- Modify: `src/components/map/index.ts`

### Steps

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/map/PolygonChipBar.test.tsx`:

```tsx
import { render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { PolygonChipBar } from '@/components/map/PolygonChipBar'
import type { PolygonEntry } from '@/lib/types'

function makeEntry(overrides: Partial<PolygonEntry> = {}): PolygonEntry {
  return {
    id: crypto.randomUUID(),
    label: 'Vlak 1',
    area: 42.5,
    heading: 0,
    tilt: 0,
    excluded: false,
    polygon: {
      setMap: vi.fn(),
      getPath: vi.fn(() => ({ addListener: vi.fn(), forEach: vi.fn(), push: vi.fn(), getLength: vi.fn(() => 0) })),
      get: vi.fn((key: string) => (key === 'fillColor' ? '#6ee7b7' : undefined)),
      set: vi.fn(),
    } as unknown as google.maps.Polygon,
    ...overrides,
  }
}

describe('PolygonChipBar', () => {
  it('renders nothing when there are no polygons', () => {
    const { container } = render(
      <PolygonChipBar
        polygons={[]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows one chip per polygon with label and area', () => {
    render(
      <PolygonChipBar
        polygons={[
          makeEntry({ label: 'Voordak', area: 38.2 }),
          makeEntry({ label: 'Achterdak', area: 51 }),
        ]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    expect(screen.getByText('Voordak')).toBeInTheDocument()
    expect(screen.getByText('Achterdak')).toBeInTheDocument()
    expect(screen.getByText(/38,2/)).toBeInTheDocument()
    expect(screen.getByText(/51/)).toBeInTheDocument()
  })

  it('shows the summed area of non-excluded polygons in the total pill', () => {
    render(
      <PolygonChipBar
        polygons={[
          makeEntry({ label: 'A', area: 40 }),
          makeEntry({ label: 'B', area: 60, excluded: true }),
          makeEntry({ label: 'C', area: 10 }),
        ]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    expect(screen.getByTestId('chip-bar-total')).toHaveTextContent(/50/)
  })

  it('toggles excluded when the chip is tapped', async () => {
    const onToggle = vi.fn()
    render(
      <PolygonChipBar
        polygons={[makeEntry({ id: 'x', label: 'Vlak 1' })]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={onToggle}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /schakel vlak vlak 1 in of uit/i }))
    expect(onToggle).toHaveBeenCalledWith('x')
  })

  it('calls onDelete when the × button is tapped', async () => {
    const onDelete = vi.fn()
    render(
      <PolygonChipBar
        polygons={[makeEntry({ id: 'x', label: 'Vlak 1' })]}
        onDelete={onDelete}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /verwijder vlak 1/i }))
    expect(onDelete).toHaveBeenCalledWith('x')
  })

  it('opens an inline rename input on long-press and commits on Enter', async () => {
    vi.useFakeTimers()
    try {
      const onRename = vi.fn()
      render(
        <PolygonChipBar
          polygons={[makeEntry({ id: 'x', label: 'Vlak 1' })]}
          onDelete={vi.fn()}
          onRename={onRename}
          onToggleExcluded={vi.fn()}
        />,
      )

      const chip = screen.getByRole('button', { name: /schakel vlak vlak 1 in of uit/i })

      // Simulate long-press: pointerdown → advance time → pointerup
      chip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      vi.advanceTimersByTime(600)
      chip.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

      const input = await screen.findByRole('textbox', { name: /hernoem vlak 1/i })
      vi.useRealTimers()

      await userEvent.clear(input)
      await userEvent.type(input, 'Nieuw label{Enter}')

      expect(onRename).toHaveBeenCalledWith('x', 'Nieuw label')
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders excluded chips with reduced opacity styling', () => {
    render(
      <PolygonChipBar
        polygons={[makeEntry({ id: 'x', label: 'Vlak 1', excluded: true })]}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleExcluded={vi.fn()}
      />,
    )
    const chip = screen.getByTestId('chip-x')
    expect(chip).toHaveStyle({ opacity: '0.5' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/map/PolygonChipBar.test.tsx`
Expected: FAIL with "Failed to resolve import '@/components/map/PolygonChipBar'".

- [ ] **Step 3: Create the component**

Create `src/components/map/PolygonChipBar.tsx`:

```tsx
'use client'

import React, { useRef, useState } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import type { PolygonEntry } from '@/lib/types'

interface PolygonChipBarProps {
  polygons: PolygonEntry[]
  onDelete: (id: string) => void
  onRename: (id: string, label: string) => void
  onToggleExcluded: (id: string) => void
}

const LONG_PRESS_MS = 500

export function PolygonChipBar({ polygons, onDelete, onRename, onToggleExcluded }: PolygonChipBarProps) {
  const t = useTranslations('ChipBar')
  const tSide = useTranslations('Sidebar')
  const format = useFormatter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickRef = useRef(false)

  if (polygons.length === 0) return null

  const total = polygons.reduce((s, p) => (p.excluded ? s : s + p.area), 0)

  const startLongPress = (id: string, label: string) => {
    suppressClickRef.current = false
    longPressTimer.current = setTimeout(() => {
      suppressClickRef.current = true
      setEditingId(id)
      setPendingLabel(label)
    }, LONG_PRESS_MS)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const commitEdit = (id: string) => {
    const trimmed = pendingLabel.trim()
    if (trimmed) onRename(id, trimmed)
    setEditingId(null)
  }

  return (
    <div
      className="md:hidden"
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        zIndex: 5,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          flex: 1,
          paddingBottom: 4,
        }}
      >
        {polygons.map((p) => {
          const color = (p.polygon.get('fillColor') as string) || 'var(--accent)'
          const isEditing = editingId === p.id
          return (
            <div
              key={p.id}
              data-testid={`chip-${p.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: '6px 10px',
                flexShrink: 0,
                opacity: p.excluded ? 0.5 : 1,
                textDecoration: p.excluded ? 'line-through' : 'none',
              }}
            >
              <span
                aria-hidden="true"
                style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }}
              />
              {isEditing ? (
                <input
                  autoFocus
                  aria-label={t('renameChipAriaLabel', { label: p.label })}
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value)}
                  onBlur={() => commitEdit(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--accent)',
                    borderRadius: 4,
                    color: 'var(--text)',
                    padding: '2px 6px',
                    fontSize: 12,
                    outline: 'none',
                    minWidth: 0,
                    width: 120,
                  }}
                />
              ) : (
                <button
                  type="button"
                  aria-label={t('toggleChipAriaLabel', {
                    label: p.label,
                    area: format.number(p.area, { maximumFractionDigits: 1 }),
                  })}
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false
                      return
                    }
                    onToggleExcluded(p.id)
                  }}
                  onPointerDown={() => startLongPress(p.id, p.label)}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text)',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                    maxWidth: 160,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 100,
                    }}
                  >
                    {p.label}
                  </span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {format.number(p.area, { maximumFractionDigits: 1 })} {tSide('unit')}
                  </span>
                </button>
              )}
              <button
                type="button"
                aria-label={t('deleteChipAriaLabel', { label: p.label })}
                onClick={() => onDelete(p.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: '0 2px',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <div
        data-testid="chip-bar-total"
        style={{
          background: 'var(--accent)',
          color: '#000',
          borderRadius: 18,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Syne, sans-serif',
          flexShrink: 0,
        }}
      >
        {t('totalLabel')} {format.number(total, { maximumFractionDigits: 1 })} {tSide('unit')}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add to the barrel export**

Edit `src/components/map/index.ts`. Add:

```ts
export { PolygonChipBar } from './PolygonChipBar'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/map/PolygonChipBar.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/map/PolygonChipBar.tsx src/components/map/index.ts src/__tests__/components/map/PolygonChipBar.test.tsx
git commit -m "feat(map): add PolygonChipBar for mobile polygon management"
```

---

## Task 6: Hamburger in `Header`

Add an optional `onMenuClick` + `drawerOpen` prop. Render the hamburger only when `onMenuClick` is given, and only on mobile (Tailwind `md:hidden`).

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/__tests__/components/Header.test.tsx`

### Steps

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/components/Header.test.tsx`, after the existing `describe('Authentication ...)` block:

```tsx
describe('Mobile menu button', () => {
  it('renders the hamburger when onMenuClick is provided', () => {
    render(<Header usageCount={0} onMenuClick={vi.fn()} drawerOpen={false} />)
    expect(screen.getByRole('button', { name: /menu openen/i })).toBeInTheDocument()
  })

  it('omits the hamburger when onMenuClick is not provided', () => {
    render(<Header usageCount={0} />)
    expect(screen.queryByRole('button', { name: /menu openen/i })).not.toBeInTheDocument()
  })

  it('reflects drawerOpen via aria-expanded and uses the close label when open', () => {
    render(<Header usageCount={0} onMenuClick={vi.fn()} drawerOpen={true} />)
    const btn = screen.getByRole('button', { name: /menu sluiten/i })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('calls onMenuClick when tapped', async () => {
    const onMenuClick = vi.fn()
    render(<Header usageCount={0} onMenuClick={onMenuClick} drawerOpen={false} />)
    await userEvent.click(screen.getByRole('button', { name: /menu openen/i }))
    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })
})
```

Also add the import at the top of the file:

```tsx
import userEvent from '@testing-library/user-event'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/Header.test.tsx`
Expected: FAIL — new tests fail (no hamburger yet). Existing tests still pass.

- [ ] **Step 3: Update the component**

Replace the contents of `src/components/Header.tsx`:

```tsx
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

export function Header({ usageCount, onMenuClick, drawerOpen = false, drawerId = 'sidebar-drawer' }: HeaderProps) {
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
        <Logo />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

        <Show when="signed-in">
          <UserButton
            appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }}
          />
        </Show>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/Header.test.tsx`
Expected: PASS (all existing + 4 new tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/__tests__/components/Header.test.tsx
git commit -m "feat(header): add hamburger button for mobile drawer toggle"
```

---

## Task 7: Wire everything into `DakoppervlakteApp`

Integrate the `SidebarDrawer`, hamburger, `PolygonChipBar`, collapsible search, height fixes, and mobile-hide CSS wrappers. This is the biggest task — go slow and commit at the end.

**Files:**
- Modify: `src/components/DakoppervlakteApp.tsx`
- Modify: `src/__tests__/components/DakoppervlakteApp.test.tsx`

### Steps

- [ ] **Step 1: Write the failing integration tests**

Append to `src/__tests__/components/DakoppervlakteApp.test.tsx` (after the last existing `describe` block):

```tsx
describe('Responsive layout — collapsible search form', () => {
  const user = userEvent.setup()
  beforeEach(() => {
    mockUserRef.current = null
    setupFetch()
  })
  afterEach(() => vi.clearAllMocks())

  it('collapses the search form after a successful search and lets the user re-expand it', async () => {
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())

    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: /adres/i })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /nieuwe zoekopdracht/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /nieuwe zoekopdracht/i }))
    expect(screen.getByRole('textbox', { name: /adres/i })).toBeInTheDocument()
  })
})

describe('Responsive layout — mobile drawer', () => {
  const user = userEvent.setup()

  function setMobileViewport() {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: !query.includes('min-width: 768px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })
  }

  beforeEach(() => {
    mockUserRef.current = null
    setupFetch()
    setMobileViewport()
  })
  afterEach(() => vi.clearAllMocks())

  it('shows a hamburger button that opens and closes the drawer', async () => {
    render(<DakoppervlakteApp />)

    const hamburger = screen.getByRole('button', { name: /menu openen/i })
    await user.click(hamburger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByTestId('sidebar-drawer-backdrop'))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('auto-closes the drawer after a successful search', async () => {
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /menu openen/i }))
    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows polygon chips at the bottom of the map after drawing', async () => {
    render(<DakoppervlakteApp />)
    await waitFor(() => expect(MockGeocoder).toHaveBeenCalled())

    // Open drawer, search, start drawing from drawer
    await user.click(screen.getByRole('button', { name: /menu openen/i }))
    await user.type(screen.getByRole('textbox', { name: /adres/i }), 'Meir 1')
    await user.click(screen.getByRole('button', { name: /zoeken/i }))

    await user.click(screen.getByRole('button', { name: /menu openen/i }))
    await drawOnePolygon(user)

    expect(screen.getByTestId('chip-bar-total')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/DakoppervlakteApp.test.tsx`
Expected: FAIL — new tests fail. Existing tests still pass.

- [ ] **Step 3: Rewrite `DakoppervlakteApp.tsx`**

Replace the full contents of `src/components/DakoppervlakteApp.tsx` with:

```tsx
'use client'

import React, { useCallback, useState } from 'react'
import { Show, useUser } from '@clerk/nextjs'

import { useTranslations } from 'next-intl'

import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { useMapOrientation } from '@/hooks/useMapOrientation'
import { useGeocoding } from '@/hooks/useGeocoding'
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing'
import { useUsageCounter } from '@/hooks/useUsageCounter'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { normalizeHeading } from '@/lib/utils'
import type { Search } from '@/lib/types'

import { Button } from '@/components/ui'
import { Header } from '@/components/Header'
import { SidebarDrawer } from '@/components/layout'
import { MapView, MapOverlayControls, DrawingOverlay, PolygonChipBar } from '@/components/map'
import {
  AddressSearch,
  RotationControls,
  PolygonList,
  TotalAreaDisplay,
  DrawingHint,
  StepGuide,
  SearchHistory,
  SaveResetControls,
} from '@/components/sidebar'

const DRAWER_TITLE_ID = 'sidebar-drawer-title'

export function DakoppervlakteApp() {
  const t = useTranslations()
  const { user } = useUser()
  const isSignedIn = !!user

  const { mapRef, mapInstanceRef, geocoderRef, mapLoaded } = useGoogleMaps()
  const {
    heading, setHeading, tilt, canEnable3D, is3D,
    handleRotate, handleTiltToggle,
  } = useMapOrientation({ mapInstanceRef, mapLoaded })
  const {
    address, setAddress, searching, searchError, setSearchError,
    geocodeAndNavigate,
  } = useGeocoding({ mapInstanceRef, geocoderRef })
  const {
    mode, pointCount, polygons, startDrawing, finishPolygon,
    addPolygonFromPath,
    deletePolygon, renamePolygon, togglePolygonExcluded,
    resetAll, restorePolygons, serializedPolygons,
  } = usePolygonDrawing({ mapInstanceRef, currentHeading: heading, currentTilt: tilt })
  const { history, saveEntry, deleteEntry } = useSearchHistory(isSignedIn)
  const { count: usageCount, increment: incrementSearchCount } = useUsageCounter()

  const [saved, setSaved] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [autoGenerateError, setAutoGenerateError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchFormCollapsed, setSearchFormCollapsed] = useState(false)

  const totalArea = polygons.reduce((sum, p) => (p.excluded ? sum : sum + p.area), 0)

  const handleSearch = useCallback(() => {
    setAutoGenerateError('')
    setSaved(false)
    if (autoGenerate) resetAll()
    geocodeAndNavigate(address, () => {
      incrementSearchCount(address)
      setSearchFormCollapsed(true)
      setDrawerOpen(false)
      if (!autoGenerate) {
        setTimeout(() => startDrawing(), 600)
        return
      }
      const map = mapInstanceRef.current
      if (!map) return
      const center = map.getCenter()
      if (!center) return
      const lat = center.lat()
      const lng = center.lng()
      fetch(`/api/building-polygon?lat=${lat}&lng=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.type === 'Feature' && data.geometry?.coordinates) {
            const coords = data.geometry.coordinates[0] as [number, number][]
            const path = coords.map(([lng, lat]) => ({ lat, lng }))
            addPolygonFromPath(path)
          } else {
            setAutoGenerateError(t('Sidebar.noBuildingFound'))
            setTimeout(() => setAutoGenerateError(''), 5000)
            setTimeout(() => startDrawing(), 600)
          }
        })
        .catch(() => {
          setAutoGenerateError(t('Sidebar.noBuildingFound'))
          setTimeout(() => setAutoGenerateError(''), 5000)
          setTimeout(() => startDrawing(), 600)
        })
    })
  }, [address, autoGenerate, geocodeAndNavigate, incrementSearchCount, startDrawing, addPolygonFromPath, mapInstanceRef, resetAll, t])

  const handleRestore = useCallback((restored: Search) => {
    setAddress(restored.address)
    resetAll()
    setSaved(false)
    setSearchError('')
    setSearchFormCollapsed(true)
    setDrawerOpen(false)
    geocodeAndNavigate(restored.address, () => {
      if (restored.polygons) {
        setTimeout(() => restorePolygons(restored.polygons!), 500)
      }
    })
  }, [geocodeAndNavigate, resetAll, restorePolygons, setAddress, setSearchError])

  const handleSave = useCallback(async () => {
    await saveEntry(address, totalArea, serializedPolygons)
    setSaved(true)
    setDrawerOpen(false)
  }, [address, saveEntry, totalArea, serializedPolygons])

  const handleReset = useCallback(() => {
    resetAll()
    setAddress('')
    setSearchError('')
    setSaved(false)
    setSearchFormCollapsed(false)
  }, [resetAll, setAddress, setSearchError])

  const handleStartDrawing = useCallback(() => {
    setSaved(false)
    startDrawing()
    setDrawerOpen(false)
  }, [startDrawing])

  const handleExpandSearch = useCallback(() => {
    setSearchFormCollapsed(false)
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header
        usageCount={usageCount}
        onMenuClick={() => setDrawerOpen((o) => !o)}
        drawerOpen={drawerOpen}
        drawerId={DRAWER_TITLE_ID}
      />

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 60px)',
          position: 'relative',
        }}
      >
        <SidebarDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          titleId={DRAWER_TITLE_ID}
        >
          <div
            style={{
              padding: '24px 24px 16px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <h1
              id={DRAWER_TITLE_ID}
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: 6,
                color: 'var(--text)',
              }}
            >
              {t('App.title')}
              <br />
              <span style={{ color: 'var(--accent)' }}>{t('App.titleAccent')}</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              {t('App.subtitle')}
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <AddressSearch
              value={address}
              onChange={setAddress}
              onSearch={handleSearch}
              searching={searching}
              error={searchError || autoGenerateError}
              autoGenerate={autoGenerate}
              onAutoGenerateChange={setAutoGenerate}
              collapsed={searchFormCollapsed}
              onExpand={handleExpandSearch}
            />
          </div>

          <div className="hidden md:block" style={{ flexShrink: 0 }}>
            <RotationControls
              heading={heading}
              tilt={tilt}
              is3D={is3D}
              canEnable3D={canEnable3D}
              onHeadingChange={(h) => setHeading(normalizeHeading(h))}
              onRotate={handleRotate}
              onTiltToggle={handleTiltToggle}
            />
          </div>

          <div
            style={{
              padding: '16px 24px',
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            {mode === 'idle' && (
              <Button
                variant="accent"
                fullWidth
                onClick={handleStartDrawing}
                style={{ marginBottom: 16, padding: 11, fontWeight: 700 }}
              >
                ✏️{' '}
                {polygons.length === 0
                  ? t('Sidebar.startDrawing')
                  : t('Sidebar.addPlane')}
              </Button>
            )}

            {mode === 'drawing' && (
              <DrawingHint pointCount={pointCount} onFinish={finishPolygon} />
            )}

            <div className="hidden md:block">
              <PolygonList
                polygons={polygons}
                currentHeading={heading}
                currentTilt={tilt}
                onDelete={deletePolygon}
                onRename={renamePolygon}
                onToggleExcluded={togglePolygonExcluded}
              />

              <TotalAreaDisplay
                totalArea={totalArea}
                polygonCount={polygons.length}
              />
            </div>

            {polygons.length > 0 && mode === 'idle' && (
              <SaveResetControls
                saved={saved}
                isSignedIn={isSignedIn}
                onSave={handleSave}
                onReset={handleReset}
              />
            )}

            {polygons.length === 0 && mode === 'idle' && <StepGuide />}
          </div>

          <Show when="signed-in">
            <div style={{ flexShrink: 0 }}>
              <SearchHistory
                history={history}
                onRestore={handleRestore}
                onDelete={deleteEntry}
              />
            </div>
          </Show>
        </SidebarDrawer>

        <MapView mapRef={mapRef} mapLoaded={mapLoaded}>
          <MapOverlayControls
            is3D={is3D}
            canEnable3D={canEnable3D}
            onRotateLeft={() => handleRotate(-90)}
            onRotateRight={() => handleRotate(90)}
            onResetHeading={() => setHeading(0)}
            onTiltToggle={handleTiltToggle}
          />

          {mode === 'drawing' && <DrawingOverlay pointCount={pointCount} />}

          {mode !== 'drawing' && (
            <PolygonChipBar
              polygons={polygons}
              onDelete={deletePolygon}
              onRename={renamePolygon}
              onToggleExcluded={togglePolygonExcluded}
            />
          )}
        </MapView>
      </div>
    </div>
  )
}
```

Notes on the rewrite:
- The `<aside>` is gone — `SidebarDrawer` owns the `<aside>` element in both modes.
- `h1` now has `id={DRAWER_TITLE_ID}` so the dialog role can reference it via `aria-labelledby`.
- `flexShrink: 0` added to the header block, `AddressSearch` wrapper, `RotationControls` wrapper, and `SearchHistory` wrapper.
- Middle scrollable section keeps `flex: 1; overflowY: auto` and **adds `minHeight: 0`** — the fix for the overflow bug.
- `RotationControls`, `PolygonList`, `TotalAreaDisplay` wrapped in `<div className="hidden md:block">`.
- `PolygonChipBar` mounted inside `MapView` (after `DrawingOverlay`); hidden when drawing (DrawingOverlay takes priority) and hidden on desktop via its own `md:hidden` class.
- Auto-close drawer: `handleSearch`, `handleStartDrawing`, `handleSave`, `handleRestore`.
- Auto-collapse search: `handleSearch` and `handleRestore` set `searchFormCollapsed = true`. `handleReset` sets it to `false`.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS — all existing tests + the new integration tests.

- [ ] **Step 5: Run the type checker and linter**

Run: `npm run check`
Expected: PASS — no type or lint errors.

- [ ] **Step 6: Manual smoke test (desktop)**

Run: `npm run dev`
- Open the app at `http://localhost:3000` in a browser at desktop width (≥ 768px).
- Verify: sidebar visible, hamburger hidden, search form expanded.
- Type an address and search → form collapses to address label + "New search" button.
- Click "New search" → form expands again.
- Resize window or use DevTools → drag multiple polygons to confirm sidebar scroll region scrolls internally and doesn't push content off-screen.

- [ ] **Step 7: Manual smoke test (mobile)**

- In DevTools, switch to iPhone-size viewport (< 768px).
- Verify: sidebar is hidden, hamburger visible, chip bar appears after drawing a polygon.
- Tap hamburger → drawer slides in. Tap backdrop → drawer closes.
- Search → drawer auto-closes.
- Draw a polygon → chip appears at the bottom.
- Tap chip → polygon toggles excluded (reduced opacity + strikethrough).
- Long-press a chip (~500ms) → rename input appears; type and press Enter to commit.
- Tap × on a chip → polygon is deleted.

- [ ] **Step 8: Commit**

```bash
git add src/components/DakoppervlakteApp.tsx src/__tests__/components/DakoppervlakteApp.test.tsx
git commit -m "feat(app): wire responsive drawer, chip bar, and height fixes"
```

---

## Task 8: Final sweep

- [ ] **Step 1: Run everything one last time**

Run: `npm run check && npm test`
Expected: all green.

- [ ] **Step 2: Verify no orphaned inline `<aside>` in `DakoppervlakteApp`**

Run: `grep -n '<aside' src/components/DakoppervlakteApp.tsx || echo "clean"`
Expected: `clean` (the aside is now inside `SidebarDrawer`).

- [ ] **Step 3: Verify spec compliance**

Re-read `docs/superpowers/specs/2026-04-17-sidebar-responsive-design.md` and confirm every section has a corresponding implementation.

---

## Self-Review (done before handing off)

**Spec coverage:**
- Breakpoint 768px via CSS — ✅ Tailwind `md:` + `useIsMobile` matchMedia (Task 4)
- Collapsible AddressSearch — ✅ Task 3
- Height-bounded sidebar with `minHeight: 0` — ✅ Task 7 step 3
- `SearchHistory` already has `max-height: 200px; overflow-y: auto` (see `SearchHistory.tsx:23-25`) — no change needed, but wrapped in `flexShrink: 0` div in Task 7
- Hamburger button — ✅ Task 2 + Task 6
- SidebarDrawer (dialog, backdrop, Esc, focus, scroll lock) — ✅ Task 4
- Drawer auto-close on search/start-drawing/save — ✅ Task 7
- PolygonChipBar (chips, total pill, toggle, long-press rename, delete) — ✅ Task 5
- Chip bar hidden during drawing — ✅ Task 7 (`{mode !== 'drawing' && ...}`)
- Hide RotationControls/PolygonList/TotalAreaDisplay on mobile — ✅ Task 7
- i18n keys in all three locales — ✅ Task 1
- Accessibility (aria-label, aria-expanded, aria-controls, role=dialog, aria-modal, aria-labelledby) — ✅ Tasks 2, 4, 6

**Placeholder scan:** no TBD/TODO; all code inline; all commands explicit.

**Type consistency:** prop names consistent across tasks (`open`, `onClose`, `titleId`, `collapsed`, `onExpand`, `onMenuClick`, `drawerOpen`, `drawerId`).

**Out of scope (from spec — not in this plan):** swipe-to-close, chip animations, persisting collapsed state across reloads.
