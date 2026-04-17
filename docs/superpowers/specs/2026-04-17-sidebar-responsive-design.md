# Sidebar Responsive Redesign

**Status:** Draft
**Date:** 2026-04-17

## Problem

The sidebar grows vertically as features are added and can exceed viewport height, pushing the map off-screen. There is also no mobile layout — the 360px fixed sidebar eats half a phone screen and `SearchHistory` has no height cap, so it grows unboundedly.

## Goals

1. Sidebar always fits the viewport height on desktop.
2. Mobile (phones and portrait tablets, <768px) gets a dedicated layout: hamburger drawer + map chip bar.
3. The redesign is one coherent responsive system, not two bolted-on modes.

## Non-goals

- Tabs inside the sidebar (rejected — fragments orientation controls away from polygon review).
- Changing the visual identity, color palette, or typography.
- Touch gestures for drawing (out of scope — drawing flow is unchanged).

## Breakpoint

Single breakpoint at `768px` (Tailwind `md`), controlled via CSS (not JS), so there is no flash on resize.

- **Desktop (≥768px):** existing side-by-side layout, sidebar 360px.
- **Mobile (<768px):** map fills viewport; sidebar becomes a drawer; polygons get a chip bar overlay.

### Styling approach

The project already imports Tailwind v4 in `globals.css` but existing components style with inline `style={{}}` objects. To introduce responsive behavior without a broad rewrite:

- **New components** (`SidebarDrawer`, `PolygonChipBar`, `HamburgerButton`) use Tailwind utility classes for responsive behavior (`md:hidden`, `hidden md:block`, etc.).
- **Existing components** that need mobile-hide treatment (`RotationControls`, `PolygonList`, `TotalAreaDisplay`) are not rewritten — instead, they are wrapped at their call site in a `<div className="hidden md:block">` in `DakoppervlakteApp`.
- Inline styles remain for everything that isn't responsive. No refactor of existing inline styles in this change.

## Design

### Desktop sidebar — space-saving

**1. Collapsible `AddressSearch`**

Two states:
- *Expanded* (default before first search): input + auto-generate checkbox + search button.
- *Collapsed* (after successful search): a compact row showing the current address as a label + a "New search" button. Tapping "New search" expands the form and focuses the input.

State lives in `DakoppervlakteApp` as `searchFormCollapsed: boolean`. Auto-collapses on successful geocode; auto-expands on reset.

**2. Height-bounded sidebar with internal scroll**

Sidebar root already has `height: calc(100vh - 60px); display: flex; flex-direction: column`. The missing pieces:

- `AddressSearch`, `RotationControls` → `flex-shrink: 0`.
- Middle scrollable section → `flex: 1; min-height: 0` (the `min-height: 0` lets the flex child actually shrink below its content size).
- `SearchHistory` → `flex-shrink: 0` with its own internal `max-height: 200px; overflow-y: auto`.

Result: sidebar always fits viewport; long polygon lists and long history both scroll independently within their own regions.

### Mobile drawer

Slide-in drawer from the left, 85% viewport width (max 360px). Dimmed backdrop; tap backdrop or press Esc to close. Body scroll locked while open.

**Opens via:** hamburger button in `Header` (mobile only, top-left).

**Auto-closes after:**
- Successful search
- Tapping "Start drawing" / "Add plane"
- Tapping "Save"

**Stays open after:** "Reset" (user likely wants to search again).

**Drawer contents (top → bottom):**
1. `AddressSearch` (same collapsible behavior as desktop)
2. "Start drawing" / "Add plane" button
3. `StepGuide` — only when `polygons.length === 0 && mode === 'idle'`
4. `SaveResetControls` — same visibility rules as today
5. `SearchHistory` (signed-in only, bounded height with internal scroll)

**Not in the drawer on mobile:**
- `RotationControls` — map overlay's rotate/tilt buttons cover this.
- `PolygonList`, `TotalAreaDisplay` — replaced by `PolygonChipBar`.
- `DrawingHint` — stays on the map via existing `DrawingOverlay`.

### Mobile `PolygonChipBar`

A floating bar at the bottom of the map, visible only when `polygons.length > 0` and `mode !== 'drawing'` (the `DrawingOverlay` takes precedence during drawing).

**Position:** `position: absolute; bottom: 16px; left: 16px; right: 16px` inside `MapView`.

**Layout:** horizontally scrollable chip row + pinned total-area pill at the right end (pill stays visible when chips scroll).

**Each chip shows:**
- A 10px color dot (matches polygon color on map)
- Polygon name (truncated with ellipsis)
- Area (e.g. "45 m²")
- A tiny "×" delete icon

**Interactions:**
- Tap chip → toggles `excluded` (same effect as the desktop checkbox). Excluded chips render with reduced opacity and strikethrough area.
- Long-press chip → opens rename (reuses existing rename flow).
- Tap × → delete (reuses existing delete flow).

**Total-area pill:**
- Format: `Σ 120 m²` — sum of non-excluded polygon areas.
- Non-interactive.

## Architecture

### New components

| Component | Location | Purpose |
|---|---|---|
| `SidebarDrawer` | `src/components/layout/SidebarDrawer.tsx` | Wraps sidebar content. On desktop, renders inline. On mobile, renders as drawer with backdrop. Owns `open` state externally via props. |
| `PolygonChipBar` | `src/components/map/PolygonChipBar.tsx` | Mobile-only chip row overlay inside `MapView`. |
| `HamburgerButton` | `src/components/ui/HamburgerButton.tsx` | Accessible menu button for `Header`. |

### Modified components

| Component | Changes |
|---|---|
| `DakoppervlakteApp.tsx` | Adds `drawerOpen` and `searchFormCollapsed` state. Wraps sidebar children in `SidebarDrawer`. Mounts `PolygonChipBar` inside `MapView`. Auto-collapse/auto-close logic. |
| `Header.tsx` | Adds hamburger button (mobile only via CSS); accepts `onMenuClick` prop. |
| `AddressSearch.tsx` | Adds `collapsed` + `onExpand` props; renders compact "address + New search" row when collapsed. |
| Sidebar root CSS (inside `DakoppervlakteApp`) | Adds `min-height: 0` on middle scroll region; caps `SearchHistory` height. |

### Hidden on mobile (CSS only)

- `RotationControls`, `PolygonList`, `TotalAreaDisplay` — wrapped at the call site in `<div className="hidden md:block">`. No logic change inside the components.

### State ownership

All new state lives in `DakoppervlakteApp` (the smart component), passed down as props. No new hooks — this is purely view state, doesn't warrant a hook per project conventions.

- `drawerOpen: boolean` — drawer open/close.
- `searchFormCollapsed: boolean` — search form expanded/collapsed.

## i18n

Add strings to `messages/nl.json` and any other locale files:

- `Sidebar.newSearch` — "Nieuwe zoekopdracht"
- `Sidebar.openMenu` — "Menu openen"
- `Sidebar.closeMenu` — "Menu sluiten"
- `ChipBar.totalLabel` — "Σ"

## Testing

Per CLAUDE.md testing rules — scenario-based, minimal mocks.

**New scenarios:**
- "User searches successfully → search form collapses to address label"
- "User taps 'New search' on collapsed form → form expands and input is focused"
- "User taps Reset → search form expands"
- "On mobile viewport, user taps hamburger → drawer opens → taps backdrop → drawer closes"
- "On mobile viewport, drawer auto-closes after successful search"
- "On mobile, after drawing a polygon, chip appears in bottom chip bar with color, name, area"
- "On mobile, tapping a chip toggles the polygon's excluded state"
- "On mobile, total-area pill updates when excluded state changes"
- "On mobile during drawing, chip bar is hidden"

**Viewport control:** tests that need mobile viewport mock `window.matchMedia` / set `window.innerWidth` before render.

## Accessibility

- Hamburger button has `aria-label` ("Open menu" / "Close menu"), `aria-expanded`, and `aria-controls` pointing to the drawer.
- Drawer has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the drawer's title.
- Focus moves into the drawer on open; returns to hamburger button on close.
- Esc key closes the drawer.
- Chip bar chips are `<button>` elements with descriptive `aria-label` ("Toggle polygon 'Plane 1' — 45 square metres").

## Open questions

None — all resolved during brainstorming.

## Out of scope (possible follow-ups)

- Swipe-to-close drawer gesture.
- Animated chip transitions when polygons are added/removed.
- Persisting `searchFormCollapsed` across reloads.
