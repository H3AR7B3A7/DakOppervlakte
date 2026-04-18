# Code Quality Pass — Design

**Date:** 2026-04-18
**Status:** Draft — awaiting user review
**Scope:** Guardrails + pure domain layer extraction + targeted component/hook cleanup
**Constraints:** No functional changes **with one deliberate exception: removing the sidebar swipe-to-open/close gestures** (Phase 0). All existing tests stay green except those covering the removed swipe behavior. Each phase ships as a standalone, revertable PR.

---

## Goals

1. **Hygiene** — lock in formatting and lint rules automatically so stylistic drift stops.
2. **Future-proofing** — encode the smart→dumb→pure architecture from `CLAUDE.md` as dependency-cruiser rules, so regressions fail CI rather than slipping into review.
3. **Clarity** — extract a framework-agnostic `src/domain/` layer so polygon math, serialization, and geometry become testable without mocking Google Maps or jsdom.
4. **Remove an existing rule violation** — `DakoppervlakteApp.tsx` currently has 100+ lines of inline `style={{}}` objects despite CLAUDE.md stating "No raw style objects" for smart components. Fix it.

## Non-goals

- Playwright e2e tests — stays on ROADMAP as separate item.
- Storybook for pure UI components — stays on ROADMAP as separate item.
- Replacing inline styles tree-wide (Tailwind / CSS modules) — this effort only removes them from *smart* components.
- Refactoring API routes or the one-concern hooks (`useGoogleMaps`, `useMapOrientation`, `useGeocoding`, `useSearchHistory`, `useUsageCounter`). Not in scope unless arch rails surface a violation.
- Any functional change. If a bug is found during the work, it gets its own ticket.

## Approach

Phased horizontal: each phase is one PR across the whole codebase. Each phase must leave the repo in a fully working state (green tests, `npm run check`, `npm run build`). No phase starts until the previous is merged.

Ordering rationale: guardrails first so the clean-code pass is auto-applied; characterization tests before any risky refactor so silent behavior changes cannot sneak in; domain extraction before component cleanup because component cleanup depends on the domain modules.

---

## Phase 0 — Remove sidebar swipe-to-open/close gestures

Independent from the rest of the effort — can ship any time. Listed first because it is the smallest, purely subtractive change and reduces the complexity of `SidebarDrawer.tsx` before later phases need to reason about it.

### Motivation

The swipe-open and swipe-close gestures in `src/components/layout/SidebarDrawer.tsx` add ~120 lines of touch-event plumbing (two `useEffect` blocks wiring `touchstart` / `touchmove` / `touchend` listeners on `document`, plus four magic-number constants). They duplicate capability already available via:

- **Open:** the hamburger button in the `Header`
- **Close:** the backdrop click + the `Escape` key

Removing them leaves `SidebarDrawer` simpler, drops the `onOpen` prop entirely, and eliminates an edge case where horizontal touch-scrolling inside the drawer can fight the drawer's own swipe-to-close handler.

### Changes

- In `src/components/layout/SidebarDrawer.tsx`:
  - Remove the two `useEffect` blocks for swipe-open (currently `SidebarDrawer.tsx:58-119`) and swipe-close (currently `SidebarDrawer.tsx:121-178`)
  - Remove the constants `EDGE_SWIPE_START_PX`, `OPEN_SWIPE_DISTANCE_PX`, `CLOSE_SWIPE_DISTANCE_PX`, `HORIZONTAL_DOMINANCE_RATIO` (currently `SidebarDrawer.tsx:13-16`)
  - Remove the `onOpen?: () => void` prop from `SidebarDrawerProps`
- In `src/components/DakoppervlakteApp.tsx`:
  - Remove the `onOpen={() => setDrawerOpen(true)}` prop on the `<SidebarDrawer>` element (currently `DakoppervlakteApp.tsx:178`)
- In `src/__tests__/components/layout/SidebarDrawer.test.tsx`:
  - Remove the swipe-open tests (`'opens when the user swipes right from the left edge'` and the three adjacent `does not open...` cases)
  - Remove the swipe-close tests (`'closes when the user swipes left while open'`, `'does not close on a right swipe while open'`, `'does not close on a predominantly vertical swipe while open'`)
  - Keep all other tests: backdrop click, Escape key, focus management on open, body overflow lock, desktop rendering

### Exit criteria

- `npm test` passes
- `npm run check` passes
- Drawer opens via hamburger button only, closes via backdrop click / Escape key only — covered by the retained tests
- No remaining references to `onOpen`, `EDGE_SWIPE_START_PX`, `OPEN_SWIPE_DISTANCE_PX`, `CLOSE_SWIPE_DISTANCE_PX`, `HORIZONTAL_DOMINANCE_RATIO` anywhere in `src/`

---

## Phase 1 — Biome migration

Replace ESLint with Biome. This is mostly mechanical.

### Changes

- **Add** `@biomejs/biome` (latest 2.x) as devDep
- **Add** `biome.json` (full config below)
- **Remove** `eslint`, `eslint-config-next`, `eslint.config.mjs` from the project
- **Update** `package.json` scripts:
  - `lint` → `biome check --write .`
  - `check` → `tsc --noEmit && biome check --write .`
- **Run** `biome check --write .` once and commit the auto-formatting **as a separate commit** in the PR so the config-change commit stays readable in review
- **Update** `CLAUDE.md`, `GEMINI.md`, and `README.md` to reference Biome

### `biome.json`

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**", "!**/.next", "!**/coverage", "!**/node_modules", "!**/tsconfig.tsbuildinfo"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "semicolons": "asNeeded",
      "trailingCommas": "all",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false
    }
  },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": { "recommended": true },
      "correctness": {
        "useExhaustiveDependencies": "error",
        "useHookAtTopLevel": "error",
        "noChildrenProp": "error",
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noArrayIndexKey": "error",
        "noDuplicateJsxProps": "error",
        "noExplicitAny": "warn",
        "noConsole": { "level": "warn", "options": { "allow": ["error", "warn"] } }
      },
      "complexity": { "noUselessFragments": "error" },
      "style": {
        "useImportType": "error",
        "useConst": "error",
        "useTemplate": "error",
        "noDefaultExport": "error",
        "useNamingConvention": "off"
      },
      "nursery": {
        "noImgElement": "error",
        "noHeadElement": "error"
      }
    }
  },
  "overrides": [
    {
      "includes": [
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/route.ts",
        "src/app/**/not-found.tsx",
        "src/app/**/error.tsx",
        "src/app/**/loading.tsx",
        "src/proxy.ts",
        "src/i18n/request.ts",
        "next.config.ts",
        "postcss.config.mjs",
        "tailwind.config.*",
        "vitest.config.mts",
        "vitest.setup.ts"
      ],
      "linter": { "rules": { "style": { "noDefaultExport": "off" } } }
    },
    {
      "includes": ["src/__tests__/**", "vitest.setup.ts"],
      "linter": { "rules": { "suspicious": { "noExplicitAny": "off", "noConsole": "off" } } }
    },
    {
      "includes": ["src/app/api/**"],
      "linter": { "rules": { "suspicious": { "noConsole": "off" } } }
    }
  ]
}
```

### Caveat

Biome does not yet have 100 % parity with `eslint-config-next`. Before removing ESLint, run `npx next lint` one last time on `master` and confirm no rule we rely on is being dropped silently. If a Next-specific rule matters later, we layer `eslint-plugin-next` selectively in CI, not IDE.

### Exit criteria

- `npm run check` passes
- `npm test` passes
- `npm run build` passes
- CI green

---

## Phase 2 — Architecture rails

Enforce the `CLAUDE.md` layering as a machine check.

### Changes

- **Add** `dependency-cruiser` as devDep
- **Add** `.dependency-cruiser.cjs` with the rules below
- **Add** script `check:arch` → `depcruise src`
- **Update** `check` script to include `check:arch`
- **Add** CI step running `npm run check:arch`
- **Add** ROADMAP item: "Extend arch rules — enforce raw-style rule tree-wide, add stricter dumb/pure boundaries."

The raw-style grep gate is **not** introduced in this phase — the current code violates the rule, so a binary gate would either fail CI or be a no-op. The gate lands in Phase 5 once the violations are fixed.

### Dependency rules

| From | May import | May NOT import |
|---|---|---|
| `src/domain/**` | other `src/domain/**` only | `react`, `next`, `@clerk/**`, `google.maps`, `src/hooks/**`, `src/components/**`, `src/app/**`, `src/lib/db`, `src/lib/infrastructure/**` |
| `src/lib/infrastructure/**` (new, Phase 4) | `src/domain/**`, external SDKs | `src/hooks/**`, `src/components/**`, `src/app/**` |
| `src/hooks/**` | `src/domain/**`, `src/lib/**`, `react` | `src/components/**`, `src/app/**` |
| `src/components/ui/**` (pure) | `react` only | hooks, domain, other component layers |
| `src/components/{sidebar,map,layout}/**` (dumb) | `react`, `src/components/ui/**`, types from `src/domain/**` and `src/lib/types` | hooks, `src/app/**`, `fetch`/API calls |
| `src/components/DakoppervlakteApp.tsx` + `Header.tsx` (smart) | everything below | `src/app/**` |
| `src/app/**` | anything below | — (top of tree) |

Note: the `src/domain/**` and `src/lib/infrastructure/**` rules exist in the config from Phase 2 but activate in Phase 4 when those folders are populated. Until then they pass trivially.

### Exit criteria

- `npm run check:arch` passes on the current folder layout
- Any violations surfaced on current code are fixed in this PR

---

## Phase 3 — Characterization tests (safety net)

Two new test files get added, using the real route handlers + real hook + existing Google Maps stub. **No production code changes in this phase.** If a test is hard to write because the code shape resists it, note it in the PR description; the fix happens in Phase 5.

### `src/__tests__/components/DakoppervlakteApp.search.test.tsx`

Covers `handleSearch`'s four-branch behavior, plus restore-from-history. Observable outcomes only.

| Scenario | Assertions |
|---|---|
| Auto-gen ON + building found | polygon appears on map; autogen counter increments; search counter increments; drawer closes; search form collapses |
| Auto-gen ON + API returns non-Feature | error message "noBuildingFound" shows; clears after 5000 ms; drawing mode starts after 600 ms |
| Auto-gen ON + `/api/building-polygon` rejects (network error) | same as above (error + fallback to drawing) |
| Auto-gen OFF | no autogen fetch happens; drawing mode starts after 600 ms; autogen counter does NOT increment |
| Restore from history | address populates; polygons restore; form collapses; drawer closes |

Mocks: only `fetch` (for `/api/building-polygon`, `/api/counter`, `/api/autogen-counter`, `/api/searches`), the existing Google Maps stub, and the Clerk stub. No internal mocking. Timers controlled via `vi.useFakeTimers()` so the 600 ms and 5 s delays are deterministic.

### `src/__tests__/hooks/usePolygonDrawing.behavior.test.tsx`

Public API behavior only — no internal refs.

- `startDrawing` → map cursor becomes `crosshair`; click adds point; `pointCount` increments; `undoLastPoint` decrements
- `finishPolygon` with <3 points → no polygon added
- `finishPolygon` with ≥3 points → polygon in list; area rounded to one decimal; mode back to `idle`
- `addPolygonFromPath` with <3 points → rejected silently
- `restorePolygons` → replaces list; preserves heading/tilt/label per entry
- Orientation sync: polygon with `heading=0` hidden when `currentHeading=90`, visible again at 0
- `togglePolygonExcluded` → excluded flag flips; polygon stays on map
- `resetAll` → clears all entries; mode back to idle

### What we deliberately don't characterize

- Internal refs (`tempMarkersRef`, `polygonsRef`) — implementation detail
- Edge-label DOM structure — covered by existing tests
- Google Maps API call order — stub's concern
- **Exact polygon label strings** — Phase 4 localizes `'Vlak N'` / `'Auto'`. Label assertions must be loose (e.g., `expect(p.label).toEqual(expect.any(String))` and `expect(p.label).not.toBe('')`) so Phase 4 doesn't have to rewrite the tests.

### Coverage baseline

After Phase 3 merges, record the coverage baseline (lines covered for `handleSearch` and `usePolygonDrawing`) in a comment at the top of each test file. Rule for Phases 4–5: coverage on these functions can only go up, never down.

### Exit criteria

- Both new test files green
- Total suite still green
- Coverage baseline recorded

---

## Phase 4 — Domain layer extraction

Create `src/domain/` and move pure logic there. No behavioral changes.

### New layout

```
src/domain/
├── polygon/
│   ├── types.ts         ← moves from lib/types.ts: PolygonData (serializable)
│   ├── area.ts          ← computeArea helper + round-to-tenth (currently inline in usePolygonDrawing)
│   ├── color.ts         ← moves from lib/utils.ts: generatePolygonColor
│   ├── serialize.ts     ← moves from usePolygonDrawing.ts: toPolygonData / fromPolygonData
│   └── label.ts         ← polygon naming ("Vlak N", "Auto"); localized via injected translator
├── geo/
│   ├── ring.ts          ← moves from lib/geo.ts: pointInPolygon, centroid, haversineDistance
│   └── distance.ts      ← moves from lib/utils.ts: formatDistance
├── orientation/
│   └── heading.ts       ← moves from lib/utils.ts: normalizeHeading + matches(a, b) predicate
└── search/
    └── types.ts         ← moves from lib/types.ts: Search
```

### What stays outside `domain/`

- `PolygonEntry` (holds a live `google.maps.Polygon` reference) stays in `lib/types.ts` — infrastructure type, not a domain concept
- `createEdgeLabels` (DOM + `AdvancedMarkerElement`) moves to `lib/infrastructure/edgeLabels.ts` — adapter layer
- `lib/db.ts` stays as infrastructure

### Localization of polygon labels

Today `usePolygonDrawing.ts` hardcodes `'Vlak ${n}'` (NL) and `'Auto'`. Fix:

- `src/domain/polygon/label.ts` exports a pure function:
  ```ts
  type LabelKind = 'manual' | 'auto'
  export function polygonLabel(
    kind: LabelKind,
    index: number,
    t: (key: string, params?: Record<string, unknown>) => string,
  ): string
  ```
- The hook passes next-intl's `t` from `useTranslations()` into the call site. The domain module stays ignorant of next-intl.
- New i18n keys in `messages/{nl,en,fr}.json`:
  - `Polygon.manualLabel` — e.g. `"Plane {index}"` (EN), `"Vlak {index}"` (NL), `"Plan {index}"` (FR)
  - `Polygon.autoLabel` — e.g. `"Auto"` (EN/FR/NL — short enough to keep identical, or localize)

### Testing

Each new domain module gets a plain Vitest unit test file in `src/__tests__/domain/**`. No mocks, no jsdom, no Google Maps stub. Input objects in, output values out.

### Dependency-cruiser activation

The `src/domain/**` and `src/lib/infrastructure/**` rules (defined in Phase 2 but trivially satisfied until now) start catching violations in this phase.

### Exit criteria

- Phase 3 characterization tests still green
- New domain unit tests green
- `npm run check:arch` passes with domain rules now active
- No function moved includes a React or Google Maps import in its signature

---

## Phase 5 — Slim the orchestrator and hook

The payoff phase. Production code changes, but behavior is unchanged and Phase 3 tests enforce that.

### `DakoppervlakteApp.tsx`

- Extract inline-style JSX chunks to appropriate dumb components:
  - The drawer header block (h1 + subtitle) → new `components/sidebar/DrawerTitleBlock.tsx`
  - The mobile footer block (stats boast + auth buttons) → new `components/sidebar/DrawerFooter.tsx`
  - The sidebar padding wrapper → merged into `SidebarDrawer` or `layout/SidebarContent.tsx`
- Goal: **zero `style={{}}` objects** in the smart components. Satisfies the CLAUDE.md rule and the raw-style grep gate.

### `handleSearch`

Split into a pure orchestrator helper + a small infrastructure helper:

- New `src/lib/infrastructure/buildingLookup.ts` exports `fetchBuildingPolygon(lat, lng): Promise<BuildingLookupResult>` where `BuildingLookupResult` is `{ kind: 'found', path: LatLng[] } | { kind: 'not-found' } | { kind: 'error' }`. Swallows the fetch/JSON logic.
- `handleSearch` becomes:
  1. reset flags
  2. `geocodeAndNavigate` with a continuation that:
     - increments search counter
     - collapses form + closes drawer
     - if `!autoGenerate` → schedule `startDrawing` after 600 ms and return
     - else → call `fetchBuildingPolygon`, match on result:
       - `found` → `addPolygonFromPath`, increment autogen counter
       - `not-found` | `error` → show error (auto-clear 5 s), fallback to drawing after 600 ms

Result: `handleSearch` goes from ~40 lines of nested callbacks to a linear read, and the fetch logic is independently testable.

### `usePolygonDrawing.ts`

- Replace inline polygon math with calls to `src/domain/polygon/*`:
  - `Math.round(area * 10) / 10` → `roundArea(area)` from `domain/polygon/area.ts`
  - Inline `{ lat, lng }` serialization in `serializedPolygons` → `toPolygonData(entry)` from `domain/polygon/serialize.ts`
  - Hardcoded `'Vlak N'` / `'Auto'` → `polygonLabel('manual', n, t)` / `polygonLabel('auto', n, t)`
- The hook keeps all Google Maps listener wiring, ref management, and FSM state — those are genuinely hook-shaped concerns.
- Target size: under 250 lines (from 364).

### Raw-style grep gate

Introduce the CI grep gate scoped to smart components (deferred from Phase 2):

```
! grep -n "style={{" src/components/DakoppervlakteApp.tsx src/components/Header.tsx
```

Runs as a CI step. Fails the build on any raw-style reintroduction into smart components.

### Exit criteria

- Phase 3 characterization tests still green
- Coverage not lower than baseline recorded in Phase 3
- `npm run check`, `npm run check:arch`, `npm run build` all pass
- Raw-style grep gate passes with zero warnings
- `DakoppervlakteApp.tsx` has no `style={{}}` objects

---

## Rollback plan

Every phase is a standalone PR and can be reverted independently. Phase 5 depends on Phase 4's domain modules existing — reverting Phase 4 requires reverting Phase 5 first. All other phases are independent.

## Open items (future roadmap additions, not in this effort)

- Extend arch rules tree-wide (raw-style rule everywhere, stricter dumb/pure boundaries)
- Playwright e2e
- Storybook for pure UI
- Tailwind / CSS modules migration
