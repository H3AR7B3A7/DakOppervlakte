# Phase 1 — Biome migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ESLint + `eslint-config-next` with Biome 2.x, apply Next/Vercel-aligned rules with no-semicolons preference, and leave the repo formatted, linted, and green (`npm run check`, `npm test`, `npm run build`).

**Architecture:** Three logical commits. (1) Tooling swap: add Biome, remove ESLint, write config, update scripts/docs. (2) Auto-format: run `biome check --write .` once so the formatting delta is isolated in one reviewable commit. (3) Manual fixes: convert `src/lib/db.ts` to a named export (to satisfy `noDefaultExport`) and remove dead `eslint-disable` pragmas. Each commit leaves the suite green.

**Tech Stack:** Biome 2.x (replaces ESLint 9 + `eslint-config-next` 16.2.3). TypeScript 5, React 19, Next.js 16. No new runtime deps.

**Spec:** [`docs/superpowers/specs/2026-04-18-code-quality-pass-design.md`](../specs/2026-04-18-code-quality-pass-design.md) — Phase 1.

---

## File Structure

| File | Change | Why |
|---|---|---|
| `biome.json` | Create | New lint + format config (full content in Task 2 Step 1) |
| `eslint.config.mjs` | Delete | ESLint being removed |
| `package.json` | Modify | Swap devDeps (`eslint`, `eslint-config-next` → `@biomejs/biome`); scripts `lint` + `check` use Biome |
| `GEMINI.md` | Modify line 10 | Replace "eslint --fix" mention with Biome |
| `CLAUDE.md` | Modify "Tooling" section | Add Biome entry (no current ESLint reference, but spec requires a Biome mention) |
| `README.md` | Modify "Tech Stack" section | Add Biome entry (no current ESLint reference, but spec requires a Biome mention) |
| `ROADMAP.md` | Modify line 17 | Tick the Biome item (`- [ ]` → `- [x]`) |
| `src/lib/db.ts` | Modify | Convert `export default getDb` → `export function getDb()` (satisfies `noDefaultExport`) |
| `src/app/api/counter/route.ts` | Modify line 2 | `import getDb` → `import { getDb }` |
| `src/app/api/autogen-counter/route.ts` | Modify line 2 | `import getDb` → `import { getDb }` |
| `src/app/api/searches/route.ts` | Modify line 3 | `import getDb` → `import { getDb }` |
| `src/__tests__/api/searches.test.ts` | Modify | `import { getDb }`; update `vi.mock` factory to `{ getDb: vi.fn() }`; remove 4 dead `eslint-disable-next-line` comments (lines 21, 29, 41, 67) |
| `src/__tests__/api/counter.test.ts` | Modify | Update `vi.mock` factory to `{ getDb: vi.fn(...) }` |
| `src/hooks/useGoogleMaps.ts` | Modify line 19 | Remove trailing `// eslint-disable-line react-hooks/set-state-in-effect` (Biome has no equivalent rule — comment is dead) |
| *many files* | Modified by Biome | `biome check --write .` auto-fixes: import organization, `useImportType`, `noUnusedImports`, whitespace. Happens in Task 3 as one isolated commit. |

No new domain / hook / component logic. No test behavior changes.

---

### Task 1: Capture baseline (verification only, no commit)

**Files:**
- Read-only: current state of repo

Purpose: confirm the repo is clean **before** the migration so that any failure in Tasks 2–4 is traceable to this PR, not a pre-existing issue.

- [ ] **Step 1: Confirm a clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean` on branch `master`.

If not clean: stop and ask the user. Don't `git stash` or discard work.

- [ ] **Step 2: Run the current ESLint setup and note the output**

```bash
npx eslint .
```

Expected: exits 0 with no output (or only informational lines). Record the exit code and any warnings emitted — these are the rules currently in force. The new Biome config must not silently drop anything meaningful; anything Biome flags after Task 3 that ESLint also caught is expected, anything Biome misses that ESLint caught should be flagged in the PR description.

> **Note:** The spec mentions `npx next lint`. In Next.js 16 `next lint` has been removed in favor of invoking ESLint directly. Use `npx eslint .` instead — it resolves the same `eslint.config.mjs` and gives an equivalent check.

- [ ] **Step 3: Run TypeScript and tests to confirm the green baseline**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

```bash
npm test
```

Expected: all tests pass. Record the total count (should be 228 from the Phase 0 baseline).

- [ ] **Step 4: Run the production build to confirm the build baseline**

```bash
npm run build
```

Expected: exits 0. The `.next/` folder is created. (It is git-ignored, no cleanup needed.)

- [ ] **Step 5: No commit for Task 1**

This task only verifies starting state. Do not create a commit.

---

### Task 2: Install Biome, remove ESLint, create `biome.json`, update scripts and docs

**Files:**
- Create: `biome.json`
- Delete: `eslint.config.mjs`
- Modify: `package.json`
- Modify: `GEMINI.md` (line 10)
- Modify: `ROADMAP.md` (line 17)

- [ ] **Step 1: Create `biome.json` at the repo root**

Write the file exactly as specified. The `overrides` allow Next.js framework files to use `export default` and allow tests to use `any`/`console`.

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

- [ ] **Step 2: Install `@biomejs/biome` and uninstall ESLint**

```bash
npm install --save-dev @biomejs/biome@latest
```

Expected: installs the latest 2.x release. `package.json` gains `"@biomejs/biome": "^2.x.x"` in `devDependencies`. `package-lock.json` updates.

```bash
npm uninstall eslint eslint-config-next
```

Expected: removes both packages from `devDependencies` and from `package-lock.json`.

After both commands, the `devDependencies` block of `package.json` should contain `@biomejs/biome` and no longer contain `eslint` or `eslint-config-next`.

- [ ] **Step 3: Verify the installed Biome version is 2.x**

```bash
npx biome --version
```

Expected: prints a version starting with `2.` (e.g., `Version: 2.0.0` or higher). If it prints `1.x`, stop and install `@biomejs/biome@^2.0.0` explicitly instead.

- [ ] **Step 4: Stage the deletion of `eslint.config.mjs`**

```bash
git rm eslint.config.mjs
```

Expected: the file is removed from disk and its deletion is staged. No other file imports from it.

- [ ] **Step 5: Update the `lint` and `check` scripts in `package.json`**

Change the `"scripts"` section from:

```json
  "scripts": {
    "dev": "next dev",
    "build": "npx tsc --noEmit && next build",
    "start": "next start",
    "lint": "eslint --fix",
    "check": "npx tsc --noEmit && eslint --fix",
    "db:init": "tsx src/lib/init-db.ts",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "npx vitest --coverage"
  },
```

to:

```json
  "scripts": {
    "dev": "next dev",
    "build": "npx tsc --noEmit && next build",
    "start": "next start",
    "lint": "biome check --write .",
    "check": "npx tsc --noEmit && biome check --write .",
    "db:init": "tsx src/lib/init-db.ts",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "npx vitest --coverage"
  },
```

Only `lint` and `check` change. `build`, `test`, and others stay identical.

- [ ] **Step 6: Update `GEMINI.md` line 10**

Change:

```
npm run check        # Type-check (tsc --noEmit) + lint (eslint --fix) -- run before considering work complete
```

to:

```
npm run check        # Type-check (tsc --noEmit) + lint (biome check --write .) -- run before considering work complete
```

- [ ] **Step 7: Add a Biome entry to the `CLAUDE.md` "Tooling" section**

In `CLAUDE.md`, find the "Tooling" section (currently around line 56). Change:

```markdown
## Tooling

- **Test runner**: Vitest (`npm test` / `npm run test:ui`)
- **Component testing**: `@testing-library/react` + `@testing-library/user-event`
- **Setup file**: `vitest.setup.ts` — imports `@testing-library/jest-dom` and installs the Google Maps stub
- **Google Maps stub**: `src/__tests__/__mocks__/googleMaps.ts` — imported once in setup, never per-test
```

to:

```markdown
## Tooling

- **Test runner**: Vitest (`npm test` / `npm run test:ui`)
- **Component testing**: `@testing-library/react` + `@testing-library/user-event`
- **Setup file**: `vitest.setup.ts` — imports `@testing-library/jest-dom` and installs the Google Maps stub
- **Google Maps stub**: `src/__tests__/__mocks__/googleMaps.ts` — imported once in setup, never per-test
- **Linter / formatter**: Biome (`npm run lint` → `biome check --write .`); config in `biome.json`; no semicolons, single quotes, 100-char lines
```

- [ ] **Step 8: Add a Biome entry to the `README.md` "Tech Stack" section**

In `README.md`, find the "Tech Stack" section (currently around lines 55–64). Change:

```markdown
## Tech Stack

- **Framework** -- Next.js 16 (App Router) with React 19
- **Language** -- TypeScript 5
- **Auth** -- Clerk
- **Database** -- Neon Postgres (raw SQL via `@neondatabase/serverless`)
- **Maps** -- Google Maps JavaScript API
- **i18n** -- next-intl (NL, EN, FR)
- **Styling** -- Inline React `style={{}}` objects (Tailwind CSS 4 installed for CSS variables/resets in `globals.css`)
- **Testing** -- Vitest, Testing Library, jsdom, v8 coverage
```

to:

```markdown
## Tech Stack

- **Framework** -- Next.js 16 (App Router) with React 19
- **Language** -- TypeScript 5
- **Auth** -- Clerk
- **Database** -- Neon Postgres (raw SQL via `@neondatabase/serverless`)
- **Maps** -- Google Maps JavaScript API
- **i18n** -- next-intl (NL, EN, FR)
- **Styling** -- Inline React `style={{}}` objects (Tailwind CSS 4 installed for CSS variables/resets in `globals.css`)
- **Testing** -- Vitest, Testing Library, jsdom, v8 coverage
- **Linter / formatter** -- Biome 2 (no semicolons, single quotes, 100-char lines)
```

- [ ] **Step 9: Update `ROADMAP.md` line 17 (tick the item)**

Change:

```
- [ ] Use Biome instead of eslint/prettier, set good rules, vercel / nextjs / no semicolons
```

to:

```
- [x] Use Biome instead of eslint/prettier, set good rules, vercel / nextjs / no semicolons
```

- [ ] **Step 10: Verify TypeScript still passes**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output. (No source files have changed yet; this is a sanity check that the script edits didn't break the type-check.)

Do **not** run `npm run check` yet — that would now execute `biome check --write .` and auto-format files, which belongs in Task 3's commit.

- [ ] **Step 11: Verify tests still pass**

```bash
npm test
```

Expected: 228 tests pass. No source has changed.

- [ ] **Step 12: Commit**

```bash
git add biome.json package.json package-lock.json GEMINI.md CLAUDE.md README.md ROADMAP.md
git commit -m "build(deps): replace eslint with biome"
```

Expected: one commit with 8 files changed (6 modified, 1 added, 1 deleted — the deletion of `eslint.config.mjs` was already staged in Step 4).

---

### Task 3: Apply Biome auto-format and safe fixes as a single commit

**Files:**
- Many files auto-modified by `biome check --write .` (formatting, import organization, `useImportType`, `noUnusedImports`). No manual edits in this task.

- [ ] **Step 1: Run Biome with auto-fix**

```bash
npx biome check --write .
```

Expected: Biome reports the files it changed, then exits. Some errors may remain (specifically: `noDefaultExport` on `src/lib/db.ts`, dead `eslint-disable` comments that aren't auto-fixable). Exit code may be non-zero — that is expected and will be addressed in Task 4.

What Biome **will** auto-fix in this step:
- Import ordering / organization
- Type-only imports (`import type { ... }` where appropriate) via `useImportType`
- Removal of unused imports via `noUnusedImports`
- Any whitespace / quote-style / trailing-comma drift

What Biome **will NOT** auto-fix (addressed in Task 4):
- `noDefaultExport` on `src/lib/db.ts` — requires renaming the export and updating call sites
- Dead `// eslint-disable-line` / `// eslint-disable-next-line` pragmas — they're plain comments to Biome, so Biome leaves them; we remove them manually in Task 4

- [ ] **Step 2: Verify TypeScript still passes after auto-format**

```bash
npx tsc --noEmit
```

Expected: exits 0. Biome's safe fixes (import reorganization, `useImportType`) should not break type-checking.

If it fails: inspect the diff. `useImportType` occasionally converts an import that is used as a value (e.g., a class used both as a type and for `instanceof`) — if so, revert that specific change by hand.

- [ ] **Step 3: Verify tests still pass**

```bash
npm test
```

Expected: 228 tests pass. If the count differs or any test fails: inspect the diff against the failing file.

- [ ] **Step 4: Inspect the diff and confirm it's formatting-only**

```bash
git diff --stat
```

Expected: many files with small changes. Spot-check 2–3 files with `git diff <file>` and confirm the changes are cosmetic (whitespace, import order, `import type`). No logic changes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style: apply biome auto-format and safe fixes"
```

Expected: one commit isolating the formatting/import-organization changes, separate from the config commit in Task 2 and the manual fixes in Task 4. This keeps the history readable in review.

---

### Task 4: Fix remaining Biome errors (named export for `db.ts` + dead comment cleanup)

**Files:**
- Modify: `src/lib/db.ts` (convert default export to named export)
- Modify: `src/app/api/counter/route.ts:2` (default import → named import)
- Modify: `src/app/api/autogen-counter/route.ts:2` (default import → named import)
- Modify: `src/app/api/searches/route.ts:3` (default import → named import)
- Modify: `src/__tests__/api/searches.test.ts` (named import + `vi.mock` factory + remove 4 dead `eslint-disable-next-line` pragmas)
- Modify: `src/__tests__/api/counter.test.ts` (`vi.mock` factory uses named export shape)
- Modify: `src/hooks/useGoogleMaps.ts:19` (remove trailing `// eslint-disable-line` comment)

- [ ] **Step 1: Confirm the outstanding Biome errors before fixing**

```bash
npx biome check .
```

Expected: Biome reports exactly the following (path names may vary slightly in Biome's output format; match by semantics):
- `src/lib/db.ts` — `lint/style/noDefaultExport` (1 diagnostic)

If Biome also reports other diagnostics: address them in the same task and note them in the commit message. The most likely extras:
- Usage of `any` outside `src/__tests__/**` — there shouldn't be any in the current codebase; if found, convert to a more specific type.
- `noConsole` outside the allowed overrides — currently only `src/lib/init-db.ts` has a `console.log` (line 58), but `init-db.ts` is not under the `api/**` or test overrides. If Biome flags it, add `src/lib/init-db.ts` to the override list as a one-off CLI script exception, or replace `console.log` with `console.warn`/`error` which are allowed by the rule.

- [ ] **Step 2: Convert `src/lib/db.ts` to a named export**

Replace the entire file with:

```ts
import { neon } from '@neondatabase/serverless'

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url || url === 'postgresql://placeholder') {
    throw new Error('DATABASE_URL not configured')
  }
  return neon(url)
}
```

(Difference: removed the trailing `export default getDb`; added `export` before `function getDb()`.)

- [ ] **Step 3: Update `src/app/api/counter/route.ts` line 2**

Change:

```ts
import getDb from '@/lib/db'
```

to:

```ts
import { getDb } from '@/lib/db'
```

- [ ] **Step 4: Update `src/app/api/autogen-counter/route.ts` line 2**

Change:

```ts
import getDb from '@/lib/db'
```

to:

```ts
import { getDb } from '@/lib/db'
```

- [ ] **Step 5: Update `src/app/api/searches/route.ts` line 3**

Change:

```ts
import getDb from '@/lib/db'
```

to:

```ts
import { getDb } from '@/lib/db'
```

- [ ] **Step 6: Update `src/__tests__/api/searches.test.ts` — imports, mock factory, and remove 4 dead pragmas**

Replace lines 1–13 (currently):

```ts
import { GET, POST, DELETE } from '@/app/api/searches/route'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import getDb from '@/lib/db'

// Mock Clerk and DB
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  default: vi.fn(),
}))
```

with:

```ts
import { GET, POST, DELETE } from '@/app/api/searches/route'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

// Mock Clerk and DB
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))
```

(Two changes: `import getDb` → `import { getDb }`; mock factory key `default` → `getDb`.)

Then remove the four dead pragmas. Delete exactly these lines (the `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment line only, keeping the line immediately below):

- Current line 21 (before the `vi.mocked(auth).mockResolvedValue({ userId: null } as any)` call in `GET returns 401`)
- Current line 29 (before the same call in `POST returns 401`)
- Current line 41 (before the same call in `POST performs UPSERT`)
- Current line 67 (before the same call in `DELETE requires an ID`)

After the deletions, the test body for each of the four tests looks like:

```ts
  it('GET returns 401 if not signed in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const res = await GET()
    expect(res.status).toBe(401)
  })
```

(The comment line is gone; the `vi.mocked(...)` line stays unchanged. The `as any` cast stays — tests have `noExplicitAny: off` via the `biome.json` override, so the pragma is no longer needed.)

Repeat for the other three tests.

- [ ] **Step 7: Update `src/__tests__/api/counter.test.ts` mock factory**

Replace lines 1–7 (currently):

```ts
// Mock the db client
vi.mock('@/lib/db', () => ({
  default: vi.fn(() => ({
    // This allows us to use tagged template literal as a function
    // For simpler mocking, we might need a custom mock implementation
  })),
}))
```

with:

```ts
// Mock the db client
vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    // This allows us to use tagged template literal as a function
    // For simpler mocking, we might need a custom mock implementation
  })),
}))
```

(Only the key changes from `default` to `getDb`. The test file has no real assertions — it's a placeholder — so no further updates are needed.)

- [ ] **Step 8: Remove the dead pragma in `src/hooks/useGoogleMaps.ts` line 19**

Change:

```ts
      setMapLoaded(true) // eslint-disable-line react-hooks/set-state-in-effect
```

to:

```ts
      setMapLoaded(true)
```

(Only the trailing `// eslint-disable-line ...` comment is removed. The call itself is unchanged. Biome has no equivalent to ESLint's `react-hooks/set-state-in-effect` rule, so the pragma is dead.)

- [ ] **Step 9: Run Biome to confirm the repo is clean**

```bash
npx biome check .
```

Expected: exits 0 with no diagnostics. If any remain: address them before continuing.

- [ ] **Step 10: Run TypeScript**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output. (The named-export swap is type-compatible — the default import `getDb` and the named import `{ getDb }` have identical call signatures.)

- [ ] **Step 11: Run the full test suite**

```bash
npm test
```

Expected: all 228 tests pass. The `vi.mock` factories now match the production module's named-export shape, so `vi.mocked(getDb)` continues to resolve.

- [ ] **Step 12: Run the full check script**

```bash
npm run check
```

Expected: exits 0 with no output. Runs `tsc --noEmit && biome check --write .`. Because Biome has already been applied in Task 3 and the outstanding errors have been fixed in this task, this should be a no-op.

- [ ] **Step 13: Run the production build**

```bash
npm run build
```

Expected: exits 0. The `.next/` folder is created. Warnings about telemetry or third-party deprecations are acceptable as long as the exit code is 0.

- [ ] **Step 14: Commit**

```bash
git add src/lib/db.ts src/app/api/counter/route.ts src/app/api/autogen-counter/route.ts src/app/api/searches/route.ts src/__tests__/api/searches.test.ts src/__tests__/api/counter.test.ts src/hooks/useGoogleMaps.ts
git commit -m "refactor: convert db.ts to named export and remove dead eslint pragmas"
```

Expected: one commit with 7 files changed.

---

## Exit criteria (Phase 1 complete)

- `npm run check` exits 0 (runs `tsc --noEmit && biome check --write .`)
- `npm test` exits 0 with 228 tests passing
- `npm run build` exits 0
- `npx biome check .` (read-only) exits 0 with no diagnostics
- `eslint.config.mjs` does not exist; `biome.json` does
- `devDependencies` in `package.json` contains `@biomejs/biome` and does not contain `eslint` or `eslint-config-next`
- `GEMINI.md` line 10 mentions Biome, not ESLint
- `ROADMAP.md` line 17 is ticked (`- [x]`)
- Three commits on the branch, in order:
  1. `build(deps): replace eslint with biome`
  2. `style: apply biome auto-format and safe fixes`
  3. `refactor: convert db.ts to named export and remove dead eslint pragmas`
