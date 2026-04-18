# Phase 2 — Architecture rails — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encode the `CLAUDE.md` layering (pure UI → dumb → smart; hooks → lib → app) as a machine-enforced check, and wire it into local tooling + CI so regressions fail the build rather than slipping into review.

**Architecture:** Install `dependency-cruiser`, add `.dependency-cruiser.cjs` with six forbidden-rules, expose a `check:arch` npm script, fold it into the existing `check` command, and add a minimal GitHub Actions workflow that runs `check`, `check:arch`, `test`, and `build` on PRs and pushes to `master`. The existing codebase is expected to pass the rules on first run (verified by the Task 0 survey) — if any violation is surfaced in Task 3, fix the violation inline rather than softening the rule. Domain (`src/domain/**`) and infrastructure (`src/lib/infrastructure/**`) rules are included but trivially satisfied until Phase 4 populates those folders.

**Tech Stack:** `dependency-cruiser` ^17 (devDep). GitHub Actions (new). No new runtime deps. No test framework changes.

**Spec:** [`docs/superpowers/specs/2026-04-18-code-quality-pass-design.md`](../specs/2026-04-18-code-quality-pass-design.md) — Phase 2.

---

## File Structure

| File | Change | Why |
|---|---|---|
| `package.json` | Modify | Add `dependency-cruiser` to devDeps; add `check:arch` script; extend `check` script to call `check:arch` |
| `.dependency-cruiser.cjs` | Create | Project dependency rules matching the CLAUDE.md layering (full content in Task 2 Step 1) |
| `.github/workflows/ci.yml` | Create | Runs lint, arch check, tests, and build on pull requests and pushes to `master` (satisfies Phase 2 "Add CI step" + ROADMAP "Add github action that runs build and test") |
| `CLAUDE.md` | Modify Tooling section | Document the new `check:arch` script and config location |
| `README.md` | Modify Tech Stack section | Add `dependency-cruiser` bullet |
| `ROADMAP.md` | Modify | Tick line 14 (GitHub action) and line 18 (architecture rules) |

No source files under `src/` are expected to change — the Task 0 survey confirmed the current code already satisfies the layering rules. If Task 3 surfaces a violation the survey missed, the fix lands in that task.

### Dumb-layer `fetch` gap (documented limitation)

The spec also says dumb components (`src/components/{sidebar,map,layout}/**`) must not "call `fetch`/API". `dependency-cruiser` analyses module imports only — it cannot detect a raw `fetch(...)` call, because `fetch` is a global. This gap is not fixed in Phase 2. Mitigations:

- The `dumb-no-hooks-or-app` rule (Task 2) catches the common case of a dumb component pulling in a hook to do data fetching.
- The PR description for this phase should state the gap explicitly so reviewers know to watch for `fetch` calls during code review.
- A scoped `rg '\bfetch\s*\(' src/components/{sidebar,map,layout}` grep gate could be added if the pattern ever appears in practice. Not added to ROADMAP now (YAGNI — current code has no offenders).

---

### Task 0: Baseline verification (no commit)

**Files:**
- Read-only: current state of repo

Purpose: confirm the tree is clean and the suite is green before touching anything, so any failure in Tasks 1–5 is traceable to this PR.

- [ ] **Step 1: Confirm a clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean` on branch `master`.

If not clean: stop and ask the user. Do not `git stash` or discard work.

- [ ] **Step 2: Run the existing check + tests + build to confirm the green baseline**

```bash
npm run check
```

Expected: `npx tsc --noEmit` exits 0, then `biome check --write .` reports `Checked N files ... No fixes applied.` (or applies zero fixes).

```bash
npm test
```

Expected: all tests pass (last known count: 228 from Phase 1.5).

```bash
npm run build
```

Expected: exits 0, Next.js build completes.

Record the test count. Any deviation = stop and investigate before proceeding.

- [ ] **Step 3: Confirm the expected-clean layering by eye**

Run:

```bash
rg --line-number "^import" src/components/ui
```

Expected: only `import type React from 'react'` (or equivalent) per file. No `@/hooks`, no `@/app`, no other component layers.

Run:

```bash
rg --line-number "from '@/(hooks|app)/" src/components/sidebar src/components/map src/components/layout
```

Expected: no matches.

Run:

```bash
rg --line-number "from '@/(components|app)/" src/hooks
```

Expected: no matches.

Run:

```bash
rg --line-number "from '@/app/" src/components src/hooks src/lib
```

Expected: no matches.

If any expectation fails: the plan's claim that no source changes are needed is wrong. Stop, re-read the `CLAUDE.md` layering section, and update the plan to include a fix task for the violation before continuing.

---

### Task 1: Install `dependency-cruiser`

**Files:**
- Modify: `package.json` (devDependencies)
- Modify: `package-lock.json` (auto)

- [ ] **Step 1: Add the dependency**

```bash
npm install --save-dev dependency-cruiser@^17
```

Expected: installs without peer-dep warnings. If npm prints an EBADENGINE warning about Node versions, record it in the commit message and keep going — dep-cruiser supports Node 20+ and the project's `engines` (if any) should already cover that.

- [ ] **Step 2: Verify the CLI is wired up**

```bash
npx depcruise --version
```

Expected: prints a version like `17.x.y`. If the command is not found, the install failed — re-run Step 1 with `npm install` (no scripts) and investigate.

- [ ] **Step 3: Confirm no other files changed**

```bash
git status
```

Expected: only `package.json` and `package-lock.json` are modified. No source files touched.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add dependency-cruiser for architecture checks"
```

---

### Task 2: Create `.dependency-cruiser.cjs`

**Files:**
- Create: `.dependency-cruiser.cjs`

The config lives at the repo root (not under `docs/` or `src/`) because dep-cruiser auto-discovers it there. CJS because the rest of the config toolchain at this repo root (`postcss.config.mjs`, `tailwind.config.*`, `next.config.ts`) is mixed — dep-cruiser's own scaffolding uses `.cjs` and it works regardless of the `type` field in `package.json`.

- [ ] **Step 1: Create the config file**

```js
// .dependency-cruiser.cjs
// See https://github.com/sverweij/dependency-cruiser for the full rule schema.
// Phase 2 of the code-quality-pass — encodes the layering rules from CLAUDE.md.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'A dependency cycle makes the code harder to reason about and test. If one appears, split the shared piece into its own module.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'ui-is-pure',
      severity: 'error',
      comment:
        'src/components/ui/** is the pure-UI layer (CLAUDE.md). It may only import React. No hooks, no domain, no other component layers, no lib.',
      from: { path: '^src/components/ui/' },
      to: {
        path: '.+',
        pathNot: [
          '^src/components/ui/',
          '^node_modules/(react|react-dom)($|/)',
          '^node_modules/@types/react($|/)',
        ],
      },
    },
    {
      name: 'dumb-no-hooks-or-app',
      severity: 'error',
      comment:
        'Dumb components (sidebar / map / layout) receive their data via props. They must not import hooks or app routes.',
      from: { path: '^src/components/(sidebar|map|layout)/' },
      to: { path: ['^src/hooks/', '^src/app/'] },
    },
    {
      name: 'hooks-no-components-or-app',
      severity: 'error',
      comment:
        'Hooks expose state and effects downward to components; they must not reach sideways into component code or upward into app routes.',
      from: { path: '^src/hooks/' },
      to: { path: ['^src/components/', '^src/app/'] },
    },
    {
      name: 'below-app-no-app',
      severity: 'error',
      comment:
        'src/app/** is the top of the tree. Nothing in components, hooks, or lib may reach into it — the dependency direction is always downward.',
      from: { path: '^src/(components|hooks|lib)/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment:
        'src/domain/** (created in Phase 4) must be framework-agnostic: no React, Next, Clerk, google.maps, hooks, components, app, or infrastructure. Pure inputs/outputs only.',
      from: { path: '^src/domain/' },
      to: {
        path: [
          '^src/hooks/',
          '^src/components/',
          '^src/app/',
          '^src/lib/db',
          '^src/lib/infrastructure/',
          '^node_modules/(react|react-dom|next|@clerk)($|/)',
        ],
      },
    },
    {
      name: 'infrastructure-boundaries',
      severity: 'error',
      comment:
        'src/lib/infrastructure/** (created in Phase 4) wraps external SDKs for the hook / component layers. It must not reach upward into hooks, components, or app.',
      from: { path: '^src/lib/infrastructure/' },
      to: { path: ['^src/hooks/', '^src/components/', '^src/app/'] },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: './tsconfig.json' },
    doNotFollow: { path: '^node_modules' },
    includeOnly: '^src/',
    exclude: {
      path: ['^src/__tests__/'],
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['main', 'types'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
}
```

- [ ] **Step 2: Sanity-check the config by running dep-cruiser directly**

```bash
npx depcruise src
```

Expected: either exits 0 with "no dependency violations found" or prints a list of violations. **Either outcome is fine at this step** — Task 3 will wire up the script and handle violations if any appear. The point of running it now is to confirm the config itself parses and the TS resolver works.

If dep-cruiser errors out with "cannot find tsconfig" or similar: the `tsConfig.fileName` path is relative to the config file's location (the repo root) — verify `./tsconfig.json` exists at the root and is valid.

- [ ] **Step 3: Commit the config**

```bash
git add .dependency-cruiser.cjs
git commit -m "chore(arch): add dependency-cruiser config with layering rules"
```

---

### Task 3: Add `check:arch` script, wire into `check`, fix any violations

**Files:**
- Modify: `package.json` (scripts block)
- (Possibly) Modify: source files that violate the rules — only if Step 3 surfaces any.

- [ ] **Step 1: Add `check:arch` and extend `check`**

Open `package.json` and modify the `scripts` block. Keep existing scripts in place.

Replace the current `check` line:

```json
    "check": "npx tsc --noEmit && biome check --write .",
```

with:

```json
    "check": "npx tsc --noEmit && biome check --write . && npm run check:arch",
    "check:arch": "depcruise src",
```

(Insert `check:arch` immediately after `check`, before `db:init`. The exact position isn't enforced but keeps related scripts together.)

- [ ] **Step 2: Confirm the script runs**

```bash
npm run check:arch
```

Expected one of:

1. `✔ no dependency violations found (N modules, M dependencies cruised)` — the current code is clean. Continue to Step 4.
2. One or more `error` lines, e.g. `error no-circular: src/x.ts → src/y.ts → src/x.ts`. Continue to Step 3 to fix them.

- [ ] **Step 3: If violations appeared, fix the source, not the rule**

For each violation, the fix is almost always **at the offender**, not in the rule:

- **`no-circular`** — split the shared piece into its own module so both sides import from it (e.g. if `a.ts` ↔ `b.ts` both need `Foo`, move `Foo` to a new `c.ts` and import from there).
- **`ui-is-pure`** — move the non-React import out of the UI component. Either pass the value in as a prop, or relocate the component to `src/components/{sidebar,map,layout}/` if it actually has dumb-component responsibilities.
- **`dumb-no-hooks-or-app`** — lift the hook call up to the smart component (`DakoppervlakteApp.tsx` or `Header.tsx`) and pass the hook's result as a prop.
- **`hooks-no-components-or-app`** — extract the shared type/helper to `src/lib/` and have both hook and component import from there.
- **`below-app-no-app`** — relocate whatever was imported from `src/app/` into `src/lib/` (types) or re-export it through a lib module.

After each fix, re-run `npm run check:arch` until it passes. Then run `npm test` to confirm nothing behavioral broke. Do not loosen the rule to silence the check.

- [ ] **Step 4: Run the full `check` to confirm the expanded command works end-to-end**

```bash
npm run check
```

Expected: tsc clean, Biome clean, dep-cruise clean. All three chained gates pass.

- [ ] **Step 5: Run tests to confirm nothing regressed**

```bash
npm test
```

Expected: same green count as Task 0 Step 2. If a violation fix in Step 3 happened to move code, tests must still pass.

- [ ] **Step 6: Commit**

If only `package.json` changed (no violations were found in Step 2):

```bash
git add package.json
git commit -m "chore(arch): add check:arch script and include in check"
```

If source files were also modified in Step 3, include them in the same commit and use a more descriptive message, e.g.:

```bash
git add package.json src/path/to/changed.ts src/path/to/other.ts
git commit -m "chore(arch): add check:arch and fix <layer> violation in <file>"
```

(The fix and the check-script addition belong in one commit because the commit must leave the tree green — shipping the script without the fix would break `check`.)

---

### Task 4: Add GitHub Actions workflow

**Files:**
- Create: `.github/workflows/ci.yml`

The Phase 2 spec requires "Add CI step running `npm run check:arch`". No CI workflow currently exists in this repo. This task adds a minimal one that runs all four gates (lint, arch, test, build) — which also satisfies ROADMAP line 14 ("Add github action that runs `build` and `test`"). A single workflow is cheaper and less noisy than one per gate.

- [ ] **Step 1: Create the workflow directory and file**

```bash
mkdir -p .github/workflows
```

Then create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Lint, typecheck, arch, test, build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Check (tsc + biome + depcruise)
        run: npm run check

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

Notes for the implementer:

- `npm run check` already chains `tsc`, `biome check --write .`, and `check:arch` (after Task 3). CI reruns it so a reviewer doesn't have to trust the local run.
- `biome check --write .` will modify files if anything is out of format. On CI we actually want the non-writing variant to fail fast on drift. However, since Task 3 standardizes `check` to call `--write`, and since the workflow runs it on a fresh checkout (nothing to drift against), this is acceptable for Phase 2. A tightening to `biome check` (no `--write`) can be a follow-up ROADMAP item.
- `concurrency.cancel-in-progress: true` prevents stacking up redundant runs when a PR is pushed to rapidly. Matches typical Vercel/Next.js project conventions.

- [ ] **Step 2: Validate the YAML locally (no push)**

```bash
node -e "console.log(require('fs').readFileSync('.github/workflows/ci.yml', 'utf8').length + ' bytes written')"
```

Expected: prints a byte count (confirms the file was written and is readable). YAML syntax is hard to validate without a YAML parser, but GitHub Actions will reject malformed YAML on the first CI run — which is the real acceptance test.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow running check, test, and build"
```

Do **not** push. Pushing is out of scope for this plan (standing instruction: no pushes during code-quality-pass work).

---

### Task 5: Update documentation

**Files:**
- Modify: `CLAUDE.md` (Tooling section — append a line)
- Modify: `README.md` (Tech Stack section — append a bullet)
- Modify: `ROADMAP.md` (tick two lines)

- [ ] **Step 1: Add the `check:arch` line to `CLAUDE.md`**

Open `CLAUDE.md`. Find the Tooling section (lines 56–62). After the "Linter / formatter" line, add a new bullet. The final section should read:

```markdown
## Tooling

- **Test runner**: Vitest (`npm test` / `npm run test:ui`)
- **Component testing**: `@testing-library/react` + `@testing-library/user-event`
- **Setup file**: `vitest.setup.ts` — imports `@testing-library/jest-dom` and installs the Google Maps stub
- **Google Maps stub**: `src/__tests__/__mocks__/googleMaps.ts` — imported once in setup, never per-test
- **Linter / formatter**: Biome (`npm run check` runs `biome check --write .`, which both formats and lints); config in `biome.json`; no semicolons, single quotes, 100-char lines
- **Architecture check**: `dependency-cruiser` (`npm run check:arch`); config in `.dependency-cruiser.cjs`; enforces the layering table at the top of this file. `npm run check` chains it after Biome.
```

- [ ] **Step 2: Add the dependency-cruiser bullet to `README.md`**

Open `README.md`. Find the Tech Stack section (starts at line 55). After the "Linter / formatter" bullet, add a new bullet:

```markdown
- **Linter / formatter** -- Biome 2 (no semicolons, single quotes, 100-char lines)
- **Architecture check** -- dependency-cruiser (enforces CLAUDE.md layering; `npm run check:arch`)
```

- [ ] **Step 3: Tick two existing ROADMAP items and add one new ROADMAP item**

Open `ROADMAP.md`. Change line 14 from:

```markdown
- [ ] Add github action that runs `build` and `test` in package.json
```

to:

```markdown
- [x] Add github action that runs `build` and `test` in package.json
```

Change line 18 from:

```markdown
- [ ] Use linting to implement architecture rules (direction of dependencies)
```

to:

```markdown
- [x] Use linting to implement architecture rules (direction of dependencies)
```

Then add a new unchecked line immediately below the ticked architecture-rules line:

```markdown
- [x] Use linting to implement architecture rules (direction of dependencies)
- [ ] Extend arch rules — enforce raw-style rule tree-wide, add stricter dumb/pure boundaries
```

The new line is mandated by the Phase 2 spec and captures the follow-up work deferred from this phase: a tree-wide raw-style ban (the grep gate currently scoped to smart components in Phase 5 spec) and tightening the dumb-layer rule to match the spec's stricter "react + ui + types only" table (current rule allows `next-intl` and `@/lib/utils` because enforcing the stricter version would require refactoring many components).

(Line numbers may have drifted slightly — match by prefix text, not line number.)

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md ROADMAP.md
git commit -m "docs: document check:arch and tick Phase 2 ROADMAP items"
```

---

### Task 6: Final verification (no commit)

- [ ] **Step 1: Run the full local gate suite**

```bash
npm run check
```

Expected: `tsc` clean, Biome clean, `depcruise src` clean. Exit 0.

```bash
npm test
```

Expected: same green count as Task 0 Step 2 (last known: 228).

```bash
npm run build
```

Expected: Next.js build succeeds, exit 0.

- [ ] **Step 2: Inspect the commit log for the phase**

```bash
git log --oneline master..HEAD
```

(If working directly on `master`, use `git log --oneline -10` instead.)

Expected: five commits from this phase, one per task:

1. `chore(deps): add dependency-cruiser for architecture checks`
2. `chore(arch): add dependency-cruiser config with layering rules`
3. `chore(arch): add check:arch script and include in check` (or a variant if Task 3 Step 3 applied)
4. `ci: add GitHub Actions workflow running check, test, and build`
5. `docs: document check:arch and tick Phase 2 ROADMAP items`

- [ ] **Step 3: Confirm no unintended files were changed**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

```bash
git diff master..HEAD --stat
```

Expected: only the files listed in the File Structure table at the top of this plan (plus any files fixed by Task 3 Step 3, if applicable).

- [ ] **Step 4: Summarize for the user**

Write a short phase-completion summary listing:
- Commits landed (count + messages)
- Any violations found + fixed in Task 3
- Open items (noted: the `fetch` gap in dumb components, documented in the spec-level plan)
- `npm run check`, `npm test`, `npm run build` all green

Do not push. Await the user's decision on Phase 3.

---

## Notes for the executor

- **No `--no-verify` flags.** Every commit must pass local hooks if any are configured.
- **Separate commits.** Each task = one commit. If Task 3 requires a fix, the fix + the script addition are one combined commit (explained in that task).
- **Do not soften the rules.** If Task 3 Step 2 surfaces a violation and Step 3 feels like too much refactoring, escalate to the user — don't weaken the rule to make it pass.
- **Don't push.** The standing instruction from the code-quality-pass effort is to work on `master` locally without pushing. CI will run once the user manually pushes or opens a PR.
