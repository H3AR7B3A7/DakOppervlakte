# Phase 1.5 — Biome Backlog Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear Biome's backlog so `npm run check` reports zero diagnostics and `npm test` stays 228/228 green.

**Architecture:** 83 format-only diffs + 64 lint errors across 19 rule families + 2 readability nits. Risk-ascending batches, one commit per rule family. End-of-phase test gate.

**Tech Stack:** Biome 2.4.12, Vitest 4, React 19, Next.js 16, TypeScript 5.

**Branch:** master (no worktree; no push).

**Spec:** `docs/superpowers/specs/2026-04-18-phase-1-5-biome-backlog-design.md`.

---

## Preconditions

- Working tree clean, on master at `fcd5d5d` or later.
- `npm test` → 228/228 passing.
- `npm run check` → 136 errors (83 format + 64 lint) as of the spec.

## Conventions

- Commit messages use `chore(format): …` or `chore(lint): fix <rule> (<N> sites)`.
- **Never** silence a diagnostic with `biome-ignore` unless this plan says so.
- **Never** change `biome.json` rule severities in this phase.
- If a fix would require restructuring a hook, re-architecting a component, or adding abstractions, **STOP and flag it to the user** — do not silently expand scope.
- All commands assume repo root `C:\Users\sdhondt01\IdeaProjects\DakOppervlakte`.

---

## Task 0: Baseline

**Files:** none

- [ ] **Step 1: Verify clean tree**

Run: `git status`
Expected: `nothing to commit, working tree clean`

- [ ] **Step 2: Verify green baseline tests**

Run: `npm test`
Expected: `Tests 228 passed (228)` (or current baseline count; record the number)

- [ ] **Step 3: Capture current Biome diagnostic totals**

Run: `npx biome check --max-diagnostics=200 . 2>&1 | tail -5`
Expected: `Found 136 errors. Found 9 warnings. Found 2 infos.`

---

## Task 1: Formatter sweep (83 files)

**Files:** 83 files — see `/tmp/biome-format-files.txt` for the full list. Affects JSON, TS, TSX, CSS, MD, MTS, MJS across docs/, messages/, src/, config files.

- [ ] **Step 1: Apply Biome formatter**

Run: `npx biome format --write .`
Expected: `Formatted N files in …ms. Fixed N files.`

- [ ] **Step 2: Verify no logic diff**

Run: `git diff --stat | tail -5`
Expected: changes touch whitespace/quotes/trailing commas only. Spot-check 2–3 files with `git diff <path>` if uncertain.

- [ ] **Step 3: Verify formatter is now clean**

Run: `npx biome format . 2>&1 | tail -3`
Expected: `Checked N files …` with no "would have printed" diffs.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(format): apply biome formatter to full tree"
```

---

## Task 2: `correctness/noUnusedImports` (14 sites)

**Files:**
- `src/components/DakoppervlakteApp.tsx:5`
- `src/components/Header.tsx:5`
- `src/components/map/DrawingOverlay.tsx:2`
- `src/components/map/PolygonChipBar.tsx:4`
- `src/components/sidebar/AddressSearch.tsx:4`
- `src/components/sidebar/DrawingHint.tsx:2`
- `src/components/sidebar/PolygonList.tsx:4`
- `src/components/sidebar/SaveResetControls.tsx:4`
- `src/components/sidebar/SearchHistory.tsx:2`
- `src/components/sidebar/StepGuide.tsx:2`
- `src/components/sidebar/TotalAreaDisplay.tsx:2`
- `src/components/ui/HamburgerButton.tsx:1`
- `src/components/ui/Logo.tsx:1`
- `src/components/ui/Spinner.tsx:1`

All 14 are FIXABLE. Pattern is almost certainly `import React from 'react'` left over from pre-React-19 days.

- [ ] **Step 1: Autofix the rule**

Run: `npx biome check --write --only=lint/correctness/noUnusedImports .`
Expected: `Fixed N files.`

- [ ] **Step 2: Verify rule is clean**

Run: `npx biome check --only=lint/correctness/noUnusedImports . 2>&1 | tail -3`
Expected: `Found 0 errors.` (or no matching diagnostics in the output)

- [ ] **Step 3: Spot-check a changed file**

Run: `git diff src/components/DakoppervlakteApp.tsx | head -20`
Expected: one or two unused import lines removed; no other changes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(lint): fix noUnusedImports (14 sites)"
```

---

## Task 3: `a11y/useButtonType` (11 sites)

**Files:**
- `src/components/map/MapOverlayControls.tsx:56,65,80,89`
- `src/components/sidebar/PolygonList.tsx:150,179`
- `src/components/sidebar/RotationControls.tsx:66,108,118`
- `src/components/sidebar/SearchHistory.tsx:52,97`

Biome requires `type="button"` (or `submit`/`reset`) on every `<button>` so it doesn't default to `type="submit"` inside a form. All mechanical; no logic change.

- [ ] **Step 1: Autofix**

Run: `npx biome check --write --only=lint/a11y/useButtonType .`
Expected: `Fixed N files.` (Note: this rule is usually auto-fixable in Biome 2.x.)

- [ ] **Step 2: If autofix left any residue, fix by hand**

Run: `npx biome check --only=lint/a11y/useButtonType . 2>&1 | tail -5`
Expected: zero matches. If any remain, edit the file and add `type="button"` as the first attribute on the flagged `<button>`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(lint): fix a11y/useButtonType (11 sites)"
```

---

## Task 4: `complexity/noUselessFragments` (2 sites)

**Files:**
- `src/__tests__/components/Header.test.tsx:10`
- `src/components/sidebar/SaveResetControls.tsx:20`

Both FIXABLE. A `<>{something}</>` wrapping a single child gets unwrapped to `{something}`.

- [ ] **Step 1: Autofix**

Run: `npx biome check --write --only=lint/complexity/noUselessFragments .`
Expected: `Fixed 2 files.`

- [ ] **Step 2: Verify**

Run: `npx biome check --only=lint/complexity/noUselessFragments . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(lint): fix noUselessFragments (2 sites)"
```

---

## Task 5: Small mechanical families (4 rules, 4 sites)

Bundled because each is a single-site mechanical autofix. Still one commit per family — 4 commits.

### Task 5a: `style/useTemplate` (1 site)

**Files:** `src/hooks/useGeocoding.ts:26` — `addr + ', Belgium'` → `` `${addr}, Belgium` ``.

- [ ] **Step 1: Autofix**

Run: `npx biome check --write --only=lint/style/useTemplate .`

- [ ] **Step 2: Verify**

Run: `npx biome check --only=lint/style/useTemplate . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(lint): fix useTemplate (1 site)"
```

### Task 5b: `style/useNodejsImportProtocol` (1 site)

**Files:** `src/lib/init-db.ts:3` — `import { resolve } from 'path'` → `from 'node:path'`.

- [ ] **Step 1: Autofix**

Run: `npx biome check --write --only=lint/style/useNodejsImportProtocol .`

- [ ] **Step 2: Verify**

Run: `npx biome check --only=lint/style/useNodejsImportProtocol . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(lint): fix useNodejsImportProtocol (1 site)"
```

### Task 5c: `correctness/useParseIntRadix` (1 site)

**Files:** `src/__tests__/lib/utils.test.ts:11` — `parseInt(...)` → `parseInt(..., 10)`. This line also has a `!` non-null assertion flagged by Task 9; autofix here only changes `parseInt`. The `!` will be addressed in Task 9.

- [ ] **Step 1: Autofix**

Run: `npx biome check --write --only=lint/correctness/useParseIntRadix .`

- [ ] **Step 2: Verify**

Run: `npx biome check --only=lint/correctness/useParseIntRadix . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(lint): fix useParseIntRadix (1 site)"
```

### Task 5d: `correctness/noUnusedFunctionParameters` (1 site)

**Files:** `src/proxy.ts:8` — `clerkMiddleware(async (auth, req) => { … })` where `auth` is unused.

The autofix renames to `_auth`. That's the right call here: Clerk's middleware type signature expects the first argument, so we can't drop it.

- [ ] **Step 1: Autofix**

Run: `npx biome check --write --only=lint/correctness/noUnusedFunctionParameters --unsafe .`
Expected: `Fixed 1 file.` (Biome labels the underscore-prefix rename as "unsafe" because it may change meaning; for an unused parameter it's safe.)

- [ ] **Step 2: Verify**

Run: `npx biome check --only=lint/correctness/noUnusedFunctionParameters . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 3: Verify proxy still type-checks**

Run: `npx tsc --noEmit`
Expected: clean exit.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(lint): fix noUnusedFunctionParameters (1 site)"
```

---

## Task 6: `complexity/noImportantStyles` (2 sites)

**Files:** `src/app/globals.css:27,28`.

Current CSS:
```css
.cl-formButtonPrimary {
  background: var(--accent) !important;
  color: #000 !important;
}
```

The `!important` exists to override Clerk's bundled styles. Without it, Clerk's defaults win. Options:

**A. Increase specificity** (preferred — stays within Biome's rules):
```css
body .cl-formButtonPrimary {
  background: var(--accent);
  color: #000;
}
```
Clerk injects at the document level; a single-body prefix makes our rule win without `!important`. Verify in the browser after change.

**B. If specificity doesn't win**, flag to the user. Do not silence the rule without discussion.

- [ ] **Step 1: Try the specificity fix**

Edit `src/app/globals.css:25-29` to:
```css
body .cl-formButtonPrimary {
  background: var(--accent);
  color: #000;
}
```

- [ ] **Step 2: Verify Biome accepts it**

Run: `npx biome check --only=lint/complexity/noImportantStyles . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 3: Start dev server and verify Clerk button styling**

Run: `npm run dev` (in another shell)
Visit `http://localhost:3000/en`, trigger the sign-in UI, confirm the primary button still shows the `--accent` background (green) with black text.

Expected: button styling unchanged.

- [ ] **Step 4: If button styling broke, revert and escalate**

```bash
git checkout -- src/app/globals.css
```
Then STOP and flag to the user: "`noImportantStyles` for `.cl-formButtonPrimary` can't be fixed by specificity alone — need guidance on whether to add an override for this file."

- [ ] **Step 5: Commit (only if Step 3 passed)**

```bash
git add src/app/globals.css
git commit -m "chore(lint): replace !important with specificity for Clerk button override"
```

---

## Task 7: `a11y/noSvgWithoutTitle` (2 sites)

**Files:**
- `src/components/sidebar/SearchHistory.tsx:124` — delete/trash icon
- `src/components/ui/HamburgerButton.tsx:39` — hamburger icon

Both are decorative SVGs inside buttons that already have accessible labels. The correct fix is `aria-hidden="true"` on the `<svg>`, which satisfies the rule without adding redundant `<title>`.

- [ ] **Step 1: Edit `src/components/sidebar/SearchHistory.tsx:124`**

Change:
```tsx
<svg
  width="14"
  height="14"
  viewBox="0 0 24 24"
  …
```
to:
```tsx
<svg
  aria-hidden="true"
  width="14"
  height="14"
  viewBox="0 0 24 24"
  …
```

- [ ] **Step 2: Edit `src/components/ui/HamburgerButton.tsx:39`**

Change:
```tsx
<svg
  width="22"
  height="22"
  viewBox="0 0 24 24"
  …
```
to:
```tsx
<svg
  aria-hidden="true"
  width="22"
  height="22"
  viewBox="0 0 24 24"
  …
```

- [ ] **Step 3: Verify**

Run: `npx biome check --only=lint/a11y/noSvgWithoutTitle . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(lint): fix noSvgWithoutTitle (2 sites) with aria-hidden"
```

---

## Task 8: `a11y/noAutofocus` (2 sites)

**Files:**
- `src/components/map/PolygonChipBar.tsx:142`
- `src/components/sidebar/PolygonList.tsx:129`

These are inline-rename inputs that appear when the user clicks "rename"; autofocus is intentional UX (the user asked to type). The autofix removes `autoFocus`, which regresses the UX.

The correct fix is to replace `autoFocus` with a `useEffect` that calls `.focus()` on the ref when the edit mode opens. Biome's rule treats this as acceptable because the focus is a side-effect response to a user action, not attribute-driven on mount.

**Inspect each site first** to confirm this is the pattern. If either site is NOT a rename-on-user-click input, stop and flag.

- [ ] **Step 1: Inspect PolygonChipBar.tsx:142**

Run: `grep -n "autoFocus" src/components/map/PolygonChipBar.tsx`
Read context lines 130–160. Confirm: the input is rendered conditionally when the user opens rename mode; there is already a ref OR one can be added cleanly.

If the pattern does NOT match (e.g. autoFocus on mount of a permanent input), STOP and flag.

- [ ] **Step 2: Inspect PolygonList.tsx:129**

Run: `grep -n "autoFocus" src/components/sidebar/PolygonList.tsx`
Read context lines 110–140. Same confirmation.

- [ ] **Step 3: For each site, replace `autoFocus` with ref + useEffect**

Pattern (apply per site; adapt variable names to the component's conventions):

```tsx
// top of component
const inputRef = useRef<HTMLInputElement>(null)

// when entering rename mode
useEffect(() => {
  if (isEditing) {
    inputRef.current?.focus()
    inputRef.current?.select()
  }
}, [isEditing])

// on the input
<input ref={inputRef} … />  // remove autoFocus
```

Show the full before/after diff of the input and the useEffect addition in each file before committing.

- [ ] **Step 4: Verify linter**

Run: `npx biome check --only=lint/a11y/noAutofocus . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 5: Verify tests still pass for these components**

Run: `npx vitest run src/__tests__/components/map/PolygonChipBar.test.tsx src/__tests__/components/sidebar/PolygonList.test.tsx`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(lint): replace autoFocus with useEffect+ref (2 sites)"
```

---

## Task 9: `style/noNonNullAssertion` (5 sites)

**Files:**
- `src/__tests__/lib/utils.test.ts:11` — `parseInt(generatePolygonColor().match(/hsl\((\d+)/)![1], 10)` in a test.
- `src/__tests__/components/sidebar/SearchHistory.test.tsx:65` — `.closest('button')!` in a test.
- `src/components/DakoppervlakteApp.tsx:133` — `restored.polygons!` after a null check.
- `src/hooks/usePolygonDrawing.ts:127` — `createEdgeLabels(map!, locale)`.
- `src/lib/init-db.ts:8` — `neon(process.env.DATABASE_URL!)`.

Each needs an individual fix. Handle per site:

### Task 9a: Test files (2 sites) — narrow with assertions

In tests, a helper assert is fine; the lint rule doesn't fire on `expect(x).toBeDefined()` narrowings but *does* fire on `!`. Use `if (!x) throw …` or `expect(…).not.toBeNull()` then cast. Simplest is an early expectation that narrows.

- [ ] **Step 1: Fix `src/__tests__/lib/utils.test.ts:9-12`**

Change:
```ts
for (let i = 0; i < 100; i++) {
  const hue = parseInt(generatePolygonColor().match(/hsl\((\d+)/)![1], 10)
  …
```
to:
```ts
for (let i = 0; i < 100; i++) {
  const match = generatePolygonColor().match(/hsl\((\d+)/)
  expect(match).not.toBeNull()
  const hue = parseInt(match![1], 10)
  …
```

Wait — that still uses `!`. The correct fix:
```ts
for (let i = 0; i < 100; i++) {
  const match = generatePolygonColor().match(/hsl\((\d+)/)
  if (!match) throw new Error('regex did not match')
  const hue = parseInt(match[1], 10)
  …
```

- [ ] **Step 2: Fix `src/__tests__/components/sidebar/SearchHistory.test.tsx:64-66`**

Change:
```ts
const restoreButton = screen.getByText('Meir 1, Antwerpen').closest('button')!
```
to:
```ts
const restoreButton = screen.getByText('Meir 1, Antwerpen').closest('button')
if (!restoreButton) throw new Error('restore button not found')
```

### Task 9b: Production code (3 sites)

- [ ] **Step 3: Fix `src/components/DakoppervlakteApp.tsx:131-135`**

Current:
```tsx
geocodeAndNavigate(restored.address, () => {
  if (restored.polygons) {
    setTimeout(() => restorePolygons(restored.polygons!), 500)
  }
})
```

The `!` is there because inside the setTimeout callback TypeScript loses the narrowing. Fix by capturing locally:
```tsx
geocodeAndNavigate(restored.address, () => {
  const polygons = restored.polygons
  if (polygons) {
    setTimeout(() => restorePolygons(polygons), 500)
  }
})
```

- [ ] **Step 4: Fix `src/hooks/usePolygonDrawing.ts:125-128`**

Current:
```ts
(polygon: google.maps.Polygon, options: {…}): PolygonEntry => {
  const map = mapInstanceRef.current
  const edgeLabels = createEdgeLabels(map!, locale)
```

Add a real guard — `attachPolygonEntry` is only ever called with a ready map, but the type says `map | null`. Fix:
```ts
(polygon: google.maps.Polygon, options: {…}): PolygonEntry => {
  const map = mapInstanceRef.current
  if (!map) throw new Error('attachPolygonEntry called without map')
  const edgeLabels = createEdgeLabels(map, locale)
```

- [ ] **Step 5: Fix `src/lib/init-db.ts:8`**

Current:
```ts
const sql = neon(process.env.DATABASE_URL!)
```

Change to an explicit guard (matches the pattern in `src/lib/db.ts`):
```ts
const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL not configured')
}
const sql = neon(url)
```

### Task 9c: Verify and commit

- [ ] **Step 6: Verify linter**

Run: `npx biome check --only=lint/style/noNonNullAssertion . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 7: Verify affected tests still pass**

Run: `npx vitest run src/__tests__/lib/utils.test.ts src/__tests__/components/sidebar/SearchHistory.test.tsx src/__tests__/components/DakoppervlakteApp.test.tsx`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(lint): replace non-null assertions with explicit guards (5 sites)"
```

---

## Task 10: `a11y/useSemanticElements` (1 site)

**Files:** `src/components/sidebar/TotalAreaDisplay.tsx:17` — `<div role="region">`.

Biome wants `<section>` instead of `role="region"` on a `<div>`. The element also has `aria-label={t('totalArea')}` which makes it a named landmark — acceptable on `<section>`.

- [ ] **Step 1: Edit TotalAreaDisplay.tsx:16-17**

Change:
```tsx
<div
  role="region"
  aria-label={t('totalArea')}
  style={{
    …
  }}
>
```
to:
```tsx
<section
  aria-label={t('totalArea')}
  style={{
    …
  }}
>
```

Also update the matching closing tag `</div>` (at the end of the component) to `</section>`.

- [ ] **Step 2: Verify linter**

Run: `npx biome check --only=lint/a11y/useSemanticElements . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 3: Run affected test**

Run: `npx vitest run src/__tests__/components/sidebar/TotalAreaDisplay.test.tsx`
Expected: all pass. If a test queries `getByRole('region')` it will still match `<section>` because `<section>` with `aria-label` has implicit role=region.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(lint): use <section> over div+role=region in TotalAreaDisplay"
```

---

## Task 11: SidebarDrawer backdrop a11y (3 rules, 1 element)

**Files:** `src/components/layout/SidebarDrawer.tsx:87-96`.

The backdrop `<div onClick={onClose}>` fires three rules simultaneously:
- `a11y/noStaticElementInteractions` — `<div>` with click handler but no role.
- `a11y/useKeyWithClickEvents` — click handler but no key handler.
- `a11y/useAriaPropsSupportedByRole` — (fires on line 98; this is on the `<aside>` below; see also).

The backdrop is a visual-only dismiss layer. Semantically, the user's keyboard path to close the drawer should be `Escape`, which is typically handled at the drawer container (the `<aside>` with `role="dialog"`). The backdrop itself is decorative for keyboard users.

Also, line 98 `<aside>` fires `useAriaPropsSupportedByRole` — likely `aria-modal` is being set even when `role` is undefined (the `role={open ? 'dialog' : undefined}` pattern). When `role` is undefined, `aria-modal` isn't valid.

**Handle in two steps:**

- [ ] **Step 1: Make the backdrop a button element**

Change the backdrop from `<div onClick={…} />` to `<button type="button" onClick={onClose} aria-label={…}>`. This gives it a role, supports keyboard (Enter/Space trigger click natively), and satisfies all three rules for line 87.

Current:
```tsx
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
```

Replace with (add a translation key `closeDrawer` or reuse an existing one — check the component's `useTranslations` namespace; for this plan assume `t('close')` exists and is appropriate):
```tsx
<button
  type="button"
  data-testid="sidebar-drawer-backdrop"
  onClick={onClose}
  aria-label={t('close')}
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
```

Before editing, verify the component already calls `useTranslations` and has a suitable key. If it does not, STOP and flag: "SidebarDrawer backdrop needs a translation key; no existing `t('close')` or similar in scope — pick a key or add one to `messages/en.json` + `messages/nl.json`."

- [ ] **Step 2: Fix `useAriaPropsSupportedByRole` on the `<aside>`**

Current (line 98-103):
```tsx
<aside
  ref={drawerRef}
  role={open ? 'dialog' : undefined}
  aria-modal={open ? true : undefined}
  aria-labelledby={open ? titleId : undefined}
  aria-hidden={!open}
```

Replace the conditional `role` + conditional aria-props with either always-set or always-omitted, based on the `open` state. Cleanest: keep `role="dialog"` always (it's conceptually always a dialog; `aria-hidden` hides it when closed), and keep the aria-labelledby tied to open.

```tsx
<aside
  ref={drawerRef}
  role="dialog"
  aria-modal={open}
  aria-labelledby={titleId}
  aria-hidden={!open}
```

Verify `titleId` is defined regardless of `open` (read the component's header).

- [ ] **Step 3: Verify all three rules clean**

Run: `npx biome check --only=lint/a11y/noStaticElementInteractions --only=lint/a11y/useKeyWithClickEvents --only=lint/a11y/useAriaPropsSupportedByRole . 2>&1 | tail -5`
Expected: zero matches.

- [ ] **Step 4: Run drawer tests**

Run: `npx vitest run src/__tests__/components/layout/SidebarDrawer.test.tsx`
Expected: all pass. Tests that query `getByTestId('sidebar-drawer-backdrop')` still match (test id preserved). If a test asserts the element is a `<div>`, adjust the test assertion.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(lint): make drawer backdrop a button; simplify aside dialog role"
```

---

## Task 12: `suspicious/useIterableCallbackReturn` (7 sites)

**Files:**
- `src/__tests__/__mocks__/googleMaps.ts:20` — inside `_trigger` in `makeEventTarget`.
- `src/__tests__/hooks/useGeocoding.test.ts:22`
- `src/__tests__/hooks/useMapOrientation.test.ts:21`
- `src/__tests__/hooks/usePolygonDrawing.test.ts:27`
- `src/hooks/useMapOrientation.ts:53`
- `src/hooks/usePolygonDrawing.ts:57` — `p.polygon.getPath().forEach((pt) => pts.push(pt))`.
- `src/hooks/usePolygonDrawing.ts:131` — identical pattern in `collectPath`.

All fire because an arrow `.forEach((x) => someFn(x))` implicitly returns whatever `someFn` returns. `.forEach` doesn't use the return value, but the rule is protecting against the case where the author meant `.map`.

**Fix pattern:** wrap in a block body so the return is explicit-undefined.

- [ ] **Step 1: Fix `src/hooks/usePolygonDrawing.ts:57`**

Change:
```ts
p.polygon.getPath().forEach((pt) => pts.push(pt))
```
to:
```ts
p.polygon.getPath().forEach((pt) => {
  pts.push(pt)
})
```

- [ ] **Step 2: Fix `src/hooks/usePolygonDrawing.ts:131`**

Change:
```ts
polygon.getPath().forEach((pt) => pts.push(pt))
```
to:
```ts
polygon.getPath().forEach((pt) => {
  pts.push(pt)
})
```

- [ ] **Step 3: Fix `src/hooks/useMapOrientation.ts:53`**

Read the site, apply the same pattern. If the callback body does something other than push, adapt: the goal is a block body with no implicit return.

- [ ] **Step 4: Fix the four test/mock sites**

Read each flagged line, apply the same pattern. For `googleMaps.ts:20`, note that the file has a biome override for `useArrowFunction` — this rule is different and not covered by that override, so the fix still applies. Keep outer factory arrows as `function` (per existing invariant comment).

- [ ] **Step 5: Verify linter**

Run: `npx biome check --only=lint/suspicious/useIterableCallbackReturn . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 6: Run affected tests**

Run: `npx vitest run`
Expected: 228/228 pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(lint): fix useIterableCallbackReturn (7 sites) with block bodies"
```

---

## Task 13: `suspicious/noArrayIndexKey` (1 site)

**Files:** `src/components/sidebar/StepGuide.tsx:23` — `<li key={i}>` in a map over `STEPS`.

STEPS are static translated strings; the index is stable. But the rule is on for a reason: if the array ever becomes dynamic, index-as-key causes bugs. Use the text itself, which is unique among the 4 steps.

- [ ] **Step 1: Edit StepGuide.tsx:22-23**

Change:
```tsx
{STEPS.map((text, i) => (
  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
```
to:
```tsx
{STEPS.map((text, i) => (
  <li key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
```

Keep `i` destructured because it's used inside the element (`{i + 1}` at line 42).

- [ ] **Step 2: Verify**

Run: `npx biome check --only=lint/suspicious/noArrayIndexKey . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 3: Run test**

Run: `npx vitest run src/__tests__/components/sidebar/StepGuide.test.tsx`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(lint): use text as key in StepGuide (noArrayIndexKey)"
```

---

## Task 14: `suspicious/noConsole` in init-db (1 site) — ESCALATION EXPECTED

**Files:** `src/lib/init-db.ts:58` — `console.log('✅ Database initialized')`.

This is a Node.js CLI script, not app code. `biome.json` allows `console.error` and `console.warn`, which don't fit a success message. Comparable case: `src/app/api/**` has an override for `noConsole`.

**Expected escalation.** Two candidate resolutions — present to the user and await direction:

1. Add `src/lib/init-db.ts` to the existing `noConsole` override group (or a new group for `src/lib/**.ts` scripts). Minimal code change, consistent with the API route precedent.
2. Replace the log line with `console.warn('✅ Database initialized')`. Semantically off but zero config change.

- [ ] **Step 1: Stop and ask the user which option to take.**

Do not proceed without direction. When the user answers, execute the chosen option as its own commit:

- If option 1: edit `biome.json` to extend the existing `src/app/api/**` override's `includes` array to include `src/lib/init-db.ts`. Commit message: `chore(lint): allow console in init-db CLI script`.
- If option 2: edit the line. Commit message: `chore(lint): use console.warn in init-db (noConsole)`.

- [ ] **Step 2: Verify**

Run: `npx biome check --only=lint/suspicious/noConsole . 2>&1 | tail -3`
Expected: zero matches.

---

## Task 15: `correctness/useExhaustiveDependencies` (9 sites in usePolygonDrawing.ts)

**Files:**
- `src/hooks/usePolygonDrawing.ts:36` (useEffect)
- `src/hooks/usePolygonDrawing.ts:110` (resetAll)
- `src/hooks/usePolygonDrawing.ts:121` (attachPolygonEntry)
- `src/hooks/usePolygonDrawing.ts:164` (restorePolygons)
- `src/hooks/usePolygonDrawing.ts:196` (finishPolygon)
- `src/hooks/usePolygonDrawing.ts:231` (addPolygonFromPath)
- `src/hooks/usePolygonDrawing.ts:338` (deletePolygon)
- `src/hooks/usePolygonDrawing.ts:348` (renamePolygon)
- `src/hooks/usePolygonDrawing.ts:353` (togglePolygonExcluded)

All 8 callback sites share a root cause: `syncPolygons` (defined at line 106) is a plain function that closes over `setPolygons`. Each `useCallback` that calls it transitively reads `setPolygons`, which React cares about but Biome treats as missing. Wrapping `syncPolygons` itself in `useCallback` makes it a stable reference; then add it to every caller's deps.

Site 36 (the `useEffect`) is different — likely flags because `polygons` is in deps but never read inside (`polygonsRef.current` is read instead). Verify by reading the site and the rule's message.

**Expected escalation trigger:** if applying the below turns out to require more than adding `syncPolygons` to dep arrays and wrapping it in `useCallback`, STOP and flag.

- [ ] **Step 1: Wrap `syncPolygons` in useCallback**

Edit `src/hooks/usePolygonDrawing.ts` around line 106-108.

Current:
```ts
const syncPolygons = () => {
  setPolygons([...polygonsRef.current])
}
```
Replace with:
```ts
const syncPolygons = useCallback(() => {
  setPolygons([...polygonsRef.current])
}, [])
```

- [ ] **Step 2: Add `syncPolygons` to deps of each useCallback that calls it**

The current deps arrays for the 7 useCallbacks that use `syncPolygons` (not counting the effect):
- `resetAll` (line 119): `[clearDrawingState]` → `[clearDrawingState, syncPolygons]`
- `attachPolygonEntry` (line 161): `[mapInstanceRef, locale]` → `[mapInstanceRef, locale, syncPolygons]`
- `restorePolygons` (line 193): `[mapInstanceRef, resetAll, attachPolygonEntry]` → add `syncPolygons` if the autofix says so (it might deduce via attachPolygonEntry). Follow Biome's suggestion.
- `finishPolygon` (line 229): `[clearDrawingState, mapInstanceRef, currentHeading, currentTilt, attachPolygonEntry]` → add `syncPolygons`.
- `addPolygonFromPath` (line 263): same pattern → add `syncPolygons`.
- `deletePolygon` (line 346): `[]` → `[syncPolygons]`.
- `renamePolygon` (line 351): `[]` → `[syncPolygons]`.
- `togglePolygonExcluded` (line 359): `[]` → `[syncPolygons]`.

- [ ] **Step 3: Handle the useEffect at line 36**

Read the Biome diagnostic for line 36:3:

Run: `npx biome check --only=lint/correctness/useExhaustiveDependencies src/hooks/usePolygonDrawing.ts 2>&1 | grep -A 20 ":36:"`

Follow the suggested fix exactly. If it suggests removing `polygons` from deps, do that (the effect reads `polygonsRef.current`, so the dep is unused in principle, but the presence of `polygons` makes the effect rerun after state updates — which is the intent). If removing `polygons` breaks the behavior, add it back and STOP + flag for guidance on whether to add a scoped `biome-ignore` with a "why" comment.

- [ ] **Step 4: Run autofix for the rest, confirm residue**

Run: `npx biome check --write --only=lint/correctness/useExhaustiveDependencies src/hooks/usePolygonDrawing.ts`
Expected: no further changes if Steps 1–3 covered everything.

- [ ] **Step 5: Verify linter**

Run: `npx biome check --only=lint/correctness/useExhaustiveDependencies . 2>&1 | tail -3`
Expected: zero matches.

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: 228/228 pass. If any tests regress (e.g. polygon rendering, drawing FSM), STOP — the dep changes introduced a re-render loop or stale closure.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(lint): stabilize syncPolygons with useCallback (useExhaustiveDependencies)"
```

---

## Task 16: Readability nits (2 items)

**Files:**
- `src/lib/geo.ts:9` — restore parens stripped by a prior autoformat.
- `CLAUDE.md:62` — clarify that `biome check --write .` also formats.

- [ ] **Step 1: Read geo.ts line 9**

Run: `sed -n '5,15p' src/lib/geo.ts`
Identify the comparison that lost its clarifying parens (expected shape: `yi > lat !== yj > lat`).

- [ ] **Step 2: Restore parens**

Change:
```ts
yi > lat !== yj > lat
```
to:
```ts
(yi > lat) !== (yj > lat)
```

- [ ] **Step 3: Verify formatter doesn't strip them again**

Run: `npx biome format src/lib/geo.ts 2>&1 | tail -3`
Expected: `Checked 1 file …` with no diff. If Biome wants to strip them, STOP and flag: parens are readability-only; Biome's opinion wins per the "no rule relaxation" constraint, and this nit should be abandoned.

- [ ] **Step 4: Update CLAUDE.md:62**

Current:
```
- **Development**: After making changes, ALWAYS run `npm run check` and `npm test`.
```

No change needed to the command itself, but the line below (currently: "Run all tests: `npm test`") could add a clarifying sentence. Update the **Development** line to:
```
- **Development**: After making changes, ALWAYS run `npm run check` (lints + formats + organizes imports) and `npm test`.
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo.ts CLAUDE.md
git commit -m "chore: restore geo.ts parens; clarify biome wording in CLAUDE.md"
```

---

## Task 17: Final verification

**Files:** none

- [ ] **Step 1: Full Biome check must be clean**

Run: `npx biome check --max-diagnostics=200 . 2>&1 | tail -5`
Expected: `Found 0 errors. Found 0 warnings.` (info count may remain non-zero; that's OK — only errors and warnings matter)

- [ ] **Step 2: Full test suite must be green**

Run: `npm test`
Expected: `Tests 228 passed (228)` — same as baseline from Task 0 Step 2.

- [ ] **Step 3: Type check must pass**

Run: `npx tsc --noEmit`
Expected: clean exit (exit code 0).

- [ ] **Step 4: Git log shows one-commit-per-family**

Run: `git log --oneline fcd5d5d..HEAD`
Expected: ~14–16 commits, each with a focused `chore(…)` subject line.

- [ ] **Step 5: Working tree clean**

Run: `git status`
Expected: `nothing to commit, working tree clean`.

---

## Self-Review Checklist (already completed)

**Spec coverage:**
- Goal (zero diagnostics, green tests): Task 17.
- 83 format-only diffs: Task 1.
- 64 lint errors across 19 rule families:
  - noUnusedImports (14): Task 2
  - useButtonType (11): Task 3
  - noUselessFragments (2): Task 4
  - useTemplate (1), useNodejsImportProtocol (1), useParseIntRadix (1), noUnusedFunctionParameters (1): Task 5a–d
  - noImportantStyles (2): Task 6
  - noSvgWithoutTitle (2): Task 7
  - noAutofocus (2): Task 8
  - noNonNullAssertion (5): Task 9
  - useSemanticElements (1): Task 10
  - noStaticElementInteractions (1), useKeyWithClickEvents (1), useAriaPropsSupportedByRole (1): Task 11
  - useIterableCallbackReturn (7): Task 12
  - noArrayIndexKey (1): Task 13
  - noConsole (1): Task 14
  - useExhaustiveDependencies (9): Task 15
- Two nits (geo.ts parens, CLAUDE.md wording): Task 16.
- Tests at baseline + phase end: Task 0 + Task 17.
- No rule relaxations: adhered; Task 14 is the one candidate and it is explicitly flagged for user decision.

**Placeholder scan:** each step contains the exact file, exact command, or exact before/after code.

**Consistency:** `syncPolygons` name is consistent across Task 15 steps; file paths match the enumeration in the Files: sections of each task.
