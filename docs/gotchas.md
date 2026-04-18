# Gotchas

Tribal knowledge about behaviours that have surprised contributors. Each entry describes what looks wrong, why it is happening, and whether it is fixable or accepted.

## Unreachable "no building found" error

**Symptom.** Users never see the translated `Sidebar.noBuildingFound` message ("Geen gebouw gevonden") when auto-generate fails. The state flips, the 5-second timeout fires, but nothing renders on screen.

**Cause.** Two pieces of `DakoppervlakteApp.handleSearch` and `AddressSearch` interact badly:

1. `handleSearch` calls `setSearchFormCollapsed(true)` **inside the geocoder continuation**, before the `fetchBuildingPolygon(...)` promise resolves (`src/components/DakoppervlakteApp.tsx`, `handleSearch`).
2. By the time the `.then(...)` / `.catch(...)` runs `setAutoGenerateError(t('Sidebar.noBuildingFound'))`, the form is already collapsed.
3. `AddressSearch`'s `if (collapsed)` branch renders only the current-address block and a "New search" button — **it does not render the `error` prop at all**. The non-collapsed branch threads `error` into `Input`, but the non-collapsed branch is no longer on screen.

Net effect: `autoGenerateError` state flips but nothing displays it. The `DakoppervlakteApp` line `error={searchError || autoGenerateError}` is passed into a component that ignores it in the only branch the user is looking at.

**What to do.** Treat any test of the "no building found" path as a behaviour test on state + side effects, not on visible text. Characterisation tests correctly assert: `fetch('/api/building-polygon')` happens, `incrementAutogenCount` is not called, `startDrawing` runs after 600 ms. They do **not** assert the error text is visible — that assertion would fail for the right reason.

**Fix when scheduled.** Options: move `setSearchFormCollapsed(true)` into the success path, render `error` in the collapsed branch of `AddressSearch`, or surface the error via a toast. Fixing the bug needs its own ticket per the project's "no functional changes" rule for doc passes.

**References.**
- `src/components/DakoppervlakteApp.tsx` — `handleSearch`
- `src/components/sidebar/AddressSearch.tsx` — the `if (collapsed)` early return
- [address-search.mermaid](address-search.mermaid) — diagram correctly shows `setAutoGenerateError` firing; the UX bug is that no component renders it in the collapsed state

## Counter increment fires on search, not on save

**Symptom.** A signed-in user draws a polygon and clicks "Save to history", expecting the usage counter in the header to go up by one. It does not. Clicking "Search" for a new address *does* increment the counter.

**Cause.** The `/api/counter` POST is invoked inside `DakoppervlakteApp.handleSearch`, **not** `handleSave`:

- `handleSearch` calls `incrementSearchCount(address)` in the `geocodeAndNavigate` success continuation. `useUsageCounter.increment` is de-duplicated by address via `localStorage` (`dakoppervlakte_searched_addresses`), so the same address searched twice only increments once per browser.
- `handleSave` calls `saveEntry(address, totalArea, serializedPolygons)` and then `setSaved(true)`. No counter call.

This is intentional: the counter measures "unique addresses ever searched", not "saves". Saves are protected (require Clerk auth), while the counter is the public freemium metric shown to unauthenticated visitors.

**Diagrams reflect this.**
- [address-search.mermaid](address-search.mermaid) — `App ->> UC: incrementSearchCount(address)` step is present.
- [save-calculation.mermaid](save-calculation.mermaid) — has an explicit `Note over App: No counter increment here — incrementSearchCount fires in handleSearch, not handleSave` to make the asymmetry visible at a glance.

**What to do.** If a future product change wants "save counts", add a separate `/api/save-counter` rather than doubling up `/api/counter`, so the two metrics stay independent.

**References.**
- `src/components/DakoppervlakteApp.tsx` — `handleSearch`, `handleSave`
- `src/hooks/useUsageCounter.ts` — localStorage-backed dedupe
