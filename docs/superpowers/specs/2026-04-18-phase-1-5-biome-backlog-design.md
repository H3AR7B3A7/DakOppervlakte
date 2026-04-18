# Phase 1.5 — Biome Backlog Cleanup

**Date:** 2026-04-18
**Branch:** master
**Depends on:** Phase 1 Biome Migration (complete at `7c9144f`)

## Goal

Clear the diagnostic backlog that Phase 1 deferred. At the end of Phase 1.5:

- `npm run check` (i.e. `biome check --write .`) produces **zero diagnostics** on a clean working tree.
- `npm test` is 228/228 green.
- No functional changes. No feature work. No rule relaxations in `biome.json`.

## Scope

**In scope:**

- 72 formatter-only diffs (pure `biome format --write` output).
- 64 lint errors across 19 rule families.
- 2 readability nits surfaced during Phase 1:
  - `src/lib/geo.ts:9` — restore the clarifying parens around `(yi > lat) !== (yj > lat)` that a prior autoformat stripped.
  - `CLAUDE.md:62` — clarify that `biome check --write .` also formats, not just lints.

**Out of scope:**

- `@vitejs/plugin-react` 6.x migration (deferred; would silence 3 remaining Vite warnings but breaks the `new vi.fn()` mock pattern).
- Any `biome.json` rule changes. Rules stay at the severities Phase 1 set.
- Dependency bumps.

## Execution Order

Risk-ascending, one commit per rule family. ~14–15 commits total.

### Batch 1 — Formatter sweep

Run `biome format --write .` over the 72 format-only diffs. One commit.

```
chore(format): apply biome formatter to full tree
```

### Batch 2 — Mechanical autofix families

Biome fixes these unambiguously; minimal review surface.

| Rule | Count |
|---|---|
| `correctness/noUnusedImports` | 14 |
| `a11y/useButtonType` | 11 |
| `complexity/noUselessFragments` | 2 |
| `style/useTemplate` | 1 |
| `correctness/useNodejsImportProtocol` | 1 |
| `correctness/useParseIntRadix` | 1 |
| `correctness/noUnusedFunctionParameters` | 1 |

One commit per family.

### Batch 3 — a11y & style (may need JSX/code edits)

| Rule | Count |
|---|---|
| `a11y/noSvgWithoutTitle` | 2 |
| `a11y/noAutofocus` | 2 |
| `a11y/useSemanticElements` | 1 |
| `a11y/useKeyWithClickEvents` | 1 |
| `a11y/useAriaPropsSupportedByRole` | 1 |
| `a11y/noStaticElementInteractions` | 1 |
| `complexity/noImportantStyles` | 2 |
| `style/noNonNullAssertion` | 5 |

One commit per family.

### Batch 4 — Logic-touching

These require reading the code. Each site inspected individually.

| Rule | Count |
|---|---|
| `correctness/useExhaustiveDependencies` | 9 |
| `suspicious/useIterableCallbackReturn` | 7 |
| `suspicious/noArrayIndexKey` | 1 |
| `suspicious/noConsole` | 1 |

One commit per family.

### Batch 5 — Nits

Single combined commit for the two readability nits.

```
chore: restore geo.ts parens and clarify biome wording in CLAUDE.md
```

## Per-Family Handling Policy

Each family follows the same shape:

1. **Autofix first** — `biome check --write --only=lint/<group>/<rule> <paths>`.
2. **Inspect residue** — anything not auto-fixed gets read and resolved by hand. Typical cases:
   - `useExhaustiveDependencies`: add the missing dep, or wrap the value in `useRef` / `useCallback`. **Never** a `biome-ignore`.
   - `useIterableCallbackReturn`: stray implicit-return arrow in `.forEach` / `.map` treated as `.forEach`; convert to block body.
   - `noNonNullAssertion`: replace `x!` with a narrow (`if (!x) return`) or a thrown error with a real message.
   - `noSvgWithoutTitle` / a11y family: add `<title>` or the missing ARIA attribute.
3. **Verify** — `npm run check` reports that family as clean.
4. **Commit** — `chore(lint): fix <rule-name> (<N> sites)`.

**Escalation rule:** if a fix would require restructuring a hook, re-architecting a component, or adding new abstractions, **stop and flag it** to the user. Do not silently add `biome-ignore`. Do not silently expand scope.

## Testing Gate

- `npm test` runs once at phase start to establish a green baseline (228/228).
- `npm test` runs once at phase end to verify.
- No per-commit test run. Autofixes and mechanical edits are trusted; the end-of-phase run catches regressions.

## Deliverables

- `npm run check` → clean.
- `npm test` → 228/228 green.
- Working tree clean.
- ~14–15 focused commits on master, not pushed.

## Risks

- **Autofix surprises a logic-touching family.** Mitigation: Batch 4 is read-inspected per site; escalation rule applies.
- **Test failures surface at phase end and can't be localized.** Mitigation: commits are small and per-family, so `git bisect` over ~15 commits is cheap.
- **A rule forces a non-trivial redesign.** Mitigation: escalation rule — stop, flag, decide together whether to relax the rule for that site or do the redesign in a follow-up phase.
