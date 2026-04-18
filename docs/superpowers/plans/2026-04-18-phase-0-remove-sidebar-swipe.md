# Phase 0 — Remove sidebar swipe-to-open/close gestures — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the swipe-to-open (from the left edge) and swipe-to-close gestures from `SidebarDrawer`, delete the associated tests, and drop the now-unused `onOpen` prop. The drawer continues to open via the hamburger button and close via backdrop click or `Escape` key.

**Architecture:** Three-step removal. Tests come off first so the intermediate state is "feature still works, fewer tests." Then the prop call site is removed. Finally the implementation and interface are removed. Each step leaves `npm test` and `npm run check` green.

**Tech Stack:** React 19, Next.js 16, Vitest, @testing-library/react. No new dependencies.

**Spec:** [`docs/superpowers/specs/2026-04-18-code-quality-pass-design.md`](../specs/2026-04-18-code-quality-pass-design.md) — Phase 0.

---

## File Structure

| File | Change | Why |
|---|---|---|
| `src/__tests__/components/layout/SidebarDrawer.test.tsx` | Modify — remove 8 test cases + trim `fireEvent` import | Tests cover behavior being removed; `fireEvent` is used only by those tests |
| `src/components/DakoppervlakteApp.tsx` | Modify — remove `onOpen` prop on the `<SidebarDrawer>` element | Call site becomes a no-op; remove before the prop disappears |
| `src/components/layout/SidebarDrawer.tsx` | Modify — remove 4 constants, 2 useEffect blocks, `onOpen` from props interface and destructure | The feature being removed |

No new files. No domain / lib / hook changes.

---

### Task 1: Remove swipe-related tests from `SidebarDrawer.test.tsx`

**Files:**
- Modify: `src/__tests__/components/layout/SidebarDrawer.test.tsx:1` (import line) and `:77-193` (8 test cases)

- [ ] **Step 1: Remove the `fireEvent` import (it's only used by swipe tests)**

In `src/__tests__/components/layout/SidebarDrawer.test.tsx`, change line 1 from:

```tsx
import { render, screen, fireEvent } from '../../test-utils'
```

to:

```tsx
import { render, screen } from '../../test-utils'
```

- [ ] **Step 2: Remove the 8 swipe test cases**

Delete the following `it(...)` blocks from `src/__tests__/components/layout/SidebarDrawer.test.tsx` (all inside `describe('On mobile', ...)`):

1. `'opens when the user swipes right from the left edge'` (currently lines 77–90)
2. `'does not open when the swipe starts away from the left edge'` (currently lines 92–105)
3. `'does not open on a predominantly vertical swipe'` (currently lines 107–120)
4. `'does not open on a tap near the left edge'` (currently lines 122–134)
5. `'closes when the user swipes left while open'` (currently lines 136–149)
6. `'does not close on a right swipe while open'` (currently lines 151–164)
7. `'does not close on a predominantly vertical swipe while open'` (currently lines 166–179)
8. `'does not close on a tap inside the drawer'` (currently lines 181–193)

The resulting `describe('On mobile', ...)` block keeps exactly these tests (in order):
- `'renders the drawer with dialog role when open'`
- `'calls onClose when the backdrop is clicked'`
- `'calls onClose when Escape is pressed'`
- `'does not render a backdrop when closed'`
- `'locks body scroll when open'`

The `describe('On desktop', ...)` block is unchanged.

- [ ] **Step 3: Run the test suite — expect pass**

```bash
npx vitest run src/__tests__/components/layout/SidebarDrawer.test.tsx
```

Expected: all remaining tests pass. The swipe tests are gone; the swipe implementation in `SidebarDrawer.tsx` still exists but is now untested (will be removed in Task 3).

- [ ] **Step 4: Run the full suite + typecheck — expect pass**

```bash
npm run check && npm test
```

Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/components/layout/SidebarDrawer.test.tsx
git commit -m "test(SidebarDrawer): remove swipe-open/close test cases"
```

---

### Task 2: Remove the `onOpen` call site in `DakoppervlakteApp.tsx`

**Files:**
- Modify: `src/components/DakoppervlakteApp.tsx:178` (single line removal)

- [ ] **Step 1: Remove the `onOpen` prop from the `<SidebarDrawer>` element**

In `src/components/DakoppervlakteApp.tsx`, locate the `<SidebarDrawer>` element (around line 176–181). Change:

```tsx
<SidebarDrawer
  open={drawerOpen}
  onOpen={() => setDrawerOpen(true)}
  onClose={() => setDrawerOpen(false)}
  titleId={DRAWER_TITLE_ID}
>
```

to:

```tsx
<SidebarDrawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  titleId={DRAWER_TITLE_ID}
>
```

- [ ] **Step 2: Run typecheck + full suite — expect pass**

```bash
npm run check && npm test
```

Expected: green. `onOpen` is an optional prop on `SidebarDrawerProps`, so omitting it is legal even though the prop definition still exists. The swipe-open effect in `SidebarDrawer.tsx` has an `if (... || !onOpen) return` guard on line 59, so it becomes a no-op at runtime — harmless until Task 3 removes the code entirely.

- [ ] **Step 3: Commit**

```bash
git add src/components/DakoppervlakteApp.tsx
git commit -m "refactor(DakoppervlakteApp): drop onOpen prop on SidebarDrawer"
```

---

### Task 3: Remove swipe implementation and `onOpen` prop from `SidebarDrawer.tsx`

**Files:**
- Modify: `src/components/layout/SidebarDrawer.tsx` — remove 4 constants, remove 2 useEffect blocks, remove `onOpen` from props interface and destructure

- [ ] **Step 1: Remove the four swipe constants**

In `src/components/layout/SidebarDrawer.tsx`, delete lines 13–16:

```tsx
const EDGE_SWIPE_START_PX = 24
const OPEN_SWIPE_DISTANCE_PX = 60
const CLOSE_SWIPE_DISTANCE_PX = 60
const HORIZONTAL_DOMINANCE_RATIO = 1.2
```

Keep the `FOCUSABLE_SELECTOR` constant immediately below (currently lines 18–19) — it is used by the focus-management effect.

- [ ] **Step 2: Remove the swipe-open useEffect block**

Delete the entire `useEffect` block that wires swipe-to-open (currently lines 58–119). It starts with:

```tsx
  useEffect(() => {
    if (!isMobile || open || !onOpen) return

    let startX = 0
```

and ends with (just before the next `useEffect`):

```tsx
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile, open, onOpen])
```

- [ ] **Step 3: Remove the swipe-close useEffect block**

Delete the entire `useEffect` block that wires swipe-to-close (currently lines 121–178). It starts with:

```tsx
  useEffect(() => {
    if (!isMobile || !open) return

    let startX = 0
    let startY = 0
    let tracking = false
    let committedHorizontal = false

    const onTouchStart = (e: TouchEvent) => {
```

and ends with:

```tsx
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile, open, onClose])
```

**Note:** there is a different `useEffect` block above (the Escape-key handler, currently lines 40–47) that starts with `if (!isMobile || !open) return` followed by `const onKeyDown`. Do NOT delete that one. Distinguish them by the body: Escape handler uses `document.addEventListener('keydown', ...)`, swipe-close uses `document.addEventListener('touchstart', ...)`.

- [ ] **Step 4: Remove `onOpen` from the props interface**

Change the `SidebarDrawerProps` interface (currently lines 5–11) from:

```tsx
interface SidebarDrawerProps {
  open: boolean
  onOpen?: () => void
  onClose: () => void
  titleId: string
  children: React.ReactNode
}
```

to:

```tsx
interface SidebarDrawerProps {
  open: boolean
  onClose: () => void
  titleId: string
  children: React.ReactNode
}
```

- [ ] **Step 5: Remove `onOpen` from the function destructure**

Change the component signature (currently line 35) from:

```tsx
export function SidebarDrawer({ open, onOpen, onClose, titleId, children }: SidebarDrawerProps) {
```

to:

```tsx
export function SidebarDrawer({ open, onClose, titleId, children }: SidebarDrawerProps) {
```

- [ ] **Step 6: Run typecheck — expect pass**

```bash
npm run check
```

Expected: green. The `onOpen` prop is no longer in the interface; its only caller (in `DakoppervlakteApp.tsx`) was already removed in Task 2.

- [ ] **Step 7: Run the full test suite — expect pass**

```bash
npm test
```

Expected: all tests pass. The remaining `SidebarDrawer` tests cover the kept behavior (dialog role, backdrop click, Escape, closed state, body scroll lock, desktop rendering).

- [ ] **Step 8: Verify no residual references anywhere in `src/`**

Run each of these — all should produce **no output** (exit code 1 from `grep` is the expected "no match" result):

```bash
grep -rn "EDGE_SWIPE_START_PX" src/ || true
grep -rn "OPEN_SWIPE_DISTANCE_PX" src/ || true
grep -rn "CLOSE_SWIPE_DISTANCE_PX" src/ || true
grep -rn "HORIZONTAL_DOMINANCE_RATIO" src/ || true
grep -rn "\bonOpen\b" src/ || true
```

Expected: no lines printed (apart from the trailing `|| true` which prevents non-zero exit from halting the shell).

If any line prints, investigate — there is a reference the plan did not anticipate, and it must be resolved before the commit.

- [ ] **Step 9: Run the app locally and smoke-test the drawer on mobile viewport**

```bash
npm run dev
```

Open `http://localhost:3000` in a browser, narrow the viewport below 768 px (or use DevTools device emulation), and verify:

- Clicking the hamburger button in the header opens the drawer
- Clicking the backdrop closes the drawer
- Pressing `Escape` while the drawer is open closes it
- Attempting a swipe from the left edge does **not** open the drawer (no gesture is wired)
- Attempting a leftward swipe while the drawer is open does **not** close it

Stop the dev server (`Ctrl+C`).

- [ ] **Step 10: Commit**

```bash
git add src/components/layout/SidebarDrawer.tsx
git commit -m "refactor(SidebarDrawer): remove swipe-to-open/close gestures"
```

---

## Exit criteria (Phase 0 complete)

- `npm run check` passes
- `npm test` passes
- Grep for `onOpen`, `EDGE_SWIPE_START_PX`, `OPEN_SWIPE_DISTANCE_PX`, `CLOSE_SWIPE_DISTANCE_PX`, `HORIZONTAL_DOMINANCE_RATIO` in `src/` returns no matches
- Drawer opens via hamburger button only; closes via backdrop click / Escape only (verified manually in Task 3 Step 9)
- Three commits land on the branch, in order:
  1. `test(SidebarDrawer): remove swipe-open/close test cases`
  2. `refactor(DakoppervlakteApp): drop onOpen prop on SidebarDrawer`
  3. `refactor(SidebarDrawer): remove swipe-to-open/close gestures`
